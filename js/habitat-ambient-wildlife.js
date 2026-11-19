import { pw, ph, pRect } from './07-habitat-state.js';
import { isLightMode } from './01-core-ui.js';
import { getGroundY } from './habitat-geometry.js';
import { getArcticLedges } from './arctic-geometry.js';

/* HABITAT AMBIENT WILDLIFE — hero-scale, widget-safe stationary pixel-art
   hosts for every biome (24–42px logical / 72–126px on-screen scale) with
   calm, natural resting-and-action state machines, plus the toggleable
   Arctic Christmas Wonderland layer. */

// ============================================================================
// BÖLÜM BAŞI: BİYOMLARIN EV SAHİBİ DURGUN CANLILARI
// ============================================================================

function getLeftSafeX(pct) {
    return Math.max(Math.round(pw * pct), 146);
}

function getRightSafeX(pct) {
    return Math.min(Math.round(pw * pct), pw - 142);
}

function drawMeadowHoneyBear(time) {
    // Sol meyve ağaçlarının yanında, Music Widget'tan ve orta akıştan tamamen uzakta (~38px boy x 36px en)
    const bearX = getLeftSafeX(0.27);
    const groundY = getGroundY(bearX, 'meadow', pw, ph) + 1;
    const potX = bearX + 12;
    const potY = groundY;

    // 18 saniyelik sakin, doğal ritim (~%56 dingin dinlenme & nefes, ardından yavaş bal alma & keyifli tadım)
    const phase = (time % 18000) / 18000;
    const breath = Math.sin(time * 0.0020) > 0.35 ? -1 : 0;
    const blink = (time % 5400) > 5220;
    const earTwitch = (time % 7900) > 7640 ? -1 : 0;

    let pawLift = 0;
    let mouthOpen = false;
    let happyEyes = false;
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

    const furDeep = '#2d1407';
    const furDark = '#4a2511';
    const furMid = '#733c1b';
    const furHi = '#9a5a2c';
    const tan = '#d6a676';
    const cream = '#ebd0ad';

    pRect(bearX - 15, groundY, 37, 3, 'rgba(2, 10, 14, 0.36)');
    pRect(bearX - 13, groundY + 2, 33, 2, 'rgba(2, 10, 14, 0.22)');

    pRect(bearX - 14, groundY - 7, 4, 4, furDark);
    pRect(bearX - 15, groundY - 6, 2, 2, furDeep);

    pRect(bearX - 12, groundY - 21 + breath, 22, 20, furMid);
    pRect(bearX - 12, groundY - 19 + breath, 5, 18, furDark);
    pRect(bearX - 11, groundY - 17 + breath, 2, 14, furDeep);
    pRect(bearX - 8, groundY - 22 + breath, 12, 5, furHi);
    pRect(bearX + 4, groundY - 19 + breath, 5, 16, furDark);

    pRect(bearX - 4, groundY - 18 + breath, 11, 15, tan);
    pRect(bearX - 2, groundY - 16 + breath, 7, 12, cream);

    pRect(bearX - 11, groundY - 6, 9, 6, furDark);
    pRect(bearX - 10, groundY - 5, 7, 4, furMid);
    pRect(bearX - 8, groundY - 4, 4, 3, tan);
    pRect(bearX + 2, groundY - 6, 8, 6, furDark);
    pRect(bearX + 3, groundY - 5, 6, 4, furMid);
    pRect(bearX + 5, groundY - 4, 4, 3, cream);

    pRect(bearX - 10, groundY - 15 + breath, 5, 7, furDark);
    pRect(bearX - 9, groundY - 13 + breath, 6, 4, furMid);
    pRect(bearX - 5, groundY - 11 + breath, 5, 3, tan);

    const hy = groundY - 35 + breath;
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

    if (happyEyes) {
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
    if (mouthOpen) {
        pRect(bearX + 2, hy + 10, 4, 2, '#7f1d1d');
        pRect(bearX + 3, hy + 11, 2, 1, '#fb7185');
    }

    pRect(potX - 6, potY - 10, 13, 10, '#78350f');
    pRect(potX - 5, potY - 9, 10, 8, '#b45309');
    pRect(potX - 3, potY - 8, 5, 5, '#d97706');
    pRect(potX - 7, potY - 12, 15, 3, '#92400e');
    pRect(potX - 6, potY - 12, 13, 2, '#d97706');
    pRect(potX - 5, potY - 13, 11, 2, '#f59e0b');
    pRect(potX - 4, potY - 13, 8, 1, '#fde047');
    pRect(potX + 2, potY - 10, 3, 4, '#f59e0b');
    pRect(potX + 3, potY - 9, 1, 2, '#fde047');
    pRect(potX - 2, potY - 10, 2, 2, '#f59e0b');

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

function drawBettaTankCritters(time) {
    const soilY = (x) => {
        const nx = x / Math.max(1, pw);
        const mound = Math.pow(Math.abs(nx - 0.50) * 1.95, 1.45) * 18;
        return Math.round(ph - 4 - mound - Math.sin(x * 0.04) * 2);
    };

    // 1. Akvaryumun Hero Ev Sahibi: Sol-orta açık kumda dinlenen Büyük Pembe Aksolotl (~38x18px)
    const axoX = Math.max(Math.round(pw * 0.34), 168);
    const axoY = Math.min(ph - 22, soilY(axoX) - 6);
    const phase = (time % 16000) / 16000;
    const breath = Math.sin(time * 0.0022) > 0.3 ? -1 : 0;
    const gillFlick = (phase > 0.35 && phase < 0.42) || (phase > 0.78 && phase < 0.85) ? -1 : 0;
    const yawnWindow = phase > 0.56 && phase < 0.66;
    const tailSway = Math.round(Math.sin(time * 0.0024) * 1.5);

    const pinkDeep = '#be185d';
    const pinkMid = '#f472b6';
    const pinkLight = '#f9a8d4';
    const pinkHi = '#fbcfe8';
    const gillBase = '#e11d48';
    const gillTip = '#fb7185';

    pRect(axoX - 18, axoY + 2, 34, 3, 'rgba(2, 8, 16, 0.36)');

    pRect(axoX - 20, axoY - 5 + tailSway, 7, 5, 'rgba(249, 168, 212, 0.55)');
    pRect(axoX - 17, axoY - 4 + tailSway, 6, 3, pinkMid);
    pRect(axoX - 14, axoY - 3 + Math.round(tailSway * 0.5), 6, 4, pinkLight);

    pRect(axoX - 10, axoY - 5 + breath, 18, 7, pinkLight);
    pRect(axoX - 9, axoY - 6 + breath, 15, 2, pinkHi);
    pRect(axoX - 8, axoY, 14, 2, pinkMid);
    pRect(axoX - 7, axoY + 1, 3, 3, pinkMid);
    pRect(axoX - 8, axoY + 3, 4, 1, pinkHi);
    pRect(axoX + 4, axoY + 1, 3, 3, pinkMid);
    pRect(axoX + 4, axoY + 3, 4, 1, pinkHi);

    [-1, 0, 1].forEach((row, idx) => {
        const gY = axoY - 9 + row * 3 + breath + gillFlick;
        pRect(axoX + 3, gY, 5 + (idx === 1 ? 1 : 0), 2, gillBase);
        pRect(axoX + 2 - idx, gY - 1, 3, 2, gillTip);
        pRect(axoX + 1 - idx, gY - 1, 1, 1, '#fda4af');
        pRect(axoX + 10, gY, 4, 2, gillBase);
        pRect(axoX + 13, gY - 1, 2, 2, gillTip);
    });

    pRect(axoX + 5, axoY - 9 + breath, 11, 9, pinkLight);
    pRect(axoX + 6, axoY - 10 + breath, 9, 2, pinkHi);
    pRect(axoX + 6, axoY - 2 + breath, 9, 2, pinkMid);
    pRect(axoX + 8, axoY - 7 + breath, 2, 2, '#0f172a');
    pRect(axoX + 13, axoY - 7 + breath, 2, 2, '#0f172a');
    pRect(axoX + 8, axoY - 7 + breath, 1, 1, '#ffffff');
    pRect(axoX + 13, axoY - 7 + breath, 1, 1, '#ffffff');
    if (yawnWindow) {
        pRect(axoX + 9, axoY - 4 + breath, 4, 2, pinkDeep);
        for (let b = 0; b < 3; b++) {
            const bprog = ((phase - 0.56) / 0.10 + b * 0.28) % 1;
            pRect(axoX + 11 + b, Math.round(axoY - 7 - bprog * 14), 2, 2, 'rgba(224, 242, 254, 0.72)');
        }
    } else {
        pRect(axoX + 9, axoY - 4 + breath, 4, 1, pinkDeep);
    }

    // 2. Kütük Kemerinde Güneşlenen Büyük Altın Elma Salyangozu (~15x12px — Music Widget'ın üstünde!)
    const snX = Math.round(pw * 0.16);
    const snY = ph - 72;
    const stalkWave = Math.round(Math.sin(time * 0.0022) * 0.8);
    pRect(snX - 6, snY - 2, 12, 3, '#fde68a');
    pRect(snX - 5, snY - 8, 9, 7, '#b45309');
    pRect(snX - 4, snY - 10, 7, 7, '#f59e0b');
    pRect(snX - 2, snY - 8, 4, 4, '#fde047');
    pRect(snX - 1, snY - 7, 2, 2, '#ffffff');
    pRect(snX + 5, snY - 3, 3, 2, '#fef3c7');
    pRect(snX + 6, snY - 6 + stalkWave, 1, 3, '#fcd34d');
    pRect(snX + 7, snY - 5 - stalkWave, 1, 3, '#fcd34d');
}

function drawWetlandCritters(time) {
    // 1. Sazlığın Asil Ev Sahibi: Sığ Suda Bekleyen Mavi Balıkçıl (~42px boy x 28px en)
    const hx = getLeftSafeX(0.30);
    const hy = ph - 14;
    const phase = (time % 17000) / 17000;
    const blink = (time % 5100) > 4920;

    let dipNeck = 0;
    if (phase >= 0.62 && phase < 0.76) {
        dipNeck = Math.round(((phase - 0.62) / 0.14) * 5);
    } else if (phase >= 0.76 && phase < 0.81) {
        dipNeck = 8;
    } else if (phase >= 0.81 && phase < 0.92) {
        dipNeck = Math.round((1 - (phase - 0.81) / 0.11) * 6);
    }

    pRect(hx - 7, hy + 2, 15, 2, 'rgba(2, 12, 18, 0.35)');
    pRect(hx - 1, hy - 14, 2, 16, '#1e293b');
    pRect(hx + 3, hy - 14, 2, 16, '#334155');
    pRect(hx - 5, hy + 1, 12, 1, 'rgba(186, 230, 253, 0.38)');
    if (phase >= 0.76 && phase < 0.84) {
        const sp = Math.round(((phase - 0.76) / 0.08) * 9);
        pRect(hx + 16 - sp, hy, sp * 2, 1, 'rgba(224, 242, 254, 0.65)');
    }

    pRect(hx - 9, hy - 25, 16, 11, '#334155');
    pRect(hx - 7, hy - 26, 13, 9, '#475569');
    pRect(hx - 5, hy - 25, 9, 5, '#64748b');
    pRect(hx - 2, hy - 23, 6, 3, '#cbd5e1');
    pRect(hx - 11, hy - 21, 5, 4, '#1e293b');
    pRect(hx + 3, hy - 23, 5, 7, '#e2e8f0');

    const neckForward = Math.round(dipNeck * 0.75);
    const neckDown = dipNeck;
    pRect(hx + 4 + Math.round(neckForward * 0.3), hy - 32 + Math.round(neckDown * 0.5), 3, 9, '#f1f5f9');
    pRect(hx + 5 + Math.round(neckForward * 0.6), hy - 38 + Math.round(neckDown * 0.8), 3, 8, '#ffffff');
    pRect(hx + 5 + neckForward, hy - 41 + neckDown, 6, 4, '#ffffff');
    pRect(hx + 3 + neckForward, hy - 42 + neckDown, 7, 2, '#0f172a');
    pRect(hx + 1 + neckForward, hy - 41 + neckDown, 3, 1, '#334155');
    pRect(hx + 8 + neckForward, hy - 40 + neckDown, 1, 1, blink ? '#cbd5e1' : '#facc15');
    pRect(hx + 11 + neckForward, hy - 40 + neckDown, 8, 2, '#f59e0b');
    pRect(hx + 15 + neckForward, hy - 39 + neckDown, 5, 1, '#fde047');

    // 2. Kütük Üstünde Güneşlenen Dolgun Su Kaplumbağası (~22x12px)
    const snagX = Math.round(pw * 0.66);
    const snagBankY = getGroundY(snagX + 8, 'wetland', pw, ph) + 1;
    const tuX = snagX - 3;
    const tuY = snagBankY - 8;
    const tuckPhase = (time % 15000) / 15000;
    const headPull = (tuckPhase > 0.74 && tuckPhase < 0.88) ? 3 : 0;
    const blinkTu = (time % 4600) > 4420;

    pRect(tuX - 7, tuY - 2, 15, 3, '#92400e');
    pRect(tuX - 8, tuY - 7, 16, 5, '#14532d');
    pRect(tuX - 6, tuY - 9, 12, 4, '#166534');
    pRect(tuX - 4, tuY - 8, 3, 2, '#4ade80');
    pRect(tuX + 1, tuY - 8, 3, 2, '#4ade80');
    pRect(tuX - 5, tuY - 5, 3, 2, '#d97706');
    pRect(tuX + 2, tuY - 5, 3, 2, '#d97706');
    pRect(tuX - 7, tuY, 3, 3, '#365314');
    pRect(tuX + 4, tuY, 3, 3, '#365314');
    pRect(tuX - 12 + headPull, tuY - 5, 5, 3, '#4d7c0f');
    pRect(tuX - 14 + headPull, tuY - 7, 5, 3, '#65a30d');
    pRect(tuX - 11 + headPull, tuY - 5, 2, 1, '#ef4444');
    pRect(tuX - 13 + headPull, tuY - 7, 1, 1, blinkTu ? '#365314' : '#0f172a');
}

function drawBotanicalCritters(time) {
    // 1. Bahçenin Uyuyan Sarman Kedisi (Sağ-orta açık çimlikte, Ticker & System'dan uzakta, ~34x22px)
    const catX = getRightSafeX(0.68);
    const catY = getGroundY(catX, 'botanical', pw, ph) + 1;
    const phase = (time % 18000) / 18000;
    const breath = Math.sin(time * 0.0019) > 0.3 ? -1 : 0;
    const earTwitch = (time % 6800) > 6580 ? -1 : 0;
    const tailCurl = Math.round(Math.sin(time * 0.0020) * 1.4);

    const waking = phase >= 0.62 && phase < 0.86;
    const yawning = phase >= 0.71 && phase < 0.80;
    const headLift = waking ? -2 : 0;

    pRect(catX - 17, catY, 35, 3, 'rgba(2, 8, 16, 0.42)');
    pRect(catX - 16, catY - 3, 33, 4, '#334155');
    pRect(catX - 15, catY - 4, 31, 2, '#475569');
    pRect(catX - 13, catY - 4, 6, 1, '#15803d');

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

    // 2. Sol-orta Bahçe Taşı Üstündeki Kızılgerdan (~16x13px — Music Widget'tan açık!)
    const birdX = getLeftSafeX(0.30);
    const birdY = getGroundY(birdX, 'botanical', pw, ph) + 1;
    const birdPhase = (time % 14000) / 14000;
    const birdDip = (birdPhase > 0.65 && birdPhase < 0.80) ? 2 : 0;
    const blinkR = (time % 4700) > 4520;

    pRect(birdX - 6, birdY - 4, 12, 5, '#334155');
    pRect(birdX - 5, birdY - 5, 10, 2, '#64748b');
    pRect(birdX - 1, birdY - 7, 2, 2, '#78350f');
    pRect(birdX + 2, birdY - 7, 2, 2, '#78350f');
    pRect(birdX - 5, birdY - 12 + birdDip, 9, 6, '#78350f');
    pRect(birdX - 8, birdY - 11 + birdDip, 4, 2, '#5c3a21');
    pRect(birdX, birdY - 12 + birdDip, 5, 5, '#ef4444');
    pRect(birdX + 1, birdY - 11 + birdDip, 3, 3, '#fb923c');
    pRect(birdX, birdY - 16 + birdDip, 6, 5, '#92400e');
    pRect(birdX + 3, birdY - 15 + birdDip, 1, 1, blinkR ? '#78350f' : '#0f172a');
    pRect(birdX + 6, birdY - 14 + birdDip, 3, 1, '#facc15');
}

function drawReefCritters(time) {
    const reefFloorY = (x) => {
        const nx = x / Math.max(1, pw);
        const sideMound = nx < 0.26 ? Math.pow((0.26 - nx) / 0.26, 1.5) * 34
                        : (nx > 0.74 ? Math.pow((nx - 0.74) / 0.26, 1.5) * 34 : 0);
        return Math.round(getGroundY(x, 'reef', pw, ph) - sideMound);
    };

    // 1. Batık Tapınak Tepesindeki Dev Biyolüminesan Ahtapot (~42x30px — sol-orta açık alanda)
    const octX = getLeftSafeX(0.30);
    const octBaseY = reefFloorY(octX) - 2;
    const phase = (time % 16000) / 16000;
    const mantlePulse = Math.sin(time * 0.0020) > 0.35 ? -1 : 0;
    const blink = (time % 5200) > 5010;
    const tentacleLift = (phase > 0.58 && phase < 0.86)
        ? Math.round(Math.sin(((phase - 0.58) / 0.28) * Math.PI) * 5)
        : 0;
    const biolumiBoost = (phase > 0.48 && phase < 0.70);

    pRect(octX - 18, octBaseY + 1, 36, 3, 'rgba(5, 4, 23, 0.45)');

    pRect(octX - 18, octBaseY - 4, 9, 5, '#581c87');
    pRect(octX - 20, octBaseY - 6, 5, 3, '#7e22ce');
    pRect(octX - 11, octBaseY - 3, 8, 4, '#6b21a8');
    pRect(octX - 4, octBaseY - 2, 8, 3, '#7e22ce');
    pRect(octX + 5, octBaseY - 3, 9, 4, '#6b21a8');
    pRect(octX + 12, octBaseY - 5 - tentacleLift, 8, 4, '#9333ea');
    pRect(octX + 18, octBaseY - 7 - Math.round(tentacleLift * 1.4), 5, 3, '#c084fc');
    pRect(octX - 15, octBaseY - 1, 2, 1, '#f5d0fe');
    pRect(octX + 14, octBaseY - 2 - tentacleLift, 2, 1, '#f5d0fe');

    pRect(octX - 11, octBaseY - 17 + mantlePulse, 22, 15, '#6b21a8');
    pRect(octX - 10, octBaseY - 22 + mantlePulse, 20, 7, '#7e22ce');
    pRect(octX - 8, octBaseY - 25 + mantlePulse, 16, 4, '#9333ea');
    pRect(octX - 5, octBaseY - 26 + mantlePulse, 10, 2, '#a855f7');
    const spotCol = biolumiBoost ? '#67e8f9' : '#e879f9';
    pRect(octX - 7, octBaseY - 21 + mantlePulse, 3, 2, spotCol);
    pRect(octX + 3, octBaseY - 22 + mantlePulse, 3, 2, '#f0abfc');
    pRect(octX - 2, octBaseY - 17 + mantlePulse, 4, 2, spotCol);
    pRect(octX - 9, octBaseY - 11, 5, 4, blink ? '#581c87' : '#fbbf24');
    pRect(octX + 4, octBaseY - 11, 5, 4, blink ? '#581c87' : '#fbbf24');
    if (!blink) {
        pRect(octX - 8, octBaseY - 10, 3, 2, '#090d16');
        pRect(octX + 5, octBaseY - 10, 3, 2, '#090d16');
    }

    // 2. Sağ-Orta Mercanda Şakayık ve Palyaço Balığı (~22x16px — clam'dan açık)
    const anemX = Math.min(Math.round(pw * 0.62), getRightSafeX(0.66));
    const anemY = reefFloorY(anemX) - 2;
    const sw = Math.sin(time * 0.0022);
    pRect(anemX - 9, anemY - 3, 18, 4, '#831843');
    for (let t = -8; t <= 8; t += 4) {
        const th = 7 + ((Math.abs(t) + 1) % 3) * 2;
        const ts = Math.round(sw * (t >= 0 ? 1.3 : 0.8));
        pRect(anemX + t, anemY - th, 3, th, '#db2777');
        pRect(anemX + t + ts, anemY - th - 2, 3, 2, '#f472b6');
        pRect(anemX + t + ts, anemY - th - 3, 2, 1, '#fbcfe8');
    }
    const peekShift = phase > 0.45 && phase < 0.78 ? Math.round(Math.sin(((phase - 0.45) / 0.33) * Math.PI) * 5) : 0;
    const cfX = anemX + 2 + peekShift;
    const cfY = anemY - 9;
    pRect(cfX - 6, cfY - 3, 11, 6, '#f97316');
    pRect(cfX - 8, cfY - 2, 3, 4, '#ea580c');
    pRect(cfX - 2, cfY - 3, 2, 6, '#ffffff');
    pRect(cfX + 2, cfY - 3, 2, 6, '#ffffff');
    pRect(cfX + 4, cfY - 2, 1, 2, '#0f172a');
}

function drawKoiPondCritters(time) {
    // 1. GİZEMLİ & ÜRPERTİCİ GÖLET EV SAHİBİ: Alt vücudu hep derin su altında gizlenen Loch Ness / Ryūjin Ejderha Yılanı!
    const nessX = Math.max(Math.round(pw * 0.30), 182);
    const nessY = Math.round(ph * 0.68);
    const phase = (time % 24000) / 24000;

    // Alt vücut HER ZAMAN derin koyu gölet suyunun altında belli belirsiz gölge kıvrımı olarak kalır!
    const subGlide = Math.sin(time * 0.0014) * 3;
    pRect(Math.round(nessX - 28 + subGlide), nessY + 8, 22, 5, 'rgba(2, 14, 22, 0.30)');
    pRect(Math.round(nessX - 10 + subGlide * 0.6), nessY + 11, 28, 6, 'rgba(2, 14, 22, 0.38)');
    pRect(Math.round(nessX + 16 + subGlide * 0.4), nessY + 9, 16, 4, 'rgba(2, 14, 22, 0.24)');

    if (phase < 0.46 && ((time % 3400) < 1200)) {
        const bStep = ((time % 3400) / 1200);
        pRect(nessX + 2, Math.round(nessY - 2 - bStep * 5), 2, 2, 'rgba(186, 230, 253, 0.42)');
        pRect(nessX - 5, Math.round(nessY + 2 - bStep * 4), 1, 1, 'rgba(186, 230, 253, 0.35)');
    }

    // 24 saniyelik gizemli çıkış-dalış döngüsü: ~11s su altı -> ~2.9s akıcı yükseliş -> ~6.7s sessiz gözetleme -> ~3.4s akıcı dalış
    let emerge = 0;
    if (phase >= 0.46 && phase < 0.58) {
        const u = (phase - 0.46) / 0.12;
        emerge = 1 - (1 - u) * (1 - u);
    } else if (phase >= 0.58 && phase < 0.86) {
        emerge = 1;
    } else if (phase >= 0.86) {
        const u = (phase - 0.86) / 0.14;
        emerge = 1 - u * u;
    }

    if (emerge > 0.02) {
        const drawAboveWater = (x, y, w, h, col) => {
            if (y >= nessY || h <= 0) return;
            pRect(x, y, w, Math.min(h, nessY - y), col);
        };

        const colDeep = '#031d1c';
        const colDark = '#06322f';
        const colMid = '#0d544d';
        const colSpec = '#2dd4bf';

        const headBob = emerge > 0.85 && Math.sin(time * 0.0020) > 0.4 ? -1 : 0;
        const liftY = Math.round(emerge * 34);
        const headBaseY = nessY + 8 - liftY + headBob;
        const blinkNess = (time % 6300) > 6100;

        // İkinci batık sırt kamburu (yükselişin ortasından itibaren su yüzeyini sıyırır)
        if (emerge > 0.35) {
            const humpRise = Math.round(((emerge - 0.35) / 0.65) * 6);
            drawAboveWater(nessX - 31, nessY - humpRise, 14, humpRise, colDark);
            drawAboveWater(nessX - 29, nessY - humpRise - 1, 10, 2, colMid);
            drawAboveWater(nessX - 26, nessY - humpRise - 2, 4, 2, colSpec);
            pRect(nessX - 33, nessY, 18, 1, 'rgba(224, 242, 254, 0.45)');
        }

        // Başın tam altından (dy=0) su çizgisine kadar kesintisiz inen S-kıvrımlı boyun
        for (let dy = 0; dy <= 28; dy++) {
            const py = headBaseY - 1 + dy;
            if (py >= nessY) break;
            const prog = dy / 28;
            const curveX = nessX - Math.round(Math.sin((1 - prog) * Math.PI * 0.85) * 5);
            const thick = Math.round(7 + prog * 3);
            const halfW = Math.floor(thick * 0.5);
            drawAboveWater(curveX - halfW, py, thick, 1, colDeep);
            drawAboveWater(curveX - halfW + 1, py, Math.max(2, thick - 3), 1, colDark);
            drawAboveWater(curveX - halfW + 1, py, 2, 1, colMid);
            if (dy % 5 === 0 && py < nessY - 1) {
                drawAboveWater(curveX - halfW - 2, py, 2, 2, colSpec);
            }
        }

        // Baş üstünde tacı & parlayan kehribar gözüyle sudan pürüzsüz yükselen ejderha başı
        const hx = nessX - 2;
        const hy = headBaseY;
        drawAboveWater(hx - 4, hy - 6, 13, 7, colDark);
        drawAboveWater(hx - 3, hy - 7, 10, 2, colMid);
        drawAboveWater(hx + 3, hy - 5, 11, 4, colDeep);
        drawAboveWater(hx + 4, hy - 5, 9, 3, colDark);
        drawAboveWater(hx + 6, hy - 5, 6, 1, colSpec);
        drawAboveWater(hx - 6, hy - 9, 4, 2, colMid);
        drawAboveWater(hx - 8, hy - 10, 3, 2, colSpec);
        if (!blinkNess) {
            drawAboveWater(hx + 2, hy - 5, 3, 2, '#fde047');
            drawAboveWater(hx + 3, hy - 5, 1, 2, '#020617');
        } else {
            drawAboveWater(hx + 2, hy - 4, 3, 1, colMid);
        }
        const dropOff = Math.floor((time * 0.014) % 8);
        drawAboveWater(hx + 11, hy - 1 + dropOff, 1, 2, 'rgba(167, 243, 208, 0.70)');

        // Su yüzeyi köpük yakası & yayılan halkalar (boyun/baş sonrası üstte çizilir)
        const surfHalf = Math.round(9 + emerge * 6);
        pRect(nessX - surfHalf, nessY, surfHalf * 2, 2, 'rgba(224, 242, 254, 0.62)');
        pRect(nessX - surfHalf - 5, nessY + 3, (surfHalf + 5) * 2, 1, 'rgba(45, 212, 191, 0.32)');
        pRect(nessX - surfHalf - 9, nessY + 6, (surfHalf + 9) * 2, 1, 'rgba(186, 230, 253, 0.22)');
    }

    // 2. Sağ-Orta Yüzen Yosunlu Kayada Güneşlenen Zen Kaplumbağası (~22x12px — System Widget'tan tamamen uzak!)
    const rockX = getRightSafeX(0.68);
    const rockY = Math.round(ph * 0.72);
    const blinkTu = (time % 5400) > 5220;
    pRect(rockX - 13, rockY + 1, 26, 4, 'rgba(2, 8, 16, 0.44)');
    pRect(rockX - 12, rockY - 4, 24, 6, '#334155');
    pRect(rockX - 10, rockY - 5, 20, 2, '#475569');
    pRect(rockX - 8, rockY - 5, 14, 1, '#15803d');

    pRect(rockX - 6, rockY - 9, 14, 4, '#14532d');
    pRect(rockX - 4, rockY - 11, 10, 3, '#166534');
    pRect(rockX - 3, rockY - 10, 3, 2, '#4ade80');
    pRect(rockX + 2, rockY - 10, 3, 2, '#d97706');
    pRect(rockX - 6, rockY - 6, 14, 1, '#b45309');
    pRect(rockX - 10, rockY - 8, 4, 3, '#4d7c0f');
    pRect(rockX - 12, rockY - 10, 4, 3, '#65a30d');
    pRect(rockX - 11, rockY - 9, 1, 1, blinkTu ? '#365314' : '#0f172a');
}

function drawArcticAlwaysPresentWildlife(time) {
    const ledges = getArcticLedges(pw, ph);

    // 1. Ledge 2 Üzerinde Oturup Kuzey Işıklarını İzleyen Koca Kutup Ayısı (~36x34px — Noel'den bağımsız!)
    const bearX = Math.max(Math.round(pw * 0.24), 146);
    const groundY = ledges[2].yFn(bearX) + 1;
    const phase = (time % 18000) / 18000;
    const breath = Math.sin(time * 0.0020) > 0.35 ? -1 : 0;
    const blink = (time % 5300) > 5120;
    const lookUp = phase > 0.58 && phase < 0.85 ? -1 : 0;
    const pawWave = phase > 0.62 && phase < 0.82 ? Math.round(Math.sin(((phase - 0.62) / 0.20) * Math.PI * 3) * 3) : 0;

    const snowDeep = isLightMode ? '#cbd5e1' : '#94a3b8';
    const furShade = isLightMode ? '#e2e8f0' : '#bae6fd';
    const furBody = isLightMode ? '#f8fafc' : '#e0f2fe';
    const furBright = '#ffffff';

    pRect(bearX - 13, groundY - 1, 27, 3, 'rgba(56, 189, 248, 0.28)');
    pRect(bearX - 13, groundY - 6, 3, 3, furShade);
    pRect(bearX - 11, groundY - 20 + breath, 20, 19, furBody);
    pRect(bearX - 11, groundY - 18 + breath, 4, 16, furShade);
    pRect(bearX - 7, groundY - 21 + breath, 12, 4, furBright);
    pRect(bearX - 3, groundY - 17 + breath, 9, 14, furBright);
    pRect(bearX - 10, groundY - 5, 8, 5, furShade);
    pRect(bearX - 8, groundY - 4, 5, 3, furBright);
    pRect(bearX + 2, groundY - 5, 8, 5, furShade);
    pRect(bearX + 4, groundY - 4, 5, 3, furBright);
    pRect(bearX + 7, groundY - 13 + breath - Math.max(0, pawWave), 6, 5, furBody);
    pRect(bearX + 8, groundY - 12 + breath - Math.max(0, pawWave), 5, 3, furBright);
    pRect(bearX + 10, groundY - 11 + breath - Math.max(0, pawWave), 2, 2, snowDeep);

    const hy = groundY - 32 + breath + lookUp;
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
    if (puff < 12) {
        const alpha = ((1 - puff / 12) * 0.55).toFixed(2);
        pRect(bearX + 8 + Math.round(puff * 0.5), Math.round(hy + 6 - puff * 0.6), 3, 2, `rgba(224, 242, 254, ${alpha})`);
    }

    // 2. Donmuş Derenin Solundaki Kutup Tavşanı (~14x13px — açık vadi karında!)
    const hareX = Math.round(pw * 0.39);
    const hareY = getGroundY(hareX, 'arctic-tundra', pw, ph);
    const earFlick = (time % 6100) > 5880 ? -1 : 0;
    const noseWiggle = Math.sin(time * 0.01) > 0.3 ? -1 : 0;

    pRect(hareX - 6, hareY - 1, 12, 2, 'rgba(56, 189, 248, 0.28)');
    pRect(hareX - 7, hareY - 4, 3, 3, '#e0f2fe');
    pRect(hareX - 5, hareY - 7, 9, 7, '#ffffff');
    pRect(hareX - 4, hareY - 3, 6, 3, '#bae6fd');
    pRect(hareX + 1, hareY - 10, 6, 5, '#ffffff');
    pRect(hareX + 2, hareY - 14, 2, 4, '#f8fafc');
    pRect(hareX + 5, hareY - 14 + earFlick, 2, 4, '#f8fafc');
    pRect(hareX + 2, hareY - 15, 2, 1, '#0f172a');
    pRect(hareX + 5, hareY - 15 + earFlick, 2, 1, '#0f172a');
    pRect(hareX + 4, hareY - 9, 1, 1, '#0f172a');
    pRect(hareX + 6, hareY - 8 + noseWiggle, 2, 1, '#fda4af');
}

export function drawHabitatAmbientWildlife(sceneProfile, time) {
    if (sceneProfile === 'meadow') drawMeadowHoneyBear(time);
    else if (sceneProfile === 'betta-aquarium') drawBettaTankCritters(time);
    else if (sceneProfile === 'wetland') drawWetlandCritters(time);
    else if (sceneProfile === 'botanical') drawBotanicalCritters(time);
    else if (sceneProfile === 'reef') drawReefCritters(time);
    else if (sceneProfile === 'koi-pond') drawKoiPondCritters(time);
    else if (sceneProfile === 'arctic-tundra') drawArcticAlwaysPresentWildlife(time);
}

// ============================================================================
// BÖLÜM SONU: BİYOMLARIN EV SAHİBİ DURGUN CANLILARI
// BÖLÜM BAŞI: AÇILIP KAPANABİLEN KUTUP NOEL HARİKALAR DİYARI
// ============================================================================

export function drawArcticChristmasSky(time) {
    // Widget çakışmasını %100 önleyen açık gökyüzü koridoru (Üst bar 0..28 ve Saat arasından süzülür)
    const travelW = pw + 260;
    const leadX = Math.round(((time * 0.017) % travelW) - 130);
    const sleighY = Math.max(52, Math.round(ph * 0.17 + Math.sin(time * 0.0018) * 3.5));
    if (leadX < -120 || leadX > pw + 110) return;

    // 1. Parlayan altın & buz-mavisi sihirli yıldız tozu şeridi
    for (let st = 0; st < 18; st++) {
        const sx = leadX - 36 - st * 4;
        const sy = sleighY + 6 + Math.round(Math.sin(time * 0.008 + st * 0.85) * 3.2) + (st % 3);
        const alpha = Math.max(0.10, 0.90 - st * 0.048).toFixed(2);
        pRect(sx, sy, st % 4 === 0 ? 2 : 1, 1, st % 2 === 0 ? `rgba(253, 224, 71, ${alpha})` : `rgba(186, 230, 253, ${alpha})`);
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

    const waveArm = Math.round(Math.sin(time * 0.008) * 1.5);
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

    // 3. 4 Doru Ren Geyiği (Boynuzlu, kırmızı çıngırak tasmalı; öndeki Rudolph!)
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
            const pulseGlow = Math.sin(time * 0.01) > 0 ? 0.45 : 0.28;
            pRect(rx + 7, ry - 10, 5, 5, `rgba(239, 68, 68, ${pulseGlow})`);
            pRect(rx + 8, ry - 9, 3, 3, 'rgba(254, 202, 202, 0.55)');
            pRect(rx + 9, ry - 8, 2, 2, '#ef4444');
        }
    }
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

function drawArcticChristmasElf(x, baseY, hatCol, tunicCol, dir, phaseOff, holdLantern, time) {
    const phase = ((time + Math.round(phaseOff * 14000)) % 14000) / 14000;
    const cheerWave = phase > 0.65 && phase < 0.88;
    const hop = cheerWave && Math.sin(time * 0.008) > 0.35 ? -1 : 0;
    const blink = ((time + Math.round(phaseOff * 2000)) % 4900) > 4720;
    const waveOff = cheerWave ? Math.round(Math.sin(time * 0.012) * 1.5) : Math.round(Math.sin(time * 0.0025 + phaseOff) * 0.6);
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
        pRect(x + dir * 5, by - 6 + waveOff, 5, 6, 'rgba(253, 224, 71, 0.25)');
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
}

function drawArcticSnowman(x, groundY, time) {
    const scarfFlutter = Math.round(Math.sin(time * 0.0032) * 1);
    const armWave = Math.sin(time * 0.0024) > 0.5 ? -1 : 0;

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
    pRect(x + 7, groundY - 16, 4, 1, '#451a03');
    pRect(x + 10, groundY - 17, 2, 1, '#78350f');

    pRect(x - 5, groundY - 18, 11, 2, '#dc2626');
    pRect(x + 3, groundY - 16 + scarfFlutter, 3, 5, '#ef4444');
    pRect(x + 4, groundY - 11 + scarfFlutter, 2, 2, '#b91c1c');

    pRect(x - 5, groundY - 24, 10, 6, '#ffffff');
    pRect(x - 3, groundY - 23, 1, 1, '#0f172a');
    pRect(x + 2, groundY - 23, 1, 1, '#0f172a');
    pRect(x, groundY - 21, 5, 2, '#f97316');
    pRect(x + 3, groundY - 21, 2, 1, '#fbbf24');
    pRect(x - 2, groundY - 19, 4, 1, '#0f172a');

    pRect(x - 6, groundY - 25, 13, 2, '#0f172a');
    pRect(x - 4, groundY - 30, 9, 5, '#1e293b');
    pRect(x - 4, groundY - 26, 9, 1, '#ef4444');
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

    // 2. Vadi Ön Planda 56px Görkemli Süslenmiş Noel Ağacı (Ticket & System'dan tamamen açık)
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

    // 5. Dev Paketli Renkli Yılbaşı Hediye Kutuları (9–14px kurdeleli yığınlar)
    drawArcticGiftBox(heroTreeX - 14, heroTreeY, 10, 9, '#dc2626', '#fde047', '#991b1b');
    drawArcticGiftBox(heroTreeX + 4, heroTreeY, 9, 8, '#2563eb', '#ffffff', '#1e40af');
    drawArcticGiftBox(heroTreeX - 4, heroTreeY - 2, 8, 7, '#16a34a', '#ef4444', '#14532d');
    drawArcticGiftBox(cabX + 9, cabY, 8, 7, '#a855f7', '#fde047', '#6b21a8');
    drawArcticGiftBox(snowX + 12, snowY, 8, 7, '#ef4444', '#ffffff', '#991b1b');

    // 6. 3 İfadeli Büyük Noel Elfi (19px, sakin dinlenme ve neşeli selam/fener ritmiyle)
    const elf1X = Math.round(pw * 0.785);
    drawArcticChristmasElf(elf1X, ledges[5].yFn(elf1X) + 1, '#dc2626', '#16a34a', -1, 0.1, true, time);
    const elf2X = heroTreeX - 24;
    drawArcticChristmasElf(elf2X, getGroundY(elf2X, 'arctic-tundra', pw, ph) + 1, '#16a34a', '#dc2626', 1, 0.4, false, time);
    const elf3X = snowX - 24;
    if (elf3X > 136) {
        drawArcticChristmasElf(elf3X, getGroundY(elf3X, 'arctic-tundra', pw, ph) + 1, '#2563eb', '#15803d', 1, 0.7, false, time);
    }
}

// ============================================================================
// BÖLÜM SONU: AÇILIP KAPANABİLEN KUTUP NOEL HARİKALAR DİYARI
// ============================================================================
