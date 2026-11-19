import { pw, ph, frameScale, frameChance, pRect, frameSmoothing } from './07-habitat-state.js';
import { findAvailableStimulus } from './creature-utils.js';

/* PIXELPARROT — dedicated papağan behavior and pixel-art rendering. */

// ============================================================================
// BÖLÜM BAŞI: PAPAĞAN SINIFI VE DAVRANIŞLARI
// Bu dosya yalnızca ilgili canlının hareket, etkileşim ve çizim kodunu içerir.
// ============================================================================

/* ============================================================================
   CREATURE 7: ARTISTIC & REALISTIC MACAW PARROT FLOCK (1:1 NATIVE PIXEL ART)
   ============================================================================ */
const PARROT_PALETTES = Object.freeze([
    {
        // Scarlet Macaw (Ara macao)
        bodyHi: '#f87171', body: '#ef4444', bodyShade: '#b91c1c', belly: '#dc2626',
        wingShoulder: '#ef4444', wingCovert: '#facc15', wingGreen: '#10b981', wingPrimary: '#1d4ed8', wingTip: '#1e3a8a', wingUnder: '#b91c1c',
        tailCenter: '#ef4444', tailMid: '#b91c1c', tailOuter: '#0284c7',
        face: '#fef3c7', faceLine: '#ef4444', beakUpper: '#fef3c7', beakTip: '#1e293b', beakLower: '#0f172a', eye: '#0f172a',
        rgb: [239, 68, 68]
    },
    {
        // Blue-and-Gold Macaw (Ara ararauna)
        bodyHi: '#38bdf8', body: '#0284c7', bodyShade: '#0369a1', belly: '#facc15',
        wingShoulder: '#22c55e', wingCovert: '#38bdf8', wingGreen: '#0ea5e9', wingPrimary: '#1d4ed8', wingTip: '#1e3a8a', wingUnder: '#eab308',
        tailCenter: '#0284c7', tailMid: '#0369a1', tailOuter: '#facc15',
        face: '#fef9c3', faceLine: '#1e293b', beakUpper: '#334155', beakTip: '#0f172a', beakLower: '#0f172a', eye: '#0f172a',
        rgb: [56, 189, 248]
    },
    {
        // Great Green Macaw (Ara ambiguus)
        bodyHi: '#4ade80', body: '#16a34a', bodyShade: '#15803d', belly: '#22c55e',
        wingShoulder: '#f97316', wingCovert: '#22c55e', wingGreen: '#0d9488', wingPrimary: '#0284c7', wingTip: '#1e3a8a', wingUnder: '#15803d',
        tailCenter: '#dc2626', tailMid: '#991b1b', tailOuter: '#0ea5e9',
        face: '#fef3c7', faceLine: '#b91c1c', beakUpper: '#334155', beakTip: '#0f172a', beakLower: '#0f172a', eye: '#0f172a',
        rgb: [34, 197, 94]
    },
    {
        // Hyacinth Macaw (Anodorhynchus hyacinthinus)
        bodyHi: '#60a5fa', body: '#2563eb', bodyShade: '#1e40af', belly: '#1d4ed8',
        wingShoulder: '#3b82f6', wingCovert: '#2563eb', wingGreen: '#1e40af', wingPrimary: '#1e3a8a', wingTip: '#172554', wingUnder: '#1e40af',
        tailCenter: '#2563eb', tailMid: '#1e40af', tailOuter: '#0ea5e9',
        face: '#facc15', faceLine: '#1e3a8a', beakUpper: '#1f2937', beakTip: '#020617', beakLower: '#020617', eye: '#020617',
        rgb: [37, 99, 235]
    },
]);

export class PixelParrot {
    constructor() {
        this.x = Math.random() * pw;
        this.y = 28 + Math.random() * Math.max(36, ph * 0.45);
        this.dir = Math.random() < 0.5 ? -1 : 1;
        this.vx = this.dir * (0.42 + Math.random() * 0.18);
        this.vy = (Math.random() - 0.5) * 0.12;
        this.phase = Math.random() * Math.PI * 2;
        this.palette = PARROT_PALETTES[Math.floor(Math.random() * PARROT_PALETTES.length)];
        this.rgb = this.palette.rgb;

        this.state = 'flying';
        this.stateTimer = 140 + Math.random() * 220;
        this.eatCooldown = 0;
        this.perchTarget = null;
        this.targetFruit = null;
        this.waypointY = this.y;
        this.headLook = 0;
        this.beakOpen = 0;
        this.tailWave = 0;
    }

    pickPerchSpot() {
        // Açık orta plan ağaçlarının yan dalları (Tukan ve Tembel Hayvan dalları hariç tutulur)
        const spots = [
            { x: Math.floor(pw * 0.14) + 15, y: Math.floor(ph * 0.24) + 17 },
            { x: Math.floor(pw * 0.42) - 15, y: Math.floor(ph * 0.32) + 17 },
            { x: Math.floor(pw * 0.58) + 15, y: Math.floor(ph * 0.30) + 17 },
            { x: Math.floor(pw * 0.86) - 15, y: Math.floor(ph * 0.22) + 17 }
        ];
        return spots[Math.floor(Math.random() * spots.length)];
    }

    update(time) {
        if (this.eatCooldown > 0) this.eatCooldown = Math.max(0, this.eatCooldown - frameScale);
        this.tailWave += 0.12 * frameScale;

        const fruit = findAvailableStimulus(this, 'tropical_fruit', Math.max(450, pw));
        if (fruit && this.state !== 'eating') {
            this.targetFruit = fruit;
            this.state = 'flying';
            this.perchTarget = null;
        }

        if (this.state === 'eating') {
            this.phase += 0.38 * frameScale;
            this.stateTimer -= frameScale;
            this.beakOpen = Math.sin(this.phase * 1.5) > 0 ? 1 : 0;

            if (this.targetFruit && this.targetFruit.life > 0) {
                const targetX = this.targetFruit.x - this.dir * 11;
                const targetY = Math.min(ph - 16, this.targetFruit.y - 2);
                this.x += (targetX - this.x) * frameSmoothing(0.18);
                this.y += (targetY - this.y) * frameSmoothing(0.18);
                if (this.stateTimer <= 8) {
                    this.targetFruit.life = 0;
                }
            }

            if (this.stateTimer <= 0) {
                this.state = 'flying';
                this.eatCooldown = 90;
                this.beakOpen = 0;
                this.targetFruit = null;
                this.vx = this.dir * 0.48;
                this.vy = -0.28;
                this.waypointY = 30 + Math.random() * (ph * 0.38);
                this.stateTimer = 180 + Math.random() * 200;
            }
            return;
        }

        if (this.state === 'perched') {
            this.phase += 0.04 * frameScale;
            this.stateTimer -= frameScale;
            this.vx = 0;
            this.vy = 0;

            if (frameChance(0.018)) {
                this.headLook = (Math.random() < 0.4) ? -1 : 0;
            }
            if (frameChance(0.012)) {
                this.beakOpen = this.beakOpen ? 0 : 1;
            }

            if (this.stateTimer <= 0 || fruit) {
                this.state = 'flying';
                this.headLook = 0;
                this.beakOpen = 0;
                this.dir = (this.x < pw * 0.5) ? 1 : -1;
                this.vx = this.dir * 0.46;
                this.vy = -0.18;
                this.waypointY = 28 + Math.random() * (ph * 0.42);
                this.stateTimer = 180 + Math.random() * 240;
            }
            return;
        }

        if (fruit) {
            this.phase += 0.24 * frameScale;
            const dx = fruit.x - this.x;
            const dy = fruit.y - this.y;
            const dist = Math.max(1, Math.hypot(dx, dy));

            const desiredVx = (dx / dist) * 0.68;
            const desiredVy = (dy / dist) * 0.52;
            this.vx += (desiredVx - this.vx) * frameSmoothing(0.09);
            this.vy += (desiredVy - this.vy) * frameSmoothing(0.09);

            if (Math.abs(dx) > 4) {
                this.dir = dx >= 0 ? 1 : -1;
            }
            this.beakOpen = dist < 26 ? 1 : 0;

            this.x += this.vx * frameScale;
            this.y += this.vy * frameScale;

            if (dist < 13) {
                this.state = 'eating';
                this.stateTimer = 34;
                this.targetFruit = fruit;
                this.vx *= 0.2;
                this.vy *= 0.2;
            }
            return;
        }

        if (this.state === 'perching' && this.perchTarget) {
            this.phase += 0.22 * frameScale;
            const dx = this.perchTarget.x - this.x;
            const dy = this.perchTarget.y - this.y;
            const dist = Math.max(1, Math.hypot(dx, dy));

            const speed = Math.min(0.55, Math.max(0.18, dist * 0.03));
            const desiredVx = (dx / dist) * speed;
            const desiredVy = (dy / dist) * speed;
            this.vx += (desiredVx - this.vx) * frameSmoothing(0.08);
            this.vy += (desiredVy - this.vy) * frameSmoothing(0.08);
            if (Math.abs(dx) > 3) this.dir = dx >= 0 ? 1 : -1;

            this.x += this.vx * frameScale;
            this.y += this.vy * frameScale;

            if (dist < 5) {
                this.x = this.perchTarget.x;
                this.y = this.perchTarget.y;
                this.state = 'perched';
                this.stateTimer = 160 + Math.random() * 220;
                this.perchTarget = null;
                this.dir = (this.x < pw * 0.5) ? 1 : -1;
            }
            return;
        }

        this.phase += 0.17 * frameScale;
        this.stateTimer -= frameScale;

        if (this.stateTimer <= 0) {
            if (Math.random() < 0.38) {
                this.perchTarget = this.pickPerchSpot();
                this.state = 'perching';
            } else {
                this.waypointY = 26 + Math.random() * (ph * 0.46);
                if (Math.random() < 0.35 && this.x > pw * 0.2 && this.x < pw * 0.8) {
                    this.dir *= -1;
                }
                this.stateTimer = 150 + Math.random() * 220;
            }
        }

        const targetVx = this.dir * (0.44 + Math.sin(time * 0.001 + this.phase * 0.2) * 0.1);
        const dyWay = this.waypointY - this.y;
        const targetVy = Math.max(-0.26, Math.min(0.26, dyWay * 0.015 + Math.sin(time * 0.002 + this.phase * 0.3) * 0.06));

        this.vx += (targetVx - this.vx) * frameSmoothing(0.045);
        this.vy += (targetVy - this.vy) * frameSmoothing(0.045);
        if (Math.abs(this.vx) > 0.08) {
            this.dir = this.vx >= 0 ? 1 : -1;
        }

        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;

        if (this.y < 20) { this.y = 20; this.vy = Math.abs(this.vy) * 0.5 + 0.04; }
        if (this.y > ph * 0.68) { this.y = ph * 0.68; this.vy = -Math.abs(this.vy) * 0.5 - 0.04; }

        if (this.x < -34) this.x = pw + 34;
        if (this.x > pw + 34) this.x = -34;
    }

    draw() {
        const p = this.palette;
        const dir = this.dir;
        const bx = Math.round(this.x);
        const by = Math.round(this.y);

        // 1:1 doğal piksel ızgarasında kesintisiz çizim (ölçekleme kaynaklı piksel kopması olmaz)
        const px = (x, y, w, h, col) => {
            const drawX = dir > 0 ? (bx + x) : (bx - x - w);
            pRect(drawX, by + y, w, h, col);
        };

        if (this.state === 'perched') {
            const breath = Math.sin(this.phase) > 0.35 ? -1 : 0;
            const lookDir = this.headLook === -1 ? -1 : 1;
            const blink = Math.sin(this.phase * 0.45) > 0.96;

            // Dalın arkasından kesintisiz sarkan zarif Ara kuyruğu
            let prevTx = null;
            for (let t = 0; t < 17; t++) {
                const sway = t > 6 ? Math.round(Math.sin(this.phase * 0.55 - t * 0.14) * ((t - 6) * 0.08)) : 0;
                const tx = -4 - Math.floor(t * 0.32) + sway;
                const ty = 4 + t;
                if (prevTx !== null && Math.abs(tx - prevTx) > 0) {
                    const step = tx > prevTx ? 1 : -1;
                    for (let bxStep = prevTx; bxStep !== tx; bxStep += step) {
                        px(bxStep, ty, 1, 1, t < 12 ? p.tailCenter : p.tailOuter);
                    }
                }
                px(tx, ty, t < 11 ? 2 : 1, 1, t < 12 ? p.tailCenter : p.tailOuter);
                if (t < 10) px(tx + 1, ty, 1, 1, p.tailMid);
                prevTx = tx;
            }

            // İncik tüyleri ve dalı kavrayan zygodactyl pençeler
            px(-2, 3, 2, 1, p.bodyShade);
            px(1, 3, 2, 1, p.bodyShade);
            px(-3, 4, 2, 2, '#334155');
            px(1, 4, 2, 2, '#334155');
            px(-3, 5, 1, 1, '#0f172a');
            px(2, 5, 1, 1, '#0f172a');

            // Zarif dik gövde, göğüs ve sırt hacmi
            px(-3, -5 + breath, 6, 6, p.body);
            px(-2, -1 + breath, 5, 4, p.belly);
            px(2, -5 + breath, 2, 6, p.bodyHi);
            px(-4, -3 + breath, 2, 5, p.bodyShade);

            // Katlanmış çok katmanlı kanat telekleri (pürüzsüz konik silüet)
            px(-3, -4 + breath, 4, 3, p.wingShoulder);
            px(-4, -1 + breath, 4, 2, p.wingCovert);
            px(-4, 1 + breath, 3, 2, p.wingGreen);
            px(-5, 3 + breath, 3, 3, p.wingPrimary);
            px(-5, 6 + breath, 2, 2, p.wingTip);

            // Baş, tepe ve yüz
            const hy = -9 + breath;
            px(-2, hy, 6, 4, p.body);
            px(-1, hy - 1, 4, 1, p.bodyHi);
            px(-2, hy + 1, 1, 2, p.bodyShade);

            if (lookDir === 1) {
                px(1, hy + 1, 3, 2, p.face);
                px(1, hy + 3, 2, 1, p.faceLine);
                px(2, hy + 1, 1, 1, blink ? p.faceLine : p.eye);
                px(4, hy + 1, 2, 1, p.beakUpper);
                px(4, hy + 2, 3, 1, p.beakUpper);
                px(6, hy + 2, 1, 2, p.beakTip);
                px(5, hy + 3, 1, 1, p.beakTip);
                px(4, hy + 3 + this.beakOpen, 2, 1, p.beakLower);
            } else {
                px(-2, hy + 1, 3, 2, p.face);
                px(-1, hy + 3, 2, 1, p.faceLine);
                px(-1, hy + 1, 1, 1, blink ? p.faceLine : p.eye);
                px(-4, hy + 1, 2, 1, p.beakUpper);
                px(-5, hy + 2, 3, 1, p.beakUpper);
                px(-5, hy + 2, 1, 2, p.beakTip);
                px(-4, hy + 3, 1, 1, p.beakTip);
                px(-4, hy + 3 + this.beakOpen, 2, 1, p.beakLower);
            }
            return;
        }

        const isHovering = this.state === 'eating' || (this.state === 'perching' && Math.hypot(this.vx, this.vy) < 0.28);
        const cycle = this.phase % (Math.PI * 4);
        const isGliding = !isHovering && !this.targetFruit && cycle > Math.PI * 2.7;
        const wingSin = isGliding ? 0.12 : Math.sin(this.phase);

        const pitch = isHovering ? -1 : Math.max(-2, Math.min(2, Math.round(this.vy * 6)));
        const liftY = Math.round(-wingSin * 0.9);
        const headPitch = pitch;
        const rearPitch = -Math.sign(pitch);

        // Uzak (arka) kanat derinlik katmanı
        if (isHovering) {
            px(1, -3 + liftY, 4, 2, p.wingUnder);
            px(0, -5 + liftY, 4, 2, p.wingPrimary);
            px(-1, -7 + liftY, 3, 2, p.wingTip);
        } else if (wingSin > 0.12) {
            const farLift = Math.round(wingSin * 5);
            px(1, -2 - Math.floor(farLift * 0.4) + liftY, 4, 2, p.wingUnder);
            px(0, -4 - Math.floor(farLift * 0.8) + liftY, 4, 2, p.wingPrimary);
            px(-2, -5 - farLift + liftY, 4, 2, p.wingTip);
            px(-3, -6 - farLift + liftY, 2, 1, p.wingTip);
        }

        // Kesintisiz uzun Ara kuyruğu (const tailLen = 23 korunur ve komşu pikseller birleştirilir)
        const tailLen = 23;
        let prevTy = null;
        for (let t = 0; t < tailLen; t++) {
            const tx = -7 - t;
            const waveOffset = Math.sin(this.tailWave - t * 0.22) * (t * 0.06);
            const pitchOffset = -pitch * (t * 0.16);
            const ty = Math.round(1 + t * 0.11 + pitchOffset + waveOffset + liftY);

            if (prevTy !== null && ty !== prevTy) {
                const step = ty > prevTy ? 1 : -1;
                for (let byStep = prevTy; byStep !== ty; byStep += step) {
                    px(tx, byStep, 1, 1, t < 13 ? p.tailMid : p.tailCenter);
                }
            }
            px(tx, ty, 1, 1, p.tailCenter);
            if (t < 7) {
                px(tx, ty - 1, 1, 1, p.tailMid);
            }
            if (t >= 1 && t < 14) {
                const outerOff = (isHovering && t < 9) ? 1 : 1;
                px(tx, ty + outerOff, 1, 1, p.tailOuter);
                if (isHovering && t >= 4 && t < 9) {
                    px(tx, ty - 1, 1, 1, p.tailOuter);
                }
            }
            prevTy = ty;
        }

        // Aerodinamik damla gövde ve yumuşak göğüs eğrisi
        px(-7, 0 + rearPitch + liftY, 3, 2, p.bodyShade);
        px(-5, -1 + rearPitch + liftY, 5, 2, p.body);
        px(0, -1 + liftY, 5, 3, p.body);
        px(-2, -2 + liftY, 6, 1, p.bodyHi);
        px(2, 0 + headPitch + liftY, 4, 2, p.bodyHi);
        px(1, 1 + headPitch + liftY, 5, 2, p.belly);
        px(-2, 2 + rearPitch + liftY, 5, 1, p.belly);
        px(-6, 2 + rearPitch + liftY, 5, 1, p.bodyShade);

        if (isHovering) {
            px(-1, 3 + liftY, 2, 2, '#334155');
            px(2, 3 + liftY, 2, 2, '#334155');
            px(2, 5 + liftY, 1, 1, '#0f172a');
        } else {
            px(-4, 3 + rearPitch + liftY, 3, 1, '#1e293b');
        }

        // Baş, krem yüz yaması, net 1px göz ve kavisli gaga
        const hx = 5;
        const hy = -4 + headPitch + liftY;

        px(4, hy + 2, 2, 3, p.body);
        px(hx, hy + 1, 5, 3, p.body);
        px(hx + 1, hy, 4, 1, p.bodyHi);
        px(hx - 1, hy + 1, 1, 2, p.bodyShade);

        px(hx + 2, hy + 1, 3, 2, p.face);
        px(hx + 2, hy + 3, 2, 1, p.faceLine);
        px(hx + 3, hy + 1, 1, 1, p.eye);

        px(hx + 5, hy + 1, 2, 1, p.beakUpper);
        px(hx + 5, hy + 2, 3, 1, p.beakUpper);
        px(hx + 7, hy + 2, 1, 2, p.beakTip);
        px(hx + 6, hy + 3, 1, 1, p.beakTip);
        px(hx + 5, hy + 3 + this.beakOpen, 2, 1, p.beakLower);

        if (this.state === 'eating' && this.beakOpen) {
            px(hx + 8, hy + 3, 1, 1, '#facc15');
            px(hx + 7, hy + 4, 1, 1, '#fb7185');
        }

        // Geriye doğru zarif kıvrımlı, sivrilen uçlu yakın (ön) kanat telekleri
        if (isHovering) {
            px(-1, -2 + liftY, 4, 2, p.wingShoulder);
            px(-3, -4 + liftY, 5, 2, p.wingCovert);
            px(-5, -6 + liftY, 5, 2, p.wingGreen);
            px(-7, -8 + liftY, 5, 2, p.wingPrimary);
            px(-9, -10 + liftY, 4, 2, p.wingTip);
            px(-6, -10 + liftY, 2, 1, p.wingTip);
            px(-3, -9 + liftY, 2, 1, p.wingTip);
        } else if (isGliding || (wingSin >= -0.22 && wingSin <= 0.22)) {
            px(-1, -1 + liftY, 5, 2, p.wingShoulder);
            px(-5, -2 + liftY, 6, 2, p.wingCovert);
            px(-9, -3 + liftY, 5, 2, p.wingGreen);
            px(-12, -4 + liftY, 5, 2, p.wingPrimary);
            px(-15, -4 + liftY, 4, 1, p.wingTip);
            px(-14, -5 + liftY, 3, 1, p.wingTip);
            px(-10, -2 + liftY, 2, 1, p.wingPrimary);
        } else if (wingSin > 0.22 && wingSin <= 0.65) {
            px(-1, -2 + liftY, 5, 2, p.wingShoulder);
            px(-4, -4 + liftY, 6, 2, p.wingCovert);
            px(-7, -5 + liftY, 5, 2, p.wingGreen);
            px(-10, -6 + liftY, 5, 2, p.wingPrimary);
            px(-12, -7 + liftY, 4, 1, p.wingTip);
            px(-13, -8 + liftY, 2, 1, p.wingTip);
            px(-10, -4 + liftY, 2, 1, p.wingPrimary);
        } else if (wingSin > 0.65) {
            px(-1, -2 + liftY, 5, 2, p.wingShoulder);
            px(-3, -4 + liftY, 5, 2, p.wingCovert);
            px(-5, -6 + liftY, 6, 2, p.wingGreen);
            px(-7, -8 + liftY, 5, 2, p.wingPrimary);
            px(-9, -10 + liftY, 5, 2, p.wingPrimary);
            px(-11, -11 + liftY, 4, 1, p.wingTip);
            px(-12, -12 + liftY, 3, 1, p.wingTip);
            px(-9, -7 + liftY, 2, 1, p.wingTip);
        } else if (wingSin < -0.22 && wingSin >= -0.65) {
            px(0, 0 + liftY, 5, 2, p.wingShoulder);
            px(-3, 2 + liftY, 5, 2, p.wingCovert);
            px(-6, 4 + liftY, 5, 2, p.wingGreen);
            px(-9, 6 + liftY, 5, 2, p.wingPrimary);
            px(-11, 7 + liftY, 4, 1, p.wingTip);
            px(-12, 8 + liftY, 2, 1, p.wingTip);
        } else {
            px(0, 1 + liftY, 4, 2, p.wingShoulder);
            px(-2, 3 + liftY, 4, 2, p.wingCovert);
            px(-4, 5 + liftY, 4, 2, p.wingGreen);
            px(-6, 7 + liftY, 4, 2, p.wingPrimary);
            px(-8, 9 + liftY, 3, 2, p.wingTip);
            px(-9, 10 + liftY, 2, 1, p.wingTip);
        }
    }
}

// ============================================================================
// ============================================================================

// ============================================================================
// BÖLÜM SONU: PAPAĞAN SINIFI VE DAVRANIŞLARI
// ============================================================================
