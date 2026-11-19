import { rm, mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distWallpaper = resolve(root, 'dist-wallpaper');

// 1. Topological dependency resolution starting from js/main.js
const visited = new Set();
const orderedModules = [];

async function visitModule(filePath) {
  const absPath = resolve(filePath);
  if (visited.has(absPath)) return;
  visited.add(absPath);

  const source = await readFile(absPath, 'utf8');
  for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g)) {
    const depPath = resolve(dirname(absPath), match[1]);
    await visitModule(depPath);
  }
  orderedModules.push({
    absPath,
    relPath: relative(root, absPath).split('\\').join('/'),
    source,
  });
}

await visitModule(resolve(root, 'js/main.js'));

const wallpaperLauncherSource = await readFile(resolve(root, 'wallpaper/wallpaper-launcher.js'), 'utf8');
orderedModules.push({
  absPath: resolve(root, 'wallpaper/wallpaper-launcher.js'),
  relPath: 'wallpaper/wallpaper-launcher.js',
  source: wallpaperLauncherSource,
});

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Wallpaper transform failed to match pattern: ${label}`);
  }
  return source.replace(search, replacement);
}

function transformForWallpaper(code, relPath) {
  let transformed = code;

  if (relPath === 'js/02-news.js') {
    transformed = replaceRequired(transformed, "const NEWS_API_ENDPOINT = '/api/news';", "const NEWS_API_ENDPOINT = 'http://127.0.0.1:47831/api/news';", '02-news endpoint');
    transformed = replaceRequired(transformed, "const CUSTOM_NEWS_API_ENDPOINT = '/api/custom-news';", "const CUSTOM_NEWS_API_ENDPOINT = 'http://127.0.0.1:47831/api/custom-news';", '02-news custom endpoint');
    transformed = replaceRequired(
      transformed,
      'async function loadNewsCategory(categoryId, { force = false } = {}) {',
      'async function loadNewsCategory(categoryId, { force = false } = {}) {\n  if (window.__weLang === \'en\' && typeof window.__weLoadEnglishNewsCategory === \'function\') {\n    return window.__weLoadEnglishNewsCategory(categoryId, { force });\n  }',
      '02-news loadNewsCategory',
    );
  }

  if (relPath === 'js/03-weather.js') {
    transformed = replaceRequired(
      transformed,
      '&count=1&language=tr&format=json',
      "&count=1&language=${window.__weLang === 'en' ? 'en' : 'tr'}&format=json",
      '03-weather geo lang',
    );
    transformed = replaceRequired(
      transformed,
      '                box.appendChild(b);\n            });\n        }',
      '                box.appendChild(b);\n            });\n            if (typeof window.__weTranslateWeatherPreviews === \'function\') window.__weTranslateWeatherPreviews();\n        }',
      '03-weather previews hook',
    );
    transformed = replaceRequired(
      transformed,
      '            }).join(\'\');\n        }\n\n        // ============================================================================\n        // BÖLÜM SONU: HAVA PANELİ GÖRÜNÜMÜ',
      '            }).join(\'\');\n            if (typeof window.__weTranslateWeatherPanel === \'function\') window.__weTranslateWeatherPanel(WX.data);\n        }\n\n        // ============================================================================\n        // BÖLÜM SONU: HAVA PANELİ GÖRÜNÜMÜ',
      '03-weather panel hook',
    );
  }

  // Keep logical world grid (pw, ph) at PIXEL_SCALE = 3 so creatures never shrink or slow down,
  // while scaling hardware canvas resolution & sub-pixel detail by window.__weDetailTier (1x, 2x HD, 3x Ultra).
  // Also size ph to the visible desktop above the Windows Taskbar with zero stretched bottom artifacts!
  if (relPath === 'js/07-habitat-state.js') {
    transformed = replaceRequired(
      transformed,
      'export const MAX_FRAME_DELTA_MS = 50;',
      'export const MAX_FRAME_DELTA_MS = 140;',
      '07-habitat-state maxFrameDelta',
    );
    transformed = replaceRequired(
      transformed,
      `        function resizePixelCanvas() {\n            const previousWidth = pw;\n            const previousHeight = ph;\n            const nextWidth = Math.max(1, Math.ceil(window.innerWidth / PIXEL_SCALE));\n            const nextHeight = Math.max(1, Math.ceil(window.innerHeight / PIXEL_SCALE));\n            if (nextWidth === previousWidth && nextHeight === previousHeight) return;\n\n            pw = nextWidth;\n            ph = nextHeight;\n            canvas.width = pw;\n            canvas.height = ph;\n            lastFillStyle = '';\n            ctx.imageSmoothingEnabled = false;\n            invalidateBackgroundCache();\n\n            if (previousWidth > 0 && previousHeight > 0 && creatures.length + stimuli.length + ambientParticles.length + flora.length + shootingStars.length > 0) {\n                scaleSceneCollections(\n                    [creatures, stimuli, ambientParticles, flora, shootingStars],\n                    pw / previousWidth,\n                    ph / previousHeight,\n                );\n            }\n        }`,
      `        let cachedDetailTier = [1, 2, 3].includes(Number(window.__weDetailTier)) ? Number(window.__weDetailTier) : 1;\n\n        function resizePixelCanvas(forceRebuild = false) {\n            const previousWidth = pw;\n            const previousHeight = ph;\n            const taskbarPx = Math.max(0, Math.min(140, Number(window.__weTaskbarHeightPx ?? 48)));\n            const visibleWinH = Math.max(240, window.innerHeight - taskbarPx);\n            const rScale = [1, 2, 3].includes(Number(window.__weDetailTier)) ? Number(window.__weDetailTier) : 1;\n            cachedDetailTier = rScale;\n            const nextWidth = Math.max(1, Math.ceil(window.innerWidth / PIXEL_SCALE));\n            const nextHeight = Math.max(80, Math.ceil(visibleWinH / PIXEL_SCALE));\n            const targetCanvasW = nextWidth * rScale;\n            const targetCanvasH = nextHeight * rScale;\n            if (!forceRebuild && nextWidth === previousWidth && nextHeight === previousHeight && canvas.width === targetCanvasW && canvas.height === targetCanvasH) return;\n\n            pw = nextWidth;\n            ph = nextHeight;\n            canvas.width = targetCanvasW;\n            canvas.height = targetCanvasH;\n            lastFillStyle = '';\n            ctx.setTransform(rScale, 0, 0, rScale, 0, 0);\n            ctx.imageSmoothingEnabled = false;\n            invalidateBackgroundCache();\n\n            if (previousWidth > 0 && previousHeight > 0) {\n                if (creatures.length + stimuli.length + ambientParticles.length + shootingStars.length > 0) {\n                    scaleSceneCollections(\n                        [creatures, stimuli, ambientParticles, shootingStars],\n                        pw / previousWidth,\n                        ph / previousHeight,\n                    );\n                }\n                if (typeof populateHabitatFlora === 'function' && HABITATS[currentHabitatIdx]) {\n                    flora.length = 0;\n                    populateHabitatFlora(HABITATS[currentHabitatIdx]);\n                }\n            }\n        }`,
      '07-habitat-state resizePixelCanvas',
    );
    transformed = replaceRequired(
      transformed,
      `        export function pRect(x, y, w, h, color) {\n            if (color !== lastFillStyle) {\n                ctx.fillStyle = color;\n                lastFillStyle = color;\n            }\n            ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));\n        }`,
      `        export function pRect(x, y, w, h, color) {\n            if (cachedDetailTier <= 1) {\n                if (color !== lastFillStyle) {\n                    ctx.fillStyle = color;\n                    lastFillStyle = color;\n                }\n                ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));\n                return;\n            }\n            const tier = cachedDetailTier;\n            const rx = Math.round(x * tier) / tier;\n            const ry = Math.round(y * tier) / tier;\n            const rw = Math.max(1 / tier, Math.round(w * tier) / tier);\n            const rh = Math.max(1 / tier, Math.round(h * tier) / tier);\n            if (color !== lastFillStyle) {\n                ctx.fillStyle = color;\n                lastFillStyle = color;\n            }\n            ctx.fillRect(rx, ry, rw, rh);\n            if (rw >= 5 && rh >= 3 && typeof color === 'string' && color.charCodeAt(0) === 35) {\n                const step = 1 / tier;\n                ctx.fillStyle = tier === 3 ? 'rgba(255, 255, 255, 0.11)' : 'rgba(255, 255, 255, 0.07)';\n                ctx.fillRect(rx, ry, rw, step);\n                const shCol = 'rgba(0, 0, 0, 0.12)';\n                ctx.fillStyle = shCol;\n                ctx.fillRect(rx, ry + rh - step, rw, step);\n                lastFillStyle = shCol;\n            }\n        }`,
      '07-habitat-state pRect',
    );
  }

  // Upgrade static background layer to match the active Detail Tier (1x, 2x HD, 3x Ultra) with micro-bevel shading
  if (relPath === 'js/habitat-backgrounds.js') {
    transformed = replaceRequired(
      transformed,
      `const off = document.createElement('canvas');\n    off.width = pw;\n    off.height = ph;\n    const sCtx = off.getContext('2d');\n    const sRect = (x, y, w, h, col) => {\n        sCtx.fillStyle = col;\n        sCtx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));\n    };`,
      `const tier = [1, 2, 3].includes(Number(window.__weDetailTier)) ? Number(window.__weDetailTier) : 1;\n    const off = document.createElement('canvas');\n    off.width = pw * tier;\n    off.height = ph * tier;\n    const sCtx = off.getContext('2d');\n    sCtx.setTransform(tier, 0, 0, tier, 0, 0);\n    const sRect = (x, y, w, h, col) => {\n        sCtx.fillStyle = col;\n        if (tier <= 1) {\n            sCtx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));\n            return;\n        }\n        const rx = Math.round(x * tier) / tier;\n        const ry = Math.round(y * tier) / tier;\n        const rw = Math.max(1 / tier, Math.round(w * tier) / tier);\n        const rh = Math.max(1 / tier, Math.round(h * tier) / tier);\n        sCtx.fillRect(rx, ry, rw, rh);\n        if (rw >= 4 && rh >= 2 && typeof col === 'string' && col.charCodeAt(0) === 35) {\n            const step = 1 / tier;\n            sCtx.fillStyle = 'rgba(255, 255, 255, 0.06)';\n            sCtx.fillRect(rx, ry, rw, step);\n        }\n    };`,
      'habitat-backgrounds sRect',
    );
  }

  // Enrich creature count and ambient bioluminescent particles when Yüksek HD (2x) or Ultra (3x) is active
  if (relPath === 'js/habitat-initializer.js') {
    transformed = replaceRequired(
      transformed,
      'for (let i = 0; i < 40; i++) {',
      'const detailTier = [1, 2, 3].includes(Number(window.__weDetailTier)) ? Number(window.__weDetailTier) : 1;\n    const particleTarget = detailTier === 3 ? 85 : detailTier === 2 ? 60 : 38;\n    for (let i = 0; i < particleTarget; i++) {',
      'habitat-initializer particles',
    );
    transformed = replaceRequired(
      transformed,
      'for (let i = 0; i < creatureProfile.count; i++) creatures.push(creatureProfile.create());',
      'const bonusCreatures = detailTier === 3 ? 3 : detailTier === 2 ? 1 : 0;\n        for (let i = 0; i < creatureProfile.count + bonusCreatures; i++) creatures.push(creatureProfile.create());',
      'habitat-initializer creatures',
    );
  }

  // Hook Focus Audio UI translation for Wallpaper Engine bilingual panel
  if (relPath === 'js/04-focus-audio.js') {
    transformed = replaceRequired(
      transformed,
      '  updateFocusStageVisibility();\n}',
      '  updateFocusStageVisibility();\n  if (typeof window.__weTranslateFocusUI === \'function\') window.__weTranslateFocusUI(focusSession, focusTotalSec);\n}',
      '04-focus-audio translateFocusUI',
    );
  }

  if (relPath === 'js/05-workspace.js') {
    transformed = replaceRequired(
      transformed,
      'remainingTasksLabel.textContent = `${activeCount} aktif satır`;',
      'remainingTasksLabel.textContent = window.__weLang === \'en\' ? `${activeCount} active` : `${activeCount} aktif satır`;',
      '05-workspace remainingTasks',
    );
  }

  // Draw scaled staticEnvCache cleanly onto logical (0, 0, pw, ph) with zero bottom-stretch artifacts
  if (relPath === 'js/09-scenery.js') {
    transformed = replaceRequired(transformed, 'ctx.drawImage(sceneCache.bgCache.img, 0, 0);', 'ctx.drawImage(sceneCache.bgCache.img, 0, 0, pw, ph);', '09-scenery bgCache');
    transformed = replaceRequired(transformed, 'ctx.drawImage(sceneCache.staticEnvCache.img, 0, 0);', 'ctx.drawImage(sceneCache.staticEnvCache.img, 0, 0, pw, ph);', '09-scenery staticEnvCache');
  }

  // Align 1:1 optical liquid glass sampling with #habitatCanvas clientHeight & rScale in Wallpaper Engine
  if (relPath === 'js/10-glass-renderer.js') {
    transformed = replaceRequired(
      transformed,
      `const winW = window.innerWidth;\n            const winH = window.innerHeight;`,
      `const winW = canvas.clientWidth || window.innerWidth;\n            const winH = canvas.clientHeight || window.innerHeight;\n            const rScale = [1, 2, 3].includes(Number(window.__weDetailTier)) ? Number(window.__weDetailTier) : 1;`,
      '10-glass-renderer dimensions',
    );
    transformed = replaceRequired(
      transformed,
      'lctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, lw, lh);',
      'lctx.drawImage(canvas, sx * rScale, sy * rScale, sw * rScale, sh * rScale, 0, 0, lw, lh);',
      '10-glass-renderer drawImage scale',
    );
  }

  return transformed
    .replace(/^\s*import\s+[\s\S]*?from\s*['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*import\s*['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*export\s+\{[^}]*\}\s*(?:from\s*['"][^'"]+['"])?;?\s*$/gm, '')
    .replace(/^(\s*)export\s+(const|let|var|function|class|async\s+function)\b/gm, '$1$2');
}

let bundleCode = `/* Living Pixel Diorama — Wallpaper Engine Classic Bundle (file:// CORS-safe) */\n(function () {\n"use strict";\nwindow.__weTaskbarHeightPx = 48;\nwindow.__weDetailTier = 1;\nwindow.__weSceneFps = 30;\nwindow.__weGlassFps = 20;\nwindow.__weGlassQualityScale = 0.75;\nwindow.__weCreatureSpeed = 1.0;\nwindow.__weArcticChristmas = true;\nwindow.__wePaused = false;\n\n`;
for (const mod of orderedModules) {
  if (
    mod.relPath === 'js/main.js' ||
    mod.relPath === 'js/12-web-studio.js' ||
    mod.relPath === 'js/calendar-observances.js'
  ) {
    continue;
  }
  bundleCode += `// ============================================================================\n`;
  bundleCode += `// MODULE: ${mod.relPath}\n`;
  bundleCode += `// ============================================================================\n`;
  bundleCode += transformForWallpaper(mod.source, mod.relPath) + '\n\n';
}
bundleCode += `})();\n`;

// Verify syntax & lexical integrity of the generated bundle
new vm.Script(bundleCode, { filename: 'wallpaper.bundle.js' });

// 2. Prepare dist-wallpaper/ directory
await rm(distWallpaper, { recursive: true, force: true });
await mkdir(resolve(distWallpaper, 'js'), { recursive: true });
for (const dir of ['css', 'fonts', 'icons', 'licenses']) {
  await cp(resolve(root, dir), resolve(distWallpaper, dir), { recursive: true });
}
await rm(resolve(distWallpaper, 'css/web-studio.css'), { force: true });
await cp(resolve(root, 'wallpaper/wallpaper.css'), resolve(distWallpaper, 'css/wallpaper.css'));
await cp(resolve(root, 'LICENSE'), resolve(distWallpaper, 'LICENSE'));
await cp(resolve(root, 'THIRD_PARTY_NOTICES.md'), resolve(distWallpaper, 'THIRD_PARTY_NOTICES.md'));
await writeFile(resolve(distWallpaper, 'js/wallpaper.bundle.js'), bundleCode, 'utf8');

// 3. Transform index.html for Wallpaper Engine (classic defer bundle + wallpaper.css + CEF popup safety)
const rawHtml = await readFile(resolve(root, 'index.html'), 'utf8');
const wallpaperHtml = rawHtml
  .replace('<!-- BUILD:MODULE_PRELOADS -->', '')
  .replace('<link rel="manifest" href="./manifest.webmanifest">', '')
  .replace('id="calendarEventTime" type="time"', 'id="calendarEventTime" type="text" placeholder="14:30" maxlength="5"')
  .replace('id="importDataFile" type="file"', 'id="importDataFile" type="hidden"')
  .replace(/\s*<link rel="stylesheet" href="\.\/css\/web-studio\.css">/, '')
  .replace(
    '<link rel="stylesheet" href="./css/widgets.css">',
    '<link rel="stylesheet" href="./css/widgets.css">\n    <link rel="stylesheet" href="./css/wallpaper.css">',
  )
  .replace(
    '<script type="module" src="./js/main.js"></script>',
    '<script defer src="./js/wallpaper.bundle.js"></script>',
  );
await writeFile(resolve(distWallpaper, 'index.html'), wallpaperHtml, 'utf8');

// 4. Generate Wallpaper Engine project.json with full Turkish UI controls
const projectJson = {
  title: 'Living Pixel Diorama — Yaşayan Piksel Habitatı & Masaüstü Başlatıcı',
  description: '8 yaşayan piksel-art habitatı, tıklamayla hayvan besleme, canlı hava durumu efektleri, odak sayacı/doğa ambiyansı, takvim, defter ve Optical Liquid Glass Linux tarzı yerel uygulama/dosya başlatıcısı.',
  file: 'index.html',
  type: 'web',
  preview: 'icons/diorama-512.png',
  tags: ['Pixel Art', 'Nature', 'Animal', 'Interactive', 'Customizable'],
  general: {
    supportsaudioprocessing: false,
    properties: {
      schemecolor: {
        order: 0,
        text: 'Vurgu Rengi',
        type: 'color',
        value: '0.02 0.03 0.05',
      },
      we_header_scene: {
        order: 1,
        text: '<h4>🌿 HABİTAT VE SAHNE AYARLARI</h4>',
        type: 'text',
        value: '',
      },
      we_habitat: {
        order: 2,
        text: 'Aktif Habitat Sahnesi',
        type: 'combo',
        value: 'random',
        options: [
          { label: '🎲 Rastgele (Her Açılışta Farklı)', value: 'random' },
          { label: '🐝 Çayır & Bal Arıları', value: 'bees' },
          { label: '🐟 Halfmoon Betta Akvaryumu', value: 'betta' },
          { label: '🌿 Sazlık & İmparator Yusufçuk', value: 'dragonfly' },
          { label: '🦋 Botanik Bahçesi & Kelebekler', value: 'butterfly' },
          { label: '🪼 Mercan Lagünü & Denizanaları', value: 'jellyfish' },
          { label: '🎏 Kyoto Zen Bahçesi & Koi Göleti', value: 'koi' },
          { label: '🦜 Yağmur Ormanı & Renkli Papağanlar', value: 'rainforest' },
          { label: '🦊 Kuzey Işıkları & Kutup Tilkisi', value: 'arctic-aurora' },
        ],
      },
      we_perf_profile: {
        order: 2.5,
        text: 'Performans & Fan Profili / Performance Profile',
        type: 'combo',
        value: 'balanced',
        options: [
          { label: 'Sessiz (Laptop Pil / Düşük Yük)', value: 'eco' },
          { label: 'Dengeli (Önerilen Varsayılan)', value: 'balanced' },
          { label: 'Yüksek HD (Masaüstü / Akıcı 60 FPS)', value: 'high' },
        ],
      },
      we_autocycle_mins: {
        order: 3,
        text: 'Otomatik Habitat Değiştirme Süresi',
        type: 'combo',
        value: '0',
        options: [
          { label: 'Kapalı (Sabit Kalsın)', value: '0' },
          { label: 'Her 1 Dakikada Bir', value: '1' },
          { label: 'Her 5 Dakikada Bir', value: '5' },
          { label: 'Her 15 Dakikada Bir', value: '15' },
          { label: 'Her 30 Dakikada Bir', value: '30' },
          { label: 'Her 1 Saatte Bir', value: '60' },
        ],
      },
      we_theme_mode: {
        order: 4,
        text: 'Gündüz / Gece Teması',
        type: 'combo',
        value: 'dark',
        options: [
          { label: '🌙 Gece Modu (Karanlık)', value: 'dark' },
          { label: '☀️ Gündüz Modu (Aydınlık)', value: 'light' },
          { label: '🌅 Güneşe Göre Otomatik (Şehir Saati)', value: 'auto' },
        ],
      },
      we_weather_fx: {
        order: 5,
        text: 'Sahnede Canlı Hava Efektleri (Yağmur/Kar/Bulut/Ay)',
        type: 'bool',
        value: true,
      },
      we_taskbar_height: {
        order: 6,
        text: 'Görev Çubuğu Alt Boşluğu (px — Tilki ve Zemin Yüksekliği)',
        type: 'slider',
        min: 0,
        max: 120,
        value: 48,
      },
      we_pixel_font: {
        order: 7,
        text: 'Pixel Art Yazı Tipi / Pixel Font',
        type: 'combo',
        value: 'departure',
        options: [
          { label: 'Departure Mono (Keskin & Ultra Okunaklı)', value: 'departure' },
          { label: 'Jersey 20 (Yüksek Çözünürlüklü 20px Piksel)', value: 'jersey20' },
          { label: 'Jersey 15 (Sıcak 15px Retro Oyun Pikseli)', value: 'jersey15' },
          { label: 'Pixelify Sans (Orijinal)', value: 'pixelify' },
        ],
      },
      we_language: {
        order: 8,
        text: 'Dil / Language',
        type: 'combo',
        value: 'tr',
        options: [
          { label: 'Türkçe', value: 'tr' },
          { label: 'English', value: 'en' },
        ],
      },
      we_arctic_christmas: {
        order: 9,
        text: 'Kutup Noel Teması (Baston Şeker, Elfler, Hediyeler & Noel Baba)',
        type: 'bool',
        value: true,
      },
      we_header_widgets: {
        order: 10,
        text: '<h4>🧩 WIDGET GÖRÜNÜRLÜK KONTROLLERİ</h4>',
        type: 'text',
        value: '',
      },
      we_topbar_mode: {
        order: 11,
        text: 'Üst Araç Çubuğu Davranışı',
        type: 'combo',
        value: 'always',
        options: [
          { label: 'Her Zaman Görünür', value: 'always' },
          { label: 'Fareyi Ekranın Üstüne Götürünce Göster (Otomatik Gizle)', value: 'autohide' },
          { label: 'Tamamen Gizle', value: 'hidden' },
        ],
      },
      we_show_clock: {
        order: 12,
        text: 'Orta: Piksel Saat ve Tarih',
        type: 'bool',
        value: true,
      },
      we_clock_seconds: {
        order: 13,
        text: 'Saatte Saniyeyi Göster (SS:DD:sn)',
        type: 'bool',
        value: false,
      },
      we_show_greeting: {
        order: 14,
        text: 'Orta: Selamlama ve Kullanıcı Adı',
        type: 'bool',
        value: true,
      },
      we_show_search: {
        order: 15,
        text: 'Orta: Linux Hibrit Arama Çubuğu (PC Uygulama/Dosya & Web)',
        type: 'bool',
        value: true,
      },
      we_show_dock: {
        order: 16,
        text: 'Orta: Sık Kullanılan Uygulamalar Glass Dock',
        type: 'bool',
        value: true,
      },
      we_show_headline: {
        order: 17,
        text: 'Orta Alt: Canlı Gündem / Haber Bandı',
        type: 'bool',
        value: true,
      },
      we_show_music: {
        order: 18,
        text: 'Alt Sol: Minecraft Piksel Plak Müzik Çalar',
        type: 'bool',
        value: true,
      },
      we_show_system: {
        order: 18.5,
        text: 'Alt Sağ: Piksel Sistem & Diorama Performans Monitörü',
        type: 'bool',
        value: true,
      },
      we_show_habitat_pill: {
        order: 19,
        text: 'Üst Sol: Habitat Seçici, Tema ve Zen Butonları',
        type: 'bool',
        value: true,
      },
      we_show_news_btn: {
        order: 19,
        text: 'Üst Sağ: Gündem / Haber Merkezi Widget',
        type: 'bool',
        value: true,
      },
      we_show_weather_btn: {
        order: 20,
        text: 'Üst Sağ: Canlı Hava Durumu Widget',
        type: 'bool',
        value: true,
      },
      we_show_air_btn: {
        order: 21,
        text: 'Üst Sağ: Xiaomi Air Purifier 4 (Oda İklimi & PM2.5) Widget',
        type: 'bool',
        value: true,
      },
      we_show_focus_btn: {
        order: 22,
        text: 'Üst Sağ: Odak Sayacı (Pomodoro) & Ambiyans Widget',
        type: 'bool',
        value: true,
      },
      we_show_calendar_btn: {
        order: 23,
        text: 'Üst Sağ: Takvim ve Etkinlikler Widget',
        type: 'bool',
        value: true,
      },
      we_show_notes_btn: {
        order: 24,
        text: 'Üst Sağ: Kişisel Defter (Görevler & Notlar) Widget',
        type: 'bool',
        value: true,
      },
      we_show_data_btn: {
        order: 25,
        text: 'Üst Sağ: Veri Yönetimi ve Yedekleme Butonu',
        type: 'bool',
        value: false,
      },
      we_header_personal: {
        order: 30,
        text: '<h4>⚙️ KONUM, KİŞİSELLEŞTİRME VE SES</h4>',
        type: 'text',
        value: '',
      },
      we_center_offset_y: {
        order: 31,
        text: 'Orta Widget Grubu Dikey Konumu (%)',
        type: 'slider',
        min: -35,
        max: 35,
        value: 0,
      },
      we_username: {
        order: 32,
        text: 'Kullanıcı Adı (Selamlama Metni)',
        type: 'textinput',
        value: 'Gezgin',
      },
      we_city: {
        order: 33,
        text: 'Hava Durumu Şehri / Weather City (İstanbul, London, Tokyo...)',
        type: 'textinput',
        value: 'İstanbul',
      },
      we_ambient_sound: {
        order: 34,
        text: 'Arka Plan Doğa Ambiyansı Sesi',
        type: 'combo',
        value: 'off',
        options: [
          { label: '🔇 Sessiz', value: 'off' },
          { label: '🌿 Biyoma Göre Otomatik Eşleştir', value: 'biome_auto' },
          { label: '🌧️ Yağmur & Gök Gürültüsü', value: 'rain' },
          { label: '🔥 Kamp Ateşi Çıtırtısı', value: 'fire' },
          { label: '🌲 Yağmur Ormanı & Kuşlar', value: 'forest' },
          { label: '🌊 Derin Su & Akvaryum', value: 'water' },
          { label: '🍃 Kuzey Rüzgarı', value: 'wind' },
          { label: '🦗 Yaz Gecesi & Cırcır Böcekleri', value: 'night' },
          { label: '🎏 Zen Bahçesi & Bambu Su', value: 'zen' },
          { label: '☕ Gece Kütüphanesi & Lo-Fi Plak', value: 'vinyl' },
        ],
      },
      we_biome_creature_sounds: {
        order: 35,
        text: 'Biyomdaki Hayvanların Sesi Arada Çıksın',
        type: 'bool',
        value: true,
      },
      we_ambient_volume: {
        order: 36,
        text: 'Doğa Ambiyansı Ses Seviyesi (%)',
        type: 'slider',
        min: 5,
        max: 100,
        value: 40,
      },
    },
  },
};

await writeFile(resolve(distWallpaper, 'project.json'), JSON.stringify(projectJson, null, 2), 'utf8');

// 5. Generate 100% portable helper .bat scripts (zero hardcoded user paths, CRLF, pure ASCII)
const toCrLf = (text) => text.replace(/\r?\n/g, '\r\n');

const startBatContent = toCrLf(`@echo off
setlocal EnableExtensions
title Living Pixel Diorama - Yerel Masaustu Koprusu (127.0.0.1:47831)
echo ===============================================================================
echo   LIVING PIXEL DIORAMA - YEREL MASAUSTU KOPRUSU (127.0.0.1:47831)
echo ===============================================================================
echo.

set "BRIDGE_SCRIPT="
if exist "%~dp0scripts\\desktop-bridge.mjs" set "BRIDGE_SCRIPT=%~dp0scripts\\desktop-bridge.mjs"
if not defined BRIDGE_SCRIPT if exist "%~dp0..\\scripts\\desktop-bridge.mjs" set "BRIDGE_SCRIPT=%~dp0..\\scripts\\desktop-bridge.mjs"

if not defined BRIDGE_SCRIPT (
    echo [HATA] scripts\\desktop-bridge.mjs bulunamadi. Lutfen proje klasorunu eksiksiz kopyalayin.
    pause
    exit /b 1
)

set "NODE_EXE="
for /f "delims=" %%I in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%I"
if not defined NODE_EXE if exist "%ProgramFiles%\\nodejs\\node.exe" set "NODE_EXE=%ProgramFiles%\\nodejs\\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles(x86)%\\nodejs\\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\\nodejs\\node.exe"
if not defined NODE_EXE if exist "%LOCALAPPDATA%\\Programs\\nodejs\\node.exe" set "NODE_EXE=%LOCALAPPDATA%\\Programs\\nodejs\\node.exe"

if not defined NODE_EXE (
    echo [HATA] Node.js bulunamadi.
    echo Lutfen https://nodejs.org adresinden LTS surumunu kurup tekrar deneyin.
    pause
    exit /b 1
)

echo [OK] Node.js bulundu: "%NODE_EXE%"
echo [OK] Masaustu koprusu baslatiliyor...
"%NODE_EXE%" "%BRIDGE_SCRIPT%"
`);

const installStartupBatContent = toCrLf(`@echo off
setlocal EnableExtensions
title Living Pixel Diorama - Windows Baslangicina Ekle
set "STARTUP_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
set "VBS_FILE=%STARTUP_DIR%\\DioramaDesktopBridge.vbs"

set "BRIDGE_SCRIPT="
if exist "%~dp0scripts\\desktop-bridge.mjs" set "BRIDGE_SCRIPT=%~dp0scripts\\desktop-bridge.mjs"
if not defined BRIDGE_SCRIPT if exist "%~dp0..\\scripts\\desktop-bridge.mjs" set "BRIDGE_SCRIPT=%~dp0..\\scripts\\desktop-bridge.mjs"

if not defined BRIDGE_SCRIPT (
    echo [HATA] scripts\\desktop-bridge.mjs bulunamadi. Lutfen proje klasorunu eksiksiz kopyalayin.
    pause
    exit /b 1
)

set "NODE_EXE="
for /f "delims=" %%I in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%I"
if not defined NODE_EXE if exist "%ProgramFiles%\\nodejs\\node.exe" set "NODE_EXE=%ProgramFiles%\\nodejs\\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles(x86)%\\nodejs\\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\\nodejs\\node.exe"
if not defined NODE_EXE if exist "%LOCALAPPDATA%\\Programs\\nodejs\\node.exe" set "NODE_EXE=%LOCALAPPDATA%\\Programs\\nodejs\\node.exe"

if not defined NODE_EXE (
    echo [HATA] Node.js bulunamadi. Lutfen https://nodejs.org adresinden Node.js kurun.
    pause
    exit /b 1
)

(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.Run """" ^& "%NODE_EXE%" ^& """ """ ^& "%BRIDGE_SCRIPT%" ^& """", 0, False
) > "%VBS_FILE%"

echo ===============================================================================
echo [OK] Diorama Masaustu Koprusu Windows baslangicina eklendi!
echo Konum: %VBS_FILE%
echo Eski kopru servisi yenileniyor ve arka planda baslatiliyor...
echo ===============================================================================
powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command "Get-NetTCPConnection -LocalPort 47831 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
wscript.exe "%VBS_FILE%"
timeout /t 2 >nul
`);

await writeFile(resolve(root, 'start-desktop-bridge.bat'), startBatContent, 'utf8');
await writeFile(resolve(distWallpaper, 'start-desktop-bridge.bat'), startBatContent, 'utf8');
await writeFile(resolve(root, 'install-startup-bridge.bat'), installStartupBatContent, 'utf8');
await writeFile(resolve(distWallpaper, 'install-startup-bridge.bat'), installStartupBatContent, 'utf8');

console.log(
  `Wallpaper Engine build complete!\n` +
  `- Output folder: ${distWallpaper}\n` +
  `- Wallpaper Engine project file: ${resolve(distWallpaper, 'project.json')}\n` +
  `- Bundled ${orderedModules.length - 1} modules into js/wallpaper.bundle.js (${bundleCode.length} bytes)\n` +
  `- Desktop bridge launcher: ${resolve(root, 'start-desktop-bridge.bat')}`,
);
