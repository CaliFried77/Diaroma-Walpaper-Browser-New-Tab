import { pw, ph, pRect } from './07-habitat-state.js';
import { isLightMode } from './01-core-ui.js';
import { getGroundY } from './habitat-geometry.js';
import { getArcticLedges } from './arctic-geometry.js';

/* HABITAT AMBIENT WILDLIFE — stationary, in-place micro-animated pixel-art animals
   for each diorama biome plus the toggleable Arctic Christmas holiday layer.
   Note: Only the biome's primary creature roams across the scene; every creature
   rendered here remains anchored in its micro-habitat performing living micro-motions. */

// ============================================================================
// BÖLÜM BAŞI: BİYOMLARA ÖZGÜ YERİNDE YAŞAYAN DURGUN CANLILAR
// ============================================================================

function drawMeadowHoneyBear(time) {
    const bearX = Math.round(pw * 0.72);
    const groundY = getGroundY(bearX, 'meadow', pw, ph) + 1;
    const potX = bearX + 6;
    const potY = groundY;

    // 4.8 saniyelik bal yeme döngüsü: çömleğe daldır -> ağza kaldır -> keyifle yala -> indir
    const phase = (time % 4800) / 4800;
    const breath = Math.sin(time * 0.0028) > 0.35 ? -1 : 0;
    const earTwitch = (time % 5700) > 5420 ? -1 : 0;
    let pawLift = 0;
    let mouthOpen = false;
    let happyEyes = false;
    if (phase >= 0.28 && phase < 0.50) {
        const t = (phase - 0.28) / 0.22;
        pawLift = Math.round(t * 5);
        mouthOpen = t > 0.65;
    } else if (phase >= 0.50 && phase < 0.78) {
        const lickBob = Math.sin(time * 0.018) > 0 ? 1 : 0;
        pawLift = 5 - lickBob;
        mouthOpen = lickBob === 0;
        happyEyes = true;
    } else if (phase >= 0.78) {
        const t = (phase - 0.78) / 0.22;
        pawLift = Math.round((1 - t) * 5);
    }

    const furDark = '#3b1d0a';
    const furMid = '#6b3818';
    const furHi = '#8b4e24';
    const tan = '#d6a676';
    const muz = '#e7c196';
    const honeyDeep = '#d97706';
    const honeyGlow = '#fde047';

    // Zemin temas gölgesi
    pRect(bearX - 9, groundY, 21, 2, 'rgba(2, 10, 14, 0.38)');

    // Kuyruk ponponu
    pRect(bearX - 9, groundY - 4, 2, 2, furDark);

    // Oturur gövde & karın hacmi (~21px toplam boy: arıdan ~3.5x büyük, ağaçtan ~5x küçük)
    pRect(bearX - 7, groundY - 12 + breath, 12, 11, furMid);
    pRect(bearX - 7, groundY - 11 + breath, 3, 10, furDark);
    pRect(bearX - 5, groundY - 12 + breath, 4, 3, furHi);
    pRect(bearX - 2, groundY - 9 + breath, 6, 8, tan);
    pRect(bearX - 1, groundY - 8 + breath, 4, 6, muz);

    // Öne uzanmış arka patiler
    pRect(bearX - 6, groundY - 3, 5, 3, furDark);
    pRect(bearX - 5, groundY - 3, 3, 2, tan);
    pRect(bearX + 1, groundY - 3, 4, 3, furDark);
    pRect(bearX + 2, groundY - 2, 2, 2, tan);

    // Sol pati çömleği tutar
    pRect(bearX - 5, groundY - 8 + breath, 3, 3, furDark);
    pRect(bearX - 4, groundY - 6 + breath, 3, 2, tan);

    // Yuvarlak ayı başı, kulaklar, krem burun ve bal yalayan ifade
    const headY = groundY - 20 + breath;
    pRect(bearX - 5, headY - 2 + earTwitch, 3, 3, furDark);
    pRect(bearX - 4, headY - 1 + earTwitch, 1, 1, tan);
    pRect(bearX + 2, headY - 2, 3, 3, furDark);
    pRect(bearX + 3, headY - 1, 1, 1, tan);

    pRect(bearX - 5, headY, 10, 8, furMid);
    pRect(bearX - 5, headY + 1, 2, 6, furDark);
    pRect(bearX - 3, headY, 6, 2, furHi);
    pRect(bearX - 2, headY + 3, 7, 5, tan);
    pRect(bearX - 1, headY + 4, 6, 3, muz);
    pRect(bearX + 3, headY + 4, 2, 1, '#18181b');

    if (happyEyes) {
        pRect(bearX - 2, headY + 2, 2, 1, furDark);
        pRect(bearX + 2, headY + 2, 2, 1, furDark);
        pRect(bearX - 3, headY + 4, 1, 1, '#fb7185');
    } else {
        pRect(bearX - 2, headY + 2, 1, 1, '#09090b');
        pRect(bearX + 2, headY + 2, 1, 1, '#09090b');
    }
    if (mouthOpen) {
        pRect(bearX + 1, headY + 6, 2, 1, '#7f1d1d');
    }

    // Altın bal çömleği (ayıyı besleyen kil kap)
    pRect(potX - 3, potY - 6, 7, 6, '#92400e');
    pRect(potX - 2, potY - 5, 4, 4, '#b45309');
    pRect(potX - 4, potY - 7, 9, 2, '#d97706');
    pRect(potX - 3, potY - 8, 7, 2, honeyDeep);
    pRect(potX - 2, potY - 8, 5, 1, honeyGlow);
    pRect(potX + 1, potY - 6, 2, 2, honeyGlow);

    // Çömleğe dalıp kalkarken parlayan bal damlalı sağ pati
    const armY = potY - 8 - pawLift;
    const armX = bearX + 2 + (pawLift > 2 ? 1 : 2);
    pRect(armX - 1, armY, 3, 4, furDark);
    pRect(armX, armY, 2, 3, furMid);
    pRect(armX, armY - 1, 2, 2, honeyDeep);
    pRect(armX + 1, armY - 1, 1, 1, honeyGlow);
    if (pawLift > 1) {
        const dripDrop = Math.floor((time * 0.01) % 3);
        pRect(armX + 1, armY + 2 + dripDrop, 1, 1, honeyGlow);
    }
}

function drawBettaTankCritters(time) {
    const soilY = (x) => {
        const nx = x / Math.max(1, pw);
        const mound = Math.pow(Math.abs(nx - 0.50) * 1.95, 1.45) * 18;
        return Math.round(ph - 4 - mound - Math.sin(x * 0.04) * 2);
    };

    // 1. Kiraz Karidesi (Sol marimo yosun topunun üstünde sabit otlanıyor)
    const sx = Math.round(pw * 0.35);
    const sy = soilY(sx) - 8;
    const graze = Math.sin(time * 0.008) > 0.2 ? 1 : 0;
    const antWave = Math.round(Math.sin(time * 0.004) * 1);
    pRect(sx - 4, sy - 1, 2, 1, '#dc2626');
    pRect(sx - 3, sy - 2, 5, 2, '#ef4444');
    pRect(sx - 2, sy - 2, 3, 1, '#f87171');
    pRect(sx + 1, sy - 1, 2, 2, '#b91c1c');
    pRect(sx + 2, sy - 1, 1, 1, '#0f172a');
    pRect(sx + 3, sy - 2 + antWave, 2, 1, 'rgba(254, 202, 202, 0.80)');
    pRect(sx + 3, sy, 2, 1, 'rgba(254, 202, 202, 0.65)');
    pRect(sx - 1, sy + graze, 1, 1, '#fca5a5');
    pRect(sx + 1, sy + (1 - graze), 1, 1, '#fca5a5');

    // 2. Altın Elma Salyangozu (Kum kanyonunun sağındaki yosunlu kaya üzerinde sabit)
    const nxRock = Math.round(pw * 0.585);
    const snX = nxRock;
    const snY = soilY(nxRock) - 3;
    const stalkWave = Math.round(Math.sin(time * 0.0025) * 0.6);
    pRect(snX - 4, snY - 1, 7, 2, '#fde68a');
    pRect(snX - 3, snY - 5, 5, 4, '#b45309');
    pRect(snX - 2, snY - 6, 4, 4, '#f59e0b');
    pRect(snX - 1, snY - 5, 2, 2, '#fde047');
    pRect(snX - 5, snY - 2, 2, 2, '#fef3c7');
    pRect(snX - 5, snY - 4 + stalkWave, 1, 2, '#fcd34d');
    pRect(snX - 4, snY - 4 - stalkWave, 1, 2, '#fcd34d');
    const bRise = ((time * 0.012) % 16);
    if (bRise > 2) {
        pRect(snX - 4, Math.round(snY - 4 - bRise), 1, 1, 'rgba(224, 242, 254, 0.68)');
    }
}

function drawWetlandCritters(time) {
    // 1. Güneşlenen Su Kaplumbağası (Sağ kıyıdaki kemerli kütüğün tepesinde sabit)
    const snagX = Math.round(pw * 0.66);
    const snagBankY = getGroundY(snagX + 8, 'wetland', pw, ph) + 1;
    const tuX = snagX - 3;
    const tuY = snagBankY - 8;
    const tuckPhase = (time % 6800) / 6800;
    const headExt = (tuckPhase > 0.72 && tuckPhase < 0.88) ? 1 : 0;
    const blink = (time % 4300) > 4120;

    pRect(tuX - 4, tuY - 1, 8, 2, '#92400e');
    pRect(tuX - 4, tuY - 4, 8, 3, '#14532d');
    pRect(tuX - 3, tuY - 5, 6, 2, '#166534');
    pRect(tuX - 2, tuY - 4, 2, 1, '#4ade80');
    pRect(tuX + 1, tuY - 4, 2, 1, '#d97706');
    pRect(tuX - 4, tuY, 2, 2, '#365314');
    pRect(tuX + 2, tuY, 2, 2, '#365314');
    // Sola (suya) uzanan kafa & kırmızı/altın kulak lekesi
    pRect(tuX - 7 + headExt, tuY - 3, 3, 2, '#4d7c0f');
    pRect(tuX - 8 + headExt, tuY - 4, 3, 2, '#65a30d');
    pRect(tuX - 6 + headExt, tuY - 3, 1, 1, '#ef4444');
    pRect(tuX - 7 + headExt, tuY - 4, 1, 1, blink ? '#365314' : '#0f172a');

    // 2. İskele Direğindeki Yalıçapkını (Orta ahşap kazığın üstünde av gözlüyor)
    const kfX = 37;
    const kfY = ph - 50;
    const bob = Math.sin(time * 0.0042) > 0.55 ? 1 : 0;
    const blinkKf = (time % 4900) > 4740;
    const tailFlick = (time % 5600) > 5420 ? -1 : 0;

    pRect(kfX - 1, kfY - 1, 3, 1, '#dc2626');
    pRect(kfX - 3, kfY - 3 + tailFlick, 2, 3, '#0369a1');
    pRect(kfX - 2, kfY - 5 + bob, 5, 4, '#0284c7');
    pRect(kfX, kfY - 4 + bob, 3, 3, '#ea580c');
    pRect(kfX + 1, kfY - 3 + bob, 2, 2, '#fb923c');
    pRect(kfX - 1, kfY - 8 + bob, 4, 3, '#0284c7');
    pRect(kfX, kfY - 9 + bob, 3, 1, '#38bdf8');
    pRect(kfX + 1, kfY - 6 + bob, 2, 1, '#f8fafc');
    pRect(kfX + 2, kfY - 8 + bob, 1, 1, blinkKf ? '#0369a1' : '#0f172a');
    pRect(kfX + 3, kfY - 7 + bob, 4, 1, '#0f172a');
    pRect(kfX + 3, kfY - 6 + bob, 2, 1, '#334155');
}

function drawBotanicalCritters(time) {
    // 1. Kıvrılıp Uyuyan Bahçe Kedisi (Yolun sağındaki yosunlu çimlikte)
    const catX = Math.round(pw * 0.63);
    const catY = getGroundY(catX, 'botanical', pw, ph) + 1;
    const breath = Math.sin(time * 0.0022) > 0.3 ? -1 : 0;
    const earTwitch = (time % 6400) > 6180 ? -1 : 0;
    const halfAwake = (time % 9600) > 8900;
    const tailCurl = Math.round(Math.sin(time * 0.0024) * 1.1);

    pRect(catX - 7, catY, 15, 2, 'rgba(2, 8, 16, 0.36)');
    // Kıvrılmış sırt & tekir çizgileri
    pRect(catX - 6, catY - 5 + breath, 11, 5, '#ea580c');
    pRect(catX - 4, catY - 6 + breath, 7, 2, '#fb923c');
    pRect(catX - 3, catY - 5 + breath, 1, 2, '#9a3412');
    pRect(catX, catY - 5 + breath, 1, 2, '#9a3412');
    pRect(catX + 3, catY - 5 + breath, 1, 2, '#9a3412');
    // Yavaşça kıpırdayan turuncu-krem kuyruk ucu
    pRect(catX - 7, catY - 2, 3, 2, '#f97316');
    pRect(catX - 8, catY - 3 + tailCurl, 2, 2, '#fed7aa');
    // Ön patiler
    pRect(catX + 4, catY - 2, 3, 2, '#fef3c7');
    // Kafa ve kulaklar
    pRect(catX + 1, catY - 8 + breath, 6, 5, '#f97316');
    pRect(catX + 1, catY - 10 + breath + earTwitch, 2, 2, '#ea580c');
    pRect(catX + 5, catY - 10 + breath, 2, 2, '#ea580c');
    pRect(catX + 3, catY - 6 + breath, 4, 3, '#fef3c7');
    pRect(catX + 5, catY - 6 + breath, 1, 1, '#fb7185');
    if (halfAwake) {
        pRect(catX + 2, catY - 7 + breath, 1, 1, '#fef08a');
        pRect(catX + 5, catY - 7 + breath, 1, 1, '#fef08a');
    } else {
        pRect(catX + 2, catY - 7 + breath, 1, 1, '#9a3412');
        pRect(catX + 5, catY - 7 + breath, 1, 1, '#9a3412');
    }

    // 2. Çeşme Kenarındaki Kızılgerdan Kuşu (Taş fıskiye çanağının sağ dudağında su içiyor)
    const fx = Math.round(pw * 0.18);
    const fy = getGroundY(fx, 'botanical', pw, ph) + 1;
    const rx = fx + 8;
    const ry = fy - 23;
    const sipPhase = (time % 5400) / 5400;
    const dip = (sipPhase > 0.65 && sipPhase < 0.85) ? 1 : 0;

    pRect(rx, ry - 1, 2, 1, '#78350f');
    pRect(rx + 2, ry - 3 + dip, 3, 2, '#78350f');
    pRect(rx - 1, ry - 5 + dip, 4, 4, '#92400e');
    pRect(rx - 2, ry - 4 + dip, 3, 3, '#ef4444');
    pRect(rx - 1, ry - 7 + dip, 3, 3, '#78350f');
    pRect(rx - 2, ry - 6 + dip, 1, 1, '#fb923c');
    pRect(rx - 1, ry - 6 + dip, 1, 1, '#0f172a');
    pRect(rx - 3, ry - 5 + dip, 2, 1, '#facc15');
}

function drawReefCritters(time) {
    const reefFloorY = (x) => {
        const nx = x / Math.max(1, pw);
        const sideMound = nx < 0.26 ? Math.pow((0.26 - nx) / 0.26, 1.5) * 34
                        : (nx > 0.74 ? Math.pow((nx - 0.74) / 0.26, 1.5) * 34 : 0);
        return Math.round(getGroundY(x, 'reef', pw, ph) - sideMound);
    };

    // 1. Deniz Şakayığı İçinden Bakan Palyaço Balığı (Batık taş bloğun tepesinde)
    const ruinX = Math.round(pw * 0.26);
    const anemX = ruinX + 4;
    const anemY = reefFloorY(anemX) - 4;
    const tentacleSway = Math.sin(time * 0.0028);

    pRect(anemX - 5, anemY - 2, 11, 3, '#831843');
    for (let t = -4; t <= 4; t += 2) {
        const th = 5 + ((Math.abs(t) + 1) % 3) * 2;
        const tipShift = Math.round(tentacleSway * (t >= 0 ? 1.2 : 0.8));
        pRect(anemX + t, anemY - th, 2, th, '#db2777');
        pRect(anemX + t + tipShift, anemY - th - 1, 2, 2, '#f472b6');
        pRect(anemX + t + tipShift, anemY - th - 2, 1, 1, '#fbcfe8');
    }
    // Anemonların arasında yerinde ileri-geri süzülen turuncu-beyaz şeritli Palyaço Balığı
    const peekX = Math.round(Math.sin(time * 0.0032) * 2);
    const cfX = anemX + 2 + peekX;
    const cfY = anemY - 5 + (Math.sin(time * 0.005) > 0.3 ? -1 : 0);
    pRect(cfX - 3, cfY - 2, 6, 4, '#f97316');
    pRect(cfX - 4, cfY - 1, 1, 2, '#ea580c');
    pRect(cfX - 1, cfY - 2, 1, 4, '#ffffff');
    pRect(cfX + 1, cfY - 2, 1, 4, '#ffffff');
    pRect(cfX + 2, cfY - 1, 1, 1, '#0f172a');
    if (Math.sin(time * 0.012) > 0) {
        pRect(cfX, cfY + 1, 1, 2, '#fb923c');
    }

    // 2. Resif Kayası Üzerinde Dinlenen Ahtapot (Sol alt mercan tümseğinde)
    const octX = Math.round(pw * 0.17);
    const octY = ph - 32;
    const mantlePulse = Math.sin(time * 0.0024) > 0.4 ? -1 : 0;
    const armWave = Math.round(Math.sin(time * 0.0036) * 2);
    const octBlink = (time % 5100) > 4920;

    pRect(octX - 7, octY - 1, 14, 3, 'rgba(5, 4, 23, 0.45)');
    // Dokunaçlar kayayı kavrarken bir kolu suda yavaşça dalgalanır
    pRect(octX - 6, octY - 2, 3, 3, '#7e22ce');
    pRect(octX - 2, octY - 1, 4, 2, '#9333ea');
    pRect(octX + 3, octY - 2, 3, 3, '#7e22ce');
    pRect(octX + 6, octY - 3 + armWave, 3, 2, '#a855f7');
    pRect(octX + 8, octY - 4 + armWave, 2, 1, '#e879f9');
    // Kubbeli baş, benekler ve altın gözler
    pRect(octX - 4, octY - 7 + mantlePulse, 8, 6, '#9333ea');
    pRect(octX - 3, octY - 9 + mantlePulse, 6, 3, '#a855f7');
    pRect(octX - 2, octY - 8 + mantlePulse, 2, 1, '#e879f9');
    pRect(octX + 1, octY - 7 + mantlePulse, 2, 1, '#f0abfc');
    pRect(octX - 3, octY - 4, 2, 2, octBlink ? '#581c87' : '#fbbf24');
    pRect(octX + 1, octY - 4, 2, 2, octBlink ? '#581c87' : '#fbbf24');
    if (!octBlink) {
        pRect(octX - 2, octY - 4, 1, 1, '#090d16');
        pRect(octX + 2, octY - 4, 1, 1, '#090d16');
    }
}

function drawKoiPondCritters(time) {
    // 1. Ön Sol Taşta Güneşlenen Zen Kaplumbağası
    const tx = 46;
    const ty = ph - 11;
    const blinkT = (time % 5300) > 5120;
    const headLook = Math.sin(time * 0.0018) > 0.65 ? -1 : 0;

    pRect(tx - 4, ty - 3, 8, 3, '#1e3a2f');
    pRect(tx - 3, ty - 4, 6, 2, '#15803d');
    pRect(tx - 4, ty - 1, 8, 1, '#b45309');
    pRect(tx - 2, ty - 3, 2, 1, '#4ade80');
    pRect(tx + 4, ty - 3 + headLook, 3, 2, '#4d7c0f');
    pRect(tx + 6, ty - 3 + headLook, 1, 1, blinkT ? '#365314' : '#0f172a');

    // 2. Fener Yanında Bekleyen Zarif Küçük Ak Balıkçıl (Sola gölete bakar)
    const ex = pw - 20;
    const ey = ph - 16;
    const fishCycle = (time % 6600) / 6600;
    const neckDip = (fishCycle > 0.62 && fishCycle < 0.80) ? 2 : 0;
    const blinkE = (time % 4700) > 4520;
    const plumeRuffle = Math.sin(time * 0.004) > 0.5 ? 1 : 0;

    // İnce bacaklar & temas gölgesi
    pRect(ex - 2, ey, 5, 1, 'rgba(2, 8, 16, 0.42)');
    pRect(ex - 1, ey - 5, 1, 5, '#334155');
    pRect(ex + 1, ey - 5, 1, 5, '#1e293b');
    // Kar beyazı gövde & katlı kanat
    pRect(ex - 3, ey - 8, 7, 3, '#e2e8f0');
    pRect(ex - 2, ey - 9, 6, 3, '#ffffff');
    pRect(ex + 3, ey - 8, 2, 2, '#cbd5e1');
    // Zarif S-boynu, taç tüyü, sarı göz ve sivri gaga
    pRect(ex - 3, ey - 13 + neckDip, 2, 5, '#ffffff');
    pRect(ex - 4, ey - 15 + neckDip, 3, 3, '#ffffff');
    pRect(ex - 2 + plumeRuffle, ey - 16 + neckDip, 2, 1, '#e0f2fe');
    pRect(ex - 4, ey - 14 + neckDip, 1, 1, blinkE ? '#cbd5e1' : '#facc15');
    pRect(ex - 7, ey - 14 + neckDip, 3, 1, '#f59e0b');
    pRect(ex - 8, ey - 13 + neckDip, 2, 1, '#0f172a');
}

function drawArcticAlwaysPresentWildlife(time) {
    const ledges = getArcticLedges(pw, ph);

    // 1. Kutup Ayısı Yavrusu (Ledge 2 üzerindeki açık kar seyir alanında oturur — Noel temasından bağımsızdır)
    const cubX = Math.round(pw * 0.23);
    const cubY = ledges[2].yFn(cubX);
    const breath = Math.sin(time * 0.0026) > 0.4 ? -1 : 0;
    const pawWave = Math.sin(time * 0.0038) > 0.35 ? -2 : 0;
    const blinkCub = (time % 4800) > 4620;
    const earWiggle = (time % 6100) > 5880 ? -1 : 0;

    pRect(cubX - 6, cubY - 1, 12, 2, 'rgba(56, 189, 248, 0.25)');
    pRect(cubX - 5, cubY - 8 + breath, 10, 7, isLightMode ? '#f1f5f9' : '#e0f2fe');
    pRect(cubX - 4, cubY - 8 + breath, 8, 6, '#ffffff');
    pRect(cubX - 4, cubY - 2, 3, 2, '#bae6fd');
    pRect(cubX + 1, cubY - 2, 3, 2, '#bae6fd');
    // Yandan bakan tombul el sallayan pati
    pRect(cubX + 4, cubY - 6 + breath + pawWave, 3, 3, '#ffffff');
    pRect(cubX + 5, cubY - 5 + breath + pawWave, 1, 1, '#94a3b8');
    // Yuvarlak ayı yavrusu başı, kulaklar, gözler & burun
    pRect(cubX - 4, cubY - 15 + breath + earWiggle, 2, 2, '#bae6fd');
    pRect(cubX + 2, cubY - 15 + breath, 2, 2, '#bae6fd');
    pRect(cubX - 4, cubY - 13 + breath, 8, 6, '#ffffff');
    pRect(cubX - 2, cubY - 10 + breath, 5, 3, '#f0f9ff');
    pRect(cubX - 2, cubY - 11 + breath, 1, 1, blinkCub ? '#94a3b8' : '#0f172a');
    pRect(cubX + 2, cubY - 11 + breath, 1, 1, blinkCub ? '#94a3b8' : '#0f172a');
    pRect(cubX, cubY - 9 + breath, 2, 1, '#0f172a');
    // Soğuk havada nefes buharı
    const puff = ((time * 0.008) % 12);
    if (puff < 8) {
        const pAlpha = ((1 - puff / 8) * 0.55).toFixed(2);
        pRect(cubX + 2 + Math.round(puff * 0.4), Math.round(cubY - 10 - puff * 0.5), 2, 1, `rgba(224, 242, 254, ${pAlpha})`);
    }

    // 2. Kutup Tavşanı (Donmuş derenin solundaki vadi karında sabit)
    const hareX = Math.round(pw * 0.38);
    const hareY = getGroundY(hareX, 'arctic-tundra', pw, ph);
    const noseTwitch = Math.sin(time * 0.012) > 0.3 ? -1 : 0;
    const earTipFlick = (time % 5300) > 5080 ? -1 : 0;

    pRect(hareX - 4, hareY - 1, 8, 1, 'rgba(56, 189, 248, 0.28)');
    pRect(hareX - 4, hareY - 3, 2, 2, '#f8fafc');
    pRect(hareX - 3, hareY - 4, 6, 4, '#ffffff');
    pRect(hareX + 1, hareY - 6, 3, 3, '#ffffff');
    pRect(hareX + 1, hareY - 9, 1, 3, '#f1f5f9');
    pRect(hareX + 3, hareY - 9 + earTipFlick, 1, 3, '#f1f5f9');
    pRect(hareX + 1, hareY - 10, 1, 1, '#0f172a');
    pRect(hareX + 3, hareY - 10 + earTipFlick, 1, 1, '#0f172a');
    pRect(hareX + 3, hareY - 5, 1, 1, '#0f172a');
    pRect(hareX + 4, hareY - 5 + noseTwitch, 1, 1, '#fda4af');
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
// BÖLÜM SONU: BİYOMLARA ÖZGÜ YERİNDE YAŞAYAN DURGUN CANLILAR
// BÖLÜM BAŞI: AÇILIP KAPANABİLEN KUTUP NOEL TEMASI (NOEL BABA, ELFLER & ŞEKERLER)
// ============================================================================

export function drawArcticChristmasSky(time) {
    const travelW = pw + 220;
    const progress = (time * 0.015) % travelW;
    const sleighCenter = Math.round(progress - 95);
    const sleighY = Math.round(25 + Math.sin(time * 0.0018) * 3.5);
    if (sleighCenter < -80 || sleighCenter > pw + 80) return;

    // 1. Yıldız tozu parıltı izi
    for (let st = 0; st < 10; st++) {
        const sx = sleighCenter - 16 - st * 4;
        const sy = sleighY + Math.round(Math.sin(time * 0.008 + st * 1.1) * 2.5) + (st % 2);
        const alpha = Math.max(0.12, 0.85 - st * 0.08).toFixed(2);
        pRect(sx, sy, 1, 1, st % 2 === 0 ? `rgba(253, 224, 71, ${alpha})` : `rgba(186, 230, 253, ${alpha})`);
    }

    // 2. Kırmızı-altın Kızak & Noel Baba
    const slX = sleighCenter - 12;
    pRect(slX - 5, sleighY + 3, 15, 1, '#facc15');
    pRect(slX + 9, sleighY + 2, 2, 1, '#fef08a');
    pRect(slX - 3, sleighY, 2, 3, '#d97706');
    pRect(slX + 5, sleighY, 2, 3, '#d97706');
    pRect(slX - 5, sleighY - 3, 14, 4, '#dc2626');
    pRect(slX - 4, sleighY - 1, 12, 1, '#facc15');
    // Hediye çuvalı & renkli kutular
    pRect(slX - 4, sleighY - 6, 5, 3, '#16a34a');
    pRect(slX - 2, sleighY - 7, 3, 2, '#facc15');
    pRect(slX - 3, sleighY - 5, 2, 2, '#38bdf8');
    // Noel Baba
    pRect(slX + 2, sleighY - 6, 4, 3, '#dc2626');
    pRect(slX + 3, sleighY - 9, 3, 3, '#fed7aa');
    pRect(slX + 3, sleighY - 7, 4, 2, '#ffffff');
    pRect(slX + 2, sleighY - 10, 4, 2, '#dc2626');
    pRect(slX + 1, sleighY - 10, 1, 1, '#ffffff');
    if (Math.sin(time * 0.01) > 0) {
        pRect(slX + 6, sleighY - 6, 2, 1, '#dc2626');
    }

    // Kızak dizginleri
    pRect(slX + 9, sleighY - 3, 34, 1, 'rgba(253, 224, 71, 0.72)');

    // 3. 3 Ren Geyiği (En önde Kırmızı Burunlu Rudolph!)
    for (let r = 0; r < 3; r++) {
        const rx = sleighCenter + 8 + r * 11;
        const step = Math.round(Math.sin(time * 0.014 + r * 1.4) * 1.4);
        const ry = sleighY - 1 + Math.round(Math.sin(time * 0.008 + r) * 0.6);

        // Bacaklar
        pRect(rx - 2 + step, ry + 1, 1, 2, '#451a03');
        pRect(rx + 1 - step, ry + 1, 1, 2, '#451a03');
        // Gövde & boyun
        pRect(rx - 3, ry - 2, 6, 3, '#78350f');
        pRect(rx - 2, ry - 2, 4, 1, '#b45309');
        pRect(rx + 2, ry - 4, 2, 3, '#92400e');
        pRect(rx + 2, ry - 5, 3, 2, '#78350f');
        // Boynuzlar
        pRect(rx + 1, ry - 7, 1, 2, '#d97706');
        pRect(rx + 2, ry - 7, 1, 1, '#fbbf24');
        // En öndeki Rudolph parlayan kırmızı burun taşır
        if (r === 2) {
            pRect(rx + 4, ry - 5, 3, 3, 'rgba(239, 68, 68, 0.36)');
            pRect(rx + 5, ry - 4, 1, 1, '#ef4444');
        }
    }
}

function drawArcticCandyCane(x, baseY, height, curveDir) {
    for (let y = 0; y < height - 2; y++) {
        const col = y % 2 === 0 ? '#ffffff' : '#ef4444';
        pRect(x, baseY - y, 2, 1, col);
    }
    const topY = baseY - height + 2;
    pRect(x + curveDir, topY - 1, 2, 2, '#ffffff');
    pRect(x + curveDir * 2, topY - 2, 2, 2, '#ef4444');
    pRect(x + curveDir * 3, topY - 1, 2, 2, '#ffffff');
    pRect(x + curveDir * 3, topY + 1, 1, 1, '#ef4444');
}

function drawArcticGiftBox(x, baseY, w, h, boxCol, ribbonCol) {
    pRect(x - 1, baseY, w + 2, 1, 'rgba(7, 13, 25, 0.36)');
    pRect(x, baseY - h, w, h, boxCol);
    const midX = x + Math.floor(w * 0.5);
    const midY = baseY - Math.ceil(h * 0.5);
    pRect(midX, baseY - h, 1, h, ribbonCol);
    pRect(x, midY, w, 1, ribbonCol);
    pRect(midX - 1, baseY - h - 1, 3, 1, ribbonCol);
}

function drawArcticChristmasElf(x, baseY, hatCol, tunicCol, dir, phaseOff, time) {
    const hop = Math.sin(time * 0.0055 + phaseOff) > 0.72 ? -1 : 0;
    const blink = ((time + Math.round(phaseOff * 1000)) % 4400) > 4220;
    const wave = Math.sin(time * 0.007 + phaseOff) > 0.15 ? -1 : 0;
    const by = baseY + hop;

    pRect(x - 3, baseY, 6, 1, 'rgba(7, 13, 25, 0.35)');
    // Çizmeler
    pRect(x - 2, by - 2, 2, 2, '#1e293b');
    pRect(x + 1, by - 2, 2, 2, '#1e293b');
    // Elbise & altın kemer
    pRect(x - 2, by - 6, 5, 4, tunicCol);
    pRect(x - 2, by - 4, 5, 1, '#0f172a');
    pRect(x, by - 4, 1, 1, '#facc15');
    // Sallanan kol / minik fener
    pRect(x + dir * 3, by - 5 + wave, 1, 2, tunicCol);
    if (dir < 0) {
        pRect(x - 4, by - 4 + wave, 1, 2, '#fef08a');
    } else {
        pRect(x + 4, by - 5 + wave, 1, 1, '#fde047');
    }
    // Güleryüz & göz kırpma
    pRect(x - 2, by - 9, 5, 3, '#fed7aa');
    pRect(x - 1, by - 8, 1, 1, blink ? '#d97706' : '#0f172a');
    pRect(x + 1, by - 8, 1, 1, blink ? '#d97706' : '#0f172a');
    // Sivri yılbaşı şapkası
    pRect(x - 2, by - 10, 5, 1, '#ffffff');
    pRect(x - 1, by - 12, 3, 2, hatCol);
    pRect(x, by - 13, 1, 1, hatCol);
    pRect(x - dir, by - 14, 1, 1, '#ffffff');
}

export function drawArcticChristmasGround(time) {
    const ledges = getArcticLedges(pw, ph);
    const cabX = Math.round(pw * 0.73);
    const cabY = ledges[5].yFn(cabX) + 1;
    const pineX = Math.round(pw * 0.66);
    const pineY = ledges[5].yFn(pineX) + 1;

    // 1. Kulübe Çam Ağacı Süsleri, Parlayan Yıldız & Kulübe Çelenk/Işıkları
    const starGlow = Math.sin(time * 0.005) > 0 ? '#ffffff' : '#fde047';
    pRect(pineX - 2, pineY - 37, 5, 3, 'rgba(253, 224, 71, 0.35)');
    pRect(pineX - 1, pineY - 36, 3, 1, '#fde047');
    pRect(pineX, pineY - 37, 1, 3, starGlow);

    const treeOrnaments = [
        { dx: -2, dy: -28, phase: 0 },
        { dx: 3, dy: -25, phase: 1 },
        { dx: -5, dy: -20, phase: 2 },
        { dx: 1, dy: -18, phase: 3 },
        { dx: 6, dy: -16, phase: 4 },
        { dx: -4, dy: -12, phase: 5 },
        { dx: 3, dy: -11, phase: 6 }
    ];
    const bulbPalette = ['#ef4444', '#fde047', '#38bdf8', '#22c55e'];
    treeOrnaments.forEach((o) => {
        const idx = (o.phase + Math.floor(time * 0.0025)) % bulbPalette.length;
        pRect(pineX + o.dx, pineY + o.dy, 1, 1, bulbPalette[idx]);
    });

    // Kulübe kapı çelengi & saçak yılbaşı ışıkları
    pRect(cabX - 8, cabY - 9, 4, 4, '#15803d');
    pRect(cabX - 7, cabY - 8, 2, 2, '#271105');
    pRect(cabX - 7, cabY - 9, 2, 1, '#ef4444');
    for (let lx = -14; lx <= 12; lx += 4) {
        const idx = (Math.abs(lx) + Math.floor(time * 0.0032)) % bulbPalette.length;
        pRect(cabX + lx, cabY - 14, 1, 1, bulbPalette[idx]);
    }

    // 2. Baston Şeker Kamışları (Peppermint Candy Canes)
    drawArcticCandyCane(Math.round(pw * 0.21), ledges[1].yFn(Math.round(pw * 0.21)), 11, 1);
    drawArcticCandyCane(Math.round(pw * 0.80), ledges[4].yFn(Math.round(pw * 0.80)), 11, -1);
    drawArcticCandyCane(cabX + 15, ledges[5].yFn(cabX + 15), 10, 1);
    const valleyCaneX = Math.round(pw * 0.62);
    drawArcticCandyCane(valleyCaneX, getGroundY(valleyCaneX, 'arctic-tundra', pw, ph), 12, -1);

    // 3. Sarılı Yılbaşı Hediye Kutuları
    drawArcticGiftBox(pineX - 7, ledges[5].yFn(pineX - 7) + 1, 5, 4, '#ef4444', '#fde047');
    drawArcticGiftBox(pineX + 3, ledges[5].yFn(pineX + 3) + 1, 4, 4, '#2563eb', '#f8fafc');
    drawArcticGiftBox(cabX + 10, ledges[5].yFn(cabX + 10) + 1, 5, 5, '#16a34a', '#ef4444');
    const valleyGiftX = Math.round(pw * 0.64);
    const valleyGiftY = getGroundY(valleyGiftX, 'arctic-tundra', pw, ph) + 1;
    drawArcticGiftBox(valleyGiftX, valleyGiftY, 5, 5, '#a855f7', '#fde047');
    drawArcticGiftBox(valleyGiftX + 6, valleyGiftY, 4, 3, '#ef4444', '#ffffff');

    // 4. İki Neşeli Minik Noel Elfi (Yerlerinde zıplayıp el sallayarak fener tutar)
    const elf1X = Math.round(pw * 0.78);
    drawArcticChristmasElf(elf1X, ledges[5].yFn(elf1X) + 1, '#dc2626', '#16a34a', -1, 0.2, time);
    const elf2X = Math.round(pw * 0.59);
    drawArcticChristmasElf(elf2X, getGroundY(elf2X, 'arctic-tundra', pw, ph) + 1, '#16a34a', '#dc2626', 1, 1.9, time);
}

// ============================================================================
// BÖLÜM SONU: AÇILIP KAPANABİLEN KUTUP NOEL TEMASI
// ============================================================================
