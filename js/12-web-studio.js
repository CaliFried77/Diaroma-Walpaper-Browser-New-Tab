import { lsGet, lsSet, esc } from './storage.js';
import { createArticleId, filterNewsArticles, formatNewsDate } from './news-utils.js';
import {
  getWebPublicObservances,
  formatYmd,
  parseTimeToMins,
  formatMinsToTime,
  parseFlexibleDateInput,
  formatIsoToDisplayDate,
  getIsoWeekdayFromKey,
  normalizeWebCalendarConfig,
  normalizeWebCalendarRoutines,
  computeFreeTimeWindows,
  getWebSmartDayData,
  getUpcomingWebObservances,
} from './calendar-observances.js';
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
   Web Settings & Laptop Performance Profiles, Switchable Pixel Fonts, 2-Column Editorial
   News Reader (60 FPS FLIP), Complete 3-Tab Offline Smart Calendar (Weekly Routines,
   Holiday Skipping, Free-Time Calculator) & 8-Channel Organic Biome Audio for Web/Cloudflare. */

const WEB_SETTINGS_KEY = 'diorama_web_settings_v1';
const LEGACY_CAL_COUNTRY_KEY = 'diorama_web_cal_country_v1';
const SMART_CAL_CFG_KEY = 'diorama_smart_calendar_cfg_v1';
const SMART_CAL_ROUTINES_KEY = 'diorama_smart_calendar_routines_v1';

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
// 1. SETTINGS STATE, PERFORMANCE PROFILES & BILINGUAL HELPERS
// ============================================================================
const rawSettings = lsGet(WEB_SETTINGS_KEY, null);
let webSettings = { ...DEFAULT_WEB_SETTINGS, ...(rawSettings && typeof rawSettings === 'object' ? rawSettings : {}) };
let autoCycleIntervalId = null;
let clockSecondsIntervalId = null;
let lastClockStr = '';
let webToastTimerId = null;

const isEn = () => webSettings.language === 'en';
const L = (tr, en) => (isEn() ? en : tr);

function showWebToast(message, durationMs = 2400) {
  if (!message || typeof document === 'undefined' || !isDomEl(document.body)) return;
  let toast = document.getElementById('weWebToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'weWebToast';
    toast.className = 'we-web-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = String(message);
  toast.classList.add('is-visible');
  if (webToastTimerId) clearTimeout(webToastTimerId);
  webToastTimerId = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, durationMs);
}

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

function preloadSelectedPixelFont(fontKey) {
  if (typeof document === 'undefined' || !document.fonts || typeof document.fonts.load !== 'function') return;
  const familyMap = {
    departure: "'Departure Mono'",
    jersey20: "'Jersey 20'",
    jersey15: "'Jersey 15'",
  };
  const family = familyMap[fontKey];
  if (!family) return;
  document.fonts.load(`16px ${family}`).catch(() => {});
  document.fonts.load(`400 48px ${family}`).catch(() => {});
}

// ============================================================================
// 2. UNIFIED HYBRID LIQUID GLASS TOP PILLS & POPOVER BACKING PLATE
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

  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(() => {
      if (typeof window.__weSyncPopoverGlassPlate === 'function') window.__weSyncPopoverGlassPlate();
    });
    document.querySelectorAll('.popover-panel').forEach((panel) => ro.observe(panel));
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
// 3. 16x16 PIXEL-ART HABITAT MENU ICONS (ALL 8 ECOSYSTEMS)
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
// 4. 2-COLUMN EDITORIAL NEWS READER & 60 FPS FLIP ACCORDION
// ============================================================================
const NEWS_CHEVRON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>';
const NEWS_COPY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const NEWS_CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

function parseEditorialHeadline(rawTitle = '', index = 0, query = '', filter = 'all') {
  let cleanTitle = String(rawTitle || '').trim();
  const breakingRe = /^(?:son\s+dak[iİ]ka(?:\s+haber[iİ])?|flaş(?:\s+haber)?|breaking(?:\s+news)?|live\s+updates?)\s*[:\-–—|]\s*/i;
  let isBreaking = false;
  if (breakingRe.test(cleanTitle)) {
    isBreaking = true;
    cleanTitle = cleanTitle.replace(breakingRe, '').trim() || cleanTitle;
  } else if (/\bson\s+dak[iİ]ka\b|\bbreaking\s+news\b/i.test(cleanTitle)) {
    isBreaking = true;
  }
  const isLead = !isBreaking && index === 0 && !query && filter === 'all';
  return {
    cleanTitle,
    badgeType: isBreaking ? 'breaking' : isLead ? 'lead' : null,
    badgeText: isBreaking ? L('Son Dakika', 'Breaking') : isLead ? L('Manşet', 'Top Story') : '',
  };
}

function syncEditorialCardState(card, isExpanded, isRead) {
  if (!card) return;
  card.classList.toggle('is-expanded', isExpanded);
  card.classList.toggle('is-read', isRead);
  const bodyBtn = card.querySelector('.we-news-body-btn');
  if (bodyBtn) bodyBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  const statusPill = card.querySelector('.we-news-status-pill');
  if (statusPill) statusPill.textContent = isRead ? L('Okundu', 'Read') : L('Yeni', 'New');
  const expandLabel = card.querySelector('.we-news-expand-label');
  if (expandLabel) expandLabel.textContent = isExpanded ? L('Özeti gizle', 'Hide summary') : L('Özeti gör', 'Read summary');
  const drawer = card.querySelector('.we-news-drawer');
  if (drawer) {
    drawer.inert = !isExpanded;
    drawer.setAttribute('aria-hidden', isExpanded ? 'false' : 'true');
  }
}

function toggleNewsCardWithFlip(clickedCard, itemId) {
  const bridge = window.__weNewsBridge;
  const listEl = document.getElementById('newsListContainer');
  if (!bridge || !listEl || !clickedCard) return;

  const expandedIds = bridge.getExpandedIds();
  const readIds = bridge.getReadIds();
  const allCards = Array.from(listEl.querySelectorAll('.news-card.we-editorial-card'));
  const reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const firstRects = new Map();
  if (!reducedMotion) {
    allCards.forEach((c) => {
      if (typeof c.getBoundingClientRect === 'function') firstRects.set(c, c.getBoundingClientRect());
    });
    allCards.forEach((c) => {
      c.style.transition = 'none';
      c.style.transform = '';
    });
  }

  const willExpand = !expandedIds.has(itemId);
  if (willExpand) {
    allCards.forEach((c) => {
      const otherId = c.dataset.itemId;
      if (otherId && otherId !== itemId && expandedIds.has(otherId)) {
        expandedIds.delete(otherId);
        syncEditorialCardState(c, false, readIds.has(otherId));
      }
    });
    expandedIds.add(itemId);
    if (expandedIds.size > 80) expandedIds.delete(expandedIds.values().next().value);
    bridge.markRead(itemId);
  } else {
    expandedIds.delete(itemId);
  }

  syncEditorialCardState(clickedCard, willExpand, readIds.has(itemId));

  if (!reducedMotion) {
    const lastRects = new Map();
    allCards.forEach((c) => {
      if (typeof c.getBoundingClientRect === 'function') lastRects.set(c, c.getBoundingClientRect());
    });

    allCards.forEach((c) => {
      const first = firstRects.get(c);
      const last = lastRects.get(c);
      if (!first || !last) return;
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (c === clickedCard) {
        const startScale = willExpand ? 0.985 : 1.008;
        c.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${startScale})`;
      } else if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        c.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      }
    });

    void listEl.offsetHeight;

    const flipEasing = 'cubic-bezier(0.22, 1, 0.36, 1)';
    allCards.forEach((c) => {
      if (!c.style.transform) return;
      c.style.transition = `transform 0.42s ${flipEasing}, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease`;
      c.style.transform = 'translate3d(0, 0, 0) scale(1)';
      const clearFlip = (ev) => {
        if (ev.propertyName !== 'transform') return;
        c.style.transition = '';
        c.style.transform = '';
        c.removeEventListener('transitionend', clearFlip);
      };
      c.addEventListener('transitionend', clearFlip);
    });
  }

  trackGlassTransition(420);

  if (willExpand) {
    setTimeout(() => {
      const pop = document.getElementById('newsPopover');
      if (!pop || !clickedCard.isConnected || typeof pop.scrollBy !== 'function') return;
      const popRect = pop.getBoundingClientRect();
      const cardRect = clickedCard.getBoundingClientRect();
      const overflowBottom = cardRect.bottom - (popRect.bottom - 28);
      if (overflowBottom > 16) {
        pop.scrollBy({ top: Math.min(overflowBottom + 24, 260), behavior: 'smooth' });
      }
    }, 190);
  }
}

function initEditorialNewsReader() {
  const listEl = document.getElementById('newsListContainer');
  if (!listEl || !window.__weNewsBridge) return;

  window.__weCustomRenderNewsCards = function renderEditorialNewsCards(emptyMessage = '') {
    const bridge = window.__weNewsBridge;
    const container = document.getElementById('newsListContainer');
    if (!bridge || !container) return;

    container.replaceChildren();
    const items = bridge.getItems();
    const cat = bridge.getCategory();
    const query = bridge.getSearchQuery();
    const filter = bridge.getFilter();
    const readIds = bridge.getReadIds();
    const savedIds = bridge.getSavedIds();
    const expandedIds = bridge.getExpandedIds();

    const filtered = filterNewsArticles(items, { query, filter, readIds, savedIds });
    const metaEl = document.getElementById('newsListMeta');
    if (metaEl) {
      metaEl.textContent = isEn()
        ? `${filtered.length} stories · ${items.length} fetched`
        : `${filtered.length} haber gösteriliyor · ${items.length} haber bulundu`;
    }
    bridge.updateFilterButtons();

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'news-empty-state';
      empty.textContent = emptyMessage || (query
        ? L('Aramanla eşleşen haber bulunamadı.', 'No stories match your search.')
        : filter === 'saved'
          ? L('Henüz kaydettiğin haber yok. Kart üzerindeki yer imi simgesini kullanabilirsin.', 'No saved stories yet. Click the bookmark icon on any card.')
          : filter === 'unread'
            ? L('Okunmamış haber kalmadı. Yeni haberler için akışı yenileyebilirsin.', 'All caught up! Refresh to check for new stories.')
            : L('Bu kategoride şu anda gösterilebilecek haber yok.', 'No stories available in this category right now.'));
      container.appendChild(empty);
      bridge.updateHeadlineTicker();
      if (typeof window.__weSyncPopoverGlassPlate === 'function') {
        requestAnimationFrame(() => window.__weSyncPopoverGlassPlate());
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    const catSources = bridge.getAllSources(cat);
    const dateLocale = isEn() ? 'en-US' : 'tr-TR';

    filtered.forEach((item, index) => {
      const itemId = item.itemId || createArticleId(item);
      const isRead = readIds.has(itemId);
      const isSaved = savedIds.has(itemId);
      const isExpanded = expandedIds.has(itemId);
      const source = catSources.find((entry) => entry.id === item.sourceId);
      const sourceUrl = bridge.safeExternalUrl(item.link, source?.homepage);
      const publisherName = item.source || source?.publisher || L('Haber kaynağı', 'News source');
      const { cleanTitle, badgeType, badgeText } = parseEditorialHeadline(item.title, index, query, filter);

      const card = document.createElement('article');
      card.className = `news-card we-editorial-card${isRead ? ' is-read' : ''}${isExpanded ? ' is-expanded' : ''}`;
      card.dataset.itemId = itemId;

      const topBar = document.createElement('div');
      topBar.className = 'we-news-card-top';

      const pubGroup = document.createElement('div');
      pubGroup.className = 'we-news-pub-group';

      const pubTag = document.createElement('span');
      pubTag.className = 'we-news-pub-tag';
      const pubLabel = document.createElement('span');
      pubLabel.className = 'truncate';
      pubLabel.textContent = publisherName;
      pubTag.appendChild(pubLabel);
      pubGroup.appendChild(pubTag);

      if (badgeType) {
        const badge = document.createElement('span');
        badge.className = badgeType === 'breaking' ? 'we-news-breaking-badge' : 'we-news-lead-badge';
        badge.textContent = badgeText;
        pubGroup.appendChild(badge);
      }

      const metaRight = document.createElement('div');
      metaRight.className = 'we-news-meta-right';

      const dateEl = document.createElement('time');
      dateEl.className = 'we-news-time';
      dateEl.textContent = item.publishedAt ? formatNewsDate(item.publishedAt, dateLocale) : (item.time || '');
      if (item.publishedAt) dateEl.dateTime = item.publishedAt;

      const statusPill = document.createElement('span');
      statusPill.className = 'we-news-status-pill';
      statusPill.textContent = isRead ? L('Okundu', 'Read') : L('Yeni', 'New');

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = `we-news-bookmark-btn news-save-btn${isSaved ? ' is-saved' : ''}`;
      saveBtn.setAttribute('aria-label', isSaved ? L('Haberi kayıtlardan çıkar', 'Remove bookmark') : L('Haberi kaydet', 'Bookmark story'));
      saveBtn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
      saveBtn.title = isSaved ? L('Kaydedilenlerden çıkar', 'Remove from saved') : L('Haberi kaydet', 'Save story');
      saveBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.8L6 21V4.75Z"/></svg>';
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nowSaved = bridge.toggleSaved(itemId);
        if (bridge.getFilter() === 'saved') {
          renderEditorialNewsCards();
          return;
        }
        saveBtn.classList.toggle('is-saved', nowSaved);
        saveBtn.setAttribute('aria-pressed', nowSaved ? 'true' : 'false');
        saveBtn.setAttribute('aria-label', nowSaved ? L('Haberi kayıtlardan çıkar', 'Remove bookmark') : L('Haberi kaydet', 'Bookmark story'));
        saveBtn.title = nowSaved ? L('Kaydedilenlerden çıkar', 'Remove from saved') : L('Haberi kaydet', 'Save story');
        showWebToast(nowSaved ? L('Haber kaydedilenlere eklendi.', 'Story saved.') : L('Haber kaydedilenlerden çıkarıldı.', 'Removed from saved.'), 2000);
      });

      metaRight.append(dateEl, statusPill, saveBtn);
      topBar.append(pubGroup, metaRight);

      const bodyBtn = document.createElement('button');
      bodyBtn.type = 'button';
      bodyBtn.className = 'we-news-body-btn news-card-expand';
      bodyBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      bodyBtn.setAttribute('aria-label', isExpanded ? L('Haber detayını daralt', 'Collapse summary') : `${L('Haber detayını göster', 'Show summary')}: ${cleanTitle}`);

      const headline = document.createElement('h4');
      headline.className = 'we-news-headline news-card-title';
      headline.textContent = cleanTitle;

      const footerBar = document.createElement('div');
      footerBar.className = 'we-news-footer-bar';

      const expandPill = document.createElement('span');
      expandPill.className = 'we-news-expand-pill';
      const chevron = document.createElement('span');
      chevron.className = 'we-news-chevron';
      chevron.innerHTML = NEWS_CHEVRON_SVG;
      const expandLabel = document.createElement('span');
      expandLabel.className = 'we-news-expand-label';
      expandLabel.textContent = isExpanded ? L('Özeti gizle', 'Hide summary') : L('Özeti gör', 'Read summary');
      expandPill.append(chevron, expandLabel);

      footerBar.appendChild(expandPill);
      bodyBtn.append(headline, footerBar);

      const drawer = document.createElement('div');
      drawer.className = 'we-news-drawer';
      drawer.inert = !isExpanded;
      drawer.setAttribute('aria-hidden', isExpanded ? 'false' : 'true');

      const drawerInner = document.createElement('div');
      drawerInner.className = 'we-news-drawer-inner';

      const readingWell = document.createElement('div');
      readingWell.className = 'we-news-reading-well';

      const summaryText = document.createElement('p');
      summaryText.className = 'we-news-summary-text';
      const rawDesc = String(item.description || '').trim();
      summaryText.textContent = rawDesc && rawDesc !== cleanTitle
        ? rawDesc
        : L(
          `${publisherName} kaynağından gelen bu haberin tüm detaylarını okumak için aşağıdaki bağlantıyı kullanabilirsin.`,
          `Open the full article on ${publisherName} using the link below.`,
        );

      const drawerActions = document.createElement('div');
      drawerActions.className = 'we-news-drawer-actions';

      const openLink = document.createElement('a');
      openLink.className = 'we-news-read-full-btn news-open-source';
      openLink.href = sourceUrl;
      openLink.target = '_blank';
      openLink.rel = 'noopener noreferrer';
      openLink.referrerPolicy = 'no-referrer';
      openLink.textContent = L('Haberi kaynağında aç ↗', 'Open full article ↗');
      openLink.addEventListener('click', () => {
        bridge.markRead(itemId);
        syncEditorialCardState(card, true, true);
      });

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'we-news-copy-btn';
      copyBtn.innerHTML = `${NEWS_COPY_SVG}<span>${L('Linki kopyala', 'Copy link')}</span>`;
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(sourceUrl).catch(() => {});
        }
        copyBtn.innerHTML = `${NEWS_CHECK_SVG}<span>${L('Kopyalandı', 'Copied')}</span>`;
        showWebToast(L('Haber bağlantısı panoya kopyalandı.', 'Article link copied to clipboard.'), 2000);
        setTimeout(() => {
          copyBtn.innerHTML = `${NEWS_COPY_SVG}<span>${L('Linki kopyala', 'Copy link')}</span>`;
        }, 1800);
      });

      drawerActions.append(openLink, copyBtn);
      readingWell.append(summaryText, drawerActions);
      drawerInner.appendChild(readingWell);
      drawer.appendChild(drawerInner);

      bodyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNewsCardWithFlip(card, itemId);
      });

      card.append(topBar, bodyBtn, drawer);
      fragment.appendChild(card);
    });

    container.appendChild(fragment);
    bridge.updateHeadlineTicker();
    if (typeof window.__weSyncPopoverGlassPlate === 'function') {
      requestAnimationFrame(() => window.__weSyncPopoverGlassPlate());
    }
  };

  window.__weNewsBridge.renderCards();
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
// 6. COMPLETE 3-TAB OFFLINE SMART CALENDAR (HOLIDAYS, ROUTINES & FREE TIME)
// ============================================================================
let smartCalConfig = (() => {
  const saved = lsGet(SMART_CAL_CFG_KEY, null);
  if (saved && typeof saved === 'object') return normalizeWebCalendarConfig(saved);
  const legacyCountry = lsGet(LEGACY_CAL_COUNTRY_KEY, 'TR');
  return normalizeWebCalendarConfig({ holidayCountry: legacyCountry });
})();
let smartCalRoutines = normalizeWebCalendarRoutines(lsGet(SMART_CAL_ROUTINES_KEY, []));
let smartCalActiveTab = 'month'; // 'month' | 'schedule' | 'holidays'

let calTabsBar = null;
let calMonthPane = null;
let calSchedulePane = null;
let calHolidaysPane = null;
let calHolidayBannerSlot = null;
let calFreeSummarySlot = null;

function persistSmartCalConfig() {
  smartCalConfig = normalizeWebCalendarConfig(smartCalConfig);
  lsSet(SMART_CAL_CFG_KEY, smartCalConfig);
}

function persistSmartCalRoutines() {
  smartCalRoutines = normalizeWebCalendarRoutines(smartCalRoutines);
  lsSet(SMART_CAL_ROUTINES_KEY, smartCalRoutines);
}

function getIsoDayShort(isoDay) {
  const tr = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const en = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const idx = Math.max(0, Math.min(6, (Number(isoDay) || 1) - 1));
  return isEn() ? en[idx] : tr[idx];
}

function formatDurationLocalized(totalMins) {
  const m = Math.max(0, Math.round(Number(totalMins) || 0));
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  if (isEn()) {
    if (hrs && rem) return `${hrs}h ${rem}m`;
    if (hrs) return `${hrs}h`;
    return `${rem}m`;
  }
  if (hrs && rem) return `${hrs} sa ${rem} dk`;
  if (hrs) return `${hrs} sa`;
  return `${rem} dk`;
}

function updateSmartCalendarSubtitle() {
  const calSubtitleEl = document.querySelector('#calendarPopover .calendar-subtitle');
  if (!calSubtitleEl) return;
  const parts = [];
  if (smartCalConfig.showHolidays && smartCalConfig.holidayCountry !== 'none') {
    parts.push(`${smartCalConfig.holidayCountry} ${L('tatiller', 'holidays')}`);
  }
  if (smartCalRoutines.length) {
    parts.push(isEn() ? `${smartCalRoutines.length} rules` : `${smartCalRoutines.length} program`);
  }
  const todayObs = getWebPublicObservances(formatYmd(new Date()), smartCalConfig.holidayCountry, webSettings.language);
  if (smartCalConfig.showHolidays && todayObs.holidays.length) {
    parts.push(todayObs.holidays[0]);
  }
  calSubtitleEl.textContent = parts.length ? parts.join(' · ') : L('Küçük planlar, güzel günler.', 'Small plans, brighter days.');
}

function renderSmartCalendarScheduleTab() {
  const weekList = document.getElementById('weCalWeekList');
  const weekRangeLabel = document.getElementById('weCalWeekRangeLabel');
  const weekTotalFreeEl = document.getElementById('weCalWeekTotalFree');
  const rulesList = document.getElementById('weCalRulesList');
  const rulesCountEl = document.getElementById('weCalRulesCount');
  const bridge = window.__weCalendarBridge;
  if (!weekList || !bridge) return;

  const sel = bridge.getSelectedDate();
  const mondayOffset = (sel.getDay() + 6) % 7;
  const monday = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - mondayOffset);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const todayKey = bridge.dateKey(new Date());
  const manualEvents = bridge.getEvents();

  if (weekRangeLabel) {
    weekRangeLabel.textContent = `${bridge.formatDate(monday, { day: 'numeric', month: 'short' })} – ${bridge.formatDate(sunday, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }

  const dayStartMins = smartCalConfig.dayStartHour * 60;
  const dayEndMins = smartCalConfig.dayEndHour * 60;
  const daySpanMins = Math.max(60, dayEndMins - dayStartMins);
  const mapTitleEl = document.getElementById('weCalWeekMapTitle');
  if (mapTitleEl) {
    const spanStr = `${formatMinsToTime(dayStartMins)} – ${formatMinsToTime(dayEndMins)}`;
    mapTitleEl.textContent = L(`Haftalık Boş Zaman Haritası (${spanStr})`, `Weekly Free-Time Map (${spanStr})`);
  }

  weekList.replaceChildren();
  let weekFreeSum = 0;

  for (let i = 0; i < 7; i += 1) {
    const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = bridge.dateKey(dt);
    const info = getWebSmartDayData(key, manualEvents, smartCalRoutines, smartCalConfig, webSettings.language);
    weekFreeSum += info.totalFreeMins;

    const row = document.createElement('button');
    row.type = 'button';
    row.className = `we-cal-week-row${key === todayKey ? ' is-today' : ''}${info.hasHoliday ? ' is-holiday' : ''}`;

    const dayName = `${getIsoDayShort(getIsoWeekdayFromKey(key))} ${bridge.formatDate(dt, { day: 'numeric', month: 'short' })}`;
    const segmentsHtml = info.busy.map((b) => {
      const s = Math.max(dayStartMins, Math.min(dayEndMins, b.start));
      const e = Math.max(dayStartMins, Math.min(dayEndMins, b.end));
      if (e <= s) return '';
      const leftPct = ((s - dayStartMins) / daySpanMins) * 100;
      const widthPct = Math.max(1.5, ((e - s) / daySpanMins) * 100);
      return `<span class="we-cal-timeline-seg is-${b.kind}" style="left:${leftPct.toFixed(1)}%;width:${widthPct.toFixed(1)}%"></span>`;
    }).join('');

    const freeSummaryText = info.hasHoliday && !info.busy.length
      ? `${L('Resmî Tatil', 'Holiday')} (${info.holidays[0]}) · ${L('Tüm gün serbest', 'All day free')}`
      : info.free.length
        ? `${L('Boş', 'Free')}: ${info.free.map((f) => f.label).join(' · ')}`
        : L(`${formatMinsToTime(dayStartMins)}–${formatMinsToTime(dayEndMins)} arası tamamen dolu`, `Fully booked (${formatMinsToTime(dayStartMins)}–${formatMinsToTime(dayEndMins)})`);

    row.innerHTML = `
      <div class="we-cal-week-top">
        <span class="we-cal-week-day">${esc(dayName)}${info.hasHoliday ? ` · ${L('Tatil', 'Holiday')}` : ''}</span>
        <span class="we-cal-week-free-sum">${formatDurationLocalized(info.totalFreeMins)} ${L('boş', 'free')}</span>
      </div>
      <div class="we-cal-timeline-track" aria-hidden="true">${segmentsHtml}</div>
      <div class="we-cal-week-slots">${esc(freeSummaryText)}</div>
    `;
    row.addEventListener('click', () => {
      bridge.setSelectedDate(dt);
      bridge.setVisibleMonth(dt);
      smartCalActiveTab = 'month';
      bridge.renderAll();
      syncSmartCalendarActiveTab();
    });
    weekList.appendChild(row);
  }

  if (weekTotalFreeEl) {
    weekTotalFreeEl.textContent = isEn()
      ? `${formatDurationLocalized(weekFreeSum)} free / wk`
      : `Haftalık ${formatDurationLocalized(weekFreeSum)} boş`;
  }

  if (rulesCountEl) {
    rulesCountEl.textContent = isEn() ? `${smartCalRoutines.length} rules` : `${smartCalRoutines.length} kural`;
  }
  if (rulesList) {
    rulesList.replaceChildren();
    if (!smartCalRoutines.length) {
      const empty = document.createElement('p');
      empty.className = 'calendar-empty';
      empty.textContent = L(
        'Henüz haftalık ders veya iş programı eklemedin. Yukarıdaki formdan kolayca ekleyebilirsin.',
        'No recurring classes or work schedules yet. Use the form above to add one.',
      );
      rulesList.appendChild(empty);
    } else {
      smartCalRoutines.forEach((rule) => {
        const card = document.createElement('div');
        card.className = 'we-cal-rule-item';
        const daysLabel = rule.days.map((d) => getIsoDayShort(d)).join(', ');
        const periodLabel = rule.mode === 'permanent'
          ? L('Kalıcı', 'Permanent')
          : `${formatIsoToDisplayDate(rule.startDate, webSettings.language)} – ${formatIsoToDisplayDate(rule.endDate, webSettings.language)}`;
        const catLabel = rule.category === 'school'
          ? L('Ders', 'Class')
          : rule.category === 'work'
            ? L('İş', 'Work')
            : L('Rutin', 'Routine');
        card.innerHTML = `
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="we-cal-badge is-${rule.category}">${catLabel}</span>
              <strong class="we-cal-agenda-title truncate">${esc(rule.title)}</strong>
            </div>
            <div class="we-cal-rule-meta">${esc(daysLabel)} · ${esc(rule.startTime)}–${esc(rule.endTime)} · ${esc(periodLabel)}${rule.skipHolidays ? L(' · Tatilde atla', ' · Skip holidays') : ''}</div>
          </div>
          <button type="button" class="calendar-event-remove" title="${L('Program kuralını sil', 'Delete rule')}" aria-label="${L('Kuralı sil', 'Delete rule')}: ${esc(rule.title)}">×</button>
        `;
        card.querySelector('.calendar-event-remove')?.addEventListener('click', () => {
          smartCalRoutines = smartCalRoutines.filter((r) => r.id !== rule.id);
          persistSmartCalRoutines();
          bridge.renderAll();
          renderSmartCalendarTabsUI();
        });
        rulesList.appendChild(card);
      });
    }
  }
}

function renderSmartCalendarHolidaysTab() {
  const holChk = document.getElementById('weCalToggleHolidays');
  const spcChk = document.getElementById('weCalToggleSpecials');
  const listEl = document.getElementById('weCalUpcomingHolidaysList');
  const countEl = document.getElementById('weCalUpcomingHolCount');

  if (holChk) holChk.checked = Boolean(smartCalConfig.showHolidays);
  if (spcChk) spcChk.checked = Boolean(smartCalConfig.showSpecialDays);

  document.getElementById('weCalHolidayCountryGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.country === smartCalConfig.holidayCountry);
  });

  const windowKey = `${smartCalConfig.dayStartHour}-${smartCalConfig.dayEndHour}`;
  document.getElementById('weCalHoursGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.hours === windowKey);
  });

  const bridge = window.__weCalendarBridge;
  const upcoming = getUpcomingWebObservances(new Date(), smartCalConfig, webSettings.language, 10);
  if (countEl) {
    countEl.textContent = isEn() ? `${upcoming.length} upcoming` : `${upcoming.length} yaklaşan`;
  }
  if (listEl) {
    listEl.replaceChildren();
    if (!upcoming.length) {
      const empty = document.createElement('p');
      empty.className = 'calendar-empty';
      empty.textContent = smartCalConfig.holidayCountry === 'none'
        ? L('Resmî tatil gösterimi kapalı. Yukarıdan bir ülke seçebilirsin.', 'Public holidays are turned off. Pick a country above.')
        : L('Yakın dönem için listelenecek tatil günü bulunmuyor.', 'No upcoming observances in range.');
      listEl.appendChild(empty);
    } else {
      upcoming.forEach((entry) => {
        const dt = new Date(`${entry.dateKey}T12:00:00`);
        const shortDate = bridge
          ? bridge.formatDate(dt, { day: 'numeric', month: 'short' })
          : formatIsoToDisplayDate(entry.dateKey, webSettings.language);
        const weekday = getIsoDayShort(getIsoWeekdayFromKey(entry.dateKey));
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `we-cal-upcoming-card${entry.kind === 'special' ? ' is-special' : ''}`;
        btn.innerHTML = `
          <span class="we-cal-agenda-time">${esc(shortDate)}<br>${esc(weekday)}</span>
          <span class="we-cal-agenda-body">
            <strong class="we-cal-agenda-title">${esc(entry.names.join(' · '))}</strong>
          </span>
          <span class="we-cal-badge is-${entry.kind}">${entry.kind === 'holiday' ? L('Tatil', 'Holiday') : L('Özel', 'Special')}</span>
        `;
        btn.addEventListener('click', () => {
          if (!bridge) return;
          bridge.setSelectedDate(dt);
          bridge.setVisibleMonth(dt);
          smartCalActiveTab = 'month';
          bridge.renderAll();
          syncSmartCalendarActiveTab();
        });
        listEl.appendChild(btn);
      });
    }
  }
}

function renderSmartCalendarTabsUI() {
  updateSmartCalendarSubtitle();
  renderSmartCalendarScheduleTab();
  renderSmartCalendarHolidaysTab();
}

function applySmartCalendarLanguage() {
  if (calTabsBar) {
    const tabMap = {
      month: L('Takvim', 'Calendar'),
      schedule: L('Program & Boş', 'Schedule & Free'),
      holidays: L('Tatiller & Ayar', 'Holidays'),
    };
    calTabsBar.querySelectorAll('.we-cal-tab-btn').forEach((b) => {
      if (tabMap[b.dataset.calTab]) b.textContent = tabMap[b.dataset.calTab];
    });
  }
  const legendSpans = document.querySelectorAll('#weCalLegend b');
  const legendTexts = [L('Resmî Tatil', 'Holiday'), L('Ders / İş', 'Schedule'), L('Etkinlik', 'Event'), L('Özel Gün', 'Special')];
  legendSpans.forEach((el, idx) => {
    if (legendTexts[idx]) el.textContent = legendTexts[idx];
  });

  const setTxt = (id, tr, en) => { const el = document.getElementById(id); if (el) el.textContent = L(tr, en); };
  setTxt('weCalAddRuleTitle', 'Ders Programı / Kalıcı İş Rutini Ekle', 'Add Class Schedule or Work Routine');
  setTxt('weCalAddRuleSub', 'Tarih aralığı vererek tüm döneme veya kalıcı olarak işle', 'Apply across a term date range or permanently every week');
  setTxt('weCalRoutineTitleLbl', 'Ders veya İş Adı', 'Class, Work, or Routine Title');
  setTxt('weCalRoutineDaysLbl', 'Hangi Günler?', 'Which Days?');
  setTxt('weCalPresetWeekdaysBtn', 'Hafta İçi (Pzt–Cum)', 'Weekdays (Mon–Fri)');
  setTxt('weCalRoutineStartLbl', 'Başlangıç Saati', 'Start Time');
  setTxt('weCalRoutineEndLbl', 'Bitiş Saati', 'End Time');
  setTxt('weCalRoutineModeLbl', 'Geçerlilik Süresi', 'Duration Mode');
  setTxt('weCalRangeStartLbl', 'Başlangıç Tarihi', 'Start Date');
  setTxt('weCalRangeEndLbl', 'Bitiş Tarihi', 'End Date');
  setTxt('weCalPresetTermBtn', '+14 Hafta (Dönem)', '+14 Weeks (Term)');
  setTxt('weCalPresetMonthBtn', '+1 Ay', '+1 Month');
  setTxt('weCalPresetYearBtn', 'Yıl Sonuna Kadar', 'Until Year End');
  setTxt('weCalSkipHolidaysLbl', 'Resmî tatil günlerinde bu programı otomatik atla', 'Automatically skip on public holidays');
  setTxt('weCalSubmitRuleBtn', 'Programa Ekle ve Takvime İşle', 'Add to Weekly Schedule');
  setTxt('weCalSavedRulesTitle', 'Kayıtlı Haftalık Kurallar', 'Saved Weekly Rules');

  const rtTitle = document.getElementById('weCalRoutineTitle');
  if (rtTitle) rtTitle.placeholder = L('Örn: Veri Yapıları / Ofis Mesaisi', 'e.g. Data Structures / Office Shift');
  const rsInp = document.getElementById('weCalRangeStart');
  const reInp = document.getElementById('weCalRangeEnd');
  if (rsInp) rsInp.placeholder = L('GG.AA.YYYY', 'YYYY-MM-DD');
  if (reInp) reInp.placeholder = L('GG.AA.YYYY', 'YYYY-MM-DD');

  const catLabels = { school: L('Ders / Okul', 'Class / School'), work: L('İş / Mesai', 'Work / Shift'), routine: L('Kişisel Rutin', 'Routine') };
  document.getElementById('weCalRoutineCatGroup')?.querySelectorAll('.we-seg-btn').forEach((b) => {
    if (catLabels[b.dataset.val]) b.textContent = catLabels[b.dataset.val];
  });
  const modeLabels = { range: L('Tarih Aralığı (Dönem)', 'Date Range (Term)'), permanent: L('Kalıcı (Sürekli)', 'Permanent') };
  document.getElementById('weCalRoutineModeGroup')?.querySelectorAll('.we-seg-btn').forEach((b) => {
    if (modeLabels[b.dataset.val]) b.textContent = modeLabels[b.dataset.val];
  });
  document.getElementById('weCalRoutineDays')?.querySelectorAll('.we-cal-day-pill').forEach((b) => {
    b.textContent = getIsoDayShort(Number(b.dataset.day));
  });

  setTxt('weCalHolCardTitle', 'Resmî Tatiller & Önemli Günler', 'Public Holidays & Special Days');
  setTxt('weCalHolCardSub', 'Çevrimdışı tatil takvimi · Ders ve iş kuralları tatillerde atlanır', 'Offline holiday engine · Classes & work skip on holidays');
  setTxt('weCalCountryOffBtn', 'Kapalı', 'Off');
  setTxt('weCalToggleHolidaysLbl', 'Resmî tatilleri göster (okul/iş programını otomatik atlar)', 'Show public holidays (auto-skips recurring schedules)');
  setTxt('weCalToggleSpecialsLbl', 'Önemli günleri ve anma günlerini göster', 'Show observances & special days');
  setTxt('weCalHoursCardTitle', 'Günlük Aktif Saat Aralığı (Boş Zaman)', 'Daily Active Window (Free Time)');
  setTxt('weCalUpcomingHolTitle', 'Yaklaşan Tatiller & Önemli Günler (Tıkla → Güne Git)', 'Upcoming Holidays & Observances (Click → Jump to Day)');

  const calFootnoteEl = document.querySelector('#calendarPopover .calendar-footnote');
  if (calFootnoteEl) {
    calFootnoteEl.textContent = L(
      'Etkinlikler, haftalık programların ve tatil seçimlerin bu tarayıcıda çevrimdışı saklanır.',
      'Your calendar, recurring schedules, and holiday picks are stored offline in this browser.',
    );
  }
}

function syncSmartCalendarActiveTab() {
  if (!calTabsBar) return;
  calTabsBar.querySelectorAll('.we-cal-tab-btn').forEach((btn) => {
    const active = btn.dataset.calTab === smartCalActiveTab;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  if (calMonthPane) calMonthPane.hidden = smartCalActiveTab !== 'month';
  if (calSchedulePane) calSchedulePane.hidden = smartCalActiveTab !== 'schedule';
  if (calHolidaysPane) calHolidaysPane.hidden = smartCalActiveTab !== 'holidays';
  renderSmartCalendarTabsUI();
  if (typeof window.__weSyncPopoverGlassPlate === 'function') {
    requestAnimationFrame(() => window.__weSyncPopoverGlassPlate());
  }
}

function initSmartCalendar() {
  const calPopoverEl = document.getElementById('calendarPopover');
  const calHeaderEl = calPopoverEl?.querySelector('.calendar-header');
  const calWeekdaysEl = calPopoverEl?.querySelector('.calendar-weekdays');
  const calGridEl = document.getElementById('calendarGrid');
  const calDayPanelEl = calPopoverEl?.querySelector('.calendar-day-panel');
  const bridge = window.__weCalendarBridge;
  if (!calPopoverEl || !calHeaderEl || !calWeekdaysEl || !calGridEl || !calDayPanelEl || !bridge) return;
  if (document.getElementById('weCalTabsBar')) return;

  calTabsBar = document.createElement('div');
  calTabsBar.id = 'weCalTabsBar';
  calTabsBar.className = 'we-cal-tabs';
  calTabsBar.setAttribute('role', 'tablist');
  calTabsBar.innerHTML = `
    <button type="button" data-cal-tab="month" class="we-cal-tab-btn is-active" role="tab" aria-selected="true">Takvim</button>
    <button type="button" data-cal-tab="schedule" class="we-cal-tab-btn" role="tab" aria-selected="false">Program &amp; Boş</button>
    <button type="button" data-cal-tab="holidays" class="we-cal-tab-btn" role="tab" aria-selected="false">Tatiller &amp; Ayar</button>
  `;
  calHeaderEl.insertAdjacentElement('afterend', calTabsBar);

  calMonthPane = document.createElement('div');
  calMonthPane.id = 'weCalPaneMonth';
  calTabsBar.insertAdjacentElement('afterend', calMonthPane);
  calMonthPane.append(calWeekdaysEl, calGridEl);

  const legend = document.createElement('div');
  legend.id = 'weCalLegend';
  legend.className = 'we-cal-legend';
  legend.innerHTML = `
    <span><i style="background:#fb7185"></i><b class="font-normal">Resmî Tatil</b></span>
    <span><i style="background:#34d399"></i><b class="font-normal">Ders / İş</b></span>
    <span><i style="background:#7dd3fc"></i><b class="font-normal">Etkinlik</b></span>
    <span><i style="background:#c084fc"></i><b class="font-normal">Özel Gün</b></span>
  `;
  calMonthPane.appendChild(legend);
  calMonthPane.appendChild(calDayPanelEl);

  const evListEl = document.getElementById('calendarEventList');
  if (evListEl) {
    calHolidayBannerSlot = document.createElement('div');
    calHolidayBannerSlot.id = 'weCalHolidayBanner';
    evListEl.insertAdjacentElement('beforebegin', calHolidayBannerSlot);

    calFreeSummarySlot = document.createElement('div');
    calFreeSummarySlot.id = 'weCalDayFreeSlot';
    evListEl.insertAdjacentElement('afterend', calFreeSummarySlot);
  }

  calSchedulePane = document.createElement('div');
  calSchedulePane.id = 'weCalPaneSchedule';
  calSchedulePane.hidden = true;
  calSchedulePane.innerHTML = `
    <section class="we-cal-section-card">
      <div class="we-cal-section-head">
        <div>
          <h4 id="weCalWeekMapTitle" class="we-cal-section-title font-pixel">Haftalık Boş Zaman Haritası (08:00 – 23:00)</h4>
          <p id="weCalWeekRangeLabel" class="we-cal-section-sub">Seçili hafta</p>
        </div>
        <span id="weCalWeekTotalFree" class="we-cal-week-free-sum">--</span>
      </div>
      <div id="weCalWeekList" class="we-cal-week-list"></div>
    </section>

    <section class="we-cal-section-card">
      <div class="we-cal-section-head">
        <div>
          <h4 id="weCalAddRuleTitle" class="we-cal-section-title font-pixel">Ders Programı / Kalıcı İş Rutini Ekle</h4>
          <p id="weCalAddRuleSub" class="we-cal-section-sub">Tarih aralığı vererek tüm döneme veya kalıcı olarak işle</p>
        </div>
      </div>
      <form id="weCalRoutineForm" class="we-cal-form-grid">
        <div id="weCalRoutineCatGroup" class="we-segmented-grid we-segmented-3">
          <button type="button" data-val="school" class="we-seg-btn is-active">Ders / Okul</button>
          <button type="button" data-val="work" class="we-seg-btn">İş / Mesai</button>
          <button type="button" data-val="routine" class="we-seg-btn">Kişisel Rutin</button>
        </div>

        <div>
          <label id="weCalRoutineTitleLbl" class="we-cal-field-label font-pixel" for="weCalRoutineTitle">Ders veya İş Adı</label>
          <input id="weCalRoutineTitle" type="text" maxlength="80" required placeholder="Örn: Veri Yapıları / Ofis Mesaisi" class="we-cal-input">
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <span id="weCalRoutineDaysLbl" class="we-cal-field-label font-pixel mb-0">Hangi Günler?</span>
            <button type="button" id="weCalPresetWeekdaysBtn" class="we-cal-mini-chip">Hafta İçi (Pzt–Cum)</button>
          </div>
          <div id="weCalRoutineDays" class="we-cal-day-pills" role="group" aria-label="Haftanın günleri">
            <button type="button" data-day="1" class="we-cal-day-pill is-active">Pzt</button>
            <button type="button" data-day="2" class="we-cal-day-pill">Sal</button>
            <button type="button" data-day="3" class="we-cal-day-pill">Çar</button>
            <button type="button" data-day="4" class="we-cal-day-pill">Per</button>
            <button type="button" data-day="5" class="we-cal-day-pill">Cum</button>
            <button type="button" data-day="6" class="we-cal-day-pill">Cmt</button>
            <button type="button" data-day="7" class="we-cal-day-pill">Paz</button>
          </div>
        </div>

        <div class="we-cal-row-2">
          <div>
            <label id="weCalRoutineStartLbl" class="we-cal-field-label font-pixel" for="weCalRoutineStart">Başlangıç Saati</label>
            <input id="weCalRoutineStart" type="text" maxlength="5" value="09:00" placeholder="09:00" class="we-cal-input font-mono">
          </div>
          <div>
            <label id="weCalRoutineEndLbl" class="we-cal-field-label font-pixel" for="weCalRoutineEnd">Bitiş Saati</label>
            <input id="weCalRoutineEnd" type="text" maxlength="5" value="11:00" placeholder="11:00" class="we-cal-input font-mono">
          </div>
        </div>

        <div>
          <span id="weCalRoutineModeLbl" class="we-cal-field-label font-pixel">Geçerlilik Süresi</span>
          <div id="weCalRoutineModeGroup" class="we-segmented-grid we-segmented-2">
            <button type="button" data-val="range" class="we-seg-btn is-active">Tarih Aralığı (Dönem)</button>
            <button type="button" data-val="permanent" class="we-seg-btn">Kalıcı (Sürekli)</button>
          </div>
        </div>

        <div id="weCalDateRangeBox">
          <div class="we-cal-row-2">
            <div>
              <label id="weCalRangeStartLbl" class="we-cal-field-label font-pixel" for="weCalRangeStart">Başlangıç Tarihi</label>
              <input id="weCalRangeStart" type="text" maxlength="10" placeholder="GG.AA.YYYY" class="we-cal-input font-mono">
            </div>
            <div>
              <label id="weCalRangeEndLbl" class="we-cal-field-label font-pixel" for="weCalRangeEnd">Bitiş Tarihi</label>
              <input id="weCalRangeEnd" type="text" maxlength="10" placeholder="GG.AA.YYYY" class="we-cal-input font-mono">
            </div>
          </div>
          <div class="we-cal-quick-presets">
            <button type="button" data-range-weeks="14" id="weCalPresetTermBtn" class="we-cal-mini-chip">+14 Hafta (Dönem)</button>
            <button type="button" data-range-weeks="4" id="weCalPresetMonthBtn" class="we-cal-mini-chip">+1 Ay</button>
            <button type="button" data-range-year-end="1" id="weCalPresetYearBtn" class="we-cal-mini-chip">Yıl Sonuna Kadar</button>
          </div>
        </div>

        <label class="we-cal-check-row">
          <input id="weCalSkipHolidays" type="checkbox" checked>
          <span id="weCalSkipHolidaysLbl">Resmî tatil günlerinde bu programı otomatik atla</span>
        </label>

        <div id="weCalFormFeedback" class="we-cal-form-feedback" role="status" aria-live="polite"></div>
        <button id="weCalSubmitRuleBtn" type="submit" class="we-cal-primary-btn font-pixel">Programa Ekle ve Takvime İşle</button>
      </form>
    </section>

    <section class="we-cal-section-card">
      <div class="we-cal-section-head">
        <h4 id="weCalSavedRulesTitle" class="we-cal-section-title font-pixel">Kayıtlı Haftalık Kurallar</h4>
        <span id="weCalRulesCount" class="we-cal-section-sub">0 kural</span>
      </div>
      <div id="weCalRulesList" class="we-cal-rules-list"></div>
    </section>
  `;
  calMonthPane.insertAdjacentElement('afterend', calSchedulePane);

  calHolidaysPane = document.createElement('div');
  calHolidaysPane.id = 'weCalPaneHolidays';
  calHolidaysPane.hidden = true;
  calHolidaysPane.innerHTML = `
    <section class="we-cal-section-card">
      <div class="we-cal-section-head">
        <div>
          <h4 id="weCalHolCardTitle" class="we-cal-section-title font-pixel">Resmî Tatiller &amp; Önemli Günler</h4>
          <p id="weCalHolCardSub" class="we-cal-section-sub">Çevrimdışı tatil takvimi · Ders ve iş kuralları tatillerde atlanır</p>
        </div>
      </div>
      <div id="weCalHolidayCountryGroup" class="we-cal-holiday-country-grid" role="group" aria-label="Tatil ülkesi">
        <button type="button" data-country="TR" class="we-seg-btn">TR</button>
        <button type="button" data-country="US" class="we-seg-btn">US</button>
        <button type="button" data-country="UK" class="we-seg-btn">UK</button>
        <button type="button" data-country="DE" class="we-seg-btn">DE</button>
        <button type="button" data-country="none" class="we-seg-btn" id="weCalCountryOffBtn">Kapalı</button>
      </div>
      <div class="space-y-2">
        <label class="we-cal-check-row">
          <input id="weCalToggleHolidays" type="checkbox" checked>
          <span id="weCalToggleHolidaysLbl">Resmî tatilleri göster (okul/iş programını otomatik atlar)</span>
        </label>
        <label class="we-cal-check-row">
          <input id="weCalToggleSpecials" type="checkbox" checked>
          <span id="weCalToggleSpecialsLbl">Önemli günleri ve anma günlerini göster</span>
        </label>
      </div>
    </section>

    <section class="we-cal-section-card">
      <div class="we-cal-section-head">
        <h4 id="weCalHoursCardTitle" class="we-cal-section-title font-pixel">Günlük Aktif Saat Aralığı (Boş Zaman)</h4>
      </div>
      <div id="weCalHoursGroup" class="we-segmented-grid">
        <button type="button" data-hours="7-23" class="we-seg-btn">07–23</button>
        <button type="button" data-hours="8-23" class="we-seg-btn">08–23</button>
        <button type="button" data-hours="9-22" class="we-seg-btn">09–22</button>
        <button type="button" data-hours="6-24" class="we-seg-btn">06–24</button>
      </div>
    </section>

    <section class="we-cal-section-card">
      <div class="we-cal-section-head">
        <span id="weCalUpcomingHolTitle" class="we-cal-field-label font-pixel mb-0">Yaklaşan Tatiller &amp; Önemli Günler (Tıkla → Güne Git)</span>
        <span id="weCalUpcomingHolCount" class="we-cal-section-sub">0</span>
      </div>
      <div id="weCalUpcomingHolidaysList" class="we-cal-upcoming-list"></div>
    </section>
  `;
  calSchedulePane.insertAdjacentElement('afterend', calHolidaysPane);

  calTabsBar.querySelectorAll('.we-cal-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      smartCalActiveTab = btn.dataset.calTab || 'month';
      syncSmartCalendarActiveTab();
    });
  });

  ['weCalRoutineStart', 'weCalRoutineEnd'].forEach((id) => {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.addEventListener('input', () => {
      let v = inp.value.replace(/[^\d:]/g, '');
      if (/^\d{3,4}$/.test(v)) v = `${v.slice(0, 2)}:${v.slice(2, 4)}`;
      inp.value = v.slice(0, 5);
    });
  });

  const setDefaultDateRange = (weeks = 14) => {
    const base = bridge.getSelectedDate();
    const end = new Date(base.getFullYear(), base.getMonth(), base.getDate() + weeks * 7);
    const rs = document.getElementById('weCalRangeStart');
    const re = document.getElementById('weCalRangeEnd');
    if (rs) rs.value = formatIsoToDisplayDate(bridge.dateKey(base), webSettings.language);
    if (re) re.value = formatIsoToDisplayDate(bridge.dateKey(end), webSettings.language);
  };
  setDefaultDateRange(14);

  let formCat = 'school';
  let formMode = 'range';

  const syncRoutineModeUI = () => {
    document.getElementById('weCalRoutineModeGroup')?.querySelectorAll('.we-seg-btn')
      .forEach((b) => b.classList.toggle('is-active', b.dataset.val === formMode));
    const rangeBox = document.getElementById('weCalDateRangeBox');
    if (rangeBox) rangeBox.hidden = formMode === 'permanent';
  };

  document.getElementById('weCalRoutineCatGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      formCat = btn.dataset.val || 'school';
      document.getElementById('weCalRoutineCatGroup')?.querySelectorAll('.we-seg-btn')
        .forEach((b) => b.classList.toggle('is-active', b.dataset.val === formCat));
      if (formCat === 'work') {
        formMode = 'permanent';
        syncRoutineModeUI();
      } else if (formCat === 'school') {
        formMode = 'range';
        syncRoutineModeUI();
      }
    });
  });

  document.getElementById('weCalRoutineModeGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      formMode = btn.dataset.val === 'permanent' ? 'permanent' : 'range';
      syncRoutineModeUI();
    });
  });

  document.getElementById('weCalRoutineDays')?.querySelectorAll('.we-cal-day-pill').forEach((btn) => {
    btn.addEventListener('click', () => btn.classList.toggle('is-active'));
  });

  document.getElementById('weCalPresetWeekdaysBtn')?.addEventListener('click', () => {
    document.getElementById('weCalRoutineDays')?.querySelectorAll('.we-cal-day-pill').forEach((btn) => {
      const d = Number(btn.dataset.day);
      btn.classList.toggle('is-active', d >= 1 && d <= 5);
    });
  });

  calSchedulePane.querySelectorAll('[data-range-weeks]').forEach((btn) => {
    btn.addEventListener('click', () => setDefaultDateRange(Number(btn.dataset.rangeWeeks) || 14));
  });
  calSchedulePane.querySelector('[data-range-year-end]')?.addEventListener('click', () => {
    const base = bridge.getSelectedDate();
    const rs = document.getElementById('weCalRangeStart');
    const re = document.getElementById('weCalRangeEnd');
    if (rs) rs.value = formatIsoToDisplayDate(bridge.dateKey(base), webSettings.language);
    if (re) re.value = formatIsoToDisplayDate(`${base.getFullYear()}-12-31`, webSettings.language);
  });

  document.getElementById('weCalRoutineForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleEl = document.getElementById('weCalRoutineTitle');
    const startEl = document.getElementById('weCalRoutineStart');
    const endEl = document.getElementById('weCalRoutineEnd');
    const rangeStartEl = document.getElementById('weCalRangeStart');
    const rangeEndEl = document.getElementById('weCalRangeEnd');
    const skipEl = document.getElementById('weCalSkipHolidays');
    const feedbackEl = document.getElementById('weCalFormFeedback');

    const title = String(titleEl?.value || '').trim().slice(0, 80);
    const days = Array.from(document.querySelectorAll('#weCalRoutineDays .we-cal-day-pill.is-active'))
      .map((b) => Number(b.dataset.day))
      .filter((d) => d >= 1 && d <= 7);
    const startMin = parseTimeToMins(startEl?.value);
    const endMin = parseTimeToMins(endEl?.value);

    const setFeedback = (msg) => {
      if (feedbackEl) feedbackEl.textContent = msg;
      showWebToast(msg, 2600);
    };

    if (!title) {
      setFeedback(L('Lütfen ders veya iş adını gir.', 'Please enter a class or work title.'));
      return;
    }
    if (!days.length) {
      setFeedback(L('En az bir gün seçmelisin (Pzt–Paz).', 'Select at least one weekday (Mon–Sun).'));
      return;
    }
    if (startMin === null || endMin === null || endMin <= startMin) {
      setFeedback(L('Saat aralığını SS:DD biçiminde gir (bitiş başlangıçtan sonra olmalı).', 'Enter time as HH:MM (end must be after start).'));
      return;
    }

    let startDate = '';
    let endDate = '';
    if (formMode === 'range') {
      startDate = parseFlexibleDateInput(rangeStartEl?.value) || '';
      endDate = parseFlexibleDateInput(rangeEndEl?.value) || '';
      if (!startDate || !endDate || endDate < startDate) {
        setFeedback(L('Geçerli bir tarih aralığı gir (GG.AA.YYYY).', 'Enter a valid date range (YYYY-MM-DD).'));
        return;
      }
    }

    smartCalRoutines.push({
      id: `rt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      category: formCat,
      days,
      startTime: formatMinsToTime(startMin),
      endTime: formatMinsToTime(endMin),
      mode: formMode,
      startDate,
      endDate,
      skipHolidays: Boolean(skipEl?.checked),
    });
    persistSmartCalRoutines();
    if (titleEl) titleEl.value = '';
    bridge.renderAll();
    renderSmartCalendarTabsUI();
    setFeedback(
      formMode === 'permanent'
        ? L(`"${title}" kalıcı olarak takvime işlendi.`, `"${title}" added permanently to your calendar.`)
        : L(`"${title}" seçilen tarih aralığındaki tüm haftalara eklendi.`, `"${title}" added across the selected date range.`),
    );
  });

  document.getElementById('weCalHolidayCountryGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      smartCalConfig.holidayCountry = btn.dataset.country || 'TR';
      persistSmartCalConfig();
      bridge.renderAll();
      renderSmartCalendarTabsUI();
    });
  });

  document.getElementById('weCalToggleHolidays')?.addEventListener('change', (e) => {
    smartCalConfig.showHolidays = Boolean(e.target.checked);
    persistSmartCalConfig();
    bridge.renderAll();
    renderSmartCalendarTabsUI();
  });

  document.getElementById('weCalToggleSpecials')?.addEventListener('change', (e) => {
    smartCalConfig.showSpecialDays = Boolean(e.target.checked);
    persistSmartCalConfig();
    bridge.renderAll();
    renderSmartCalendarTabsUI();
  });

  document.getElementById('weCalHoursGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [sH, eH] = String(btn.dataset.hours || '8-23').split('-').map(Number);
      smartCalConfig.dayStartHour = sH;
      smartCalConfig.dayEndHour = eH;
      persistSmartCalConfig();
      bridge.renderAll();
      renderSmartCalendarTabsUI();
    });
  });

  window.__weCustomRenderCalendar = function renderSmartWebMonthGrid() {
    const monthLabelEl = document.getElementById('calendarMonthLabel');
    const visibleMonth = bridge.getVisibleMonth();
    const selectedDate = bridge.getSelectedDate();
    const manualEvents = bridge.getEvents();

    if (monthLabelEl) {
      monthLabelEl.textContent = bridge.formatDate(visibleMonth, { month: 'long', year: 'numeric' });
    }
    calGridEl.replaceChildren();

    const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), 1 - mondayOffset);
    const todayKey = bridge.dateKey(new Date());
    const selectedKey = bridge.dateKey(selectedDate);

    for (let index = 0; index < 42; index += 1) {
      const dt = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const key = bridge.dateKey(dt);
      const inMonth = dt.getMonth() === visibleMonth.getMonth();
      const info = getWebSmartDayData(key, manualEvents, smartCalRoutines, smartCalConfig, webSettings.language);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calendar-day';
      button.classList.toggle('is-outside', !inMonth);
      button.classList.toggle('is-today', key === todayKey);
      button.classList.toggle('is-selected', key === selectedKey);
      button.classList.toggle('is-holiday', info.hasHoliday);
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-pressed', key === selectedKey ? 'true' : 'false');
      button.setAttribute('aria-label', `${bridge.formatDate(dt, { weekday: 'long', day: 'numeric', month: 'long' })}, ${info.items.length} ${L('kayıt', 'items')}`);

      const number = document.createElement('span');
      number.className = 'calendar-day-number';
      number.textContent = String(dt.getDate());
      button.appendChild(number);

      const dotClasses = [];
      if (info.hasHoliday) dotClasses.push('dot-holiday');
      if (info.hasRoutine) dotClasses.push('dot-routine');
      if (info.hasManual) dotClasses.push('dot-event');
      else if (info.hasSpecial && dotClasses.length < 3) dotClasses.push('dot-special');

      if (dotClasses.length) {
        const dots = document.createElement('span');
        dots.className = 'calendar-day-dots';
        dots.setAttribute('aria-hidden', 'true');
        dotClasses.slice(0, 4).forEach((cls) => {
          const marker = document.createElement('i');
          marker.className = cls;
          dots.appendChild(marker);
        });
        button.appendChild(dots);
      }

      button.addEventListener('click', () => {
        bridge.setSelectedDate(dt);
        bridge.renderAll();
        renderSmartCalendarTabsUI();
      });
      calGridEl.appendChild(button);
    }
    updateSmartCalendarSubtitle();
  };

  window.__weCustomRenderSelectedDay = function renderSmartWebSelectedDayPanel() {
    const sel = bridge.getSelectedDate();
    const key = bridge.dateKey(sel);
    const manualEvents = bridge.getEvents();
    const info = getWebSmartDayData(key, manualEvents, smartCalRoutines, smartCalConfig, webSettings.language);
    const dayStartMins = smartCalConfig.dayStartHour * 60;
    const dayEndMins = smartCalConfig.dayEndHour * 60;
    const windowFree = computeFreeTimeWindows(info.busy, dayStartMins, dayEndMins);

    const selectedDateLabelEl = document.getElementById('calendarSelectedDate');
    const eventCountLabelEl = document.getElementById('calendarEventCount');
    const eventListEl = document.getElementById('calendarEventList');

    if (selectedDateLabelEl) {
      selectedDateLabelEl.textContent = bridge.formatDate(sel, { weekday: 'long', day: 'numeric', month: 'long' });
    }
    if (eventCountLabelEl) {
      eventCountLabelEl.textContent = isEn() ? `${info.items.length} items` : `${info.items.length} kayıt`;
    }

    if (calHolidayBannerSlot) {
      if (info.hasHoliday) {
        const skipMsg = info.skippedByHolidayCount > 0
          ? (isEn()
            ? `${info.skippedByHolidayCount} recurring schedule(s) automatically skipped for this holiday.`
            : `Resmî tatil nedeniyle bu güne ait ${info.skippedByHolidayCount} ders/iş programı otomatik atlandı.`)
          : L('Resmî tatil günü — okul ve iş programları bu güne yazılmaz.', 'Public holiday — recurring school & work schedules are skipped.');
        calHolidayBannerSlot.innerHTML = `
          <div class="we-cal-holiday-banner">
            <strong>${esc(info.holidays.join(' · '))}</strong>
            <small>${esc(skipMsg)}</small>
          </div>
        `;
      } else {
        calHolidayBannerSlot.innerHTML = '';
      }
    }

    if (eventListEl) {
      eventListEl.replaceChildren();
      if (!info.items.length) {
        const empty = document.createElement('p');
        empty.className = 'calendar-empty';
        empty.textContent = L(
          'Bu gün için kayıtlı etkinlik veya ders programı yok.',
          'No events or classes scheduled for this day.',
        );
        eventListEl.appendChild(empty);
      } else {
        info.items.forEach((item) => {
          const row = document.createElement('article');
          row.className = `we-cal-agenda-row is-${item.kind}`;

          const timeEl = document.createElement('span');
          timeEl.className = 'we-cal-agenda-time';
          timeEl.textContent = item.timeText;

          const bodyEl = document.createElement('div');
          bodyEl.className = 'we-cal-agenda-body';
          const titleEl = document.createElement('span');
          titleEl.className = 'we-cal-agenda-title';
          titleEl.textContent = item.title;
          bodyEl.appendChild(titleEl);
          if (item.subtitle) {
            const subEl = document.createElement('span');
            subEl.className = 'we-cal-agenda-sub';
            subEl.textContent = item.subtitle;
            bodyEl.appendChild(subEl);
          }

          const rightSlot = document.createElement('div');
          rightSlot.className = 'flex items-center gap-1.5';
          const badgeEl = document.createElement('span');
          badgeEl.className = `we-cal-badge is-${item.kind}`;
          badgeEl.textContent = item.badge;
          rightSlot.appendChild(badgeEl);

          if (item.manualId) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'calendar-event-remove';
            delBtn.textContent = '×';
            delBtn.title = L('Etkinliği sil', 'Delete event');
            delBtn.setAttribute('aria-label', `${L('Etkinliği sil', 'Delete event')}: ${item.title}`);
            delBtn.addEventListener('click', () => {
              bridge.removeEvent(item.manualId);
              bridge.renderAll();
              renderSmartCalendarTabsUI();
            });
            rightSlot.appendChild(delBtn);
          }

          row.append(timeEl, bodyEl, rightSlot);
          eventListEl.appendChild(row);
        });
      }
    }

    if (calFreeSummarySlot) {
      const chipsHtml = windowFree.free.length
        ? windowFree.free.map((slot) => `<span class="we-cal-free-chip">${esc(slot.label)}</span>`).join('')
        : `<span class="we-cal-free-chip">${L('Serbest aralık yok', 'No free slots')}</span>`;
      const spanTitle = `${formatMinsToTime(dayStartMins)}–${formatMinsToTime(dayEndMins)}`;
      calFreeSummarySlot.innerHTML = `
        <div class="we-cal-free-box">
          <div class="we-cal-free-head">
            <span class="we-cal-free-label font-pixel">${L(`BOŞ ZAMANLAR (${spanTitle})`, `FREE TIME (${spanTitle})`)}</span>
            <span class="we-cal-free-total">${formatDurationLocalized(windowFree.totalFreeMins)} ${L('boş', 'free')}</span>
          </div>
          <div class="we-cal-free-chips">${chipsHtml}</div>
        </div>
      `;
    }
    if (smartCalActiveTab === 'schedule') renderSmartCalendarScheduleTab();
    if (typeof window.__weSyncPopoverGlassPlate === 'function') {
      requestAnimationFrame(() => window.__weSyncPopoverGlassPlate());
    }
  };

  applySmartCalendarLanguage();
  bridge.renderAll();
  renderSmartCalendarTabsUI();
}

// ============================================================================
// 7. WEB SETTINGS, PERFORMANCE PROFILES & FULL BIDIRECTIONAL TR <-> EN UI
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

  const shouldTranslateStatic = Boolean(document.body.dataset.weTranslatedOnce === '1' || webSettings.language === 'en');
  if (webSettings.language === 'en') document.body.dataset.weTranslatedOnce = '1';

  const setText = (sel, tr, en) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = L(tr, en);
  };
  const setAttr = (sel, attr, tr, en) => {
    const el = document.querySelector(sel);
    if (el) el.setAttribute(attr, L(tr, en));
  };

  if (shouldTranslateStatic) {
    // Top bar & main hero
    setText('#newsBtn span', 'Gündem', 'News');
    setText('#calendarBtn span', 'Takvim', 'Calendar');
    setText('#notesBtn span', 'Defter', 'Notes');
    setText('#dataManagerBtn span', 'Veri', 'Data');
    setText('#headlineBar > span', 'Gündem', 'Headlines');
    setText('#searchForm .font-mono', '↑ ↓ motor', '↑ ↓ engine');
    setAttr('#searchInput', 'placeholder', "Google'da ara veya bir adres yaz...", 'Search the web or enter an address...');

    // Habitat popover
    setText('#habitatPopover h3', 'Yaşayan Habitatlar', 'Living Habitats');
    setText('#habitatPopover h3 + p', 'Sahne seç veya açılış için sabitle', 'Select a biome or pin for startup');

    // News popover static UI
    setText('#newsPopover .news-eyebrow', 'Diorama · Güncel', 'Diorama · Live Desk');
    setText('#newsPopover .news-title', 'Haber Merkezi', 'News Desk');
    setText('#newsPopover .news-section-heading span:first-child', 'Akışa göz at', 'Browse feeds');
    const catMap = { gundem: ['Türkiye & Dünya', 'Top & World'], teknoloji: ['Teknoloji', 'Tech'], bilim: ['Bilim & Kültür', 'Science & Culture'] };
    document.querySelectorAll('#newsCategories .news-cat-btn').forEach((btn) => {
      const pair = catMap[btn.dataset.cat];
      if (pair) btn.textContent = L(pair[0], pair[1]);
    });
    const filterMap = { all: ['Tümü', 'All'], unread: ['Okunmadı', 'Unread'], saved: ['Kaydedilen', 'Saved'] };
    document.querySelectorAll('#newsPopover .news-filter-btn').forEach((btn) => {
      const pair = filterMap[btn.dataset.filter];
      if (pair) btn.textContent = L(pair[0], pair[1]);
    });
    setAttr('#newsSearchInput', 'placeholder', 'Haber veya yayıncı ara…', 'Search headlines or publishers…');
    setText('#newsSettingsPanel .news-settings-heading h4', 'Kaynak tercihleri', 'Source Preferences');
    setText('#newsSettingsPanel .news-settings-heading p', 'Bu kategoride hangi yayıncıları takip edeceğini seç.', 'Choose which publishers to follow in this category.');
    setText('#addNewsSourceForm .news-add-heading h4', 'Kendi RSS kaynağını ekle', 'Add Custom RSS Feed');
    setText('#addNewsSourceForm .news-add-heading p', 'Herkese açık HTTPS RSS veya Atom akışı.', 'Public HTTPS RSS or Atom feed.');
    setText('.news-add-source-btn', 'Kaynağı ekle', 'Add Source');
    setText('.news-provider-note', 'Haber akışı: Diorama RSS API · Haberlerin telif ve yayın hakları kaynak yayıncılara aittir.', 'News feed: Diorama RSS API · Copyright remains with original publishers.');

    // Weather popover static UI
    const wxLabels = document.querySelectorAll('#weatherPopover .wx-section-label');
    if (wxLabels[0]) wxLabels[0].textContent = L('ÖNÜMÜZDEKİ SAATLER', 'NEXT HOURS');
    if (wxLabels[1]) wxLabels[1].textContent = L('5 GÜNLÜK TAHMİN', '5-DAY FORECAST');
    if (wxLabels[2]) wxLabels[2].textContent = L('SAHNEDE DENE', 'PREVIEW ON SCENE');
    const wxFxSpan = document.getElementById('wxFxToggle')?.previousElementSibling;
    if (wxFxSpan) wxFxSpan.textContent = L('Sahnede hava efektleri', 'Weather effects in scene');
    const wxAutoSpan = document.getElementById('wxAutoTheme')?.previousElementSibling;
    if (wxAutoSpan) wxAutoSpan.textContent = L('Gündüz/gece temasını güneşe göre ayarla', 'Auto day/night theme from sun cycle');
    setAttr('#cityInput', 'placeholder', 'Şehir (Örn: İstanbul)', 'City (e.g. London)');
    setText('#weatherForm button[type="submit"]', 'Kaydet', 'Save');

    // Focus popover & HUD static UI
    setText('#focusPopover h3', 'Odak & Ambiyans', 'Focus & Ambience');
    setText('#focusPopover .focus-clock-machine-head span:nth-child(2)', 'HABİTAT SAYACI', 'HABITAT TIMER');
    setText('#focusPopover .focus-clock-machine-head .focus-machine-current', 'CANLI', 'LIVE');
    setText('#focusPopover .focus-duration-label', 'SÜRE SEÇ', 'DURATION');
    setText('#focusPopover .focus-custom-duration label', 'ÖZEL SÜRE', 'CUSTOM');
    setAttr('#focusCustomMinutes', 'placeholder', '1–180 dk', '1–180 min');
    setText('#focusApplyCustomBtn', 'UYGULA', 'APPLY');
    setText('#focusPopover .focus-task-field label', 'BU OTURUMUN HEDEFİ', 'SESSION INTENTION');
    setAttr('#focusTaskInput', 'placeholder', 'Ne üzerinde çalışacaksın?', 'What are you focusing on?');
    setText('#focusPopover .focus-volume-row label', 'SES SEVİYESİ', 'VOLUME');
    setText('#focusPopover .mt-4 > .flex > span:first-child', 'Üretken Doğa Ambiyansı', 'Organic Nature Soundscapes');
    document.querySelectorAll('#focusPopover .focus-preset-btn').forEach((btn) => {
      const m = btn.dataset.mins;
      if (m) btn.textContent = isEn() ? `${m} MIN` : `${m} DK`;
    });
    setText('#focusStageStatus', 'HABİTATINDA ODAKLANIYORSUN', 'FOCUSING IN YOUR HABITAT');
    setText('#focusStageReset', 'BITIR', 'END');

    // Calendar popover base UI
    setText('#calendarPopover .calendar-header .calendar-eyebrow', 'Diorama · Planlama', 'Diorama · Planner');
    setText('#calendarTodayBtn', 'Bugün', 'Today');
    const calWeekdays = document.querySelectorAll('#calendarPopover .calendar-weekdays span');
    const wkTr = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const wkEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    calWeekdays.forEach((el, idx) => {
      if (wkTr[idx]) el.textContent = L(wkTr[idx], wkEn[idx]);
    });
    setText('#calendarPopover .calendar-day-heading .calendar-eyebrow', 'SEÇİLİ GÜN', 'SELECTED DAY');
    setText('#calendarEventForm > label', 'Yeni etkinlik', 'New event');
    setAttr('#calendarEventTitle', 'placeholder', 'Örn. Proje üzerinde çalış', 'e.g. Deep work session');
    setText('#calendarEventForm > button[type="submit"]', 'Etkinliği ekle', 'Add event');

    // Notes popover
    setText('#notesPopover h3', 'Kişisel Defter', 'Personal Journal');
    setText('#taskProgressText', 'Günlük akış ve hızlı notlar', 'Daily tasks and quick notes');
    setText('#tasksTab', 'Görevler', 'Tasks');
    setText('#notesTab', 'Notlar', 'Notes');
    setAttr('#newTaskInput', 'placeholder', 'Yeni bir satır ekle...', 'Add a new task...');
    setText('#addTaskForm button[type="submit"]', 'Ekle', 'Add');
    setText('#clearDoneTasksBtn', 'Tamamlananları Sil', 'Clear Done');
    setAttr('#noteTitleInput', 'placeholder', 'Başlık (isteğe bağlı)...', 'Title (optional)...');
    setAttr('#noteBodyInput', 'placeholder', 'Düşünce, alıntı veya bağlantı kaydet...', 'Write a thought, quote, or link...');
    setText('#addNoteCardForm button[type="submit"]', 'Deftere Kaydet', 'Save Note');

    // Data Manager popover
    setText('#dataManagerPopover h3', 'Veri Yönetimi', 'Data Manager');
    setText('#dataManagerPopover h3 + p', 'Notlarını, görevlerini ve kısayollarını güvenceye al', 'Back up notes, tasks & shortcuts locally');
  }

  // Web Settings Popover always translates cleanly
  setText('#weSetTitleText', 'Ayarlar & Performans', 'Settings & Performance');
  setText('#weSetSubText', 'Laptop serinliği, cam kalitesi ve dil', 'Laptop thermals, liquid glass & language');
  setText('#weSetSecLang', 'Arayüz Dili / Language', 'Interface Language');
  setText('#weSetSecPerf', '1. Performans & Fan Profili', '1. Performance & Thermal Profile');
  setText('#weSetPerfProfileLabel', 'Tek Tıkla Profil', '1-Click Profile');
  setText('#weSetFpsLabel', 'Sahne Kare Hızı (FPS)', 'Scene Frame Rate (FPS)');
  setText('#weSetSpeedLabel', 'Canlı Hareket Hızı', 'Creature Speed');
  setText('#weSetSecGlass', '2. Liquid Glass Kalitesi', '2. Liquid Glass Quality');
  setText('#weSetGlassFpsLabel', 'Cam Yenileme Hızı (Glass FPS)', 'Glass Refresh Rate (FPS)');
  setText('#weSetGlassQLabel', 'Mercek Çözünürlüğü', 'Lens Resolution');
  setText('#weSetBlurLabel', 'Cam Bulanıklığı', 'Glass Blur');
  setText('#weSetOpLabel', 'Mercek Yoğunluğu', 'Lens Opacity');
  setText('#weSetSecView', '3. Görünüm, Saat & Yazı Tipi', '3. Layout, Clock & Typography');
  setText('#weSetAutoCycleLabel', 'Otomatik Habitat Değiştirme', 'Auto-Cycle Habitats');
  setText('#weSetFontLabel', 'Pixel Yazı Tipi', 'Pixel Typeface');
  setText('#weSetSecWidgets', '4. Görünür Bileşenler', '4. Visible Widgets');
  setText('#weResetDefaultsBtn', 'Sıfırla', 'Reset');

  const perfBtnMap = { eco: ['Sessiz 24', 'Silent 24'], balanced: ['Dengeli', 'Balanced'], high: ['Yüksek 60', 'High 60'] };
  document.getElementById('wePerfProfileGroup')?.querySelectorAll('.we-seg-btn').forEach((b) => {
    const pair = perfBtnMap[b.dataset.val];
    if (pair) b.textContent = L(pair[0], pair[1]);
  });
  const cycBtnMap = { '0': ['Kapalı', 'Off'], '1': ['1 DK', '1 MIN'], '5': ['5 DK', '5 MIN'], '15': ['15 DK', '15 MIN'] };
  document.getElementById('weAutoCycleGroup')?.querySelectorAll('.we-seg-btn').forEach((b) => {
    const pair = cycBtnMap[b.dataset.val];
    if (pair) b.textContent = L(pair[0], pair[1]);
  });
  const classicFontBtn = document.querySelector('#wePixelFontGroup button[data-val="classic"]');
  if (classicFontBtn) classicFontBtn.textContent = L('Klasik', 'Classic');

  if (shouldTranslateStatic) {
    window.__weNewsBridge?.renderCards?.();
    applySmartCalendarLanguage();
    window.__weCalendarBridge?.renderAll?.();
    renderSmartCalendarTabsUI();
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
      preloadSelectedPixelFont(webSettings.pixelFont);
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
  initEditorialNewsReader();
  initFocusSoundscapeStudio();
  initSmartCalendar();
  applyAllWebSettings(false);
  renderHabitatMenu();
  refreshGlassCardCache();
}

initWebStudio();
