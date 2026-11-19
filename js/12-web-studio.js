import { lsGet, lsSet, esc } from './storage.js';
import { getWebPublicObservances, formatYmd } from './calendar-observances.js';
import {
  popovers,
  setPopoverOpen,
  applyThemeMode,
  updateClockAndGreeting,
  refreshGlassCardCache,
} from './01-core-ui.js';
import { getAmbientVolume } from './04-focus-audio.js';
import { HABITATS, currentHabitatIdx, pinnedHabitatId, setPinnedHabitatId } from './07-habitat-state.js';
import { initHabitat } from './habitat-initializer.js';
import { updateOpticalLiquidGlass, renderHabitatMenu } from './10-glass-renderer.js';

/* WEB-STUDIO — Unified Hybrid Smoked-Crystal Liquid Glass, 16x16 Pixel Habitat Icons,
   Web Settings & Laptop Performance Profiles, 8-Channel Organic Biome Audio,
   Bilingual TR/EN Switching & Offline Smart Calendar Holiday Ribbon for the Web App. */

const WEB_SETTINGS_KEY = 'diorama_web_settings_v1';
const WEB_CAL_COUNTRY_KEY = 'diorama_web_cal_country_v1';

const WEB_PERF_PROFILES = Object.freeze({
  eco: { sceneFps: 24, glassFps: 15, glassQuality: 0.75 },
  balanced: { sceneFps: 30, glassFps: 20, glassQuality: 0.75 },
  high: { sceneFps: 60, glassFps: 30, glassQuality: 1 },
});

const DEFAULT_WEB_SETTINGS = Object.freeze({
  language: 'tr',
  perfProfile: 'balanced',
  sceneFps: 30,
  glassFps: 20,
  glassQuality: 0.75,
  creatureSpeed: 1.0,
  glassBlur: 2.2,
  glassOpacity: 90,
  pixelFont: 'classic',
  clockSeconds: false,
  autoCycleMins: 0,
  showClock: true,
  showGreeting: true,
  showSearch: true,
  showDock: true,
  showHeadline: true,
});

function setCssVar(el, prop, value) {
  if (!el || !el.style) return;
  if (typeof el.style.setProperty === 'function') {
    el.style.setProperty(prop, value);
  } else {
    el.style[prop] = value;
  }
}

function isDomEl(el) {
  return typeof HTMLElement !== 'undefined' && el instanceof HTMLElement;
}

// ============================================================================
// 1. SETTINGS STATE, PERFORMANCE PROFILES & BILINGUAL TRANSLATION
// ============================================================================
const rawSettings = lsGet(WEB_SETTINGS_KEY, null);
let webSettings = { ...DEFAULT_WEB_SETTINGS, ...(rawSettings && typeof rawSettings === 'object' ? rawSettings : {}) };
let autoCycleIntervalId = null;
let clockSecondsIntervalId = null;
let lastClockStr = '';

const isEn = () => webSettings.language === 'en';
const L = (tr, en) => (isEn() ? en : tr);

const heroClockEl = document.getElementById('heroClock');
window.__weSetHeroClock = function renderWebHeroClock(formatted) {
  if (!heroClockEl || formatted === lastClockStr) return;
  lastClockStr = formatted;
  heroClockEl.textContent = formatted;
};

function updateClockSecondsTicker() {
  if (clockSecondsIntervalId) {
    clearInterval(clockSecondsIntervalId);
    clockSecondsIntervalId = null;
  }
  window.__weClockSeconds = Boolean(webSettings.clockSeconds);
  if (webSettings.clockSeconds) {
    clockSecondsIntervalId = setInterval(() => {
      if (!document.hidden && typeof updateClockAndGreeting === 'function') {
        updateClockAndGreeting();
      }
    }, 500);
  }
}

function updateAutoCycleTimer() {
  if (autoCycleIntervalId) {
    clearInterval(autoCycleIntervalId);
    autoCycleIntervalId = null;
  }
  const mins = Number(webSettings.autoCycleMins) || 0;
  if (mins > 0) {
    autoCycleIntervalId = setInterval(() => {
      if (document.hidden) return;
      initHabitat(currentHabitatIdx + 1);
      if (pinnedHabitatId) {
        setPinnedHabitatId(HABITATS[currentHabitatIdx].id);
        try { localStorage.setItem('diorama_pinned_habitat', pinnedHabitatId); } catch {}
      }
      renderHabitatMenu();
    }, mins * 60 * 1000);
  }
}

function detectPerfProfileKey() {
  const s = Number(webSettings.sceneFps);
  const g = Number(webSettings.glassFps);
  const q = Number(webSettings.glassQuality);
  for (const [key, prof] of Object.entries(WEB_PERF_PROFILES)) {
    if (prof.sceneFps === s && prof.glassFps === g && prof.glassQuality === q) return key;
  }
  return 'custom';
}

// ============================================================================
// 3. UNIFIED HYBRID LIQUID GLASS TOP PILLS & POPOVER BACKING PLATE
// ============================================================================
let wePopoverGlassPlate = null;
let lastPlateRectKey = '';
let glassTrackRafId = null;
let glassTrackUntil = 0;

function trackGlassTransition(durationMs = 340) {
  if (typeof performance === 'undefined' || typeof performance.now !== 'function') return;
  const until = performance.now() + durationMs;
  if (until > glassTrackUntil) glassTrackUntil = until;
  window.__weGlassRectsDirty = true;
  if (glassTrackRafId !== null || typeof requestAnimationFrame !== 'function') return;
  const step = (now) => {
    glassTrackRafId = null;
    if (document.hidden) return;
    if (typeof window.__weSyncPopoverGlassPlate === 'function') window.__weSyncPopoverGlassPlate();
    updateOpticalLiquidGlass();
    if (now < glassTrackUntil) {
      glassTrackRafId = requestAnimationFrame(step);
    }
  };
  glassTrackRafId = requestAnimationFrame(step);
}

function initHybridGlassLayer() {
  if (typeof document === 'undefined' || !isDomEl(document.body)) return;

  document.querySelectorAll('.main-header .optical-pill').forEach((pill) => {
    if (!pill.querySelector('canvas.glass-lens')) {
      const lens = document.createElement('canvas');
      lens.className = 'glass-lens';
      lens.setAttribute('aria-hidden', 'true');
      pill.prepend(lens);
    }
    pill.classList.add('optical-glass', 'we-liquid-pill');
  });

  if (!document.getElementById('wePopoverGlassPlate')) {
    wePopoverGlassPlate = document.createElement('div');
    wePopoverGlassPlate.id = 'wePopoverGlassPlate';
    wePopoverGlassPlate.className = 'optical-glass we-popover-glass-plate';
    wePopoverGlassPlate.setAttribute('aria-hidden', 'true');
    const plateLens = document.createElement('canvas');
    plateLens.className = 'glass-lens';
    plateLens.setAttribute('aria-hidden', 'true');
    wePopoverGlassPlate.appendChild(plateLens);
    document.body.appendChild(wePopoverGlassPlate);
    document.body.classList.add('we-plate-ready');
  } else {
    wePopoverGlassPlate = document.getElementById('wePopoverGlassPlate');
  }

  window.__weSyncPopoverGlassPlate = function syncPopoverGlassPlate() {
    if (!wePopoverGlassPlate) return;
    const openPanel = document.querySelector('.popover-panel.open');
    if (!openPanel || document.body.classList.contains('zen-active')) {
      if (wePopoverGlassPlate.classList.contains('is-visible')) {
        wePopoverGlassPlate.classList.remove('is-visible');
        wePopoverGlassPlate.style.width = '0px';
        wePopoverGlassPlate.style.height = '0px';
        lastPlateRectKey = '';
        window.__weGlassRectsDirty = true;
      }
      return;
    }
    const r = openPanel.getBoundingClientRect();
    if (!r || r.width < 12 || r.height < 12) return;
    const key = `${Math.round(r.left)}|${Math.round(r.top)}|${Math.round(r.width)}|${Math.round(r.height)}`;
    if (key !== lastPlateRectKey) {
      lastPlateRectKey = key;
      wePopoverGlassPlate.style.left = `${Math.round(r.left)}px`;
      wePopoverGlassPlate.style.top = `${Math.round(r.top)}px`;
      wePopoverGlassPlate.style.width = `${Math.round(r.width)}px`;
      wePopoverGlassPlate.style.height = `${Math.round(r.height)}px`;
      window.__weGlassRectsDirty = true;
    }
    if (!wePopoverGlassPlate.classList.contains('is-visible')) {
      wePopoverGlassPlate.classList.add('is-visible');
      window.__weGlassRectsDirty = true;
    }
  };

  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => {
      window.__weGlassRectsDirty = true;
      if (typeof window.__weSyncPopoverGlassPlate === 'function') window.__weSyncPopoverGlassPlate();
      trackGlassTransition(300);
    });
    document.querySelectorAll('.popover-panel').forEach((panel) => {
      observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
    });
  }

  document.addEventListener('pointermove', (e) => {
    if (!wePopoverGlassPlate || !wePopoverGlassPlate.classList.contains('is-visible')) return;
    const panel = e.target instanceof Element ? e.target.closest('.popover-panel.open') : null;
    if (!panel) return;
    const rect = wePopoverGlassPlate.getBoundingClientRect();
    if (!rect || rect.width < 1) return;
    setCssVar(wePopoverGlassPlate, '--mouse-x', `${(e.clientX - rect.left).toFixed(1)}px`);
    setCssVar(wePopoverGlassPlate, '--mouse-y', `${(e.clientY - rect.top).toFixed(1)}px`);
  }, { passive: true });

  window.addEventListener('resize', () => {
    lastPlateRectKey = '';
    if (typeof window.__weSyncPopoverGlassPlate === 'function') window.__weSyncPopoverGlassPlate();
  }, { passive: true });
}

// ============================================================================
// 4. 16x16 PIXEL-ART HABITAT MENU ICONS (ALL 8 ECOSYSTEMS)
// ============================================================================
const HABITAT_PIXEL_SPRITES = {
  bees: {
    pal: { W: '#f0f9ff', B: '#bae6fd', Y: '#fde047', O: '#f59e0b', K: '#18181b' },
    grid: [
      '................', '................', '..K..WW..WW.....', '...KWBBWWBBW....',
      '....WBBWWBBW....', '...KKKKKKKKKK...', '..KYYYYKKYYKKK..', '.KYKWYYKKYYKKYK.',
      '.KYKKYYKKYYKKYKK', '.KYYYYOKKYYKKYK.', '..KOOOOKKOOKKK..', '...KKKKKKKKKK...',
      '.....K....K.....', '................', '................', '................',
    ],
  },
  betta: {
    pal: { C: '#38bdf8', L: '#bae6fd', D: '#0284c7', V: '#a855f7', P: '#f0abfc', K: '#0f172a', W: '#ffffff' },
    grid: [
      '................', '.....PPP........', '....PVVVP...PPP.', '....PVVVPP.PVVPP',
      '...CCCVVP.PVVVPP', '..CCLLCCCPVVVVVP', '.CCKWLLCCCVVVVVP', 'CCCCCLLCCCVVVVVP',
      '.CCCCDDCCCVVVVVP', '..CCDDDDCPVVVVVP', '....DDVVP.PVVVPP', '.....PVVPP.PVVPP',
      '......PPP...PPP.', '................', '................', '................',
    ],
  },
  dragonfly: {
    pal: { W: '#f0f9ff', B: '#a7f3d0', E: '#34d399', T: '#0d9488', C: '#67e8f9', K: '#064e3b' },
    grid: [
      '................', '......C..C......', '......CEEC......', '.WWWWW.EE.WWWWW.',
      'WBBBBBWEEWBBBBBW', '.WWWWW.TT.WWWWW.', '..WWWW.EE.WWWW..', '.WBBBBWTTWBBBBW.',
      '..WWWW.EE.WWWW..', '.......TT.......', '.......EE.......', '.......TT.......',
      '.......EE.......', '.......TT.......', '.......KK.......', '................',
    ],
  },
  butterfly: {
    pal: { K: '#3b0764', B: '#1e1b4b', V: '#c084fc', M: '#f472b6', P: '#a855f7', L: '#ffffff' },
    grid: [
      '................', '....K......K....', '.KKK.K....K.KKK.', 'KVVVK.K..K.KVVVK',
      'KVLMVK.BB.KVMLVK', 'KVMMMVKBBKVMMMVK', 'KVVMMVKBBKVMMVVK', '.KPPPVKBBKVPPPK.',
      '..KKKKKBBKKKKK..', '.KPPPPKBBKPPPPK.', '.KVVLMKBBKMLVVK.', '.KVVVVKBBKVVVVK.',
      '..KKKK.BB.KKKK..', '.......BB.......', '................', '................',
    ],
  },
  jellyfish: {
    pal: { W: '#ffffff', L: '#f5d0fe', M: '#e879f9', D: '#a21caf', P: '#c084fc', C: '#38bdf8' },
    grid: [
      '................', '.....MMMMMM.....', '...MMLLLLLLMM...', '..MLLWWLLLLLLM..',
      '..MLWLLLLLLLLM..', '.MLLLLLLLLLLLLM.', '.MMMMMMMMMMMMMM.', '..DDPPDDDDPPDD..',
      '...P..C..C..P...', '..P....CC....P..', '...P..C..C..P...', '....P.C..C.P....',
      '...P...CC...P...', '..P...C..C...P..', '......C..C......', '................',
    ],
  },
  koi: {
    pal: { W: '#ffffff', S: '#cbd5e1', R: '#ef4444', O: '#fb923c', K: '#0f172a' },
    grid: [
      '................', '.....WWW........', '....WWRWW.......', '...WKWRWKW......',
      '...WWWWWWW......', '.SSWWRORWWSS....', '.SSWWRRRWWWSS...', '....WWWWWWW.....',
      '.....WWWORWW....', '......WWRRWW....', '.......WWWWW....', '........WWWW....',
      '........WWSWW...', '.......WWS..WW..', '.......WW...WW..', '................',
    ],
  },
  rainforest: {
    pal: { R: '#ef4444', Y: '#facc15', B: '#3b82f6', C: '#fef3c7', W: '#ffffff', K: '#0f172a' },
    grid: [
      '................', '.....RRRRR......', '....RRRRRRR.....', '..CCRWWWRRRR....',
      '.CCCRWKWRRRR....', '.CKK.WWWRRRRR...', '..K..RRRRRRRR...', '.....RRRYYYYR...',
      '.....RRRYYYYBB..', '......RRRBBBB...', '......RRRBBBB...', '.......RRBBBBB..',
      '.......RR..BBBB.', '........R...BBB.', '.............BB.', '................',
    ],
  },
  'arctic-aurora': {
    pal: { W: '#ffffff', C: '#bae6fd', P: '#f9a8d4', K: '#0f172a' },
    grid: [
      '................', '..W..........W..', '..WW........WW..', '..WPW......WPW..',
      '..WPPW....WPPW..', '..WWWWWWWWWWWW..', '.WWWWWWWWWWWWWW.', 'CWWWKWWWWWWKWWWC',
      'CWWKKWWWWWWKKWWC', '.CWWWWWWWWWWWWC.', '..CCWWWWWWWWCC..', '....CWWKKWWC....',
      '.....CWKKWC.....', '......CCCC......', '................', '................',
    ],
  },
};

const HABITAT_EN_TEXT = {
  bees: { name: 'Meadow & Honeybees', hint: 'Click: Nectar & Pollen' },
  betta: { name: 'Halfmoon Betta Tank', hint: 'Click: Bloodworms' },
  dragonfly: { name: 'Marsh & Emperor Dragonfly', hint: 'Click: Water Fly' },
  butterfly: { name: 'Botanical Garden & Butterflies', hint: 'Click: Floating Blossom' },
  jellyfish: { name: 'Coral Lagoon & Jellyfish', hint: 'Click: Bioluminescent Plankton' },
  koi: { name: 'Kyoto Zen & Koi Pond', hint: 'Click: Floating Koi Pellet' },
  rainforest: { name: 'Rainforest & Macaws', hint: 'Click: Tropical Fruit' },
  'arctic-aurora': { name: 'Northern Lights & Arctic Fox', hint: 'Click: Golden Cloudberries' },
};

function pxHabitatIcon(habitatId, size = 26) {
  const spec = HABITAT_PIXEL_SPRITES[habitatId] || HABITAT_PIXEL_SPRITES.bees;
  let rects = '';
  spec.grid.forEach((row, y) => {
    let x = 0;
    while (x < 16) {
      const ch = row[x];
      if (!ch || ch === '.' || !spec.pal[ch]) {
        x += 1;
        continue;
      }
      let end = x;
      while (end < 16 && row[end] === ch) end += 1;
      rects += `<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${spec.pal[ch]}"/>`;
      x = end;
    }
  });
  return `<svg class="we-hab-pixel-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

function getHabitatText(hab) {
  if (!hab) return { name: '', hint: '' };
  if (isEn() && HABITAT_EN_TEXT[hab.id]) return HABITAT_EN_TEXT[hab.id];
  return { name: hab.name || '', hint: hab.hint || '' };
}

function syncTopBarHabitatPixelIcon(hab) {
  const dot = document.getElementById('habitatDot');
  if (dot && hab) {
    dot.classList.add('we-hab-pill-icon');
    dot.innerHTML = pxHabitatIcon(hab.id, 20);
  }
  if (hab) {
    const disp = getHabitatText(hab);
    const nameEl = document.getElementById('habitatNameLabel');
    const hintEl = document.getElementById('habitatFeedHint');
    if (nameEl) nameEl.textContent = disp.name;
    if (hintEl) hintEl.textContent = disp.hint;
  }
}

// ============================================================================
// 5. 8-CHANNEL ORGANIC SOUNDSCAPE STUDIO & BIOME CREATURE AUDIO
// ============================================================================
const BIOME_AUDIO_KEY = 'diorama_biome_audio_prefs_v1';
const biomeAudioPrefs = {
  autoSyncBiome: false,
  creatureVoices: true,
  ...(lsGet(BIOME_AUDIO_KEY, {}) || {}),
};

const HABITAT_DEFAULT_SOUND = {
  bees: 'forest',
  betta: 'water',
  dragonfly: 'night',
  butterfly: 'forest',
  jellyfish: 'water',
  koi: 'zen',
  rainforest: 'rain',
  'arctic-aurora': 'wind',
};

const SOUNDSCAPE_SVG = {
  rain: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 16.2A4.5 4.5 0 0017.5 8h-1.8A7 7 0 104 14.9"></path><path d="M16 14v5M8 14v5M12 16v5" stroke-linecap="round"></path></svg>',
  fire: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2c.5 4.5-3.5 6.5-3.5 10a5.5 5.5 0 0011 0c0-3.2-2.2-5.4-3.5-7-.5 2-2 2.8-2.5 2.5C12.5 6 12.5 3.8 12 2z" stroke-linejoin="round"/></svg>',
  forest: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l-5 7h3l-4 6h12l-4-6h3l-5-7z" stroke-linejoin="round"/><path d="M12 16v5" stroke-linecap="round"/></svg>',
  water: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" stroke-linecap="round"/><path d="M2 17c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" stroke-linecap="round"/></svg>',
  wind: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" stroke-linecap="round"/></svg>',
  night: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 14.5A8.5 8.5 0 019.5 4 7 7 0 1020 14.5z" stroke-linejoin="round"/><circle cx="17" cy="6" r="0.8" fill="currentColor"/></svg>',
  zen: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="14" r="3"/><path d="M5 17c2.2 1.8 4.6 2.5 7 2.5s4.8-.7 7-2.5" stroke-linecap="round"/><path d="M12 3v5" stroke-linecap="round"/></svg>',
  vinyl: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/><path d="M16.5 7.5a6.5 6.5 0 010 9" stroke-linecap="round"/></svg>',
};

const SOUNDSCAPES = [
  { id: 'rain', tr: 'Yağmur', fullTr: 'Yağmur & Gök Gürültüsü', en: 'Rain', fullEn: 'Rain & Thunder' },
  { id: 'fire', tr: 'Şömine', fullTr: 'Kamp Ateşi Çıtırtısı', en: 'Fire', fullEn: 'Campfire Crackles' },
  { id: 'forest', tr: 'Orman', fullTr: 'Orman Rüzgarı & Kuşlar', en: 'Forest', fullEn: 'Forest Breeze & Birds' },
  { id: 'water', tr: 'Su Altı', fullTr: 'Derin Su & Kabarcık', en: 'Stream', fullEn: 'Deep Water & Bubbles' },
  { id: 'wind', tr: 'Rüzgar', fullTr: 'Kuzey Rüzgarı & Esinti', en: 'Wind', fullEn: 'Northern Wind' },
  { id: 'night', tr: 'Gece', fullTr: 'Yaz Gecesi & Cırcır', en: 'Night', fullEn: 'Summer Night & Crickets' },
  { id: 'zen', tr: 'Zen', fullTr: 'Zen Göleti & Bambu Su', en: 'Zen', fullEn: 'Zen Pond & Bamboo' },
  { id: 'vinyl', tr: 'Plak', fullTr: 'Sıcak Plak & Lo-Fi', en: 'Vinyl', fullEn: 'Warm Vinyl & Lo-Fi' },
];

const CREATURE_VOICE_LABELS = {
  bees: ['Bal arısı kanat vızıltısı', 'Honeybee wing buzz'],
  betta: ['Betta su kabarcığı', 'Betta water bubbles'],
  dragonfly: ['Sazlık yusufçuk ve cırcır', 'Marsh dragonfly & crickets'],
  butterfly: ['Bahçe bülbülü ötüşü', 'Garden songbird melody'],
  jellyfish: ['Derin lagün akustiği', 'Deep lagoon chime'],
  koi: ['Koi su şıpırtısı', 'Koi pond water ripple'],
  rainforest: ['Tropikal papağan çağrısı', 'Tropical macaw call'],
  'arctic-aurora': ['Kutup tilkisi yankısı', 'Arctic fox valley echo'],
};

let studioAudioCtx = null;
let studioMasterGain = null;
let activeStudioSoundType = null;
let activeSoundNodes = [];
let activeSoundTimers = [];
let creatureVoiceTimer = null;

function ensureStudioAudioContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (typeof Ctor !== 'function') return null;
  if (!studioAudioCtx) studioAudioCtx = new Ctor();
  if (studioAudioCtx.state === 'suspended') {
    studioAudioCtx.resume().catch(() => {});
  }
  return studioAudioCtx;
}

function createOrganicNoiseBuffer(ctx, mode = 'pink', seconds = 5) {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buffer.getChannelData(ch);
    let b0 = 0; let b1 = 0; let b2 = 0; let b3 = 0; let b4 = 0; let b5 = 0; let b6 = 0;
    let lastBrown = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      if (mode === 'brown') {
        lastBrown = (lastBrown + 0.02 * white) / 1.02;
        data[i] = lastBrown * 0.22;
      } else {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.018;
        b6 = white * 0.115926;
      }
    }
    const fade = 3200;
    for (let i = 0; i < fade; i += 1) {
      const k = i / fade;
      data[bufferSize - fade + i] = data[bufferSize - fade + i] * (1 - k) + data[i] * k;
    }
  }
  return buffer;
}

function cleanupStudioNodes() {
  activeSoundTimers.forEach((id) => clearTimeout(id));
  activeSoundTimers = [];
  activeSoundNodes.forEach((node) => {
    try {
      if (typeof node.stop === 'function') node.stop();
      if (typeof node.disconnect === 'function') node.disconnect();
    } catch {}
  });
  activeSoundNodes = [];
}

function scheduleSoundEvent(fn, minMs, maxMs) {
  const id = setTimeout(() => {
    if (!activeStudioSoundType) return;
    if (!document.hidden) fn();
    scheduleSoundEvent(fn, minMs, maxMs);
  }, minMs + Math.random() * (maxMs - minMs));
  activeSoundTimers.push(id);
}

function triggerFireCrackle(ctx, gain) {
  const now = ctx.currentTime;
  const bursts = 1 + Math.floor(Math.random() * 3);
  for (let b = 0; b < bursts; b += 1) {
    const t = now + b * (0.018 + Math.random() * 0.045);
    const dur = 0.012 + Math.random() * 0.022;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.28));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1600 + Math.random() * 2800;
    bp.Q.value = 2.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18 + Math.random() * 0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(gain);
    src.start(t);
  }
}

function triggerWaterBubbles(ctx, gain) {
  const now = ctx.currentTime;
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i += 1) {
    const t = now + i * (0.07 + Math.random() * 0.09);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const baseF = 340 + Math.random() * 380;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseF, t);
    osc.frequency.exponentialRampToValueAtTime(baseF * 2.15, t + 0.085);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.075, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.09);
    osc.connect(g); g.connect(gain);
    osc.start(t); osc.stop(t + 0.095);
  }
}

function triggerDistantThunder(ctx, gain) {
  const now = ctx.currentTime;
  const dur = 3.2;
  const src = ctx.createBufferSource();
  src.buffer = createOrganicNoiseBuffer(ctx, 'brown', 4);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(145, now);
  lp.frequency.exponentialRampToValueAtTime(52, now + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(0.42, now + 0.45);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(lp); lp.connect(g); g.connect(gain);
  src.start(now); src.stop(now + dur + 0.1);
}

function triggerZenBamboo(ctx, gain) {
  const now = ctx.currentTime;
  [310, 625].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = idx === 0 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.11);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(idx === 0 ? 0.14 : 0.07, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.16);
    osc.connect(g); g.connect(gain);
    osc.start(now); osc.stop(now + 0.18);
  });
}

function playBiomeCreatureSound(forceHabitatId = null, isPreview = false) {
  if (!isPreview && !biomeAudioPrefs.creatureVoices) return;
  try {
    const ctx = ensureStudioAudioContext();
    if (!ctx) return;
    const habId = forceHabitatId || HABITATS[currentHabitatIdx]?.id || 'bees';
    const now = ctx.currentTime;
    const out = ctx.createGain();
    const vol = Math.max(0.18, Math.min(0.95, getAmbientVolume() * (isPreview ? 1.25 : 0.95)));
    out.gain.setValueAtTime(vol, now);
    out.connect(ctx.destination);

    if (habId === 'bees') {
      const dur = 1.4;
      const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator();
      o1.type = 'sawtooth'; o2.type = 'triangle';
      o1.frequency.setValueAtTime(196, now); o2.frequency.setValueAtTime(392, now);
      const lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 420; lp.Q.value = 1.8;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.001, now); env.gain.linearRampToValueAtTime(0.09, now + 0.5); env.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      o1.connect(lp); o2.connect(lp); lp.connect(env); env.connect(out);
      o1.start(now); o2.start(now); o1.stop(now + dur); o2.stop(now + dur);
    } else if (habId === 'betta' || habId === 'koi') {
      const notes = habId === 'koi' ? [380, 540, 760, 980] : [460, 680, 920, 1240];
      notes.forEach((f, idx) => {
        const t = now + idx * 0.085;
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(f, t); osc.frequency.exponentialRampToValueAtTime(f * 1.9, t + 0.075);
        g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.10, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(g); g.connect(out); osc.start(t); osc.stop(t + 0.085);
      });
    } else if (habId === 'dragonfly') {
      for (let p = 0; p < 5; p += 1) {
        const t = now + p * 0.045;
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(4120, t);
        g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + 0.032);
        osc.connect(g); g.connect(out); osc.start(t); osc.stop(t + 0.036);
      }
    } else if (habId === 'butterfly') {
      [[2550, 3250, 0.0, 0.13], [3300, 2750, 0.15, 0.12], [2950, 3850, 0.30, 0.16], [3600, 3100, 0.49, 0.18]].forEach(([f1, f2, off, dur]) => {
        const t = now + off;
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(f1, t); osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
        g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        osc.connect(g); g.connect(out); osc.start(t); osc.stop(t + dur + 0.01);
      });
    } else if (habId === 'jellyfish') {
      [220, 440, 1320].forEach((f, idx) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(f, now + idx * 0.06); osc.frequency.exponentialRampToValueAtTime(f * 0.88, now + 1.4);
        g.gain.setValueAtTime(0.001, now + idx * 0.06); g.gain.linearRampToValueAtTime(idx === 2 ? 0.045 : 0.08, now + idx * 0.06 + 0.08); g.gain.exponentialRampToValueAtTime(0.0008, now + 1.45);
        osc.connect(g); g.connect(out); osc.start(now + idx * 0.06); osc.stop(now + 1.5);
      });
    } else if (habId === 'rainforest') {
      [[1080, 1680, 920, 0.0, 0.22], [1180, 1840, 960, 0.28, 0.24]].forEach(([fs, fp, fe, off, dur]) => {
        const t = now + off;
        const osc = ctx.createOscillator(); const bp = ctx.createBiquadFilter(); const g = ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(fs, t); osc.frequency.exponentialRampToValueAtTime(fp, t + dur * 0.45); osc.frequency.exponentialRampToValueAtTime(fe, t + dur);
        bp.type = 'bandpass'; bp.frequency.setValueAtTime(1450, t); bp.Q.setValueAtTime(2.4, t);
        g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.025); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(bp); bp.connect(g); g.connect(out); osc.start(t); osc.stop(t + dur + 0.02);
      });
    } else if (habId === 'arctic-aurora') {
      [0, 0.24].forEach((off, idx) => {
        const t = now + off;
        const osc = ctx.createOscillator(); const bp = ctx.createBiquadFilter(); const g = ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(680, t); osc.frequency.exponentialRampToValueAtTime(1380, t + 0.065); osc.frequency.exponentialRampToValueAtTime(540, t + 0.17);
        bp.type = 'bandpass'; bp.frequency.setValueAtTime(1050, t); bp.Q.setValueAtTime(1.9, t);
        g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(idx === 0 ? 0.11 : 0.045, t + 0.018); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.18);
        osc.connect(bp); bp.connect(g); g.connect(out); osc.start(t); osc.stop(t + 0.19);
      });
    }
  } catch {}
}

function scheduleNextCreatureVoice() {
  if (creatureVoiceTimer) {
    clearTimeout(creatureVoiceTimer);
    creatureVoiceTimer = null;
  }
  if (!biomeAudioPrefs.creatureVoices) return;
  creatureVoiceTimer = setTimeout(() => {
    if (!document.hidden && biomeAudioPrefs.creatureVoices && (activeStudioSoundType || studioAudioCtx)) {
      playBiomeCreatureSound(null, false);
    }
    scheduleNextCreatureVoice();
  }, 15000 + Math.random() * 14000);
}

function stopStudioAmbientSound() {
  cleanupStudioNodes();
  studioMasterGain = null;
  activeStudioSoundType = null;
  document.getElementById('soundActiveDot')?.classList.add('hidden');
  const statusEl = document.getElementById('ambientStatusText');
  if (statusEl) statusEl.textContent = L('Sessiz', 'Muted');
  document.querySelectorAll('.sound-btn').forEach((b) => {
    b.setAttribute('aria-pressed', 'false');
    b.className = 'sound-btn py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 flex flex-col items-center gap-1 text-xs text-white/70 transition';
  });
}

function toggleStudioAmbientSound(type, forcePlay = false) {
  if (!type) return;
  if (!forcePlay && activeStudioSoundType === type) {
    stopStudioAmbientSound();
    return;
  }
  stopStudioAmbientSound();
  const ctx = ensureStudioAudioContext();
  if (!ctx) return;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(getAmbientVolume(), ctx.currentTime + 0.75);
  masterGain.connect(ctx.destination);
  studioMasterGain = masterGain;

  const baseSrc = ctx.createBufferSource();
  baseSrc.buffer = createOrganicNoiseBuffer(ctx, ['water', 'fire', 'vinyl'].includes(type) ? 'brown' : 'pink', 5);
  baseSrc.loop = true;

  const filter = ctx.createBiquadFilter();
  if (type === 'rain') { filter.type = 'bandpass'; filter.frequency.value = 820; filter.Q.value = 0.6; }
  else if (type === 'fire') { filter.type = 'lowpass'; filter.frequency.value = 185; }
  else if (type === 'forest') { filter.type = 'bandpass'; filter.frequency.value = 540; filter.Q.value = 0.85; }
  else if (type === 'water') { filter.type = 'lowpass'; filter.frequency.value = 215; }
  else if (type === 'wind') {
    filter.type = 'bandpass'; filter.frequency.value = 340; filter.Q.value = 2.4;
    const lfo = ctx.createOscillator(); const lfoG = ctx.createGain();
    lfo.frequency.value = 0.11; lfoG.gain.value = 145;
    lfo.connect(lfoG); lfoG.connect(filter.frequency); lfo.start();
    activeSoundNodes.push(lfo);
  } else if (type === 'night') { filter.type = 'bandpass'; filter.frequency.value = 420; filter.Q.value = 1.1; }
  else if (type === 'zen') { filter.type = 'bandpass'; filter.frequency.value = 640; filter.Q.value = 0.9; }
  else if (type === 'vinyl') { filter.type = 'lowpass'; filter.frequency.value = 290; }

  baseSrc.connect(filter); filter.connect(masterGain); baseSrc.start();
  activeSoundNodes.push(baseSrc);

  if (type === 'rain') {
    const patter = ctx.createBufferSource();
    patter.buffer = createOrganicNoiseBuffer(ctx, 'pink', 4); patter.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 2650; hp.Q.value = 1.1;
    const pg = ctx.createGain(); pg.gain.value = 0.35;
    patter.connect(hp); hp.connect(pg); pg.connect(masterGain); patter.start();
    activeSoundNodes.push(patter);
    scheduleSoundEvent(() => triggerDistantThunder(ctx, masterGain), 14000, 28000);
  } else if (type === 'fire') {
    scheduleSoundEvent(() => triggerFireCrackle(ctx, masterGain), 140, 520);
  } else if (type === 'forest') {
    scheduleSoundEvent(() => playBiomeCreatureSound('butterfly', true), 4500, 9500);
  } else if (type === 'water') {
    scheduleSoundEvent(() => triggerWaterBubbles(ctx, masterGain), 1800, 4200);
  } else if (type === 'night') {
    scheduleSoundEvent(() => playBiomeCreatureSound('dragonfly', true), 1400, 2900);
  } else if (type === 'zen') {
    scheduleSoundEvent(() => triggerWaterBubbles(ctx, masterGain), 2800, 5500);
    scheduleSoundEvent(() => triggerZenBamboo(ctx, masterGain), 7000, 14000);
  } else if (type === 'vinyl') {
    [174.61, 220.0, 261.63, 329.63].forEach((freq) => {
      const osc = ctx.createOscillator(); const lp = ctx.createBiquadFilter(); const cg = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq; lp.type = 'lowpass'; lp.frequency.value = 340; cg.gain.value = 0.025;
      osc.connect(lp); lp.connect(cg); cg.connect(masterGain); osc.start();
      activeSoundNodes.push(osc);
    });
    scheduleSoundEvent(() => triggerFireCrackle(ctx, masterGain), 380, 1100);
  }

  activeStudioSoundType = type;
  document.getElementById('soundActiveDot')?.classList.remove('hidden');
  const spec = SOUNDSCAPES.find((s) => s.id === type);
  const statusEl = document.getElementById('ambientStatusText');
  if (statusEl) statusEl.textContent = spec ? (isEn() ? spec.fullEn : spec.fullTr) : type;
  document.querySelectorAll('.sound-btn').forEach((b) => {
    const selected = b.dataset.sound === type;
    b.setAttribute('aria-pressed', selected ? 'true' : 'false');
    b.className = selected
      ? 'sound-btn py-2 px-2 rounded-xl bg-white/15 border border-white/35 flex flex-col items-center gap-1 text-xs text-white transition shadow-sm'
      : 'sound-btn py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 flex flex-col items-center gap-1 text-xs text-white/70 transition';
  });
}

function initFocusSoundscapeStudio() {
  const focusPop = document.getElementById('focusPopover');
  const firstSoundBtn = focusPop?.querySelector('.sound-btn');
  const oldGrid = firstSoundBtn?.parentElement;
  if (!focusPop || !oldGrid || !oldGrid.parentElement || document.getElementById('weBiomeAutoCheckbox')) return;

  window.__weCustomStopAmbientSound = stopStudioAmbientSound;
  window.__weCustomToggleAmbientSound = (t) => toggleStudioAmbientSound(t, false);
  window.__weSetCustomAmbientVolume = (vol) => {
    if (studioMasterGain && studioAudioCtx) {
      const n = studioAudioCtx.currentTime;
      studioMasterGain.gain.cancelScheduledValues(n);
      studioMasterGain.gain.setValueAtTime(studioMasterGain.gain.value, n);
      studioMasterGain.gain.linearRampToValueAtTime(vol, n + 0.12);
    }
  };

  const biomeBox = document.createElement('div');
  biomeBox.className = 'we-biome-audio-toggles';
  biomeBox.innerHTML = `
    <label class="we-biome-toggle-label">
      <span id="weBiomeAutoLabel" class="font-pixel">Biyoma göre doğa sesini otomatik seç</span>
      <input id="weBiomeAutoCheckbox" type="checkbox" aria-label="Biyom değişince doğa sesini otomatik aç" class="accent-sky-300 w-4 h-4">
    </label>
    <label class="we-biome-toggle-label">
      <span id="weCreatureVoiceToggleLabel" class="font-pixel">Biyomdaki canlıların sesi arada çıksın</span>
      <input id="weCreatureVoiceCheckbox" type="checkbox" aria-label="Biyomdaki hayvanların sesini etkinleştir" class="accent-sky-300 w-4 h-4">
    </label>
    <div class="we-biome-creature-footer">
      <span id="weActiveCreatureVoiceLabel" class="text-xs text-white/65 truncate font-pixel">Aktif biyom sesi</span>
      <button id="wePreviewCreatureVoiceBtn" type="button" class="we-creature-preview-btn">Sesi Dene</button>
    </div>
  `;
  oldGrid.parentElement.insertBefore(biomeBox, oldGrid);

  oldGrid.className = 'we-soundscape-grid-8';
  oldGrid.replaceChildren();
  SOUNDSCAPES.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.sound = item.id;
    btn.setAttribute('aria-pressed', 'false');
    btn.className = 'sound-btn py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 flex flex-col items-center gap-1 text-xs text-white/70 transition';
    btn.innerHTML = `${SOUNDSCAPE_SVG[item.id] || ''}<span class="font-pixel text-xs leading-tight">${item.tr}</span>`;
    btn.addEventListener('click', () => toggleStudioAmbientSound(item.id, false));
    oldGrid.appendChild(btn);
  });

  const syncBiomeUI = () => {
    const autoBox = document.getElementById('weBiomeAutoCheckbox');
    const crBox = document.getElementById('weCreatureVoiceCheckbox');
    const crLabel = document.getElementById('weActiveCreatureVoiceLabel');
    const autoLbl = document.getElementById('weBiomeAutoLabel');
    const crToggleLbl = document.getElementById('weCreatureVoiceToggleLabel');
    const prevBtn = document.getElementById('wePreviewCreatureVoiceBtn');
    if (autoBox) autoBox.checked = Boolean(biomeAudioPrefs.autoSyncBiome);
    if (crBox) crBox.checked = Boolean(biomeAudioPrefs.creatureVoices);
    if (autoLbl) autoLbl.textContent = L('Biyoma göre doğa sesini otomatik seç', 'Auto-match ambient sound to habitat');
    if (crToggleLbl) crToggleLbl.textContent = L('Biyomdaki canlıların sesi arada çıksın', 'Periodic habitat creature calls');
    if (prevBtn) prevBtn.textContent = L('Sesi Dene', 'Preview Call');
    const hab = HABITATS[currentHabitatIdx];
    if (crLabel && hab) {
      const pair = CREATURE_VOICE_LABELS[hab.id];
      crLabel.textContent = pair ? (isEn() ? pair[1] : pair[0]) : hab.name;
    }
    document.querySelectorAll('.sound-btn').forEach((btn) => {
      const s = SOUNDSCAPES.find((x) => x.id === btn.dataset.sound);
      const span = btn.querySelector('span');
      if (s && span) span.textContent = isEn() ? s.en : s.tr;
    });
    const statusEl = document.getElementById('ambientStatusText');
    if (statusEl) {
      if (!activeStudioSoundType) statusEl.textContent = L('Sessiz', 'Muted');
      else {
        const spec = SOUNDSCAPES.find((x) => x.id === activeStudioSoundType);
        if (spec) statusEl.textContent = isEn() ? spec.fullEn : spec.fullTr;
      }
    }
  };
  window.__weSyncWebBiomeAudioUI = syncBiomeUI;

  document.getElementById('weBiomeAutoCheckbox')?.addEventListener('change', (e) => {
    biomeAudioPrefs.autoSyncBiome = Boolean(e.target.checked);
    lsSet(BIOME_AUDIO_KEY, biomeAudioPrefs);
    syncBiomeUI();
    if (biomeAudioPrefs.autoSyncBiome) {
      const hab = HABITATS[currentHabitatIdx];
      toggleStudioAmbientSound(HABITAT_DEFAULT_SOUND[hab?.id] || 'forest', true);
    }
  });
  document.getElementById('weCreatureVoiceCheckbox')?.addEventListener('change', (e) => {
    biomeAudioPrefs.creatureVoices = Boolean(e.target.checked);
    lsSet(BIOME_AUDIO_KEY, biomeAudioPrefs);
    syncBiomeUI();
    scheduleNextCreatureVoice();
  });
  document.getElementById('wePreviewCreatureVoiceBtn')?.addEventListener('click', () => {
    playBiomeCreatureSound(HABITATS[currentHabitatIdx]?.id, true);
  });

  syncBiomeUI();
  scheduleNextCreatureVoice();
}

// ============================================================================
// 6. WEB SETTINGS & PERFORMANCE PROFILE POPOVER
// ============================================================================
function applyWebLanguageToUI() {
  if (typeof document === 'undefined' || !document.documentElement) return;
  document.documentElement.lang = isEn() ? 'en' : 'tr';
  window.__weLang = webSettings.language;

  if (typeof applyThemeMode === 'function') applyThemeMode();
  if (typeof updateClockAndGreeting === 'function') updateClockAndGreeting();
  syncTopBarHabitatPixelIcon(HABITATS[currentHabitatIdx]);
  renderHabitatMenu();
  if (typeof window.__weSyncWebBiomeAudioUI === 'function') window.__weSyncWebBiomeAudioUI();

  const labelUpdates = [
    ['#newsBtn span', 'Gündem', 'News'],
    ['#calendarBtn span', 'Takvim', 'Calendar'],
    ['#notesBtn span', 'Defter', 'Notes'],
    ['#dataManagerBtn span', 'Veri', 'Data'],
    ['#headlineBar > span', 'Gündem', 'Headlines'],
    ['#weSetTitleText', 'Ayarlar & Performans', 'Settings & Performance'],
    ['#weSetSubText', 'Laptop serinliği, cam kalitesi ve dil', 'Laptop thermals, liquid glass & language'],
    ['#weSetSecLang', 'Arayüz Dili / Language', 'Interface Language'],
    ['#weSetSecPerf', '1. Performans & Fan Profili', '1. Performance & Thermal Profile'],
    ['#weSetPerfProfileLabel', 'Tek Tıkla Profil', '1-Click Profile'],
    ['#weSetFpsLabel', 'Sahne Kare Hızı (FPS)', 'Scene Frame Rate (FPS)'],
    ['#weSetSpeedLabel', 'Canlı Hareket Hızı', 'Creature Speed'],
    ['#weSetSecGlass', '2. Liquid Glass Kalitesi', '2. Liquid Glass Quality'],
    ['#weSetGlassFpsLabel', 'Cam Yenileme Hızı (Glass FPS)', 'Glass Refresh Rate (FPS)'],
    ['#weSetGlassQLabel', 'Mercek Çözünürlüğü', 'Lens Resolution'],
    ['#weSetBlurLabel', 'Cam Bulanıklığı', 'Glass Blur'],
    ['#weSetOpLabel', 'Mercek Yoğunluğu', 'Lens Opacity'],
    ['#weSetSecView', '3. Görünüm, Saat & Yazı Tipi', '3. Layout, Clock & Typography'],
    ['#weSetAutoCycleLabel', 'Otomatik Habitat Değiştirme', 'Auto-Cycle Habitats'],
    ['#weSetFontLabel', 'Pixel Yazı Tipi', 'Pixel Typeface'],
    ['#weSetSecWidgets', '4. Görünür Bileşenler', '4. Visible Widgets'],
    ['#weResetDefaultsBtn', 'Varsayılanlara Sıfırla', 'Reset Defaults'],
  ];
  for (const [sel, tr, en] of labelUpdates) {
    const el = document.querySelector(sel);
    if (el && (el.id || document.body.dataset.weTranslatedOnce === '1' || webSettings.language === 'en')) {
      el.textContent = L(tr, en);
    }
  }
  if (webSettings.language === 'en') document.body.dataset.weTranslatedOnce = '1';

  const searchInput = document.getElementById('searchInput');
  if (searchInput && webSettings.language === 'en') {
    searchInput.placeholder = 'Search the web or enter an address...';
  }
}

function applyAllWebSettings(persist = false) {
  window.__weSceneFps = Number(webSettings.sceneFps) || 30;
  window.__weGlassFps = Number(webSettings.glassFps) || 20;
  window.__weGlassQualityScale = Math.max(0.5, Math.min(2.0, Number(webSettings.glassQuality) || 0.75));
  window.__weCreatureSpeed = Math.max(0.5, Math.min(2.0, Number(webSettings.creatureSpeed) || 1.0));
  window.__weClockSeconds = Boolean(webSettings.clockSeconds);

  if (isDomEl(document.body)) {
    document.body.classList.toggle('we-hide-clock', !webSettings.showClock);
    document.body.classList.toggle('we-hide-greeting', !webSettings.showGreeting);
    document.body.classList.toggle('we-hide-search', !webSettings.showSearch);
    document.body.classList.toggle('we-hide-dock', !webSettings.showDock);
    document.body.classList.toggle('we-hide-headline', !webSettings.showHeadline);
    if (webSettings.pixelFont && webSettings.pixelFont !== 'classic') {
      document.body.dataset.pixelFont = webSettings.pixelFont;
    } else {
      delete document.body.dataset.pixelFont;
    }
  }

  setCssVar(document.documentElement, '--we-glass-blur', `${Number(webSettings.glassBlur ?? 2.2).toFixed(1)}px`);
  setCssVar(document.documentElement, '--we-glass-opacity', `${Math.max(0.3, Math.min(1, Number(webSettings.glassOpacity ?? 90) / 100)).toFixed(2)}`);

  webSettings.perfProfile = detectPerfProfileKey();
  updateClockSecondsTicker();
  updateAutoCycleTimer();
  applyWebLanguageToUI();
  syncSettingsPanelUI();
  window.__weGlassRectsDirty = true;

  if (persist) {
    lsSet(WEB_SETTINGS_KEY, webSettings);
  }
}

const WEB_WIDGET_CHIPS = [
  ['clockSeconds', 'Saatte Saniye', 'Show Seconds'],
  ['showClock', 'Saat & Tarih', 'Clock & Date'],
  ['showGreeting', 'Selamlama', 'Greeting'],
  ['showSearch', 'Arama Çubuğu', 'Search Bar'],
  ['showDock', 'Kısayollar', 'Shortcuts Dock'],
  ['showHeadline', 'Gündem Bandı', 'News Ticker'],
];

function syncSettingsPanelUI() {
  const markGroup = (id, val) => {
    const grp = document.getElementById(id);
    if (!grp) return;
    grp.querySelectorAll('.we-seg-btn').forEach((b) => {
      b.classList.toggle('is-active', String(b.dataset.val) === String(val));
    });
  };
  markGroup('weLanguageGroup', webSettings.language);
  markGroup('wePerfProfileGroup', webSettings.perfProfile);
  markGroup('weSceneFpsGroup', webSettings.sceneFps);
  markGroup('weGlassFpsGroup', webSettings.glassFps);
  markGroup('weGlassQualityGroup', webSettings.glassQuality);
  markGroup('weAutoCycleGroup', webSettings.autoCycleMins);
  markGroup('wePixelFontGroup', webSettings.pixelFont);

  const setVal = (sliderId, valId, value, suffix) => {
    const s = document.getElementById(sliderId);
    const v = document.getElementById(valId);
    if (s) s.value = String(value);
    if (v) v.textContent = `${value}${suffix}`;
  };
  setVal('weCreatureSpeedSlider', 'weCreatureSpeedVal', Number(webSettings.creatureSpeed ?? 1).toFixed(1), 'x');
  setVal('weGlassBlurSlider', 'weGlassBlurVal', Number(webSettings.glassBlur ?? 2.2).toFixed(1), 'px');
  setVal('weGlassOpacitySlider', 'weGlassOpacityVal', Math.round(Number(webSettings.glassOpacity ?? 90)), '%');

  const grid = document.getElementById('weWidgetTogglesGrid');
  if (grid && typeof grid.replaceChildren === 'function') {
    grid.replaceChildren();
    WEB_WIDGET_CHIPS.forEach(([key, tr, en]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `we-toggle-chip${webSettings[key] ? ' is-on' : ''}`;
      btn.innerHTML = `<span class="truncate font-pixel">${esc(L(tr, en))}</span><span class="we-toggle-dot"></span>`;
      btn.addEventListener('click', () => {
        webSettings[key] = !webSettings[key];
        applyAllWebSettings(true);
      });
      grid.appendChild(btn);
    });
  }
}

function initWebSettingsPopover() {
  const rightControls = document.querySelector('.header-controls-right');
  if (!rightControls || document.getElementById('webSettingsBtn')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'weSettingsBtnWrapper';
  wrapper.className = 'relative';
  wrapper.innerHTML = `
    <button id="webSettingsBtn" type="button" aria-label="Ayarlar ve Performans" title="Ayarlar & Performans" aria-haspopup="true" aria-controls="webSettingsPopover" aria-expanded="false" class="optical-pill rounded-full px-3 py-2 flex items-center gap-1.5 text-xs font-medium text-white/95">
      <svg class="w-3.5 h-3.5 text-sky-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 2.94-.09-.02a1.7 1.7 0 0 0-1.75.59l-.05.08h-3.4l-.05-.08a1.7 1.7 0 0 0-1.75-.59l-.09.02-1.7-2.94.06-.06A1.7 1.7 0 0 0 9.6 15l-.1-.04v-3.4l.1-.04a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-2.94.09.02a1.7 1.7 0 0 0 1.75-.59l.05-.08h3.4l.05.08a1.7 1.7 0 0 0 1.75.59l.09-.02 1.7 2.94-.06.06A1.7 1.7 0 0 0 19.6 11.5l.1.04v3.4z" transform="translate(-3 -1) scale(1.08)"></path>
      </svg>
    </button>
    <div id="webSettingsPopover" role="region" aria-label="Ayarlar ve Performans" aria-hidden="true" inert class="popover-panel editorial-modal rounded-3xl we-settings-popover absolute right-0 mt-2.5 z-50">
      <div class="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-white/10">
        <div>
          <h3 id="weSetTitleText" class="text-xs font-semibold text-white/95 font-pixel tracking-wide">Ayarlar & Performans</h3>
          <p id="weSetSubText" class="text-xs text-white/60 mt-0.5">Laptop serinliği, cam kalitesi ve dil</p>
        </div>
        <button id="weResetDefaultsBtn" type="button" class="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white/85 font-pixel transition">Sıfırla</button>
      </div>

      <div class="we-settings-section">
        <div id="weSetSecLang" class="we-settings-section-title">Arayüz Dili / Language</div>
        <div id="weLanguageGroup" class="we-segmented-grid we-segmented-2">
          <button type="button" data-val="tr" class="we-seg-btn">Türkçe</button>
          <button type="button" data-val="en" class="we-seg-btn">English</button>
        </div>
      </div>

      <div class="we-settings-section">
        <div id="weSetSecPerf" class="we-settings-section-title">1. Performans & Fan Profili</div>
        <div id="weSetPerfProfileLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Tek Tıkla Profil</div>
        <div id="wePerfProfileGroup" class="we-segmented-grid we-segmented-3 mb-2.5">
          <button type="button" data-val="eco" class="we-seg-btn">Sessiz 24</button>
          <button type="button" data-val="balanced" class="we-seg-btn">Dengeli</button>
          <button type="button" data-val="high" class="we-seg-btn">Yüksek 60</button>
        </div>
        <div id="weSetFpsLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Sahne Kare Hızı (FPS)</div>
        <div id="weSceneFpsGroup" class="we-segmented-grid mb-2">
          <button type="button" data-val="24" class="we-seg-btn">24 FPS</button>
          <button type="button" data-val="30" class="we-seg-btn">30 FPS</button>
          <button type="button" data-val="60" class="we-seg-btn">60 FPS</button>
          <button type="button" data-val="144" class="we-seg-btn">Max</button>
        </div>
        <div class="we-slider-row">
          <span id="weSetSpeedLabel" class="font-pixel">Canlı Hareket Hızı</span>
          <input id="weCreatureSpeedSlider" type="range" min="0.5" max="2.0" step="0.1" value="1.0">
          <span id="weCreatureSpeedVal" class="we-slider-val">1.0x</span>
        </div>
      </div>

      <div class="we-settings-section">
        <div id="weSetSecGlass" class="we-settings-section-title">2. Liquid Glass Kalitesi</div>
        <div id="weSetGlassFpsLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Cam Yenileme Hızı (Glass FPS)</div>
        <div id="weGlassFpsGroup" class="we-segmented-grid mb-2">
          <button type="button" data-val="15" class="we-seg-btn">15 FPS</button>
          <button type="button" data-val="20" class="we-seg-btn">20 FPS</button>
          <button type="button" data-val="30" class="we-seg-btn">30 FPS</button>
          <button type="button" data-val="60" class="we-seg-btn">60 FPS</button>
        </div>
        <div id="weSetGlassQLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Mercek Çözünürlüğü</div>
        <div id="weGlassQualityGroup" class="we-segmented-grid mb-2">
          <button type="button" data-val="0.75" class="we-seg-btn">0.75x</button>
          <button type="button" data-val="1" class="we-seg-btn">1x</button>
          <button type="button" data-val="1.5" class="we-seg-btn">1.5x</button>
          <button type="button" data-val="2" class="we-seg-btn">2x</button>
        </div>
        <div class="we-slider-row">
          <span id="weSetBlurLabel" class="font-pixel">Cam Bulanıklığı</span>
          <input id="weGlassBlurSlider" type="range" min="0" max="6" step="0.2" value="2.2">
          <span id="weGlassBlurVal" class="we-slider-val">2.2px</span>
        </div>
        <div class="we-slider-row">
          <span id="weSetOpLabel" class="font-pixel">Mercek Yoğunluğu</span>
          <input id="weGlassOpacitySlider" type="range" min="30" max="100" step="5" value="90">
          <span id="weGlassOpacityVal" class="we-slider-val">90%</span>
        </div>
      </div>

      <div class="we-settings-section">
        <div id="weSetSecView" class="we-settings-section-title">3. Görünüm, Saat & Yazı Tipi</div>
        <div id="weSetAutoCycleLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Otomatik Habitat Değiştirme</div>
        <div id="weAutoCycleGroup" class="we-segmented-grid mb-2.5">
          <button type="button" data-val="0" class="we-seg-btn">Kapalı</button>
          <button type="button" data-val="1" class="we-seg-btn">1 DK</button>
          <button type="button" data-val="5" class="we-seg-btn">5 DK</button>
          <button type="button" data-val="15" class="we-seg-btn">15 DK</button>
        </div>
        <div id="weSetFontLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Pixel Yazı Tipi</div>
        <div id="wePixelFontGroup" class="we-segmented-grid">
          <button type="button" data-val="classic" class="we-seg-btn">Klasik</button>
          <button type="button" data-val="departure" class="we-seg-btn">Departure</button>
          <button type="button" data-val="jersey20" class="we-seg-btn">Jersey 20</button>
          <button type="button" data-val="jersey15" class="we-seg-btn">Jersey 15</button>
        </div>
      </div>

      <div class="we-settings-section">
        <div id="weSetSecWidgets" class="we-settings-section-title">4. Görünür Bileşenler</div>
        <div id="weWidgetTogglesGrid" class="we-widget-toggles-grid"></div>
      </div>
    </div>
  `;
  rightControls.appendChild(wrapper);

  const btn = document.getElementById('webSettingsBtn');
  const panel = document.getElementById('webSettingsPopover');
  if (btn && panel && Array.isArray(popovers)) {
    const entry = { btn, panel };
    popovers.push(entry);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const shouldOpen = !panel.classList.contains('open');
      popovers.forEach((p) => setPopoverOpen(p, false));
      if (shouldOpen) setPopoverOpen(entry, true);
    });
    panel.addEventListener('click', (e) => e.stopPropagation());
  }

  const bindGroup = (id, key, isNum = true) => {
    document.getElementById(id)?.querySelectorAll('.we-seg-btn').forEach((b) => {
      b.addEventListener('click', () => {
        webSettings[key] = isNum ? Number(b.dataset.val) : b.dataset.val;
        applyAllWebSettings(true);
      });
    });
  };
  bindGroup('weLanguageGroup', 'language', false);
  document.getElementById('wePerfProfileGroup')?.querySelectorAll('.we-seg-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const pKey = b.dataset.val;
      if (WEB_PERF_PROFILES[pKey]) {
        Object.assign(webSettings, WEB_PERF_PROFILES[pKey], { perfProfile: pKey });
        applyAllWebSettings(true);
      }
    });
  });
  bindGroup('weSceneFpsGroup', 'sceneFps', true);
  bindGroup('weGlassFpsGroup', 'glassFps', true);
  bindGroup('weGlassQualityGroup', 'glassQuality', true);
  bindGroup('weAutoCycleGroup', 'autoCycleMins', true);
  bindGroup('wePixelFontGroup', 'pixelFont', false);

  document.getElementById('weCreatureSpeedSlider')?.addEventListener('input', (e) => {
    webSettings.creatureSpeed = Number(e.target.value);
    applyAllWebSettings(true);
  });
  document.getElementById('weGlassBlurSlider')?.addEventListener('input', (e) => {
    webSettings.glassBlur = Number(e.target.value);
    applyAllWebSettings(true);
  });
  document.getElementById('weGlassOpacitySlider')?.addEventListener('input', (e) => {
    webSettings.glassOpacity = Number(e.target.value);
    applyAllWebSettings(true);
  });
  document.getElementById('weResetDefaultsBtn')?.addEventListener('click', () => {
    const keepLang = webSettings.language;
    webSettings = { ...DEFAULT_WEB_SETTINGS, language: keepLang };
    applyAllWebSettings(true);
  });
}

// ============================================================================
// 7. OFFLINE SMART CALENDAR HOLIDAY & OBSERVANCE RIBBON
// ============================================================================
function initCalendarHolidayBanner() {
  const dayPanel = document.querySelector('#calendarPopover .calendar-day-panel');
  if (!dayPanel || document.getElementById('weCalHolidayBanner')) return;

  let activeCountry = lsGet(WEB_CAL_COUNTRY_KEY, 'TR');
  if (!['TR', 'US', 'UK', 'DE'].includes(activeCountry)) activeCountry = 'TR';

  const row = document.createElement('div');
  row.className = 'we-cal-country-row';
  row.innerHTML = `
    <span id="weCalHolidayLabel" class="font-pixel text-xs text-white/70">Resmî Tatiller</span>
    <div id="weCalCountryGroup" class="we-cal-country-group" role="group" aria-label="Tatil ülkesi">
      <button type="button" data-country="TR" class="we-cal-country-btn">TR</button>
      <button type="button" data-country="US" class="we-cal-country-btn">US</button>
      <button type="button" data-country="UK" class="we-cal-country-btn">UK</button>
      <button type="button" data-country="DE" class="we-cal-country-btn">DE</button>
    </div>
  `;

  const banner = document.createElement('div');
  banner.id = 'weCalHolidayBanner';
  banner.className = 'we-cal-holiday-banner';
  banner.hidden = true;

  const eventList = document.getElementById('calendarEventList');
  if (eventList && eventList.parentElement === dayPanel) {
    dayPanel.insertBefore(row, eventList);
    dayPanel.insertBefore(banner, eventList);
  } else {
    dayPanel.appendChild(row);
    dayPanel.appendChild(banner);
  }

  const renderHolidayForDate = (dateKeyStr) => {
    document.querySelectorAll('#weCalCountryGroup .we-cal-country-btn').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.country === activeCountry);
    });
    const { holidays, specials } = getWebPublicObservances(dateKeyStr, activeCountry, webSettings.language);
    if (!holidays.length && !specials.length) {
      banner.hidden = true;
      banner.replaceChildren();
      return;
    }
    banner.hidden = false;
    banner.innerHTML = [
      ...holidays.map((h) => `<span class="we-cal-holiday-badge">${esc(h)}</span>`),
      ...specials.map((s) => `<span class="we-cal-special-badge">${esc(s)}</span>`),
    ].join('');
  };

  document.getElementById('weCalCountryGroup')?.querySelectorAll('.we-cal-country-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCountry = btn.dataset.country;
      lsSet(WEB_CAL_COUNTRY_KEY, activeCountry);
      const key = document.getElementById('calendarSelectedDate')?.dataset?.dateKey || formatYmd(new Date());
      renderHolidayForDate(key);
    });
  });

  window.__weOnCalendarDayRendered = renderHolidayForDate;
  const initialKey = document.getElementById('calendarSelectedDate')?.dataset?.dateKey || formatYmd(new Date());
  renderHolidayForDate(initialKey);
}

// ============================================================================
// 8. BOOTSTRAP WEBSITE ENHANCEMENTS
// ============================================================================
function initWebStudio() {
  if (typeof document === 'undefined' || !isDomEl(document.body)) return;

  if (heroClockEl?.parentElement && !heroClockEl.parentElement.id) {
    heroClockEl.parentElement.id = 'heroClockContainer';
  }
  const greetEl = document.getElementById('greetingLabel');
  if (greetEl?.parentElement && !greetEl.parentElement.id) {
    greetEl.parentElement.id = 'heroGreetingHeading';
  }

  const habList = document.getElementById('habitatListContainer');
  const pinBtn = document.getElementById('pinHabitatBtn');
  const pinText = document.getElementById('pinHabitatText');

  window.__weCustomRenderHabitatMenu = function renderWebPixelHabitatMenu() {
    if (!habList || typeof habList.appendChild !== 'function') return;
    habList.innerHTML = '';
    const isPinned = Boolean(pinnedHabitatId);
    if (pinText) pinText.textContent = isPinned ? L('Sabitlendi', 'Pinned') : L('Rastgele', 'Random');
    if (pinBtn) {
      pinBtn.className = isPinned
        ? 'px-2.5 py-1 rounded-xl text-[11px] font-medium bg-amber-400/20 border border-amber-300/40 text-amber-200 flex items-center gap-1.5 transition'
        : 'px-2.5 py-1 rounded-xl text-[11px] font-medium bg-white/[0.06] hover:bg-white/15 border border-white/12 text-white/80 flex items-center gap-1.5 transition';
    }

    HABITATS.forEach((h, idx) => {
      const active = idx === currentHabitatIdx;
      const disp = getHabitatText(h);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `w-full px-2.5 py-2 rounded-2xl flex items-center justify-between text-left transition ${active ? 'we-hab-row-active bg-white/15 border border-white/25 text-white' : 'hover:bg-white/[0.07] border border-transparent text-white/80 hover:text-white'}`;
      if (Array.isArray(h.rgb)) setCssVar(row, '--hab-rgb', h.rgb.join(', '));
      row.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) row.setAttribute('aria-current', 'true');
      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <span class="we-hab-icon-slot">${pxHabitatIcon(h.id, 28)}</span>
          <div class="truncate">
            <div class="text-xs font-medium truncate">${esc(disp.name)}</div>
            <div class="text-[11px] text-white/55 truncate">${esc(disp.hint)}</div>
          </div>
        </div>
        ${active ? `<span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white/95 shrink-0">${L('Aktif', 'Active')}</span>` : ''}
      `;
      row.addEventListener('click', () => {
        initHabitat(idx);
        if (pinnedHabitatId) {
          setPinnedHabitatId(HABITATS[currentHabitatIdx].id);
          try { localStorage.setItem('diorama_pinned_habitat', pinnedHabitatId); } catch {}
        }
        renderHabitatMenu();
      });
      habList.appendChild(row);
    });
    syncTopBarHabitatPixelIcon(HABITATS[currentHabitatIdx]);
  };

  window.__weOnHabitatChanged = (hab) => {
    syncTopBarHabitatPixelIcon(hab);
    if (typeof window.__weSyncWebBiomeAudioUI === 'function') window.__weSyncWebBiomeAudioUI();
    if (biomeAudioPrefs.autoSyncBiome && hab) {
      const target = HABITAT_DEFAULT_SOUND[hab.id] || 'forest';
      if (activeStudioSoundType !== target) toggleStudioAmbientSound(target, true);
    }
    if (biomeAudioPrefs.creatureVoices && (activeStudioSoundType || biomeAudioPrefs.autoSyncBiome)) {
      setTimeout(() => playBiomeCreatureSound(hab?.id, false), 650);
    }
  };

  initWebSettingsPopover();
  initHybridGlassLayer();
  initFocusSoundscapeStudio();
  initCalendarHolidayBanner();
  applyAllWebSettings(false);
  renderHabitatMenu();
  refreshGlassCardCache();
}

initWebStudio();
