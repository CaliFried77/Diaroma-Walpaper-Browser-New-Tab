import { recordRenderFrame } from './performance-monitor.js';
import { cachedGlassCards, popovers, setPopoverOpen, shortcutModal, closeShortcutModal, toggleZenMode, refreshGlassCardCache } from './01-core-ui.js';
import { pw, ph, canvas, HABITATS, currentHabitatIdx, creatures, pinnedHabitatId, prefersReducedMotion, BASE_FRAME_MS, MAX_FRAME_DELTA_MS, REDUCED_MOTION_QUERY, setPinnedHabitatId, setFrameScale, setPrefersReducedMotion } from './07-habitat-state.js';
import { initHabitat } from './habitat-initializer.js';
import { drawHabitatEnvironment } from './09-scenery.js';
import { drawWxFront } from './03-weather.js';
import { lsPut, esc } from './storage.js';

/* GLASS-RENDERER — Living Pixel Diorama
   Native ES module. Cross-file dependencies are declared with imports and exports. */
/* ============================================================================
           9. TRUE 1:1 ZERO-LAG OPTICAL LIQUID GLASS REFRACTION PASS
              - Runs at a controlled 30fps cadence after creatures draw
              - Uses exact 1:1 spatial alignment (sx, sy, sw, sh) so creatures inside
                the glass match their outside body position with zero offset!
              - MULTI-CREATURE GLOW FIX: Renders an individual radial bioluminescent
                bloom directly onto the lens canvas for EVERY creature simultaneously
                passing underneath or near the glass card (not just the single closest!).
           ============================================================================ */
        // ============================================================================
        // BÖLÜM BAŞI: CAM YÜZEYİ KIRILMA VE IŞIK EFEKTİ
// Sahne canvas'ından cam kartlarına örnek alır; maliyetli işlem ayrı aralıkla çalışır.
// ============================================================================

        const bloomSpriteCache = new Map();
        let lastRectMeasureTime = 0;
        let glassTickCount = 0;
        let glassTrackUntil = 0;
        let glassTrackRafId = null;

        function stepGlassTransitionTrack(now) {
            glassTrackRafId = null;
            if (document.hidden || window.__wePaused || document.body.classList.contains('zen-active')) return;
            updateOpticalLiquidGlass(true);
            if (now < glassTrackUntil) {
                glassTrackRafId = requestAnimationFrame(stepGlassTransitionTrack);
            }
        }

        window.__weTrackGlassTransition = (durationMs = 360) => {
            const until = performance.now() + Math.max(80, Math.min(1000, Number(durationMs) || 360));
            if (until > glassTrackUntil) glassTrackUntil = until;
            window.__weGlassRectsDirty = true;
            if (glassTrackRafId === null && !document.hidden && !window.__wePaused) {
                glassTrackRafId = requestAnimationFrame(stepGlassTransitionTrack);
            }
        };

        function getBloomSprite(rgb) {
            const key = `${rgb[0]},${rgb[1]},${rgb[2]}`;
            if (bloomSpriteCache.has(key)) return bloomSpriteCache.get(key);
            let sprite = null;
            try {
                const off = document.createElement('canvas');
                off.width = 32;
                off.height = 32;
                const sctx = off.getContext('2d');
                if (sctx && typeof sctx.createRadialGradient === 'function') {
                    const grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
                    grad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`);
                    grad.addColorStop(0.55, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.42)`);
                    grad.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
                    sctx.fillStyle = grad;
                    sctx.fillRect(0, 0, 32, 32);
                    sprite = off;
                }
            } catch {
                sprite = null;
            }
            bloomSpriteCache.set(key, sprite);
            return sprite;
        }

        function updateOpticalLiquidGlass(forceTrack = false) {
            if (document.body.classList.contains('zen-active')) return;
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            if (!winW || !winH || !cachedGlassCards.length) return;

            const nowTs = performance.now();
            const isTracking = forceTrack === true || nowTs < glassTrackUntil;
            if (!isTracking) {
                glassTickCount = (glassTickCount + 1) & 0x3fffffff;
            }
            const needMeasure = isTracking || Boolean(window.__weGlassRectsDirty) || (nowTs - lastRectMeasureTime > 600);
            const hasOpenPopover = Boolean(popovers.some((p) => p.panel?.classList?.contains('open')));
            const topbarHidden = document.body.classList.contains('we-topbar-hidden');
            const topbarAutoIdle = document.body.classList.contains('we-topbar-autohide')
                && !document.body.classList.contains('we-topbar-hover')
                && !hasOpenPopover;

            // PHASE 1 (READ ONLY): visibility filtering + batched getBoundingClientRect reads (zero reflow thrashing!)
            for (let idx = 0; idx < cachedGlassCards.length; idx++) {
                const card = cachedGlassCards[idx];
                const el = card.el;
                card._active = false;

                const hiddenPopover = el.closest('.popover-panel');
                if (hiddenPopover && !hiddenPopover.classList.contains('open')) continue;
                if (!el.isConnected) continue;
                if (el.id === 'wePopoverGlassPlate' && !el.classList.contains('is-visible')) continue;
                if (el.closest('[hidden]')) continue;
                if (el.classList.contains('we-liquid-pill') && el.id !== 'weSettingsBtn' && (topbarHidden || topbarAutoIdle)) continue;

                if (needMeasure || !card.rect) {
                    card.rect = el.getBoundingClientRect();
                }
                const rect = card.rect;
                if (!rect || rect.width < 1 || rect.height < 1 || rect.right <= 0 || rect.bottom <= 0 || rect.left >= winW || rect.top >= winH) continue;
                card._active = true;
            }
            if (needMeasure) {
                window.__weGlassRectsDirty = false;
                lastRectMeasureTime = nowTs;
            }

            // PHASE 2 (CANVAS DRAW + STYLE WRITE): zero layout reads inside this loop
            for (let idx = 0; idx < cachedGlassCards.length; idx++) {
                const card = cachedGlassCards[idx];
                if (!card._active) continue;
                const el = card.el;
                const lens = card.lens;
                const rect = card.rect;

                // Convert and clamp the card's CSS-pixel rectangle into the low-resolution scene canvas.
                const rawSx = (rect.left / winW) * pw;
                const rawSy = (rect.top / winH) * ph;
                const rawSw = (rect.width / winW) * pw;
                const rawSh = (rect.height / winH) * ph;
                const sx = Math.max(0, Math.min(pw - 1, rawSx));
                const sy = Math.max(0, Math.min(ph - 1, rawSy));
                const sw = Math.max(1, Math.min(pw - sx, rawSw - (sx - rawSx)));
                const sh = Math.max(1, Math.min(ph - sy, rawSh - (sy - rawSy)));
                if (sw <= 0 || sh <= 0) continue;

                const lw = Math.max(16, Math.round(sw));
                const lh = Math.max(12, Math.round(sh));
                let hasNearbyCreature = false;
                const proxPad = 24;
                for (let ci = 0; ci < creatures.length; ci++) {
                    const c = creatures[ci];
                    if (c.x >= sx - proxPad && c.x <= sx + sw + proxPad && c.y >= sy - proxPad && c.y <= sy + sh + proxPad) {
                        hasNearbyCreature = true;
                        break;
                    }
                }
                if (!isTracking && card._painted && lens.width === lw && lens.height === lh && !hasNearbyCreature && !card._hadCreature && ((glassTickCount + idx) % 3 !== 0)) {
                    continue;
                }
                if (lens.width !== lw || lens.height !== lh) {
                    // Setting canvas dimensions clears it and resets its drawing state.
                    lens.width = lw;
                    lens.height = lh;
                    card.width = lw;
                    card.height = lh;
                    card.ctx = lens.getContext('2d', { alpha: false });
                }
                const lctx = card.ctx;
                if (!lctx) continue;

                // Single-pass 1:1 refracted scene blit (opaque canvas needs no clearRect).
                lctx.globalCompositeOperation = 'source-over';
                lctx.globalAlpha = 1;
                lctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, lw, lh);

                // Preserve multi-creature bioluminescence using cached radial bloom sprites
                // instead of allocating gradients and full-card fills per creature.
                let bestGlow = 0;
                let glowRGB = HABITATS[currentHabitatIdx].rgb;
                let localGlowX = -200;
                let localGlowY = -200;
                const pad = 18;
                const coreAlpha = 0.52;
                const maxBloomR = Math.max(10, Math.min(lw, lh) * 0.7);

                lctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < creatures.length; i++) {
                    const c = creatures[i];
                    if (c.x < sx - pad || c.x > sx + sw + pad || c.y < sy - pad || c.y > sy + sh + pad) continue;

                    const dx = c.x < sx ? sx - c.x : (c.x > sx + sw ? c.x - (sx + sw) : 0);
                    const dy = c.y < sy ? sy - c.y : (c.y > sy + sh ? c.y - (sy + sh) : 0);
                    const intensity = Math.max(0, 1 - Math.hypot(dx, dy) / pad);
                    if (intensity <= 0) continue;

                    const rgb = c.rgb || HABITATS[currentHabitatIdx].rgb;
                    const lx = ((c.x - sx) / sw) * lw;
                    const ly = ((c.y - sy) / sh) * lh;
                    const bloomR = maxBloomR;
                    const sprite = getBloomSprite(rgb);
                    if (sprite) {
                        lctx.globalAlpha = Math.min(1, intensity * coreAlpha);
                        lctx.drawImage(sprite, lx - bloomR, ly - bloomR, bloomR * 2, bloomR * 2);
                    } else {
                        const grad = lctx.createRadialGradient(lx, ly, 0, lx, ly, bloomR);
                        grad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${intensity * coreAlpha})`);
                        grad.addColorStop(0.55, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${intensity * coreAlpha * 0.42})`);
                        grad.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
                        lctx.fillStyle = grad;
                        lctx.fillRect(0, 0, lw, lh);
                    }

                    if (intensity > bestGlow) {
                        bestGlow = intensity;
                        glowRGB = rgb;
                        localGlowX = ((c.x - sx) / sw) * rect.width;
                        localGlowY = ((c.y - sy) / sh) * rect.height;
                    }
                }
                lctx.globalCompositeOperation = 'source-over';
                lctx.globalAlpha = 1;

                // Quantize glow coordinates to 2px steps so micro-jitter does not force
                // repeated CSS custom property recalculation every glass tick.
                const qGlowX = localGlowX < -100 ? -200 : Math.round(localGlowX * 0.5) * 2;
                const qGlowY = localGlowY < -100 ? -200 : Math.round(localGlowY * 0.5) * 2;
                const glowAlphaVal = (bestGlow * 0.48).toFixed(2);
                const glowState = `${qGlowX}|${qGlowY}|${glowRGB[0]},${glowRGB[1]},${glowRGB[2]}|${glowAlphaVal}`;
                if (glowState !== card.glowState) {
                    el.style.setProperty('--creature-x', `${qGlowX}px`);
                    el.style.setProperty('--creature-y', `${qGlowY}px`);
                    el.style.setProperty('--glow-r', glowRGB[0]);
                    el.style.setProperty('--glow-g', glowRGB[1]);
                    el.style.setProperty('--glow-b', glowRGB[2]);
                    el.style.setProperty('--glow-alpha', glowAlphaVal);
                    card.glowState = glowState;
                }
                card._painted = true;
                card._hadCreature = hasNearbyCreature || bestGlow > 0;
            }
        }

        // ============================================================================
        // BÖLÜM SONU: CAM YÜZEYİ EFEKTİ
        // BÖLÜM BAŞI: HABİTAT SEÇİM MENÜSÜ VE SABİTLEME
// ============================================================================

        const habitatListContainer = document.getElementById('habitatListContainer');
        const pinHabitatBtn = document.getElementById('pinHabitatBtn');
        const pinHabitatText = document.getElementById('pinHabitatText');

        function renderHabitatMenu() {
            if (!habitatListContainer) return;
            habitatListContainer.innerHTML = '';
            const isPinned = Boolean(pinnedHabitatId);
            pinHabitatText.textContent = isPinned ? 'Sabitlendi' : 'Rastgele';
            pinHabitatBtn.className = isPinned
                ? 'px-2.5 py-1 rounded-xl text-[11px] font-medium bg-amber-400/20 border border-amber-300/40 text-amber-200 flex items-center gap-1.5 transition'
                : 'px-2.5 py-1 rounded-xl text-[11px] font-medium bg-white/[0.06] hover:bg-white/15 border border-white/12 text-white/75 flex items-center gap-1.5 transition';

            HABITATS.forEach((h, idx) => {
                const active = idx === currentHabitatIdx;
                const row = document.createElement('button');
                row.type = 'button';
                row.className = `w-full px-3 py-2 rounded-2xl flex items-center justify-between text-left transition ${active ? 'bg-white/15 border border-white/25 text-white' : 'hover:bg-white/[0.06] border border-transparent text-white/75 hover:text-white'}`;
                row.setAttribute('aria-pressed', active ? 'true' : 'false');
                if (active) row.setAttribute('aria-current', 'true');
                else row.removeAttribute('aria-current');
                row.innerHTML = `
                    <div class="flex items-center gap-2.5 min-w-0">
                        <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${h.dotColor}"></span>
                        <div class="truncate">
                            <div class="text-xs font-medium truncate">${esc(h.name)}</div>
                            <div class="text-[11px] text-white/50 truncate">${esc(h.hint)}</div>
                        </div>
                    </div>
                    ${active ? '<span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white/90">Aktif</span>' : ''}
                `;
                row.addEventListener('click', () => {
                    initHabitat(idx);
                    if (pinnedHabitatId) {
                        setPinnedHabitatId(HABITATS[currentHabitatIdx].id);
                        lsPut('diorama_pinned_habitat', pinnedHabitatId);
                    }
                    renderHabitatMenu();
                });
                habitatListContainer.appendChild(row);
            });
        }

        pinHabitatBtn.addEventListener('click', () => {
            if (pinnedHabitatId) {
                setPinnedHabitatId(null);
                try { localStorage.removeItem('diorama_pinned_habitat'); } catch (e) {}
            } else {
                setPinnedHabitatId(HABITATS[currentHabitatIdx].id);
                lsPut('diorama_pinned_habitat', pinnedHabitatId);
            }
            renderHabitatMenu();
        });

        document.getElementById('habitatCycleBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            initHabitat(currentHabitatIdx + 1);
            if (pinnedHabitatId) {
                setPinnedHabitatId(HABITATS[currentHabitatIdx].id);
                lsPut('diorama_pinned_habitat', pinnedHabitatId);
            }
            renderHabitatMenu();
        });

        // ============================================================================
        // BÖLÜM SONU: HABİTAT SEÇİM MENÜSÜ
        // BÖLÜM BAŞI: SAHNE BAŞLANGICI, ANİMASYON DÖNGÜSÜ VE KLAVYE KISAYOLLARI
// ============================================================================

        initHabitat(currentHabitatIdx);
        renderHabitatMenu();

        let animationFrameId = null;
        let lastFrameTime = 0;
        let lastGlassUpdateTime = 0;
        let sceneTime = performance.now();

        function animate(timestamp) {
            if (document.hidden || window.__wePaused) {
                animationFrameId = null;
                lastFrameTime = 0;
                return;
            }

            const minFrameInterval = prefersReducedMotion ? 1000 / 15 : BASE_FRAME_MS;
            if (lastFrameTime && timestamp - lastFrameTime < minFrameInterval) {
                animationFrameId = requestAnimationFrame(animate);
                return;
            }

            const elapsed = lastFrameTime ? timestamp - lastFrameTime : BASE_FRAME_MS;
            const safeElapsed = Math.min(MAX_FRAME_DELTA_MS, Math.max(0, elapsed));
            const motionMultiplier = prefersReducedMotion ? 0.35 : 1;
            setFrameScale((safeElapsed / BASE_FRAME_MS) * motionMultiplier);
            sceneTime += safeElapsed * motionMultiplier;
            lastFrameTime = timestamp;

            const renderStartedAt = performance.now();
            drawHabitatEnvironment(sceneTime);

            for (let i = 0; i < creatures.length; i++) {
                creatures[i].update(sceneTime);
                creatures[i].draw();
            }

            drawWxFront(sceneTime);

            // The refractive lens is expensive; 30 Hz is visually smooth for this pixel-art UI.
            const glassInterval = prefersReducedMotion ? 100 : 1000 / 30;
            let glassMs = 0;
            if (!document.body.classList.contains('zen-active') && timestamp - lastGlassUpdateTime >= glassInterval) {
                const glassStartedAt = performance.now();
                updateOpticalLiquidGlass();
                glassMs = performance.now() - glassStartedAt;
                lastGlassUpdateTime = timestamp;
            }
            recordRenderFrame(timestamp, performance.now() - renderStartedAt, glassMs);

            animationFrameId = requestAnimationFrame(animate);
        }

        function startAnimationLoop() {
            if (document.hidden || window.__wePaused || animationFrameId !== null) return;
            lastFrameTime = 0;
            lastGlassUpdateTime = 0;
            animationFrameId = requestAnimationFrame(animate);
        }

        function stopAnimationLoop() {
            if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            if (glassTrackRafId !== null) {
                cancelAnimationFrame(glassTrackRafId);
                glassTrackRafId = null;
            }
            lastFrameTime = 0;
        }

        window.__weSetScenePaused = (paused) => {
            window.__wePaused = Boolean(paused);
            if (window.__wePaused) stopAnimationLoop();
            else startAnimationLoop();
        };

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stopAnimationLoop();
            else startAnimationLoop();
        });

        const handleMotionPreferenceChange = (event) => {
            setPrefersReducedMotion(event.matches);
            lastFrameTime = 0;
        };
        if (typeof REDUCED_MOTION_QUERY.addEventListener === 'function') {
            REDUCED_MOTION_QUERY.addEventListener('change', handleMotionPreferenceChange);
        } else if (typeof REDUCED_MOTION_QUERY.addListener === 'function') {
            REDUCED_MOTION_QUERY.addListener(handleMotionPreferenceChange);
        }

        shortcutModal.addEventListener('click', (e) => { if (e.target === shortcutModal) closeShortcutModal(); });
        document.addEventListener('keydown', (e) => {
            const modalIsOpen = !shortcutModal.classList.contains('hidden');
            if (modalIsOpen) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeShortcutModal();
                    return;
                }
                if (e.key === 'Tab') {
                    const focusable = Array.from(shortcutModal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
                        .filter(el => el.getClientRects().length > 0);
                    if (!focusable.length) { e.preventDefault(); return; }
                    const first = focusable[0], last = focusable[focusable.length - 1];
                    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
                }
                return;
            }
            if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                toggleZenMode();
                return;
            }
            if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const active = document.activeElement;
                const isTyping = active && (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable);
                if (!isTyping) {
                    e.preventDefault();
                    document.getElementById('searchInput')?.focus();
                    return;
                }
            }
            if (e.key === 'Escape') {
                const openEntry = popovers.find(p => p.panel.classList.contains('open'));
                if (openEntry) {
                    e.preventDefault();
                    setPopoverOpen(openEntry, false, true);
                }
            }
        });
        document.getElementById('shortcutUrlInput').addEventListener('input', (e) => e.target.setCustomValidity(''));

        window.addEventListener('load', () => {
            refreshGlassCardCache();
            startAnimationLoop();
        }, { once: true });

// ============================================================================
        // BÖLÜM SONU: SAHNE BAŞLANGICI, ANİMASYON DÖNGÜSÜ VE KLAVYE KISAYOLLARI
// ============================================================================
