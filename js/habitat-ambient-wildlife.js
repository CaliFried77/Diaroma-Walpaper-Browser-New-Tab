import { pw, ph, pRect } from './07-habitat-state.js';
import { isLightMode } from './01-core-ui.js';
import { getGroundY } from './habitat-geometry.js';
import { getArcticLedges } from './arctic-geometry.js';

/* HABITAT AMBIENT WILDLIFE — hero-scale, widget-safe, click-reactive pixel-art
   hosts for every biome with natural resting/action rhythms, roaming Loch Ness,
   relocated Axolotl, sculpted coral-crimson Reef Octopus, and toggleable Arctic
   Christmas Wonderland. */

// ============================================================================
// BÖLÜM BAŞI: ETKİLEŞİMLİ HİTBOX VE TEPKİ YÖNETİMİ
// ============================================================================

let activeAmbientSceneProfile = null;
const ambientHitboxes = [];
const ambientReactions = new Map();
const ambientTouchPulses = [];

const AMBIENT_REACTION_DURATIONS = Object.freeze({
    meadow_bear: 3600,
    betta_axolotl: 4400,
    betta_snail: 3200,
    wetland_heron: 3200,
    wetland_turtle: 3200,
    botanical_cat: 4500,
    botanical_robin: 2800,
    reef_octopus: 4200,
    reef_anemone: 3400,
    koi_loch_ness: 3800,
    koi_terrapin: 3600,
    rainforest_toucan: 2800,
    rainforest_sloth: 3400,
    rainforest_frog: 2600,
    rainforest_morpho: 3400,
    arctic_bear: 3200,
    arctic_hare: 2800,
    arctic_snowman: 2600,
    arctic_elf_1: 2600,
    arctic_elf_2: 2600,
    arctic_elf_3: 2600,
    arctic_santa: 2400
});

const nessRoam = {
    initialized: false,
    x: 0,
    y: 0,
    vx: 0.018,
    vy: 0.004,
    dir: 1,
    wpIdx: 1,
    loopDir: 1,
    lastTime: 0,
    targetX: 0,
    targetY: 0
};

const clampVal = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function beginAmbientWildlifeFrame(sceneProfile, _time) {
    if (sceneProfile !== activeAmbientSceneProfile) {
        activeAmbientSceneProfile = sceneProfile;
        ambientReactions.clear();
        ambientTouchPulses.length = 0;
        nessRoam.initialized = false;
        nessRoam.wpIdx = 1;
        nessRoam.loopDir = 1;
        nessRoam.lastTime = 0;
    }
    ambientHitboxes.length = 0;
}

export function registerAmbientHitbox(id, x1, y1, x2, y2, priority = 0) {
    const pad = 6;
    ambientHitboxes.push({
        id,
        x1: Math.min(x1, x2) - pad,
        y1: Math.min(y1, y2) - pad,
        x2: Math.max(x1, x2) + pad,
        y2: Math.max(y1, y2) + pad,
        priority
    });
}

export function getAmbientReaction(id, time) {
    const entry = ambientReactions.get(id);
    if (!entry) return null;
    if (entry.startTime === null) {
        entry.startTime = time;
    }
    const elapsed = time - entry.startTime;
    if (elapsed < 0 || elapsed >= entry.duration) {
        ambientReactions.delete(id);
        return null;
    }
    return {
        id,
        progress: elapsed / entry.duration,
        elapsed,
        duration: entry.duration,
        clickX: entry.clickX,
        clickY: entry.clickY,
        seed: entry.seed
    };
}

export function hasAmbientWildlifeAt(sceneProfile, px, py) {
    if (sceneProfile !== activeAmbientSceneProfile) return false;
    for (let i = 0; i < ambientHitboxes.length; i++) {
        const b = ambientHitboxes[i];
        if (px >= b.x1 && px <= b.x2 && py >= b.y1 && py <= b.y2) {
            return true;
        }
    }
    return false;
}

export function tryInteractAmbientWildlife(sceneProfile, px, py) {
    if (sceneProfile !== activeAmbientSceneProfile) return false;
    let best = null;
    for (let i = 0; i < ambientHitboxes.length; i++) {
        const b = ambientHitboxes[i];
        if (px >= b.x1 && px <= b.x2 && py >= b.y1 && py <= b.y2) {
            if (!best || b.priority >= best.priority) {
                best = b;
            }
        }
    }
    if (!best) return false;
    ambientReactions.set(best.id, {
        startTime: null,
        duration: AMBIENT_REACTION_DURATIONS[best.id] || 3200,
        clickX: px,
        clickY: py,
        seed: Math.random()
    });
    if (ambientTouchPulses.length >= 6) ambientTouchPulses.shift();
    ambientTouchPulses.push({
        x: Math.round(px),
        y: Math.round(py),
        startTime: null,
        duration: 520
    });
    return true;
}

export function drawAmbientTouchPulses(time) {
    for (let i = ambientTouchPulses.length - 1; i >= 0; i--) {
        const pulse = ambientTouchPulses[i];
        if (pulse.startTime === null) pulse.startTime = time;
        const elapsed = time - pulse.startTime;
        if (elapsed < 0 || elapsed >= pulse.duration) {
            ambientTouchPulses.splice(i, 1);
            continue;
        }
        const t = easeOutQuad(elapsed / pulse.duration);
        const r = Math.max(2, Math.round(t * 14));
        const alpha = ((1 - elapsed / pulse.duration) * 0.92).toFixed(2);
        const ringCol = `rgba(253, 224, 71, ${alpha})`;
        const sparkCol = `rgba(255, 255, 255, ${alpha})`;
        pRect(pulse.x - Math.floor(r * 0.5), pulse.y - r, r, 1, ringCol);
        pRect(pulse.x - Math.floor(r * 0.5), pulse.y + r, r, 1, ringCol);
        pRect(pulse.x - r, pulse.y - Math.floor(r * 0.5), 1, r, ringCol);
        pRect(pulse.x + r, pulse.y - Math.floor(r * 0.5), 1, r, ringCol);
        const d = Math.round(r * 0.72);
        pRect(pulse.x - d, pulse.y - d, 2, 2, sparkCol);
        pRect(pulse.x + d - 1, pulse.y - d, 2, 2, sparkCol);
        pRect(pulse.x - d, pulse.y + d - 1, 2, 2, sparkCol);
        pRect(pulse.x + d - 1, pulse.y + d - 1, 2, 2, sparkCol);
    }
}

function getLeftSafeX(pct) {
    return Math.max(Math.round(pw * pct), 146);
}

function getRightSafeX(pct) {
    return Math.min(Math.round(pw * pct), pw - 142);
}

// ============================================================================
// BÖLÜM SONU: ETKİLEŞİMLİ HİTBOX VE TEPKİ YÖNETİMİ
// BÖLÜM BAŞI: BİYOMLARIN EV SAHİBİ DURGUN VE ROAMING CANLILARI
// ============================================================================

function drawMeadowHoneyBear(time) {
    // Sol meyve ağaçlarının yanında, Music Widget'tan ve orta akıştan tamamen uzakta (~38px boy x 36px en)
    const bearX = getLeftSafeX(0.27);
    const groundY = getGroundY(bearX, 'meadow', pw, ph) + 1;
    const potX = bearX + 12;
    const potY = groundY;

    const react = getAmbientReaction('meadow_bear', time);
    let standLift = 0;
    let swipeAmt = 0;
    let isAngry = false;

    if (react) {
        const p = react.progress;
        isAngry = true;
        if (p < 0.16) {
            standLift = Math.round(easeOutQuad(p / 0.16) * 11);
        } else if (p < 0.78) {
            standLift = 11;
        } else {
            standLift = Math.round((1 - easeInOutQuad((p - 0.78) / 0.22)) * 11);
        }
        const sw1 = p >= 0.16 && p < 0.35 ? (p - 0.16) / 0.19 : -1;
        const sw2 = p >= 0.35 && p < 0.54 ? (p - 0.35) / 0.19 : -1;
        swipeAmt = sw1 >= 0 ? Math.sin(sw1 * Math.PI) : (sw2 >= 0 ? Math.sin(sw2 * Math.PI) : 0);
    }

    // 18 saniyelik sakin, doğal ritim (~%56 dingin dinlenme & nefes, ardından yavaş bal alma & keyifli tadım)
    const phase = (time % 18000) / 18000;
    const breath = isAngry
        ? (Math.sin(time * 0.016) > 0 ? -1 : 0)
        : (Math.sin(time * 0.0020) > 0.35 ? -1 : 0);
    const blink = !isAngry && (time % 5400) > 5220;
    const earTwitch = !isAngry && (time % 7900) > 7640 ? -1 : 0;

    let pawLift = 0;
    let mouthOpen = false;
    let happyEyes = false;
    if (!isAngry) {
        if (phase >= 0.56 && phase < 0.64) {
            pawLift = -1;
        } else if (phase >= 0.64 && phase < 0.72) {
            const t = (phase - 0.64) / 0.08;
            pawLift = Math.round(t * 10);
            mouthOpen = t > 0.6;
        } else if (phase >= 0.72 && phase < 0.88) {
            const slowChew = Math.sin(((phase - 0.72) / 0.16) * Math.PI * 3);
            pawLift = slowChew > 0 ? 10 : 8;
            mouthOpen = slowChew < 0.15;
            happyEyes = true;
        } else if (phase >= 0.88) {
            const t = (phase - 0.88) / 0.12;
            pawLift = Math.round((1 - t) * 10);
        }
    }

    const furDeep = '#2d1407';
    const furDark = '#4a2511';
    const furMid = '#733c1b';
    const furHi = '#9a5a2c';
    const tan = '#d6a676';
    const cream = '#ebd0ad';

    pRect(bearX - 16, groundY, 39, 3, 'rgba(2, 10, 14, 0.36)');
    pRect(bearX - 14, groundY + 2, 35, 2, 'rgba(2, 10, 14, 0.22)');

    pRect(bearX - 14, groundY - 7 - Math.round(standLift * 0.35), 4, 4, furDark);
    pRect(bearX - 15, groundY - 6 - Math.round(standLift * 0.35), 2, 2, furDeep);

    // Gövde (balını korurken şaha kalkıp uzar!)
    pRect(bearX - 12 - (isAngry ? 1 : 0), groundY - 21 - standLift + breath, 22 + (isAngry ? 2 : 0), 20 + Math.round(standLift * 0.7), furMid);
    pRect(bearX - 12, groundY - 19 - standLift + breath, 5, 18 + Math.round(standLift * 0.6), furDark);
    pRect(bearX - 11, groundY - 17 - standLift + breath, 2, 14, furDeep);
    pRect(bearX - 8, groundY - 22 - standLift + breath, 12, 5, furHi);
    pRect(bearX + 4, groundY - 19 - standLift + breath, 5, 16, furDark);

    pRect(bearX - 4, groundY - 18 - standLift + breath, 11, 15 + Math.round(standLift * 0.5), tan);
    pRect(bearX - 2, groundY - 16 - standLift + breath, 7, 12 + Math.round(standLift * 0.4), cream);

    // Güçlü arka/alt ayaklar
    const stanceSpread = isAngry ? 2 : 0;
    pRect(bearX - 11 - stanceSpread, groundY - 6, 9, 6, furDark);
    pRect(bearX - 10 - stanceSpread, groundY - 5, 7, 4, furMid);
    pRect(bearX - 8 - stanceSpread, groundY - 4, 4, 3, tan);
    pRect(bearX + 2 + Math.round(stanceSpread * 0.5), groundY - 6, 8, 6, furDark);
    pRect(bearX + 3 + Math.round(stanceSpread * 0.5), groundY - 5, 6, 4, furMid);
    pRect(bearX + 5 + Math.round(stanceSpread * 0.5), groundY - 4, 4, 3, cream);

    // Sol kol (öfkelenince küpü kucaklayıp korur)
    if (isAngry) {
        pRect(bearX - 10, groundY - 17 - standLift + breath, 6, 5, furDark);
        pRect(bearX - 4, groundY - 14 - Math.round(standLift * 0.4), 10, 4, furMid);
        pRect(bearX + 4, groundY - 13 - Math.round(standLift * 0.4), 4, 3, cream);
    } else {
        pRect(bearX - 10, groundY - 15 + breath, 5, 7, furDark);
        pRect(bearX - 9, groundY - 13 + breath, 6, 4, furMid);
        pRect(bearX - 5, groundY - 11 + breath, 5, 3, tan);
    }

    // Baş, kulaklar & yüz ifadesi
    const hy = groundY - 35 - standLift + breath;
    pRect(bearX - 9, hy - 3 + earTwitch, 5, 5, furDark);
    pRect(bearX - 8, hy - 2 + earTwitch, 3, 3, furMid);
    pRect(bearX - 7, hy - 1 + earTwitch, 2, 2, tan);
    pRect(bearX + 4, hy - 3, 5, 5, furDark);
    pRect(bearX + 5, hy - 2, 3, 3, furMid);
    pRect(bearX + 5, hy - 1, 2, 2, tan);

    pRect(bearX - 8, hy - 1, 16, 14, furMid);
    pRect(bearX - 9, hy + 2, 18, 10, furMid);
    pRect(bearX - 9, hy + 2, 3, 10, furDark);
    pRect(bearX - 6, hy - 2, 12, 3, furHi);
    pRect(bearX - 3, hy + 5, 11, 8, tan);
    pRect(bearX - 2, hy + 6, 10, 6, cream);
    pRect(bearX + 4, hy + 6, 5, 3, cream);
    pRect(bearX + 6, hy + 6, 3, 2, '#09090b');
    pRect(bearX + 7, hy + 6, 1, 1, '#52525b');

    if (isAngry) {
        // Çatık öfkeli kaşlar + parlayan gözler + diş gösteren kükreme + kırmızı öfke işareti
        pRect(bearX - 5, hy + 1, 3, 1, furDeep);
        pRect(bearX - 3, hy + 2, 2, 1, furDeep);
        pRect(bearX + 4, hy + 1, 3, 1, furDeep);
        pRect(bearX + 2, hy + 2, 2, 1, furDeep);
        pRect(bearX - 4, hy + 3, 2, 2, '#09090b');
        pRect(bearX + 3, hy + 3, 2, 2, '#09090b');
        pRect(bearX - 3, hy + 3, 1, 1, '#ef4444');
        pRect(bearX + 4, hy + 3, 1, 1, '#ef4444');
        // Kükreyen ağız & sivri beyaz dişler
        pRect(bearX + 1, hy + 9, 6, 4, '#7f1d1d');
        pRect(bearX + 2, hy + 10, 4, 2, '#991b1b');
        pRect(bearX + 2, hy + 9, 1, 1, '#ffffff');
        pRect(bearX + 5, hy + 9, 1, 1, '#ffffff');
        pRect(bearX + 3, hy + 12, 1, 1, '#ffffff');
        // Öfke işareti (#ef4444 & #fde047)
        const pulse = Math.sin(time * 0.02) > 0;
        const ax = bearX - 11;
        const ay = hy - 7;
        pRect(ax, ay, 4, 1, pulse ? '#ef4444' : '#f97316');
        pRect(ax + 1, ay - 2, 1, 4, pulse ? '#ef4444' : '#f97316');
        pRect(ax + 4, ay - 1, 2, 2, '#fde047');
    } else if (happyEyes) {
        pRect(bearX - 4, hy + 4, 3, 1, furDeep);
        pRect(bearX + 2, hy + 4, 3, 1, furDeep);
        pRect(bearX - 5, hy + 7, 2, 1, '#fb7185');
        pRect(bearX + 2, hy + 7, 2, 1, '#fb7185');
    } else if (blink) {
        pRect(bearX - 4, hy + 4, 2, 1, furDark);
        pRect(bearX + 3, hy + 4, 2, 1, furDark);
    } else {
        pRect(bearX - 4, hy + 3, 2, 2, '#09090b');
        pRect(bearX + 3, hy + 3, 2, 2, '#09090b');
        pRect(bearX - 4, hy + 3, 1, 1, '#ffffff');
        pRect(bearX + 3, hy + 3, 1, 1, '#ffffff');
    }
    if (!isAngry && mouthOpen) {
        pRect(bearX + 2, hy + 10, 4, 2, '#7f1d1d');
        pRect(bearX + 3, hy + 11, 2, 1, '#fb7185');
    }

    // Bal küpü
    const potTilt = swipeAmt > 0.4 ? -1 : 0;
    pRect(potX - 6, potY - 10 + potTilt, 13, 10, '#78350f');
    pRect(potX - 5, potY - 9 + potTilt, 10, 8, '#b45309');
    pRect(potX - 3, potY - 8 + potTilt, 5, 5, '#d97706');
    pRect(potX - 7, potY - 12 + potTilt, 15, 3, '#92400e');
    pRect(potX - 6, potY - 12 + potTilt, 13, 2, '#d97706');
    pRect(potX - 5, potY - 13 + potTilt, 11, 2, '#f59e0b');
    pRect(potX - 4, potY - 13 + potTilt, 8, 1, '#fde047');
    pRect(potX + 2, potY - 10 + potTilt, 3, 4, '#f59e0b');
    pRect(potX + 3, potY - 9 + potTilt, 1, 2, '#fde047');
    pRect(potX - 2, potY - 10 + potTilt, 2, 2, '#f59e0b');

    if (isAngry) {
        // Sağ kol yukarı kalkar ve bal küpü önünde keskin pençe savurur!
        const sw = Math.round(swipeAmt * 11);
        const armX = bearX + 4 + sw;
        const armY = potY - 22 - standLift + Math.round(swipeAmt * 9);
        pRect(armX - 2, armY, 7, 5, furDark);
        pRect(armX, armY + 1, 6, 4, furMid);
        pRect(armX + 5, armY, 2, 1, '#ffffff');
        pRect(armX + 6, armY + 2, 2, 1, '#ffffff');
        pRect(armX + 5, armY + 4, 2, 1, '#ffffff');
        if (swipeAmt > 0.25) {
            for (let sl = 0; sl < 3; sl++) {
                const sx = potX + 3 + sl * 2;
                const sy = potY - 25 + sl * 4;
                pRect(sx, sy, 9, 1, '#ffffff');
                pRect(sx + 2, sy + 1, 7, 1, '#fde047');
                pRect(sx + 4, sy + 2, 4, 1, '#f97316');
            }
            const dropY = Math.round(swipeAmt * 11);
            pRect(potX + 8, potY - 16 - dropY, 2, 2, '#fde047');
            pRect(potX + 12, potY - 13 - Math.round(dropY * 0.7), 1, 2, '#f59e0b');
        }
    } else {
        const armX = bearX + 4 + (pawLift > 5 ? 1 : 3);
        const armY = potY - 13 - pawLift;
        pRect(armX - 1, armY + 1, 5, 6, furDark);
        pRect(armX, armY + 1, 4, 5, furMid);
        pRect(armX, armY, 4, 3, '#f59e0b');
        pRect(armX + 1, armY, 2, 2, '#fde047');
        if (pawLift > 2) {
            const dripStep = Math.floor((time * 0.008) % 4);
            pRect(armX + 2, armY + 3 + dripStep, 1, 2, '#fde047');
        }
    }

    registerAmbientHitbox('meadow_bear', bearX - 18, groundY - 46 - standLift, potX + 12, groundY + 4, 3);
}

function drawBettaTankCritters(time) {
    const soilY = (x) => {
        const nx = x / Math.max(1, pw);
        const mound = Math.pow(Math.abs(nx - 0.50) * 1.95, 1.45) * 18;
        return Math.round(ph - 4 - mound - Math.sin(x * 0.04) * 2);
    };

    // 1. Yeniden Konumlandırılmış Pembe Aksolotl (~42x20px): Sağ-orta açık koydaki kum yatağında sola bakar, tıklayınca suda yüzüp döner!
    const homeX = getRightSafeX(0.69);
    const homeY = Math.min(ph - 20, soilY(homeX) - 6);

    // Aksolotl için özel açık renkli yumuşak dere kumu & çakıl yatağı
    pRect(homeX - 18, homeY + 3, 36, 4, isLightMode ? '#cbd5e1' : '#334155');
    pRect(homeX - 15, homeY + 2, 30, 2, isLightMode ? '#e2e8f0' : '#475569');
    pRect(homeX + 13, homeY + 1, 5, 3, isLightMode ? '#94a3b8' : '#1e293b');

    const axoReact = getAmbientReaction('betta_axolotl', time);
    const loopX = (t) => -Math.sin(t * Math.PI) * 58 + Math.sin(t * Math.PI * 2) * 14;
    const loopY = (t) => -Math.sin(t * Math.PI) * 44 - Math.sin(t * Math.PI * 2) * 8;

    let curX = homeX;
    let curY = homeY;
    let facingDir = -1;
    let isSwimming = false;
    let swimKick = 0;

    if (axoReact) {
        const p = axoReact.progress;
        if (p < 0.12) {
            curY = Math.round(homeY - easeOutQuad(p / 0.12) * 4);
            isSwimming = true;
            for (let b = 0; b < 4; b++) {
                pRect(homeX - 10 + b * 5, Math.round(homeY - 12 - b * 4 - (p / 0.12) * 10), 2, 2, 'rgba(224, 242, 254, 0.78)');
            }
        } else if (p < 0.84) {
            const u = (p - 0.12) / 0.72;
            const ox = loopX(u);
            const oy = loopY(u);
            const prevU = Math.max(0, u - 0.02);
            const dxVel = ox - loopX(prevU);
            curX = clampVal(Math.round(homeX + ox), 146, pw - 142);
            curY = clampVal(Math.round(homeY + oy), 34, homeY + 2);
            facingDir = Math.abs(dxVel) > 0.15 ? (dxVel >= 0 ? 1 : -1) : -1;
            isSwimming = true;
            swimKick = Math.round(Math.sin(u * Math.PI * 14) * 2.4);
            for (let b = 0; b < 4; b++) {
                const trailU = Math.max(0, u - b * 0.035);
                const bx = clampVal(Math.round(homeX + loopX(trailU) - facingDir * 12), 142, pw - 138);
                const by = clampVal(Math.round(homeY + loopY(trailU) - b * 3 - 4), 28, ph - 12);
                pRect(bx, by, b % 2 === 0 ? 2 : 1, 2, 'rgba(224, 242, 254, 0.65)');
            }
        } else {
            const landT = (p - 0.84) / 0.16;
            curY = Math.round(homeY - (1 - easeOutQuad(landT)) * 2);
            facingDir = -1;
        }
    }

    const phase = (time % 16000) / 16000;
    const breath = isSwimming ? Math.round(Math.sin(time * 0.014) * 0.8) : (Math.sin(time * 0.0022) > 0.3 ? -1 : 0);
    const gillFlick = isSwimming ? (Math.sin(time * 0.02) > 0 ? -1 : 0) : ((phase > 0.35 && phase < 0.42) || (phase > 0.78 && phase < 0.85) ? -1 : 0);
    const yawnWindow = !isSwimming && phase > 0.56 && phase < 0.66;
    const tailSway = isSwimming ? swimKick : Math.round(Math.sin(time * 0.0024) * 1.5);

    const pinkDeep = '#be185d';
    const pinkMid = '#f472b6';
    const pinkLight = '#f9a8d4';
    const pinkHi = '#fbcfe8';
    const gillBase = '#e11d48';
    const gillTip = '#fb7185';

    const axRect = (ox, oy, w, h, col) => pRect(facingDir >= 0 ? curX + ox : curX - ox - w, curY + oy, w, h, col);

    if (!isSwimming) {
        pRect(curX - 20, curY + 2, 38, 3, 'rgba(2, 8, 16, 0.36)');
    }

    // Uzun yüzgeçli kuyruk
    axRect(-23, -5 + tailSway, 9, 6, 'rgba(249, 168, 212, 0.58)');
    axRect(-19, -4 + tailSway, 7, 4, pinkMid);
    axRect(-15, -3 + Math.round(tailSway * 0.5), 7, 4, pinkLight);

    // Tombul gövde & bacaklar
    axRect(-10, -5 + breath, 19, 8, pinkLight);
    axRect(-9, -6 + breath, 16, 2, pinkHi);
    axRect(-8, 1, 15, 2, pinkMid);
    const legOff = isSwimming ? 2 : 0;
    axRect(-8 - legOff, 2, 3, 3, pinkMid);
    axRect(-9 - legOff, 4, 4, 1, pinkHi);
    axRect(4 - legOff, 2, 3, 3, pinkMid);
    axRect(4 - legOff, 4, 4, 1, pinkHi);

    // Tüylü pembe-kızıl solungaç dalları
    [-1, 0, 1].forEach((row, idx) => {
        const gY = -9 + row * 3 + breath + gillFlick;
        axRect(2, gY, 6 + (idx === 1 ? 1 : 0), 2, gillBase);
        axRect(1 - idx, gY - 1, 3, 2, gillTip);
        axRect(0 - idx, gY - 1, 1, 1, '#fda4af');
        axRect(11, gY, 4, 2, gillBase);
        axRect(14, gY - 1, 2, 2, gillTip);
    });

    // Geniş baş, parlak siyah gözler & gülümseyen ağız
    axRect(5, -10 + breath, 12, 10, pinkLight);
    axRect(6, -11 + breath, 10, 2, pinkHi);
    axRect(6, -2 + breath, 10, 2, pinkMid);
    axRect(9, -7 + breath, 2, 2, '#0f172a');
    axRect(14, -7 + breath, 2, 2, '#0f172a');
    axRect(9, -7 + breath, 1, 1, '#ffffff');
    axRect(14, -7 + breath, 1, 1, '#ffffff');
    if (yawnWindow) {
        axRect(10, -4 + breath, 4, 2, pinkDeep);
        for (let b = 0; b < 3; b++) {
            const bprog = ((phase - 0.56) / 0.10 + b * 0.28) % 1;
            const bx = facingDir >= 0 ? curX + 12 + b : curX - 13 - b;
            pRect(bx, Math.round(curY - 8 - bprog * 14), 2, 2, 'rgba(224, 242, 254, 0.72)');
        }
    } else {
        axRect(10, -4 + breath, 4, 1, pinkDeep);
    }

    registerAmbientHitbox('betta_axolotl', curX - 24, curY - 15, curX + 24, curY + 10, 3);

    // 2. Büyütülmüş Altın Elma Salyangozu (~24x19px — kütük kemeri üzerine tam oturur, tıklayınca kabuğuna çekilir!)
    const maxTrunkX = Math.min(190, Math.floor(pw * 0.46));
    const snX = Math.min(Math.round(maxTrunkX * 0.57), Math.round(pw * 0.17));
    const tArch = snX / Math.max(1, maxTrunkX);
    const snY = Math.round(ph - 18 - Math.sin(tArch * Math.PI * 0.88) * 54 + Math.cos(tArch * 4) * 3) + 1;

    const snailReact = getAmbientReaction('betta_snail', time);
    let snailTucked = false;
    let shellRock = 0;
    let peekAmt = 1;
    if (snailReact) {
        const sp = snailReact.progress;
        shellRock = sp < 0.22 ? Math.round(Math.sin(sp * Math.PI * 10) * 1.4) : 0;
        if (sp >= 0.08 && sp < 0.68) {
            snailTucked = true;
            peekAmt = 0;
        } else if (sp >= 0.68) {
            peekAmt = easeOutQuad((sp - 0.68) / 0.32);
        }
        if (sp < 0.28) {
            pRect(snX + 8, Math.round(snY - 14 - sp * 45), 2, 2, 'rgba(224, 242, 254, 0.75)');
            pRect(snX + 5, Math.round(snY - 17 - sp * 35), 1, 1, 'rgba(224, 242, 254, 0.65)');
        }
    }

    const stalkWave = Math.round(Math.sin(time * 0.0022) * 0.9);
    // Ağaç üzerinde yumuşak temas gölgesi & krem gövde tabanı
    pRect(snX - 10, snY - 1, 20, 2, 'rgba(2, 8, 16, 0.38)');
    pRect(snX - 9, snY - 4, 17, 4, '#fef3c7');
    pRect(snX - 8, snY - 5, 14, 2, '#fde68a');

    // Büyük Altın Spiral Kabuk (~17x15px)
    const sx = snX - 1 + shellRock;
    pRect(sx - 9, snY - 12, 16, 9, '#78350f');
    pRect(sx - 8, snY - 15, 14, 11, '#b45309');
    pRect(sx - 7, snY - 17, 12, 11, '#d97706');
    pRect(sx - 5, snY - 16, 9, 8, '#f59e0b');
    pRect(sx - 3, snY - 15, 6, 5, '#fde047');
    pRect(sx - 2, snY - 14, 3, 2, '#ffffff');
    pRect(sx - 4, snY - 12, 4, 2, '#92400e');
    pRect(sx - 1, snY - 10, 2, 2, '#78350f');

    // Kafa ve duyargalar (tıklanınca kabuğa gizlenir)
    if (!snailTucked) {
        const ext = Math.max(1, Math.round(peekAmt * 5));
        const hx = snX + 5 + ext;
        pRect(snX + 5, snY - 6, ext + 2, 4, '#fef3c7');
        pRect(hx - 1, snY - 8, 4, 3, '#fde68a');
        pRect(hx + 1, snY - 12 + stalkWave, 1, 4, '#fcd34d');
        pRect(hx + 3, snY - 11 - stalkWave, 1, 4, '#fcd34d');
        pRect(hx + 1, snY - 13 + stalkWave, 1, 1, '#0f172a');
        pRect(hx + 3, snY - 12 - stalkWave, 1, 1, '#0f172a');
    }

    registerAmbientHitbox('betta_snail', snX - 15, snY - 21, snX + 16, snY + 5, 2);
}

function drawWetlandCritters(time) {
    // 1. Sazlığın Asil Ev Sahibi: Mavi Balıkçıl (~42px, tıklayınca kanat açıp ürkek sıçrar!)
    const hx = getLeftSafeX(0.30);
    const groundHeronY = ph - 14;
    const react = getAmbientReaction('wetland_heron', time);

    let lift = 0;
    let wingOpen = false;
    let flap = 0;
    let isSquawking = false;
    if (react) {
        const p = react.progress;
        lift = Math.round(Math.sin(p * Math.PI) * 11);
        wingOpen = p >= 0.05 && p < 0.88;
        flap = Math.round(Math.sin(p * Math.PI * 7) * 3);
        isSquawking = p >= 0.06 && p < 0.44;
    }

    const hy = groundHeronY - lift;
    const phase = (time % 17000) / 17000;
    const blink = !wingOpen && (time % 5100) > 4920;

    let dipNeck = 0;
    if (!wingOpen) {
        if (phase >= 0.62 && phase < 0.76) {
            dipNeck = Math.round(((phase - 0.62) / 0.14) * 5);
        } else if (phase >= 0.76 && phase < 0.81) {
            dipNeck = 8;
        } else if (phase >= 0.81 && phase < 0.92) {
            dipNeck = Math.round((1 - (phase - 0.81) / 0.11) * 6);
        }
    }

    pRect(hx - 7, groundHeronY + 2, 15, 2, 'rgba(2, 12, 18, 0.35)');
    if (react && react.progress < 0.65) {
        pRect(hx - 10, groundHeronY, 22, 1, 'rgba(224, 242, 254, 0.72)');
        pRect(hx - 6, groundHeronY - 3, 2, 2, '#e0f2fe');
        pRect(hx + 7, groundHeronY - 4, 2, 2, '#bae6fd');
    }

    pRect(hx - 1, hy - 14, 2, 16, '#1e293b');
    pRect(hx + 3, hy - 14, 2, 16, '#334155');
    if (!wingOpen) {
        pRect(hx - 5, groundHeronY + 1, 12, 1, 'rgba(186, 230, 253, 0.38)');
    }
    if (!wingOpen && phase >= 0.76 && phase < 0.84) {
        const sp = Math.round(((phase - 0.76) / 0.08) * 9);
        pRect(hx + 16 - sp, groundHeronY, sp * 2, 1, 'rgba(224, 242, 254, 0.65)');
    }

    // Geniş açılan katmanlı kanatlar (tıklama tepkisi)
    if (wingOpen) {
        pRect(hx - 23, hy - 34 + flap, 21, 9, '#334155');
        pRect(hx - 21, hy - 32 + flap, 18, 6, '#64748b');
        pRect(hx - 23, hy - 27 + flap, 15, 4, '#0f172a');
        pRect(hx + 3, hy - 34 - flap, 18, 8, '#475569');
        pRect(hx + 6, hy - 31 - flap, 15, 5, '#94a3b8');
        pRect(hx + 14, hy - 27 - flap, 7, 3, '#1e293b');
    }

    pRect(hx - 9, hy - 25, 16, 11, '#334155');
    pRect(hx - 7, hy - 26, 13, 9, '#475569');
    pRect(hx - 5, hy - 25, 9, 5, '#64748b');
    pRect(hx - 2, hy - 23, 6, 3, '#cbd5e1');
    pRect(hx - 11, hy - 21, 5, 4, '#1e293b');
    pRect(hx + 3, hy - 23, 5, 7, '#e2e8f0');

    const neckForward = Math.round(dipNeck * 0.75);
    const neckDown = dipNeck - (wingOpen ? 2 : 0);
    pRect(hx + 4 + Math.round(neckForward * 0.3), hy - 32 + Math.round(neckDown * 0.5), 3, 9, '#f1f5f9');
    pRect(hx + 5 + Math.round(neckForward * 0.6), hy - 38 + Math.round(neckDown * 0.8), 3, 8, '#ffffff');
    pRect(hx + 5 + neckForward, hy - 41 + neckDown, 6, 4, '#ffffff');
    pRect(hx + 3 + neckForward, hy - 42 + neckDown, 7, 2, '#0f172a');
    pRect(hx + 1 + neckForward, hy - 41 + neckDown, 3, 1, '#334155');
    pRect(hx + 8 + neckForward, hy - 40 + neckDown, 1, 1, blink ? '#cbd5e1' : '#facc15');
    if (isSquawking) {
        pRect(hx + 11, hy - 41 + neckDown, 8, 1, '#f59e0b');
        pRect(hx + 11, hy - 38 + neckDown, 8, 1, '#fde047');
        pRect(hx + 21, hy - 43 + neckDown, 2, 1, '#ffffff');
        pRect(hx + 22, hy - 40 + neckDown, 3, 1, '#fef08a');
    } else {
        pRect(hx + 11 + neckForward, hy - 40 + neckDown, 8, 2, '#f59e0b');
        pRect(hx + 15 + neckForward, hy - 39 + neckDown, 5, 1, '#fde047');
    }

    registerAmbientHitbox('wetland_heron', hx - 14, hy - 44, hx + 22, groundHeronY + 5, 3);

    // 2. Büyütülmüş Su Kaplumbağası (~25x14px — tıklayınca kabuğa gizlenip su dalgalandırır)
    const snagX = Math.round(pw * 0.66);
    const snagBankY = getGroundY(snagX + 8, 'wetland', pw, ph) + 1;
    const tuX = snagX - 3;
    const tuY = snagBankY - 8;
    const tReact = getAmbientReaction('wetland_turtle', time);
    const tuckPhase = (time % 15000) / 15000;
    const hideFully = tReact ? tReact.progress < 0.72 : false;
    const rockTu = tReact && tReact.progress < 0.25 ? Math.round(Math.sin(tReact.progress * Math.PI * 12)) : 0;
    const headPull = hideFully ? 8 : ((tuckPhase > 0.74 && tuckPhase < 0.88) ? 3 : 0);
    const blinkTu = (time % 4600) > 4420;

    pRect(tuX - 8, tuY - 2, 17, 3, '#92400e');
    if (tReact && tReact.progress < 0.45) {
        pRect(tuX - 13, tuY + 2, 26, 1, 'rgba(186, 230, 253, 0.55)');
    }
    pRect(tuX - 9 + rockTu, tuY - 8, 18, 6, '#14532d');
    pRect(tuX - 7 + rockTu, tuY - 10, 14, 5, '#166534');
    pRect(tuX - 5 + rockTu, tuY - 9, 4, 2, '#4ade80');
    pRect(tuX + 1 + rockTu, tuY - 9, 4, 2, '#4ade80');
    pRect(tuX - 6 + rockTu, tuY - 6, 4, 2, '#d97706');
    pRect(tuX + 2 + rockTu, tuY - 6, 4, 2, '#d97706');
    if (!hideFully) {
        pRect(tuX - 8, tuY, 3, 3, '#365314');
        pRect(tuX + 5, tuY, 3, 3, '#365314');
        pRect(tuX - 13 + headPull, tuY - 6, 6, 3, '#4d7c0f');
        pRect(tuX - 15 + headPull, tuY - 8, 5, 3, '#65a30d');
        pRect(tuX - 12 + headPull, tuY - 6, 2, 1, '#ef4444');
        pRect(tuX - 14 + headPull, tuY - 8, 1, 1, blinkTu ? '#365314' : '#0f172a');
    }

    registerAmbientHitbox('wetland_turtle', tuX - 17, tuY - 13, tuX + 14, tuY + 6, 2);
}

function drawBotanicalCatStanding(cx, footY, facing, archH, stepCycle, heartUp) {
    const px = (ox, oy, w, h, col) => pRect(facing >= 0 ? cx + ox : cx - ox - w, footY + oy, w, h, col);

    pRect(cx - 12, footY - 1, 24, 3, 'rgba(2, 8, 16, 0.36)');

    // Kıvrılmış neşeli turuncu kuyruk
    const tailWag = Math.round(Math.sin(stepCycle * 0.5) * 1.5);
    px(-14, -14 + tailWag, 4, 3, '#f97316');
    px(-15, -17 + tailWag, 3, 3, '#fef3c7');
    px(-11, -11, 4, 4, '#ea580c');

    // Dört beyaz patili adım atan bacak
    const legA = Math.round(Math.sin(stepCycle) * 2);
    const legB = -legA;
    px(-8 + legA, -6, 3, 5, '#ea580c');
    px(-8 + legA, -2, 4, 2, '#fef3c7');
    px(-3 + legB, -6, 3, 5, '#c2410c');
    px(-3 + legB, -2, 3, 2, '#ffffff');
    px(3 + legB, -6, 3, 5, '#ea580c');
    px(3 + legB, -2, 4, 2, '#fef3c7');
    px(6 + legA, -6, 3, 5, '#c2410c');
    px(6 + legA, -2, 3, 2, '#ffffff');

    // Gövde + tekir çizgileri (esnerken sırtı kamburlaşır!)
    px(-9, -13 - archH, 18, 7 + Math.round(archH * 0.6), '#ea580c');
    px(-7, -14 - archH, 14, 3, '#f97316');
    px(-5, -14 - archH, 10, 2, '#fb923c');
    px(-6, -13 - archH, 2, 4, '#9a3412');
    px(-1, -13 - archH, 2, 4, '#9a3412');
    px(4, -13 - archH, 2, 4, '#9a3412');
    px(2, -9, 7, 3, '#fef3c7');

    // Baş (oyuncak ya da neşeli yürüyüş bakışı)
    const hy = -21 - Math.round(archH * 0.35);
    px(5, hy - 3, 3, 4, '#c2410c');
    px(6, hy - 2, 1, 2, '#fda4af');
    px(11, hy - 3, 3, 4, '#c2410c');
    px(12, hy - 2, 1, 2, '#fda4af');
    px(4, hy, 11, 9, '#f97316');
    px(6, hy - 1, 7, 2, '#fb923c');
    px(7, hy + 4, 7, 5, '#fef3c7');
    px(11, hy + 5, 2, 1, '#fb7185');
    px(7, hy + 3, 2, 2, '#34d399');
    px(11, hy + 3, 2, 2, '#34d399');
    px(7, hy + 3, 1, 1, '#0f172a');
    px(11, hy + 3, 1, 1, '#0f172a');

    if (heartUp >= 0) {
        const hyPos = footY - 27 - Math.round(heartUp);
        pRect(cx - 2, hyPos, 2, 2, '#fb7185');
        pRect(cx + 1, hyPos, 2, 2, '#fb7185');
        pRect(cx - 1, hyPos + 1, 3, 2, '#f43f5e');
        pRect(cx, hyPos + 3, 1, 1, '#e11d48');
    }
}

function drawBotanicalCritters(time) {
    // 1. Bahçenin Uyuyan Sarman Kedisi (~34x22px, tıklayınca uyanıp sırt esnetir, koşup pati atar ve taşına döner!)
    const catX = getRightSafeX(0.68);
    const catY = getGroundY(catX, 'botanical', pw, ph) + 1;

    // Sabit yosunlu bahçe taşı
    pRect(catX - 17, catY, 35, 3, 'rgba(2, 8, 16, 0.42)');
    pRect(catX - 16, catY - 3, 33, 4, '#334155');
    pRect(catX - 15, catY - 4, 31, 2, '#475569');
    pRect(catX - 13, catY - 4, 6, 1, '#15803d');

    const catReact = getAmbientReaction('botanical_cat', time);
    let curCatX = catX;

    if (catReact && catReact.progress >= 0.04 && catReact.progress < 0.90) {
        const p = catReact.progress;
        let jumpY = 0;
        let archH = 0;
        let facing = -1;
        let stepCycle = p * 26;
        let heartUp = -1;

        if (p < 0.18) {
            archH = Math.round(Math.sin(((p - 0.04) / 0.14) * Math.PI) * 3);
            stepCycle = 0;
            heartUp = ((p - 0.04) / 0.14) * 7;
        } else if (p < 0.54) {
            const u = (p - 0.18) / 0.36;
            const walkOut = Math.min(1, u / 0.65);
            curCatX = catX - Math.round(easeInOutQuad(walkOut) * 28);
            facing = -1;
            if (u > 0.65) {
                const pounceU = (u - 0.65) / 0.35;
                jumpY = -Math.round(Math.sin(pounceU * Math.PI) * 7);
                pRect(curCatX - 18, catY - 12 - Math.round(Math.sin(pounceU * Math.PI) * 5), 2, 2, '#fde047');
                pRect(curCatX - 21, catY - 9, 2, 2, '#f472b6');
                stepCycle = Math.PI * 0.5;
            }
        } else {
            const u = (p - 0.54) / 0.36;
            curCatX = catX - Math.round((1 - easeInOutQuad(u)) * 28);
            facing = 1;
            heartUp = u * 9;
        }

        const standingFootY = Math.round(catY - 3 + jumpY);
        drawBotanicalCatStanding(curCatX, standingFootY, facing, archH, stepCycle, heartUp);
    } else {
        const phase = (time % 18000) / 18000;
        const breath = Math.sin(time * 0.0019) > 0.3 ? -1 : 0;
        const earTwitch = (time % 6800) > 6580 ? -1 : 0;
        const tailCurl = Math.round(Math.sin(time * 0.0020) * 1.4);

        const waking = phase >= 0.62 && phase < 0.86;
        const yawning = phase >= 0.71 && phase < 0.80;
        const headLift = waking ? -2 : 0;

        pRect(catX - 12, catY - 12 + breath, 21, 9, '#ea580c');
        pRect(catX - 9, catY - 14 + breath, 15, 4, '#f97316');
        pRect(catX - 6, catY - 14 + breath, 9, 2, '#fb923c');
        pRect(catX - 7, catY - 13 + breath, 2, 5, '#9a3412');
        pRect(catX - 2, catY - 13 + breath, 2, 5, '#9a3412');
        pRect(catX + 3, catY - 13 + breath, 2, 5, '#9a3412');

        pRect(catX - 14, catY - 7, 5, 4, '#ea580c');
        pRect(catX - 16, catY - 9 + tailCurl, 4, 3, '#f97316');
        pRect(catX - 17, catY - 10 + tailCurl, 3, 2, '#fef3c7');

        pRect(catX + 6, catY - 5, 6, 3, '#fef3c7');
        pRect(catX + 8, catY - 6, 4, 2, '#ffffff');

        const hx = catX + 3;
        const hy = catY - 18 + breath + headLift;
        pRect(hx, hy - 3 + earTwitch, 3, 4, '#c2410c');
        pRect(hx + 1, hy - 2 + earTwitch, 1, 2, '#fda4af');
        pRect(hx + 7, hy - 3, 3, 4, '#c2410c');
        pRect(hx + 8, hy - 2, 1, 2, '#fda4af');
        pRect(hx - 1, hy, 12, 9, '#f97316');
        pRect(hx + 1, hy - 1, 8, 2, '#fb923c');
        pRect(hx + 2, hy + 4, 8, 5, '#fef3c7');
        pRect(hx + 5, hy + 5, 2, 1, '#fb7185');
        if (yawning) {
            pRect(hx + 5, hy + 6, 3, 2, '#be123c');
            pRect(hx + 6, hy + 7, 1, 1, '#fda4af');
        }
        if (waking && !yawning) {
            pRect(hx + 2, hy + 3, 2, 2, '#34d399');
            pRect(hx + 7, hy + 3, 2, 2, '#34d399');
            pRect(hx + 2, hy + 3, 1, 1, '#0f172a');
            pRect(hx + 7, hy + 3, 1, 1, '#0f172a');
        } else {
            pRect(hx + 2, hy + 3, 2, 1, '#7c2d12');
            pRect(hx + 7, hy + 3, 2, 1, '#7c2d12');
        }
    }

    registerAmbientHitbox('botanical_cat', curCatX - 20, catY - 25, curCatX + 20, catY + 5, 3);

    // 2. Büyütülmüş Bahçe Kızılgerdanı (~22x17px — tıklayınca cıvıldayıp kanat çırparak zıplar)
    const birdX = getLeftSafeX(0.30);
    const birdBaseY = getGroundY(birdX, 'botanical', pw, ph) + 1;
    pRect(birdX - 8, birdBaseY - 4, 16, 5, '#334155');
    pRect(birdX - 6, birdBaseY - 5, 13, 2, '#64748b');

    const birdReact = getAmbientReaction('botanical_robin', time);
    let curRx = birdX;
    let curRy = birdBaseY - 4;
    let wingFlap = 0;

    if (birdReact) {
        const p = birdReact.progress;
        curRx = birdX + Math.round(Math.sin(p * Math.PI * 2) * 14);
        curRy = birdBaseY - 4 - Math.round(Math.sin(p * Math.PI) * 18);
        wingFlap = Math.sin(p * Math.PI * 10) > 0 ? -4 : 1;
        pRect(curRx + 5, curRy - 18 - Math.round(p * 6), 2, 2, '#fde047');
        pRect(curRx + 7, curRy - 20 - Math.round(p * 6), 2, 1, '#fef08a');
    }

    const birdPhase = (time % 14000) / 14000;
    const birdDip = !birdReact && (birdPhase > 0.65 && birdPhase < 0.80) ? 2 : 0;
    const blinkR = !birdReact && (time % 4700) > 4520;

    pRect(curRx - 2, curRy - 3, 2, 3, '#78350f');
    pRect(curRx + 2, curRy - 3, 2, 3, '#78350f');
    pRect(curRx - 11, curRy - 9 + birdDip, 5, 3, '#451a03');
    pRect(curRx - 7, curRy - 11 + birdDip, 13, 8, '#78350f');
    pRect(curRx - 6, curRy - 9 + wingFlap + birdDip, 7, 4, '#5c3a21');
    pRect(curRx - 1, curRy - 11 + birdDip, 8, 7, '#ef4444');
    pRect(curRx + 1, curRy - 10 + birdDip, 5, 4, '#fb923c');
    pRect(curRx, curRy - 4 + birdDip, 5, 2, '#fef3c7');
    pRect(curRx - 1, curRy - 16 + birdDip, 8, 6, '#92400e');
    pRect(curRx + 3, curRy - 15 + birdDip, 2, 2, blinkR ? '#78350f' : '#0f172a');
    if (!blinkR) pRect(curRx + 3, curRy - 15 + birdDip, 1, 1, '#ffffff');
    pRect(curRx + 7, curRy - 13 + birdDip, 4, 2, '#facc15');

    registerAmbientHitbox('botanical_robin', curRx - 13, curRy - 21, curRx + 14, curRy + 4, 2);
}

function drawReefCritters(time) {
    const reefFloorY = (x) => {
        const nx = x / Math.max(1, pw);
        const sideMound = nx < 0.26 ? Math.pow((0.26 - nx) / 0.26, 1.5) * 34
                        : (nx > 0.74 ? Math.pow((nx - 0.74) / 0.26, 1.5) * 34 : 0);
        return Math.round(getGroundY(x, 'reef', pw, ph) - sideMound);
    };

    // 1. TAMAMEN YENİDEN TASARLANAN MERCAN-KIZIL BİYOLÜMİNESAN AHTAPOT (~52x38px, tıklayınca mürekkep bulutuyla yukarı fırlar!)
    const octX = getLeftSafeX(0.30);
    const floorY = reefFloorY(octX) - 2;
    const octReact = getAmbientReaction('reef_octopus', time);

    let crouch = 0;
    let jetY = 0;
    let isJetting = false;
    let flashBoost = false;

    if (octReact) {
        const p = octReact.progress;
        flashBoost = p < 0.22;
        if (p < 0.12) {
            crouch = Math.round(easeOutQuad(p / 0.12) * 3);
        } else if (p < 0.44) {
            isJetting = true;
            jetY = -Math.round(easeOutQuad((p - 0.12) / 0.32) * 28);
        } else if (p < 0.90) {
            isJetting = true;
            jetY = -Math.round((1 - easeInOutQuad((p - 0.44) / 0.46)) * 28);
        }
        // Zemin noktasında dağılan koyu lacivert mürekkep bulutu
        if (p >= 0.12 && p < 0.78) {
            const inkT = (p - 0.12) / 0.66;
            const alpha = ((1 - inkT) * 0.76).toFixed(2);
            const colInkA = `rgba(15, 23, 42, ${alpha})`;
            const colInkB = `rgba(30, 27, 75, ${(Number(alpha) * 0.85).toFixed(2)})`;
            const spread = Math.round(inkT * 22);
            pRect(octX - 11 - spread, floorY - 12 - Math.round(inkT * 10), 14, 9, colInkA);
            pRect(octX - 3 + Math.round(spread * 0.4), floorY - 16 - Math.round(inkT * 14), 16, 11, colInkB);
            pRect(octX - 16 - Math.round(spread * 0.6), floorY - 6, 11, 7, colInkB);
            pRect(octX + 6 + spread, floorY - 8, 10, 6, colInkA);
        }
    }

    const baseY = floorY + crouch + jetY;
    const phase = (time % 16000) / 16000;
    const mantlePulse = isJetting ? 0 : (Math.sin(time * 0.0020) > 0.35 ? -1 : 0);
    const blink = !isJetting && (time % 5200) > 5010;
    const biolumi = flashBoost || (phase > 0.46 && phase < 0.70);
    const wave = Math.sin(time * 0.0026);

    const ocOutline = '#4c0519';
    const ocDeep = '#881337';
    const ocMid = '#be123c';
    const ocBright = '#e11d48';
    const ocHi = '#fb7185';
    const ocCup = '#fbcfe8';
    const ocellusCore = flashBoost ? '#a5f3fc' : (biolumi ? '#67e8f9' : '#22d3ee');

    if (!isJetting) {
        pRect(octX - 24, floorY + 1, 48, 3, 'rgba(5, 4, 23, 0.46)');
    }

    // Organik 5 kıvrımlı dokunaç & pembe vantuz dizileri
    const drawTentacleArc = (points, isBack) => {
        for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            const rx = octX + pt[0];
            const ry = baseY + pt[1];
            const r = pt[2];
            pRect(rx - r, ry - 1, r * 2, r + 1, isBack ? ocOutline : ocDeep);
            pRect(rx - Math.max(1, r - 1), ry - 1, Math.max(1, r * 2 - 2), r, isBack ? ocDeep : ocMid);
            if (!isBack && r >= 3) pRect(rx - r + 1, ry - 1, r, 1, ocBright);
            if (i % 2 === 1 && r >= 2) pRect(rx, ry + r - 1, 2, 1, ocCup);
        }
    };

    if (isJetting && octReact && octReact.progress < 0.44) {
        // Roket gibi yükselirken alta doğru uzanan ince dokunaçlar
        const trail = Math.round(Math.sin(time * 0.025) * 2);
        [-10, -5, 0, 5, 10].forEach((tx, idx) => {
            for (let s = 0; s < 5; s++) {
                const wx = octX + tx + (s >= 3 ? trail * (idx % 2 === 0 ? 1 : -1) : 0);
                const wy = baseY - 2 + s * 4;
                const w = Math.max(1, 3 - Math.floor(s * 0.45));
                pRect(wx - 1, wy, w + 1, 4, s > 2 ? ocDeep : ocMid);
                if (s % 2 === 1) pRect(wx, wy + 2, 1, 1, ocCup);
            }
        });
    } else {
        const lift = Math.round(wave * 2) + (isJetting ? -2 : 0);
        // Arka sol & arka sağ kıvrık dokunaçlar
        drawTentacleArc([[-9, -4, 4], [-14, -2, 3], [-19, -3, 3], [-23, -6, 2], [-25, -9, 1]], true);
        drawTentacleArc([[8, -5, 4], [13, -6 + lift, 3], [17, -10 + lift, 3], [19, -15 + lift, 2], [17, -19 + lift, 1]], true);
        // Ön sol kayaya sarılan, orta yayılan ve ön sağ meraktan sallanan dokunaçlar
        drawTentacleArc([[-7, -3, 4], [-12, 0, 4], [-18, 0, 3], [-23, -2, 2], [-26, -5, 2]], false);
        drawTentacleArc([[-3, -2, 4], [-5, 1, 3], [-1, 2, 3], [4, 1, 2], [8, 0, 2]], false);
        drawTentacleArc([[5, -3, 4], [11, 0, 4], [17, 1, 3], [22, -2, 2], [25, -6, 2]], false);
    }

    // Doğal eğimli armut biçimli manto kubbesi (satır satır organik çizim)
    const domeCenterX = octX - 2;
    const domeTop = baseY - 33 + mantlePulse;
    const domeHeight = 19;
    for (let dy = 0; dy < domeHeight; dy++) {
        const t = dy / (domeHeight - 1);
        const bulge = Math.sin(Math.pow(t, 0.72) * Math.PI);
        const halfW = Math.max(2, Math.round(3 + bulge * 8.5));
        const lean = Math.round((1 - t) * -3);
        const rowX = domeCenterX + lean;
        const rowY = domeTop + dy;
        pRect(rowX - halfW - 1, rowY, halfW * 2 + 2, 1, ocOutline);
        pRect(rowX - halfW, rowY, halfW * 2, 1, t > 0.72 ? ocDeep : ocMid);
        pRect(rowX - halfW + 1, rowY, Math.max(2, Math.round(halfW * 1.3)), 1, ocBright);
        if (t < 0.45 && halfW >= 5) {
            pRect(rowX - Math.floor(halfW * 0.5), rowY, Math.max(2, Math.floor(halfW * 0.7)), 1, t < 0.2 ? '#fda4af' : ocHi);
        }
    }

    // Yan sifon hunisi & biyolüminesan camgöbeği göz-benek (ocelli) halkaları
    pRect(octX + 8, baseY - 19 + mantlePulse, 5, 3, ocDeep);
    pRect(octX + 12, baseY - 18 + mantlePulse, 2, 2, ocBright);
    pRect(octX - 8, baseY - 26 + mantlePulse, 4, 3, ocOutline);
    pRect(octX - 7, baseY - 25 + mantlePulse, 2, 2, ocellusCore);
    pRect(octX - 3, baseY - 21 + mantlePulse, 4, 3, ocOutline);
    pRect(octX - 2, baseY - 20 + mantlePulse, 2, 2, ocellusCore);
    pRect(octX + 3, baseY - 25 + mantlePulse, 3, 2, ocOutline);
    pRect(octX + 4, baseY - 25 + mantlePulse, 1, 1, ocellusCore);

    // İfade dolu ahtapot başı, çıkıntılı kaşlar ve yatay dikdörtgen gözbebekleri
    pRect(octX - 10, baseY - 16, 20, 12, ocMid);
    pRect(octX - 8, baseY - 15, 16, 9, ocBright);
    pRect(octX - 9, baseY - 17, 7, 3, ocHi);
    pRect(octX + 2, baseY - 17, 7, 3, ocHi);
    pRect(octX - 8, baseY - 14, 5, 5, blink ? ocDeep : '#fbbf24');
    pRect(octX + 3, baseY - 14, 5, 5, blink ? ocDeep : '#fbbf24');
    if (!blink) {
        pRect(octX - 7, baseY - 13, 3, 2, '#fef08a');
        pRect(octX + 4, baseY - 13, 3, 2, '#fef08a');
        pRect(octX - 7, baseY - 12, 4, 2, '#090d16');
        pRect(octX + 4, baseY - 12, 4, 2, '#090d16');
        pRect(octX - 8, baseY - 14, 1, 1, '#ffffff');
        pRect(octX + 3, baseY - 14, 1, 1, '#ffffff');
    }

    registerAmbientHitbox('reef_octopus', octX - 28, baseY - 35, octX + 28, baseY + 6, 3);

    // 2. Mercanda Şakayık ve Palyaço Balığı (~26x18px — tıklayınca balığı içeri saklanıp neşeli tur atar!)
    const anemX = Math.min(Math.round(pw * 0.62), getRightSafeX(0.66));
    const anemY = reefFloorY(anemX) - 2;
    const anemReact = getAmbientReaction('reef_anemone', time);
    const sw = Math.sin(time * 0.0022);
    const hideCurl = anemReact && anemReact.progress < 0.25 ? 1 : 0;

    pRect(anemX - 10, anemY - 3, 20, 4, '#831843');
    for (let t = -8; t <= 8; t += 4) {
        const th = (hideCurl ? 5 : 8) + ((Math.abs(t) + 1) % 3) * 2;
        const ts = hideCurl ? -Math.sign(t) : Math.round(sw * (t >= 0 ? 1.3 : 0.8));
        pRect(anemX + t, anemY - th, 3, th, '#db2777');
        pRect(anemX + t + ts, anemY - th - 2, 3, 2, '#f472b6');
        pRect(anemX + t + ts, anemY - th - 3, 2, 1, '#fbcfe8');
    }

    let cfX = anemX + 2;
    let cfY = anemY - 9;
    let cfDir = 1;
    let cfHide = false;
    if (anemReact) {
        const ap = anemReact.progress;
        if (ap < 0.22) {
            cfHide = true;
        } else if (ap < 0.86) {
            const loopU = (ap - 0.22) / 0.64;
            cfX = anemX + Math.round(Math.sin(loopU * Math.PI * 2) * 14);
            cfY = anemY - 12 - Math.round(Math.sin(loopU * Math.PI) * 11);
            cfDir = Math.cos(loopU * Math.PI * 2) >= 0 ? 1 : -1;
            pRect(cfX - cfDir * 7, cfY + 1, 2, 2, 'rgba(224, 242, 254, 0.72)');
        }
    } else if (phase > 0.45 && phase < 0.78) {
        cfX += Math.round(Math.sin(((phase - 0.45) / 0.33) * Math.PI) * 5);
    }

    if (!cfHide) {
        const cfRect = (ox, oy, w, h, col) => pRect(cfDir >= 0 ? cfX + ox : cfX - ox - w, cfY + oy, w, h, col);
        cfRect(-6, -3, 12, 6, '#f97316');
        cfRect(-9, -2, 3, 4, '#ea580c');
        cfRect(-2, -3, 2, 6, '#ffffff');
        cfRect(2, -3, 2, 6, '#ffffff');
        cfRect(4, -2, 1, 2, '#0f172a');
    }

    registerAmbientHitbox('reef_anemone', anemX - 16, anemY - 21, anemX + 19, anemY + 4, 2);
}

function drawKoiPondCritters(time) {
    // 1. DIŞ ÇEVRE KORİDORUNDA GEZİNEN LOCH NESS / YEŞİM GÖL EJDERHASI
    // Saat, Arama Kutusu, Kısayollar & Gündem UI bölgesini [0.27..0.73*pw, 0.23..0.82*ph] ASLA kesmeyen 8 noktalı açık su halkası!
    const waypoints = [
        { x: Math.round(pw * 0.16), y: Math.round(ph * 0.21), canEmerge: true },  // 0: Sol-üst açık su
        { x: Math.round(pw * 0.16), y: Math.round(ph * 0.46), canEmerge: true },  // 1: Sol-orta açık göl (Arama & Saat solu)
        { x: Math.round(pw * 0.18), y: Math.round(ph * 0.72), canEmerge: true },  // 2: Sol-alt açık göl (Müzik Widget üstü)
        { x: Math.round(pw * 0.30), y: Math.round(ph * 0.87), canEmerge: true },  // 3: Alt-sol açık kanal
        { x: Math.round(pw * 0.52), y: Math.round(ph * 0.88), canEmerge: true },  // 4: Alt-orta açık gölet (Gündem altı)
        { x: Math.round(pw * 0.74), y: Math.round(ph * 0.84), canEmerge: true },  // 5: Alt-sağ açık kanal (Sistem Widget solu)
        { x: Math.round(pw * 0.78), y: Math.round(ph * 0.46), canEmerge: true },  // 6: Sağ-orta açık derin su
        { x: Math.round(pw * 0.76), y: Math.round(ph * 0.21), canEmerge: false }  // 7: Sağ-üst & üst bar altı su-altı transit
    ];

    if (!nessRoam.initialized) {
        nessRoam.initialized = true;
        nessRoam.wpIdx = 1;
        nessRoam.loopDir = 1;
        nessRoam.x = waypoints[1].x;
        nessRoam.y = waypoints[1].y;
        nessRoam.targetX = waypoints[2].x;
        nessRoam.targetY = waypoints[2].y;
        nessRoam.dir = 1;
        nessRoam.lastTime = time;
    }

    const react = getAmbientReaction('koi_loch_ness', time);
    const phase = (time % 22000) / 22000;
    let baseEmerge = 0;
    if (phase >= 0.48 && phase < 0.58) {
        const u = (phase - 0.48) / 0.10;
        baseEmerge = 1 - (1 - u) * (1 - u);
    } else if (phase >= 0.58 && phase < 0.86) {
        baseEmerge = 1;
    } else if (phase >= 0.86) {
        const u = (phase - 0.86) / 0.14;
        baseEmerge = 1 - u * u;
    }

    let reactEmerge = 0;
    let rearExtra = 0;
    if (react) {
        const rp = react.progress;
        if (rp < 0.18) {
            reactEmerge = easeOutQuad(rp / 0.18);
            rearExtra = Math.round(reactEmerge * 7);
        } else if (rp < 0.76) {
            reactEmerge = 1;
            rearExtra = 7;
        } else {
            const d = (rp - 0.76) / 0.24;
            reactEmerge = 1 - d * d;
            rearExtra = Math.round(reactEmerge * 7);
        }
    }

    const curInCenterUI = nessRoam.x > pw * 0.27 && nessRoam.x < pw * 0.73 && nessRoam.y < ph * 0.82;
    const safeToEmerge = nessRoam.y >= Math.round(ph * 0.23) && !curInCenterUI;
    const emerge = Math.max(safeToEmerge ? baseEmerge : 0, reactEmerge);

    // Açık çevre halkası boyunca sıralı ilerleme (merkez arama kutusunu asla kesmez)
    const dt = nessRoam.lastTime ? clampVal(time - nessRoam.lastTime, 0, 80) : 16;
    nessRoam.lastTime = time;
    const targetWp = waypoints[nessRoam.wpIdx] || waypoints[1];
    nessRoam.targetX = targetWp.x;
    nessRoam.targetY = targetWp.y;
    const dxToT = nessRoam.targetX - nessRoam.x;
    const dyToT = nessRoam.targetY - nessRoam.y;
    const distToT = Math.hypot(dxToT, dyToT);
    if (distToT < 16) {
        nessRoam.wpIdx = (nessRoam.wpIdx + nessRoam.loopDir + waypoints.length) % waypoints.length;
        const nextWp = waypoints[nessRoam.wpIdx];
        nessRoam.targetX = nextWp.x;
        nessRoam.targetY = nextWp.y;
    } else if (dt > 0) {
        const moveSpeed = 0.025 * (1 - emerge * 0.85);
        nessRoam.vx = (dxToT / distToT) * moveSpeed;
        nessRoam.vy = (dyToT / distToT) * moveSpeed;
        nessRoam.x = clampVal(nessRoam.x + nessRoam.vx * dt, 64, pw - 90);
        nessRoam.y = clampVal(nessRoam.y + nessRoam.vy * dt, 58, ph - 14);
        if (Math.abs(nessRoam.vx) > 0.002) {
            nessRoam.dir = nessRoam.vx >= 0 ? 1 : -1;
        }
    }

    const nessX = Math.round(nessRoam.x);
    const nessY = Math.round(nessRoam.y);
    const dir = nessRoam.dir;
    const subGlide = Math.sin(time * 0.0022) * 3;

    // Alt vücut HER ZAMAN derin koyu gölet suyunun altında uzun kıvrımlı gölge olarak kalır!
    pRect(Math.round(nessX - dir * 10 - 11 + subGlide), nessY + 6, 22, 6, 'rgba(2, 14, 22, 0.34)');
    pRect(Math.round(nessX - dir * 32 - 14 + subGlide * 0.7), nessY + 10, 28, 7, 'rgba(2, 14, 22, 0.40)');
    pRect(Math.round(nessX - dir * 56 - 11 - subGlide * 0.5), nessY + 8, 22, 5, 'rgba(2, 14, 22, 0.28)');
    pRect(Math.round(nessX - dir * 74 - 7 + subGlide * 0.3), nessY + 6, 14, 3, 'rgba(2, 14, 22, 0.20)');

    if (emerge < 0.05 && ((time % 3200) < 1300)) {
        const bStep = ((time % 3200) / 1300);
        pRect(nessX + dir * 4, Math.round(nessY - 2 - bStep * 6), 2, 2, 'rgba(186, 230, 253, 0.48)');
        pRect(nessX - dir * 12, Math.round(nessY + 2 - bStep * 5), 2, 1, 'rgba(186, 230, 253, 0.38)');
        pRect(nessX - dir * 6, nessY, 16, 1, 'rgba(45, 212, 191, 0.24)');
    }

    if (emerge > 0.02) {
        const drawAboveWater = (x, y, w, h, col) => {
            if (y >= nessY || h <= 0) return;
            pRect(x, y, w, Math.min(h, nessY - y), col);
        };

        const colDeep = '#031d1c';
        const colDark = '#06322f';
        const colMid = '#0d544d';
        const colSpec = react ? '#5eead4' : '#2dd4bf';

        const headBob = emerge > 0.85 && Math.sin(time * 0.0020) > 0.4 ? -1 : 0;
        const liftY = Math.round(emerge * (40 + rearExtra));
        const headBaseY = nessY + 9 - liftY + headBob;
        const blinkNess = !react && (time % 6300) > 6100;

        if (emerge > 0.26) {
            const humpRise = Math.round(((emerge - 0.26) / 0.74) * (9 + Math.round(rearExtra * 0.4)));
            const humpX = nessX - dir * 34;
            drawAboveWater(humpX - 12, nessY - humpRise + 2, 24, humpRise, colDeep);
            drawAboveWater(humpX - 9, nessY - humpRise, 18, humpRise, colDark);
            drawAboveWater(humpX - 6, nessY - humpRise - 1, 12, 2, colMid);
            drawAboveWater(humpX - 4, nessY - humpRise - 3, 3, 2, colSpec);
            drawAboveWater(humpX + 1, nessY - humpRise - 3, 3, 2, colSpec);
            pRect(humpX - 14, nessY, 28, 2, 'rgba(224, 242, 254, 0.48)');
        }

        for (let dy = 0; dy <= 36; dy++) {
            const py = headBaseY - 1 + dy;
            if (py >= nessY) break;
            const prog = dy / 36;
            const curveX = nessX - dir * Math.round(Math.sin((1 - prog) * Math.PI * 0.85) * 6);
            const thick = Math.round(9 + prog * 5);
            const halfW = Math.floor(thick * 0.5);
            drawAboveWater(curveX - halfW, py, thick, 1, colDeep);
            drawAboveWater(curveX - halfW + (dir > 0 ? 2 : 1), py, Math.max(3, thick - 4), 1, colDark);
            drawAboveWater(curveX + (dir > 0 ? 0 : -2), py, 3, 1, colMid);
            if (dy % 5 === 0 && py < nessY - 1) {
                const finX = dir > 0 ? curveX - halfW - 3 : curveX + halfW;
                drawAboveWater(finX, py, 3, 2, colSpec);
            }
        }

        const hx = nessX - dir * 3;
        const hy = headBaseY;
        const hRect = (ox, oy, w, h, col) => drawAboveWater(dir >= 0 ? hx + ox : hx - ox - w, hy + oy, w, h, col);
        hRect(-5, -8, 16, 9, colDark);
        hRect(-4, -9, 13, 3, colMid);
        hRect(5, -6, 13, 5, colDeep);
        hRect(6, -6, 11, 3, colDark);
        hRect(9, -6, 7, 1, colSpec);
        hRect(15, -5, 1, 1, '#020617');
        hRect(-8, -11, 5, 3, colMid);
        hRect(-11, -13, 4, 3, colSpec);
        hRect(12, -2, 3, 2, colSpec);
        if (!blinkNess) {
            hRect(3, -6, 4, 2, '#fde047');
            hRect(5, -6, 1, 2, '#020617');
        } else {
            hRect(3, -5, 4, 1, colMid);
        }
        const dropOff = Math.floor((time * 0.014) % 9);
        drawAboveWater(hx + dir * 13, hy - 1 + dropOff, 1, 2, 'rgba(167, 243, 208, 0.72)');

        const surfHalf = Math.round(12 + emerge * 8 + (react ? 6 : 0));
        pRect(nessX - surfHalf, nessY, surfHalf * 2, 2, 'rgba(224, 242, 254, 0.65)');
        pRect(nessX - surfHalf - 7, nessY + 3, (surfHalf + 7) * 2, 1, 'rgba(45, 212, 191, 0.36)');
        pRect(nessX - surfHalf - 12, nessY + 6, (surfHalf + 12) * 2, 1, 'rgba(186, 230, 253, 0.24)');
        if (react && react.progress < 0.70) {
            const shockR = Math.round(surfHalf + react.progress * 38);
            pRect(nessX - shockR, nessY + 2, shockR * 2, 1, 'rgba(94, 234, 212, 0.45)');
        }
    }

    registerAmbientHitbox(
        'koi_loch_ness',
        Math.min(nessX - 42, nessX - dir * 56),
        nessY - (emerge > 0.04 ? 56 : 12),
        Math.max(nessX + 42, nessX + dir * 26),
        nessY + 22,
        3
    );

    // 2. Sağ-Alt Gölet Kıyısına Oturan Zen Kaplumbağası (~24x14px — tıklayınca suya atlayıp tur atar & kıyıya döner!)
    const rockX = pw >= 400 ? Math.min(Math.round(pw * 0.75), pw - 152) : Math.round(pw * 0.75);
    const rockY = ph - 7;

    // Gölün dibine ve sağ kıyısına organik oturan yosunlu taş kümesi + ufak sazlar
    pRect(rockX - 18, rockY + 1, 36, 6, 'rgba(2, 8, 16, 0.50)');
    pRect(rockX - 17, rockY - 4, 34, 11, '#1e293b');
    pRect(rockX - 15, rockY - 6, 30, 8, '#334155');
    pRect(rockX - 13, rockY - 7, 25, 3, '#475569');
    pRect(rockX - 11, rockY - 7, 19, 2, '#15803d');
    pRect(rockX - 6, rockY - 8, 11, 1, '#22c55e');
    // Taşın alt-sağ kıyısında organik saz yaprakları
    pRect(rockX + 12, rockY - 12, 2, 9, '#15803d');
    pRect(rockX + 15, rockY - 10, 2, 7, '#22c55e');

    const terrReact = getAmbientReaction('koi_terrapin', time);
    let tx = rockX;
    let ty = rockY;
    let tDir = -1;
    let isSwimming = false;
    let flipperKick = 0;

    if (terrReact) {
        const tp = terrReact.progress;
        if (tp < 0.14) {
            const u = tp / 0.14;
            tx = rockX - Math.round(u * 6);
            ty = rockY - Math.round(Math.sin(u * Math.PI) * 5);
            pRect(rockX - 18, rockY + 2, 20, 1, 'rgba(224, 242, 254, 0.72)');
            pRect(rockX - 14, rockY - 2, 2, 2, '#e0f2fe');
        } else if (tp < 0.86) {
            const u = (tp - 0.14) / 0.72;
            isSwimming = true;
            tx = rockX - 6 - Math.round(Math.sin(u * Math.PI) * 26);
            ty = rockY - Math.round(Math.sin(u * Math.PI) * 20) - Math.round(Math.sin(u * Math.PI * 2) * 5);
            tDir = Math.cos(u * Math.PI) >= 0 ? -1 : 1;
            flipperKick = Math.round(Math.sin(u * Math.PI * 10) * 2);
            pRect(tx - tDir * 10, ty - 2, 2, 2, 'rgba(224, 242, 254, 0.68)');
            pRect(tx - 12, ty + 3, 24, 1, 'rgba(45, 212, 191, 0.42)');
        } else {
            const u = (tp - 0.86) / 0.14;
            tx = Math.round(rockX - 6 * (1 - u));
            ty = rockY - Math.round(Math.sin(u * Math.PI) * 4);
            tDir = 1;
        }
    }

    const blinkTu = !isSwimming && (time % 5400) > 5220;
    const tRect = (ox, oy, w, h, col) => pRect(tDir >= 0 ? tx - ox - w : tx + ox, ty + oy, w, h, col);
    // Not: mevcut kaplumbağa varsayılan sola (-1) bakar; tDir = -1 doğal yön, +1 dönüş yönü
    if (isSwimming) {
        tRect(-9, -6 + flipperKick, 4, 3, '#4d7c0f');
        tRect(5, -6 - flipperKick, 4, 3, '#4d7c0f');
    }
    tRect(-7, -12, 16, 5, '#14532d');
    tRect(-5, -14, 12, 4, '#166534');
    tRect(-4, -13, 3, 2, '#4ade80');
    tRect(2, -13, 3, 2, '#d97706');
    tRect(-7, -8, 16, 1, '#b45309');
    tRect(-11, -11, 5, 3, '#4d7c0f');
    tRect(-14, -13, 5, 3, '#65a30d');
    tRect(-13, -12, 1, 1, blinkTu ? '#365314' : '#0f172a');

    registerAmbientHitbox('koi_terrapin', tx - 16, ty - 16, rockX + 18, rockY + 6, 2);
}

function drawArcticAlwaysPresentWildlife(time) {
    const ledges = getArcticLedges(pw, ph);

    // 1. Ledge 2 Üzerinde Koca Kutup Ayısı (~36x34px — tıklayınca şaha kalkıp iki patisini sallayarak buz nefesi verir!)
    const bearX = Math.max(Math.round(pw * 0.24), 146);
    const groundY = ledges[2].yFn(bearX) + 1;
    const bearReact = getAmbientReaction('arctic_bear', time);
    const riseOff = bearReact ? Math.round(Math.sin(bearReact.progress * Math.PI) * 4) : 0;

    const phase = (time % 18000) / 18000;
    const breath = bearReact ? (Math.sin(time * 0.012) > 0 ? -1 : 0) : (Math.sin(time * 0.0020) > 0.35 ? -1 : 0);
    const blink = !bearReact && (time % 5300) > 5120;
    const lookUp = bearReact || (phase > 0.58 && phase < 0.85) ? -1 : 0;
    const pawWaveRight = bearReact
        ? Math.round(Math.sin(bearReact.progress * Math.PI * 6) * 4)
        : (phase > 0.62 && phase < 0.82 ? Math.round(Math.sin(((phase - 0.62) / 0.20) * Math.PI * 3) * 3) : 0);
    const pawWaveLeft = bearReact ? -pawWaveRight : 0;

    const snowDeep = isLightMode ? '#cbd5e1' : '#94a3b8';
    const furShade = isLightMode ? '#e2e8f0' : '#bae6fd';
    const furBody = isLightMode ? '#f8fafc' : '#e0f2fe';
    const furBright = '#ffffff';

    pRect(bearX - 13, groundY - 1, 27, 3, 'rgba(56, 189, 248, 0.28)');
    pRect(bearX - 13, groundY - 6 - riseOff, 3, 3, furShade);
    pRect(bearX - 11, groundY - 20 - riseOff + breath, 20, 19 + riseOff, furBody);
    pRect(bearX - 11, groundY - 18 - riseOff + breath, 4, 16, furShade);
    pRect(bearX - 7, groundY - 21 - riseOff + breath, 12, 4, furBright);
    pRect(bearX - 3, groundY - 17 - riseOff + breath, 9, 14, furBright);
    pRect(bearX - 10, groundY - 5, 8, 5, furShade);
    pRect(bearX - 8, groundY - 4, 5, 3, furBright);
    pRect(bearX + 2, groundY - 5, 8, 5, furShade);
    pRect(bearX + 4, groundY - 4, 5, 3, furBright);
    if (bearReact) {
        pRect(bearX - 13, groundY - 15 - riseOff + breath - Math.max(0, pawWaveLeft), 5, 5, furBody);
        pRect(bearX - 14, groundY - 14 - riseOff + breath - Math.max(0, pawWaveLeft), 2, 2, snowDeep);
    }
    pRect(bearX + 7, groundY - 13 - riseOff + breath - Math.max(0, pawWaveRight), 6, 5, furBody);
    pRect(bearX + 8, groundY - 12 - riseOff + breath - Math.max(0, pawWaveRight), 5, 3, furBright);
    pRect(bearX + 10, groundY - 11 - riseOff + breath - Math.max(0, pawWaveRight), 2, 2, snowDeep);

    const hy = groundY - 32 - riseOff + breath + lookUp;
    pRect(bearX - 8, hy - 3, 4, 4, furShade);
    pRect(bearX - 7, hy - 2, 2, 2, snowDeep);
    pRect(bearX + 3, hy - 3, 4, 4, furShade);
    pRect(bearX + 4, hy - 2, 2, 2, snowDeep);
    pRect(bearX - 8, hy, 15, 12, furBright);
    pRect(bearX - 8, hy + 2, 3, 9, furShade);
    pRect(bearX - 2, hy + 4, 9, 7, furBright);
    pRect(bearX + 5, hy + 5, 3, 2, '#0f172a');
    pRect(bearX - 4, hy + 3, 2, 2, blink ? snowDeep : '#0f172a');
    pRect(bearX + 2, hy + 3, 2, 2, blink ? snowDeep : '#0f172a');
    if (!blink) {
        pRect(bearX - 4, hy + 3, 1, 1, '#ffffff');
        pRect(bearX + 2, hy + 3, 1, 1, '#ffffff');
    }

    const puff = (time * 0.007) % 18;
    if (puff < 12 || bearReact) {
        const alpha = bearReact ? '0.68' : ((1 - puff / 12) * 0.55).toFixed(2);
        pRect(bearX + 8 + Math.round(puff * 0.5), Math.round(hy + 6 - puff * 0.6), 4, 3, `rgba(224, 242, 254, ${alpha})`);
        if (bearReact) {
            pRect(bearX + 11 + Math.round(puff * 0.4), Math.round(hy + 2 - puff * 0.4), 3, 2, 'rgba(255, 255, 255, 0.55)');
        }
    }

    registerAmbientHitbox('arctic_bear', bearX - 16, groundY - 38 - riseOff, bearX + 18, groundY + 4, 3);

    // 2. Büyütülmüş Kutup Tavşanı (~21x19px — açık vadi karında, tıklayınca iki neşeli sıçrayışla kar savurur!)
    const hareHomeX = Math.round(pw * 0.39);
    const hareReact = getAmbientReaction('arctic_hare', time);
    let hopOffsetX = 0;
    let hopOffsetY = 0;
    let hDir = 1;
    if (hareReact) {
        const hp = hareReact.progress;
        if (hp < 0.5) {
            const u = hp / 0.5;
            hopOffsetX = -Math.round(easeInOutQuad(u) * 16);
            hopOffsetY = -Math.round(Math.sin(u * Math.PI) * 12);
            hDir = -1;
        } else {
            const u = (hp - 0.5) / 0.5;
            hopOffsetX = -Math.round((1 - easeInOutQuad(u)) * 16);
            hopOffsetY = -Math.round(Math.sin(u * Math.PI) * 12);
            hDir = 1;
        }
    }

    const curHx = hareHomeX + hopOffsetX;
    const hareGroundY = getGroundY(curHx, 'arctic-tundra', pw, ph);
    const curHy = hareGroundY + hopOffsetY;
    const earFlick = !hareReact && (time % 6100) > 5880 ? -1 : 0;
    const noseWiggle = Math.sin(time * 0.01) > 0.3 ? -1 : 0;

    pRect(curHx - 7, hareGroundY - 1, 14, 2, 'rgba(56, 189, 248, 0.30)');
    if (hareReact && Math.abs(hareReact.progress - 0.5) < 0.08) {
        pRect(curHx - 9, hareGroundY - 3, 3, 2, '#ffffff');
        pRect(curHx + 6, hareGroundY - 3, 3, 2, '#e0f2fe');
    }

    const hRect = (ox, oy, w, h, col) => pRect(hDir >= 0 ? curHx + ox : curHx - ox - w, curHy + oy, w, h, col);
    hRect(-9, -6, 4, 4, '#e0f2fe');
    hRect(-7, -10, 13, 9, '#ffffff');
    hRect(-5, -4, 9, 4, '#bae6fd');
    hRect(1, -3, 7, 3, '#f8fafc');
    hRect(1, -14, 8, 7, '#ffffff');
    hRect(2, -19, 3, 6, '#f8fafc');
    hRect(6, -19 + earFlick, 3, 6, '#f8fafc');
    hRect(2, -21, 3, 2, '#0f172a');
    hRect(6, -21 + earFlick, 3, 2, '#0f172a');
    hRect(5, -12, 2, 2, '#0f172a');
    hRect(5, -12, 1, 1, '#ffffff');
    hRect(8, -10 + noseWiggle, 2, 2, '#fda4af');

    registerAmbientHitbox('arctic_hare', curHx - 12, curHy - 21, curHx + 13, curHy + 4, 2);
}

export function drawHabitatAmbientWildlife(sceneProfile, time) {
    if (sceneProfile === 'meadow') drawMeadowHoneyBear(time);
    else if (sceneProfile === 'betta-aquarium') drawBettaTankCritters(time);
    else if (sceneProfile === 'wetland') drawWetlandCritters(time);
    else if (sceneProfile === 'botanical') drawBotanicalCritters(time);
    else if (sceneProfile === 'reef') drawReefCritters(time);
    else if (sceneProfile === 'koi-pond') drawKoiPondCritters(time);
    else if (sceneProfile === 'arctic-tundra') drawArcticAlwaysPresentWildlife(time);
    drawAmbientTouchPulses(time);
}

// ============================================================================
// BÖLÜM SONU: BİYOMLARIN EV SAHİBİ DURGUN VE ROAMING CANLILARI
// BÖLÜM BAŞI: AÇILIP KAPANABİLEN KUTUP NOEL HARİKALAR DİYARI
// ============================================================================

export function drawArcticChristmasSky(time) {
    // Widget çakışmasını %100 önleyen açık gökyüzü koridoru (Üst bar 0..28 ve Saat arasından süzülür)
    const travelW = pw + 260;
    const leadX = Math.round(((time * 0.017) % travelW) - 130);
    const sleighY = Math.max(52, Math.round(ph * 0.17 + Math.sin(time * 0.0018) * 3.5));
    if (leadX < -120 || leadX > pw + 110) return;

    const santaReact = getAmbientReaction('arctic_santa', time);
    const extraDust = santaReact ? 12 : 0;

    // 1. Parlayan altın & buz-mavisi sihirli yıldız tozu şeridi
    for (let st = 0; st < 18 + extraDust; st++) {
        const sx = leadX - 36 - st * 4;
        const sy = sleighY + 6 + Math.round(Math.sin(time * 0.008 + st * 0.85) * (santaReact ? 5 : 3.2)) + (st % 3);
        const alpha = Math.max(0.10, (santaReact ? 1.0 : 0.90) - st * 0.036).toFixed(2);
        pRect(sx, sy, st % 3 === 0 ? 2 : 1, st % 5 === 0 ? 2 : 1, st % 2 === 0 ? `rgba(253, 224, 71, ${alpha})` : `rgba(186, 230, 253, ${alpha})`);
    }

    // 2. Görkemli Yakut-Kırmızısı & Altın İşlemeli Noel Kızağı (~36x20px) + Heybetli Noel Baba
    const slX = leadX - 28;
    pRect(slX - 10, sleighY + 7, 29, 2, '#f59e0b');
    pRect(slX - 9, sleighY + 7, 27, 1, '#fef08a');
    pRect(slX + 18, sleighY + 5, 3, 2, '#facc15');
    pRect(slX + 19, sleighY + 3, 2, 2, '#fef08a');
    pRect(slX - 6, sleighY + 3, 2, 4, '#b45309');
    pRect(slX + 10, sleighY + 3, 2, 4, '#b45309');

    pRect(slX - 10, sleighY - 3, 26, 7, '#b91c1c');
    pRect(slX - 12, sleighY - 6, 10, 4, '#dc2626');
    pRect(slX + 8, sleighY - 5, 9, 7, '#dc2626');
    pRect(slX - 11, sleighY - 6, 26, 1, '#facc15');
    pRect(slX - 9, sleighY, 24, 1, '#facc15');

    pRect(slX - 8, sleighY - 12, 10, 9, '#15803d');
    pRect(slX - 7, sleighY - 13, 8, 3, '#16a34a');
    pRect(slX - 9, sleighY - 9, 4, 4, '#38bdf8');
    pRect(slX - 8, sleighY - 9, 2, 4, '#fde047');
    pRect(slX - 4, sleighY - 14, 4, 3, '#f59e0b');
    pRect(slX - 6, sleighY - 15, 2, 3, '#ef4444');

    const waveArm = santaReact
        ? Math.round(Math.sin(time * 0.025) * 3)
        : Math.round(Math.sin(time * 0.008) * 1.5);
    pRect(slX + 2, sleighY - 11, 8, 8, '#dc2626');
    pRect(slX + 2, sleighY - 6, 8, 2, '#0f172a');
    pRect(slX + 6, sleighY - 6, 2, 2, '#facc15');
    pRect(slX + 2, sleighY - 4, 8, 1, '#ffffff');
    pRect(slX + 10, sleighY - 10 + waveArm, 3, 2, '#dc2626');
    pRect(slX + 12, sleighY - 11 + waveArm, 2, 2, '#ffffff');
    pRect(slX + 3, sleighY - 15, 6, 5, '#fed7aa');
    pRect(slX + 5, sleighY - 14, 1, 1, '#0f172a');
    pRect(slX + 7, sleighY - 14, 2, 1, '#fb7185');
    pRect(slX + 3, sleighY - 12, 8, 5, '#ffffff');
    pRect(slX + 4, sleighY - 9, 6, 3, '#f1f5f9');
    pRect(slX + 2, sleighY - 17, 7, 2, '#ffffff');
    pRect(slX + 3, sleighY - 19, 5, 2, '#dc2626');
    pRect(slX + 1, sleighY - 19, 3, 2, '#dc2626');
    pRect(slX - 1, sleighY - 18, 2, 2, '#ffffff');

    // Altın koşum dizginleri kızaktan öndeki geyiğin tasmasına kadar uzanır
    pRect(slX + 16, sleighY - 2, 61, 1, 'rgba(253, 224, 71, 0.78)');

    // 3. 4 Doru Ren Geyiği (Arka ve ön bacaklar, net burun & göz, boynuz & çıngıraklı tasma; öndeki Rudolph!)
    for (let r = 0; r < 4; r++) {
        const rx = slX + 24 + r * 16;
        const step = Math.round(Math.sin(time * 0.012 + r * 1.3) * 2.2);
        const bob = Math.round(Math.sin(time * 0.008 + r * 0.9) * 1.1);
        const ry = sleighY - 1 + bob;

        pRect(rx - 3 - Math.round(step * 0.7), ry + 2, 2, 4, '#290f02');
        pRect(rx + 1 + Math.round(step * 0.7), ry + 2, 2, 4, '#290f02');
        pRect(rx - 4 + step, ry + 2, 2, 4, '#451a03');
        pRect(rx + 2 - step, ry + 2, 2, 4, '#451a03');
        pRect(rx - 5, ry - 3, 10, 5, '#78350f');
        pRect(rx - 4, ry - 3, 7, 2, '#b45309');
        pRect(rx - 6, ry - 2, 2, 2, '#ffffff');
        pRect(rx + 3, ry - 7, 3, 5, '#92400e');
        pRect(rx + 5, ry - 5, 2, 3, '#d97706');
        pRect(rx + 4, ry - 9, 5, 3, '#78350f');
        pRect(rx + 9, ry - 8, 1, 2, '#92400e');
        pRect(rx + 6, ry - 8, 1, 1, '#09090b');
        pRect(rx + 3, ry - 5, 3, 1, '#ef4444');
        pRect(rx + 5, ry - 4, 1, 1, '#facc15');
        pRect(rx + 3, ry - 12, 1, 3, '#d97706');
        pRect(rx + 4, ry - 13, 2, 2, '#fbbf24');
        pRect(rx + 2, ry - 11, 2, 1, '#fde047');
        if (r === 3) {
            const pulseGlow = santaReact ? 0.72 : (Math.sin(time * 0.01) > 0 ? 0.45 : 0.28);
            pRect(rx + 7, ry - 10, 5, 5, `rgba(239, 68, 68, ${pulseGlow})`);
            pRect(rx + 8, ry - 9, 3, 3, 'rgba(254, 202, 202, 0.55)');
            pRect(rx + 9, ry - 8, 2, 2, '#ef4444');
        }
    }

    registerAmbientHitbox('arctic_santa', slX - 14, sleighY - 22, slX + 86, sleighY + 11, 4);
}

function drawArcticCandyCane(x, baseY, height, curveDir) {
    for (let y = 0; y < height - 4; y++) {
        const col = Math.floor(y / 2) % 2 === 0 ? '#ffffff' : '#ef4444';
        pRect(x, baseY - y, 3, 1, col);
    }
    const topY = baseY - height + 4;
    pRect(x + curveDir, topY - 2, 3, 2, '#ef4444');
    pRect(x + curveDir * 3, topY - 4, 4, 3, '#ffffff');
    pRect(x + curveDir * 6, topY - 3, 3, 3, '#ef4444');
    pRect(x + curveDir * 7, topY, 3, 3, '#ffffff');
    pRect(x + curveDir * 7, topY + 3, 2, 1, '#ef4444');
}

function drawArcticGiftBox(x, baseY, w, h, boxCol, ribbonCol, shadowCol) {
    pRect(x - 1, baseY, w + 2, 2, 'rgba(7, 13, 25, 0.36)');
    pRect(x, baseY - h, w, h, boxCol);
    pRect(x + w - 2, baseY - h, 2, h, shadowCol);
    pRect(x - 1, baseY - h, w + 2, 2, boxCol);
    const midX = x + Math.floor(w * 0.5) - 1;
    const midY = baseY - Math.ceil(h * 0.5);
    pRect(midX, baseY - h, 2, h, ribbonCol);
    pRect(x, midY, w, 2, ribbonCol);
    pRect(midX - 2, baseY - h - 2, 2, 2, ribbonCol);
    pRect(midX + 2, baseY - h - 2, 2, 2, ribbonCol);
}

function drawArcticChristmasElf(elfId, x, baseY, hatCol, tunicCol, dir, phaseOff, holdLantern, time) {
    const react = getAmbientReaction(elfId, time);
    const phase = ((time + Math.round(phaseOff * 14000)) % 14000) / 14000;
    const cheerWave = react || (phase > 0.65 && phase < 0.88);
    const hop = react
        ? -Math.round(Math.abs(Math.sin(react.progress * Math.PI * 2)) * 6)
        : (cheerWave && Math.sin(time * 0.008) > 0.35 ? -1 : 0);
    const blink = !react && ((time + Math.round(phaseOff * 2000)) % 4900) > 4720;
    const waveOff = cheerWave ? Math.round(Math.sin(time * 0.014) * 2) : Math.round(Math.sin(time * 0.0025 + phaseOff) * 0.6);
    const by = baseY + hop;

    pRect(x - 5, baseY, 11, 2, 'rgba(7, 13, 25, 0.35)');
    pRect(x - 3, by - 2, 3, 2, '#1e293b');
    pRect(x + 1, by - 2, 3, 2, '#1e293b');
    pRect(x - 4, by - 1, 2, 1, '#facc15');
    pRect(x + 3, by - 1, 2, 1, '#facc15');
    pRect(x - 3, by - 4, 2, 2, hatCol);
    pRect(x + 1, by - 4, 2, 2, '#ffffff');

    pRect(x - 4, by - 11, 9, 7, tunicCol);
    pRect(x - 5, by - 5, 11, 1, '#ffffff');
    pRect(x - 4, by - 8, 9, 1, '#0f172a');
    pRect(x - 1, by - 8, 3, 2, '#facc15');

    pRect(x + dir * 5, by - 10 + waveOff, 2, 4, tunicCol);
    pRect(x + dir * 6, by - 7 + waveOff, 2, 2, '#fed7aa');
    if (holdLantern) {
        pRect(x + dir * 6, by - 5 + waveOff, 3, 4, '#451a03');
        pRect(x + dir * 6, by - 4 + waveOff, 2, 2, '#fde047');
        pRect(x + dir * 5, by - 6 + waveOff, 5, 6, react ? 'rgba(253, 224, 71, 0.45)' : 'rgba(253, 224, 71, 0.25)');
    }
    if (react) {
        pRect(x - 6, by - 24, 2, 2, '#fde047');
        pRect(x + 6, by - 23, 2, 2, '#ffffff');
    }

    pRect(x - 4, by - 16, 9, 5, '#fed7aa');
    pRect(x - 5, by - 15, 1, 2, '#fdba74');
    pRect(x + 5, by - 15, 1, 2, '#fdba74');
    pRect(x - 2, by - 14, 1, 2, blink ? '#d97706' : '#0f172a');
    pRect(x + 2, by - 14, 1, 2, blink ? '#d97706' : '#0f172a');
    pRect(x - 1, by - 12, 3, 1, '#fb7185');

    pRect(x - 5, by - 17, 11, 2, '#ffffff');
    pRect(x - 3, by - 20, 7, 3, hatCol);
    pRect(x - 2, by - 22, 4, 2, hatCol);
    pRect(x - dir * 3, by - 22, 2, 2, hatCol);
    pRect(x - dir * 4, by - 21, 2, 2, '#ffffff');

    registerAmbientHitbox(elfId, x - 8, baseY - 24, x + 9, baseY + 3, 2);
}

function drawArcticSnowman(x, groundY, time) {
    const snowReact = getAmbientReaction('arctic_snowman', time);
    const scarfFlutter = Math.round(Math.sin(time * 0.0032) * 1);
    const armWave = snowReact ? Math.round(Math.sin(snowReact.progress * Math.PI * 6) * 2) : (Math.sin(time * 0.0024) > 0.5 ? -1 : 0);
    const hatLift = snowReact ? -Math.round(Math.sin(snowReact.progress * Math.PI) * 5) : 0;

    pRect(x - 9, groundY - 1, 19, 3, 'rgba(56, 189, 248, 0.28)');
    pRect(x - 8, groundY - 9, 17, 9, '#f8fafc');
    pRect(x - 7, groundY - 10, 15, 2, '#ffffff');
    pRect(x - 8, groundY - 4, 17, 4, '#bae6fd');
    pRect(x - 6, groundY - 17, 13, 8, '#ffffff');
    pRect(x - 5, groundY - 15, 2, 4, '#e0f2fe');
    pRect(x, groundY - 15, 2, 1, '#0f172a');
    pRect(x, groundY - 12, 2, 1, '#0f172a');
    pRect(x - 10, groundY - 16 + armWave, 4, 1, '#451a03');
    pRect(x - 11, groundY - 17 + armWave, 2, 1, '#78350f');
    pRect(x + 7, groundY - 16 - armWave, 4, 1, '#451a03');
    pRect(x + 10, groundY - 17 - armWave, 2, 1, '#78350f');

    pRect(x - 5, groundY - 18, 11, 2, '#dc2626');
    pRect(x + 3, groundY - 16 + scarfFlutter, 3, 5, '#ef4444');
    pRect(x + 4, groundY - 11 + scarfFlutter, 2, 2, '#b91c1c');

    pRect(x - 5, groundY - 24, 10, 6, '#ffffff');
    pRect(x - 3, groundY - 23, 1, 1, '#0f172a');
    pRect(x + 2, groundY - 23, 1, 1, '#0f172a');
    pRect(x, groundY - 21, 5, 2, '#f97316');
    pRect(x + 3, groundY - 21, 2, 1, '#fbbf24');
    pRect(x - 2, groundY - 19, 4, 1, '#0f172a');

    pRect(x - 6, groundY - 25 + hatLift, 13, 2, '#0f172a');
    pRect(x - 4, groundY - 30 + hatLift, 9, 5, '#1e293b');
    pRect(x - 4, groundY - 26 + hatLift, 9, 1, '#ef4444');

    if (snowReact) {
        pRect(x - 11, groundY - 28, 2, 2, '#e0f2fe');
        pRect(x + 9, groundY - 27, 2, 2, '#ffffff');
    }

    registerAmbientHitbox('arctic_snowman', x - 13, groundY - 33, x + 14, groundY + 3, 2);
}

function drawHeroChristmasTree(cx, baseY, h, time) {
    pRect(cx - 14, baseY - 1, 29, 3, 'rgba(7, 13, 25, 0.45)');
    pRect(cx - 3, baseY - 8, 7, 9, '#3b1806');
    pRect(cx - 1, baseY - 8, 2, 8, '#78350f');

    const bulbCols = ['#ef4444', '#fde047', '#38bdf8', '#f472b6', '#ffffff'];
    const tiers = 7;
    for (let t = 0; t < tiers; t++) {
        const prog = t / tiers;
        const ty = baseY - 6 - Math.round(prog * (h - 9));
        const th = Math.max(5, Math.round((h / tiers) * 1.45));
        const maxW = Math.round(4 + (1 - prog * 0.84) * (h * 0.34));
        for (let dy = 0; dy < th; dy++) {
            const w = Math.max(1, Math.round((dy / th) * maxW));
            const py = ty - th + dy;
            pRect(cx - w, py, w * 2 + 1, 1, dy > th - 2 ? '#052e16' : '#14532d');
            pRect(cx - Math.max(1, Math.floor(w * 0.65)), py, Math.max(2, w), 1, '#15803d');
            if (dy === 0 || (dy === 1 && w > 4)) {
                pRect(cx - w, py, 2, 1, '#e0f2fe');
                pRect(cx + w - 1, py, 2, 1, '#bae6fd');
            }
        }
        if (t < tiers - 1) {
            const garY = ty - 2;
            const garW = Math.max(2, maxW - 3);
            pRect(cx - garW, garY, garW * 2, 1, '#f59e0b');
            const cIdx1 = (t + Math.floor(time * 0.0022)) % bulbCols.length;
            const cIdx2 = (t + 2 + Math.floor(time * 0.0022)) % bulbCols.length;
            pRect(cx - Math.round(garW * 0.6), garY - 1, 2, 2, bulbCols[cIdx1]);
            pRect(cx + Math.round(garW * 0.5), garY + 1, 2, 2, bulbCols[cIdx2]);
        }
    }

    const starY = baseY - h - 2;
    const starAura = Math.sin(time * 0.004) > 0 ? 0.42 : 0.24;
    pRect(cx - 5, starY - 5, 11, 11, `rgba(253, 224, 71, ${starAura})`);
    pRect(cx - 3, starY - 1, 7, 2, '#facc15');
    pRect(cx - 1, starY - 3, 3, 6, '#facc15');
    pRect(cx - 2, starY - 2, 5, 4, '#fde047');
    pRect(cx, starY - 1, 1, 2, '#ffffff');
}

export function drawArcticChristmasGround(time) {
    const ledges = getArcticLedges(pw, ph);
    const cabX = Math.round(pw * 0.73);
    const cabY = ledges[5].yFn(cabX) + 1;
    const cabPineX = Math.round(pw * 0.66);
    const cabPineY = ledges[5].yFn(cabPineX) + 1;
    const bulbPalette = ['#ef4444', '#fde047', '#38bdf8', '#22c55e'];

    // 1. Kulübe Çatı Işıkları, Kızıl Kurdeleli Kapı Çelengi & Yanındaki Yılbaşı Çamı Süsleri
    pRect(cabPineX - 3, cabPineY - 38, 7, 5, 'rgba(253, 224, 71, 0.35)');
    pRect(cabPineX - 2, cabPineY - 36, 5, 2, '#fde047');
    pRect(cabPineX, cabPineY - 38, 1, 5, '#ffffff');
    [
        { dx: -3, dy: -28, phase: 0 },
        { dx: 3, dy: -25, phase: 1 },
        { dx: -5, dy: -19, phase: 2 },
        { dx: 1, dy: -17, phase: 3 },
        { dx: 6, dy: -15, phase: 4 },
        { dx: -4, dy: -11, phase: 5 },
        { dx: 4, dy: -10, phase: 6 }
    ].forEach((o) => {
        const idx = (o.phase + Math.floor(time * 0.0022)) % bulbPalette.length;
        pRect(cabPineX + o.dx, cabPineY + o.dy, 2, 2, bulbPalette[idx]);
    });

    pRect(cabX - 8, cabY - 10, 5, 5, '#15803d');
    pRect(cabX - 7, cabY - 9, 3, 3, '#271105');
    pRect(cabX - 7, cabY - 10, 3, 1, '#ef4444');
    for (let lx = -15; lx <= 14; lx += 4) {
        const idx = (Math.abs(lx) + Math.floor(time * 0.0026)) % bulbPalette.length;
        const slopeOff = Math.round(Math.abs(lx) * 0.52);
        pRect(cabX + lx, cabY - 22 + slopeOff, 2, 2, bulbPalette[idx]);
    }
    pRect(cabX - 15, cabY - 2, 31, 3, 'rgba(253, 224, 71, 0.14)');

    // 2. Vadi Ön Planda 56px Görkemli Süslenmiş Noel Ağacı
    const heroTreeX = getRightSafeX(0.66);
    const heroTreeY = getGroundY(heroTreeX, 'arctic-tundra', pw, ph) + 1;
    drawHeroChristmasTree(heroTreeX, heroTreeY, 56, time);

    // 3. Sol-Orta Açık Vadi Karında Kırmızı Atkılı Neşeli Kardan Adam (~26px)
    const snowX = getLeftSafeX(0.32);
    const snowY = getGroundY(snowX, 'arctic-tundra', pw, ph) + 1;
    drawArcticSnowman(snowX, snowY, time);

    // 4. 5 Kalın, Net Kırmızı-Beyaz Baston Şeker Kamışı (Candy Canes, 19–23px)
    drawArcticCandyCane(Math.round(pw * 0.18), ledges[1].yFn(Math.round(pw * 0.18)), 20, 1);
    drawArcticCandyCane(Math.round(pw * 0.34), ledges[2].yFn(Math.round(pw * 0.34)), 20, -1);
    drawArcticCandyCane(cabX + 16, ledges[5].yFn(cabX + 16), 19, -1);
    const cLeftX = snowX - 36;
    drawArcticCandyCane(cLeftX, getGroundY(cLeftX, 'arctic-tundra', pw, ph), 22, 1);
    const cRightX = heroTreeX + 20;
    drawArcticCandyCane(cRightX, getGroundY(cRightX, 'arctic-tundra', pw, ph), 23, -1);

    // 5. Dev Paketli Renkli Yılbaşı Hediye Kutuları
    drawArcticGiftBox(heroTreeX - 14, heroTreeY, 10, 9, '#dc2626', '#fde047', '#991b1b');
    drawArcticGiftBox(heroTreeX + 4, heroTreeY, 9, 8, '#2563eb', '#ffffff', '#1e40af');
    drawArcticGiftBox(heroTreeX - 4, heroTreeY - 2, 8, 7, '#16a34a', '#ef4444', '#14532d');
    drawArcticGiftBox(cabX + 9, cabY, 8, 7, '#a855f7', '#fde047', '#6b21a8');
    drawArcticGiftBox(snowX + 12, snowY, 8, 7, '#ef4444', '#ffffff', '#991b1b');

    // 6. 3 İfadeli Büyük Noel Elfi (Tıklamaya zıplayarak tepki verir)
    const elf1X = Math.round(pw * 0.785);
    drawArcticChristmasElf('arctic_elf_1', elf1X, ledges[5].yFn(elf1X) + 1, '#dc2626', '#16a34a', -1, 0.1, true, time);
    const elf2X = heroTreeX - 24;
    drawArcticChristmasElf('arctic_elf_2', elf2X, getGroundY(elf2X, 'arctic-tundra', pw, ph) + 1, '#16a34a', '#dc2626', 1, 0.4, false, time);
    const elf3X = snowX - 24;
    if (elf3X > 136) {
        drawArcticChristmasElf('arctic_elf_3', elf3X, getGroundY(elf3X, 'arctic-tundra', pw, ph) + 1, '#2563eb', '#15803d', 1, 0.7, false, time);
    }
}

// ============================================================================
// BÖLÜM SONU: AÇILIP KAPANABİLEN KUTUP NOEL HARİKALAR DİYARI
// ============================================================================
