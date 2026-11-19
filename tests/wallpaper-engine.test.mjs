import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { getArcticLedges } from '../js/arctic-geometry.js';
import { getDesktopIndex, searchDesktopItems, parseXiaomiMiotTelemetry, parseEspnScheduleEvents, parseNvidiaSmiCsv } from '../scripts/desktop-bridge.mjs';

const projectJsonRaw = await readFile(new URL('../dist-wallpaper/project.json', import.meta.url), 'utf8');
const projectJson = JSON.parse(projectJsonRaw);
const wallpaperHtml = await readFile(new URL('../dist-wallpaper/index.html', import.meta.url), 'utf8');
const wallpaperCss = await readFile(new URL('../dist-wallpaper/css/wallpaper.css', import.meta.url), 'utf8');
const wallpaperBundle = await readFile(new URL('../dist-wallpaper/js/wallpaper.bundle.js', import.meta.url), 'utf8');

test('dist-wallpaper/index.html is file:// safe with no type="module" scripts and includes wallpaper.css', () => {
  assert.doesNotMatch(wallpaperHtml, /<script[^>]*type=["']module["']/i);
  assert.doesNotMatch(wallpaperHtml, /type=["']time["']/i);
  assert.doesNotMatch(wallpaperHtml, /type=["']file["']/i);
  assert.doesNotMatch(wallpaperBundle, /createElement\(['"]select['"]\)/i);
  assert.doesNotMatch(wallpaperBundle, /<select\s+id=/i);
  assert.match(wallpaperHtml, /<script defer src="\.\/js\/wallpaper\.bundle\.js"><\/script>/);
  assert.match(wallpaperHtml, /<link rel="stylesheet" href="\.\/css\/wallpaper\.css">/);
  assert.match(wallpaperCss, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(wallpaperCss, /\.we-editorial-card/);
  assert.match(wallpaperCss, /\.we-news-drawer/);
  assert.match(wallpaperCss, /\.we-air-popover/);
  assert.match(wallpaperCss, /#weMusicWidget/);
  assert.match(wallpaperCss, /we-disc-spin/);
  assert.match(wallpaperCss, /\.we-liquid-pill/);
  assert.match(wallpaperCss, /#wePopoverGlassPlate\.we-popover-glass-plate/);
  assert.match(wallpaperCss, /\.we-hab-icon-slot/);
  assert.doesNotMatch(wallpaperCss, /\.we-hab-icon-badge/);
  assert.match(wallpaperCss, /size-adjust:\s*124%/);
  assert.match(wallpaperCss, /\.we-cal-tabs/);
  assert.match(wallpaperCss, /\.we-cal-free-box/);
  assert.match(wallpaperCss, /\.we-cal-picker-drawer/);
  assert.match(wallpaperCss, /\.we-cal-team-chip/);
  assert.match(wallpaperCss, /\.we-cal-holiday-country-grid/);
  assert.match(wallpaperCss, /#weSystemWidget/);
  assert.match(wallpaperCss, /\.we-sys-diorama-well/);
  assert.match(wallpaperCss, /\.main-header \.header-controls-right\s*\{\s*margin-left:\s*auto/);
  assert.match(wallpaperCss, /--we-glass-border:/);
  assert.match(wallpaperCss, /--we-glass-bevel:/);
  assert.match(wallpaperCss, /--we-glass-plate-bg:/);
  assert.match(wallpaperCss, /--we-glass-float-scrim:/);
  assert.match(wallpaperCss, /--we-glass-pocket-bg:/);
  assert.equal(wallpaperCss.includes('rgba(6, 11, 22, 0.90)'), false);
  assert.doesNotMatch(wallpaperCss, /\.desktop-launcher-drawer\s*\{[^}]*backdrop-filter:\s*blur\(/i);
  assert.equal(wallpaperCss.includes('clip-path: inset(0 round 22px)'), false);
  assert.match(wallpaperBundle, /__weCustomRenderNewsCards/);
  assert.match(wallpaperBundle, /__weLoadEnglishNewsCategory/);
  assert.match(wallpaperBundle, /__weTranslateWeatherPanel/);
  assert.match(wallpaperBundle, /__weApplyLanguage/);
  assert.match(wallpaperBundle, /GLOBAL_LEAGUES_LIST/);
  assert.match(wallpaperBundle, /GLOBAL_NATIONAL_TEAMS_LIST/);
  assert.match(wallpaperBundle, /__weCustomRenderHabitatMenu/);
  assert.match(wallpaperBundle, /__weCustomRenderCalendar/);
  assert.match(wallpaperBundle, /__weCalendarHelpers/);
  assert.match(wallpaperBundle, /__wePollSystemStats/);
  assert.doesNotMatch(wallpaperBundle, /const modelShort =/);
  assert.match(wallpaperBundle, /__weSyncPopoverGlassPlate/);
  assert.match(wallpaperBundle, /__weClockSeconds/);
  assert.match(wallpaperBundle, /pxHabitatIcon/);
  assert.match(wallpaperBundle, /upgradeTopBarToLiquidGlass/);
  assert.match(wallpaperBundle, /toggleNewsCardWithFlip/);
  assert.match(wallpaperBundle, /pxPurifierIcon/);
  assert.match(wallpaperBundle, /airPurifierPopover/);
  assert.match(wallpaperBundle, /playBiomeCreatureSound/);
  assert.match(wallpaperBundle, /drawMinecraftPixelDisc/);
  assert.match(wallpaperBundle, /spawnJukeboxPixelNote/);
  assert.match(wallpaperBundle, /__weHydrateUserState/);
  assert.match(wallpaperBundle, /__weScheduleUserStateSync/);
});

test('dist-wallpaper/project.json defines Wallpaper Engine web project and all user-configurable properties', () => {
  assert.equal(projectJson.type, 'web');
  assert.equal(projectJson.file, 'index.html');
  const props = projectJson.general.properties;
  for (const key of [
    'we_habitat',
    'we_autocycle_mins',
    'we_theme_mode',
    'we_weather_fx',
    'we_perf_profile',
    'we_taskbar_height',
    'we_pixel_font',
    'we_language',
    'we_arctic_christmas',
    'we_topbar_mode',
    'we_show_clock',
    'we_clock_seconds',
    'we_show_greeting',
    'we_show_search',
    'we_show_dock',
    'we_show_headline',
    'we_show_music',
    'we_show_system',
    'we_show_habitat_pill',
    'we_show_news_btn',
    'we_show_weather_btn',
    'we_show_air_btn',
    'we_show_focus_btn',
    'we_show_calendar_btn',
    'we_show_notes_btn',
    'we_show_data_btn',
    'we_center_offset_y',
    'we_username',
    'we_city',
    'we_ambient_sound',
    'we_biome_creature_sounds',
    'we_ambient_volume',
  ]) {
    assert.ok(props[key], `Missing Wallpaper Engine property: ${key}`);
  }
  assert.equal(props.we_city.value, 'İstanbul');
  assert.equal(props.we_language.value, 'tr');
  assert.equal(props.we_taskbar_height.value, 48);
  assert.equal(props.we_arctic_christmas.value, true);
});

function bootWallpaperBundleInVm(initialStorage = {}) {
  class ClassList {
    values = new Set();
    add(...names) { names.forEach((n) => this.values.add(n)); }
    remove(...names) { names.forEach((n) => this.values.delete(n)); }
    contains(name) { return this.values.has(name); }
    toggle(name, force) {
      const shouldAdd = force === undefined ? !this.values.has(name) : Boolean(force);
      shouldAdd ? this.values.add(name) : this.values.delete(name);
      return shouldAdd;
    }
  }

  const context2d = new Proxy({
    imageSmoothingEnabled: false,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
  }, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => ((o[k] = v), true) });

  class FakeElement {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.dataset = {};
      this.style = new Proxy({ setProperty: (k, v) => { this.style[k] = v; } }, {
        get: (o, k) => o[k] ?? '',
        set: (o, k, v) => ((o[k] = v), true),
      });
      this.classList = new ClassList();
      this.attributes = {};
      this.value = '';
      this.textContent = '';
      this.innerHTML = '';
      this.width = 1;
      this.height = 1;
      this.files = [];
      this.parentElement = null;
      this.isConnected = true;
      this.hidden = false;
      this.selectedOptions = [{ value: '', dataset: {} }];
    }
    addEventListener() {}
    removeEventListener() {}
    appendChild(child) {
      if (child && typeof child === 'object') {
        this.children.push(child);
        child.parentElement = this;
      }
      return child;
    }
    prepend(child) {
      if (child && typeof child === 'object') {
        this.children.unshift(child);
        child.parentElement = this;
      }
    }
    insertBefore(child) { return this.appendChild(child); }
    insertAdjacentElement(_pos, el) { return this.appendChild(el); }
    append(...children) { children.forEach((c) => this.appendChild(c)); }
    replaceChildren(...children) { this.children = []; this.append(...children); }
    remove() {}
    click() {}
    focus() {}
    blur() {}
    reset() {}
    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k] ?? null; }
    removeAttribute(k) { delete this.attributes[k]; }
    setCustomValidity() {}
    reportValidity() { return true; }
    contains() { return false; }
    closest() { return null; }
    querySelector() { return new FakeElement(); }
    querySelectorAll() { return []; }
    getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 }; }
    getClientRects() { return [{ width: 1, height: 1 }]; }
    getContext() { return context2d; }
    get className() { return [...this.classList.values].join(' '); }
    set className(v) { this.classList.values = new Set(String(v).split(/\s+/).filter(Boolean)); }
  }

  const elements = new Map();
  const getElement = (id) => {
    if (!elements.has(id)) {
      const el = new FakeElement(id === 'habitatCanvas' ? 'canvas' : 'div');
      el.id = id;
      el.parentElement = new FakeElement('div');
      elements.set(id, el);
    }
    return elements.get(id);
  };
  const body = getElement('body');
  const documentElement = new FakeElement('html');
  const documentMock = {
    body,
    hidden: false,
    documentElement,
    getElementById: getElement,
    querySelectorAll: () => [],
    querySelector: () => new FakeElement(),
    createElement: (tag) => new FakeElement(tag),
    createDocumentFragment: () => new FakeElement('fragment'),
    addEventListener() {},
    removeEventListener() {},
  };
  const storage = new Map(Object.entries(initialStorage));
  const localStorageMock = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    key: (i) => [...storage.keys()][i] ?? null,
    get length() { return storage.size; },
  };
  const media = { matches: false, addEventListener() {}, addListener() {} };
  const windowMock = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener() {},
    removeEventListener() {},
    matchMedia: () => media,
    location: { reload() {}, protocol: 'file:', hostname: '' },
    confirm: () => true,
  };

  const sandbox = {
    document: documentMock,
    window: windowMock,
    localStorage: localStorageMock,
    navigator: { onLine: false },
    performance: { now: () => 1000 },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    matchMedia: () => media,
    fetch: () => Promise.reject(new Error('offline in unit test')),
    setInterval: () => 1,
    clearInterval() {},
    setTimeout: () => 1,
    clearTimeout() {},
    URL: globalThis.URL,
    URLSearchParams: globalThis.URLSearchParams,
    Blob: globalThis.Blob,
    AbortController: globalThis.AbortController,
    Intl: globalThis.Intl,
    console,
  };

  vm.createContext(sandbox);
  vm.runInContext(wallpaperBundle, sandbox);
  return { windowMock, body, documentElement, getElement, storage };
}

test('wallpaper.bundle.js executes cleanly and registers window.wallpaperPropertyListener', () => {
  const { windowMock, body, documentElement, getElement } = bootWallpaperBundleInVm();

  assert.ok(windowMock.wallpaperPropertyListener, 'wallpaperPropertyListener must be registered on window');
  assert.equal(typeof windowMock.wallpaperPropertyListener.applyUserProperties, 'function');

  // Test applying user properties from Wallpaper Engine
  windowMock.wallpaperPropertyListener.applyUserProperties({
    we_habitat: { value: 'koi' },
    we_theme_mode: { value: 'light' },
    we_taskbar_height: { value: 60 },
    we_topbar_mode: { value: 'autohide' },
    we_show_clock: { value: false },
    we_clock_seconds: { value: true },
    we_pixel_font: { value: 'jersey20' },
    we_show_search: { value: true },
    we_show_dock: { value: true },
    we_center_offset_y: { value: -12 },
    we_username: { value: 'GezginTest' },
  });

  assert.equal(body.classList.contains('theme-light'), true);
  assert.equal(body.classList.contains('we-topbar-autohide'), true);
  assert.equal(body.classList.contains('we-hide-clock'), true);
  assert.equal(body.classList.contains('we-hide-search'), false);
  assert.equal(body.dataset.pixelFont, 'jersey20');
  assert.equal(windowMock.__weClockSeconds, true);
  assert.match(getElement('heroClock').textContent, /^\d{2}:\d{2}:\d{2}$/);
  assert.equal(typeof windowMock.__weSyncPopoverGlassPlate, 'function');
  assert.equal(getElement('editableUserName').textContent, 'GezginTest');
  assert.equal(documentElement.style['--we-taskbar-height'], '60px');
  assert.equal(documentElement.style['--we-center-offset-y'], '-12vh');
  assert.ok(wallpaperCss.includes('.desktop-launcher-drawer'));

  // Verify Smart Calendar Engine: Turkish holidays, date-range academic timetable, permanent work, holiday skipping & free time
  const cal = windowMock.__weCalendarHelpers;
  assert.ok(cal, 'Smart Calendar helpers must be registered on window');
  assert.ok(cal.getTurkishObservances('2026-10-29').holidays.some((h) => h.includes('Cumhuriyet')));
  assert.ok(cal.getTurkishObservances('2026-03-20').holidays.some((h) => h.includes('Ramazan')));
  assert.ok(cal.getTurkishObservances('2026-05-27').holidays.some((h) => h.includes('Kurban')));
  assert.equal(cal.getTurkishObservances('2026-11-10').holidays.length, 0);
  assert.ok(cal.getTurkishObservances('2026-11-10').specials.some((s) => s.includes('10 Kasım')));

  const routines = cal.normalizeCalendarRoutines([
    {
      id: 'rt-math',
      title: 'Veri Yapıları',
      category: 'school',
      days: [4], // Thursday
      startTime: '09:00',
      endTime: '11:00',
      mode: 'range',
      startDate: '01.10.2026',
      endDate: '30.11.2026',
      skipHolidays: true,
    },
    {
      id: 'rt-work',
      title: 'Ofis Mesaisi',
      category: 'work',
      days: [1, 2, 3, 4, 5],
      startTime: '13:00',
      endTime: '18:00',
      mode: 'permanent',
      skipHolidays: true,
    },
  ]);
  assert.equal(routines.length, 2);

  const cfg = { showHolidays: true, showSpecialDays: true, showNationalTeam: true, clubTeam: 'gs' };
  const sampleFixtures = [
    { id: 'fx-1', teamKey: 'gs', isNational: false, date: '2026-10-22', time: '20:45', title: 'Galatasaray - Aston Villa', league: 'Şampiyonlar Ligi', completed: false, score: '' },
  ];

  // Normal Thursday inside academic range: has class + work + match, and accurate free-time windows
  const normalThu = cal.getSmartDayData('2026-10-22', [], routines, cfg, sampleFixtures);
  assert.equal(normalThu.isOfficialHoliday, false);
  assert.ok(normalThu.items.some((i) => i.title === 'Veri Yapıları'));
  assert.ok(normalThu.items.some((i) => i.title === 'Ofis Mesaisi'));
  assert.ok(normalThu.items.some((i) => i.kind === 'match' && i.title.includes('Aston Villa')));
  assert.deepEqual(Array.from(normalThu.free, (f) => f.label), ['08:00–09:00', '11:00–13:00', '18:00–20:45', '22:45–23:00']);

  // 29 Ekim 2026 (Thursday — Official Holiday): BOTH school & work MUST be skipped!
  const holidayThu = cal.getSmartDayData('2026-10-29', [], routines, cfg, []);
  assert.equal(holidayThu.isOfficialHoliday, true);
  assert.equal(holidayThu.skippedByHolidayCount, 2);
  assert.equal(holidayThu.items.some((i) => i.title === 'Veri Yapıları' || i.title === 'Ofis Mesaisi'), false);
  assert.equal(holidayThu.totalFreeMins, 15 * 60);

  // Thursday AFTER academic range (2026-12-03): school class ended, permanent work continues!
  const afterTermThu = cal.getSmartDayData('2026-12-03', [], routines, cfg, []);
  assert.equal(afterTermThu.items.some((i) => i.title === 'Veri Yapıları'), false);
  assert.equal(afterTermThu.items.some((i) => i.title === 'Ofis Mesaisi'), true);

  // Verify Global 3-Club + 1-National Team cap, legacy migration, and US/UK/DE/TR holidays
  const cappedCfg = cal.normalizeSmartCalConfig({
    holidayCountry: 'US',
    nationalTeam: { id: '448', code: 'ENG', nameTr: 'İngiltere', nameEn: 'England' },
    clubs: [
      { id: '359', name: 'Arsenal', short: 'ARS', league: 'Premier League' },
      { id: '86', name: 'Real Madrid', short: 'RMA', league: 'LaLiga' },
      { id: '432', name: 'Galatasaray', short: 'GS', league: 'Süper Lig' },
      { id: '132', name: 'Bayern Munich', short: 'BAY', league: 'Bundesliga' },
    ],
  });
  assert.equal(cappedCfg.clubs.length, 3, 'Club slots must cap at 3');
  assert.equal(cappedCfg.nationalTeam.id, '448');
  assert.equal(cappedCfg.holidayCountry, 'US');

  assert.ok(cal.getPublicObservances('2026-07-04', 'US', 'en').holidays.includes('Independence Day'));
  assert.ok(cal.getPublicObservances('2026-11-26', 'US', 'en').holidays.includes('Thanksgiving Day'));
  assert.ok(cal.getPublicObservances('2026-04-03', 'UK', 'en').holidays.includes('Good Friday'));
  assert.ok(cal.getPublicObservances('2026-12-26', 'UK', 'en').holidays.includes('Boxing Day'));
  assert.ok(cal.getPublicObservances('2026-10-03', 'DE', 'en').holidays.includes('German Unity Day'));

  // Verify live TR <-> EN language switching without breaking Turkish
  windowMock.wallpaperPropertyListener.applyUserProperties({ we_language: { value: 'en' } });
  assert.equal(windowMock.__weLang, 'en');
  assert.equal(documentElement.lang, 'en');
  assert.equal(getElement('themeModeLabel').textContent, 'Day');
  assert.match(getElement('greetingLabel').textContent, /^Good /);

  windowMock.wallpaperPropertyListener.applyUserProperties({ we_language: { value: 'tr' } });
  assert.equal(windowMock.__weLang, 'tr');
  assert.equal(documentElement.lang, 'tr');
  assert.equal(getElement('themeModeLabel').textContent, 'Gündüz');

  // Verify Wallpaper Engine occlusion pause hook, glass transition tracker & 1-click performance presets
  assert.equal(typeof windowMock.__weTrackGlassTransition, 'function');
  assert.equal(typeof windowMock.wallpaperPropertyListener.setPaused, 'function');
  windowMock.wallpaperPropertyListener.setPaused(true);
  assert.equal(windowMock.__wePaused, true);
  windowMock.wallpaperPropertyListener.setPaused(false);
  assert.equal(windowMock.__wePaused, false);

  windowMock.wallpaperPropertyListener.applyUserProperties({ we_perf_profile: { value: 'eco' } });
  assert.equal(windowMock.__weSceneFps, 24);
  assert.equal(windowMock.__weDetailTier, 1);
  assert.equal(windowMock.__weGlassFps, 15);
  assert.equal(windowMock.__weGlassQualityScale, 0.75);

  windowMock.wallpaperPropertyListener.applyUserProperties({ we_perf_profile: { value: 'high' } });
  assert.equal(windowMock.__weSceneFps, 60);
  assert.equal(windowMock.__weDetailTier, 2);
  assert.equal(windowMock.__weGlassFps, 30);
  assert.equal(windowMock.__weGlassQualityScale, 1);

  windowMock.wallpaperPropertyListener.applyUserProperties({ we_perf_profile: { value: 'balanced' } });
  assert.equal(windowMock.__weSceneFps, 30);
  assert.equal(windowMock.__weDetailTier, 1);
  assert.equal(windowMock.__weGlassFps, 20);
  assert.equal(windowMock.__weGlassQualityScale, 0.75);

  // Switch cleanly across all 8 biomes (including bees bear, upgraded wetland/koi/rainforest & arctic-aurora Christmas)
  for (const habId of ['bees', 'betta', 'dragonfly', 'butterfly', 'jellyfish', 'koi', 'rainforest', 'arctic-aurora']) {
    windowMock.wallpaperPropertyListener.applyUserProperties({ we_habitat: { value: habId } });
  }

  // Verify Arctic Christmas Theme toggles live without disabling Arctic permanent wildlife
  assert.equal(windowMock.__weArcticChristmas, true);
  windowMock.wallpaperPropertyListener.applyUserProperties({ we_arctic_christmas: { value: false } });
  assert.equal(windowMock.__weArcticChristmas, false);
  windowMock.wallpaperPropertyListener.applyUserProperties({ we_arctic_christmas: { value: true } });
  assert.equal(windowMock.__weArcticChristmas, true);
});

test('in-app settings survive reload when Wallpaper Engine emits unchanged project.json defaults', () => {
  const savedSettings = {
    taskbarHeight: 40,
    pixelFont: 'jersey15',
    arcticChristmas: false,
    sceneFps: 24,
    detailTier: 1,
    glassFps: 15,
    glassQuality: 0.75,
    showClock: false,
    userModified: true,
    taskbarMigratedV3: true,
    updatedAt: 1795100000000,
  };
  const savedPropSnapshot = {
    we_habitat: '"random"',
    we_theme_mode: '"dark"',
    we_taskbar_height: '48',
    we_pixel_font: '"departure"',
    we_arctic_christmas: 'true',
    we_perf_profile: '"balanced"',
    we_show_clock: 'true',
    we_language: '"tr"',
  };

  const { windowMock, body, documentElement } = bootWallpaperBundleInVm({
    diorama_we_settings_v1: JSON.stringify(savedSettings),
    diorama_we_prop_snapshot_v1: JSON.stringify(savedPropSnapshot),
  });

  // Boot should apply user-saved in-app settings immediately (including default 48px override 40px)
  assert.equal(documentElement.style['--we-taskbar-height'], '40px');
  assert.equal(body.dataset.pixelFont, 'jersey15');
  assert.equal(windowMock.__weArcticChristmas, false);
  assert.equal(windowMock.__weSceneFps, 24);
  assert.equal(body.classList.contains('we-hide-clock'), true);

  // Simulate Wallpaper Engine reload firing initial bulk properties from project.json defaults
  windowMock.wallpaperPropertyListener.applyUserProperties({
    we_habitat: { value: 'random' },
    we_theme_mode: { value: 'dark' },
    we_taskbar_height: { value: 48 },
    we_pixel_font: { value: 'departure' },
    we_arctic_christmas: { value: true },
    we_perf_profile: { value: 'balanced' },
    we_show_clock: { value: true },
    we_language: { value: 'tr' },
  });

  // Unchanged project.json defaults MUST NOT overwrite user's in-app customizations!
  assert.equal(documentElement.style['--we-taskbar-height'], '40px');
  assert.equal(body.dataset.pixelFont, 'jersey15');
  assert.equal(windowMock.__weArcticChristmas, false);
  assert.equal(windowMock.__weSceneFps, 24);
  assert.equal(body.classList.contains('we-hide-clock'), true);

  // Live single-property edit from Wallpaper Engine sidebar MUST still apply
  windowMock.wallpaperPropertyListener.applyUserProperties({
    we_taskbar_height: { value: 64 },
  });
  assert.equal(documentElement.style['--we-taskbar-height'], '64px');
});

test('upgrading from pre-snapshot userModified settings preserves in-app edits across initial bulk dump', () => {
  const { windowMock, body, documentElement, storage } = bootWallpaperBundleInVm({
    diorama_we_settings_v1: JSON.stringify({
      taskbarHeight: 44,
      pixelFont: 'pixelify',
      userModified: true,
      taskbarMigratedV3: true,
      updatedAt: 1795100000000,
    }),
  });

  windowMock.wallpaperPropertyListener.applyUserProperties({
    we_habitat: { value: 'random' },
    we_theme_mode: { value: 'dark' },
    we_taskbar_height: { value: 48 },
    we_pixel_font: { value: 'departure' },
    we_perf_profile: { value: 'balanced' },
    we_language: { value: 'tr' },
  });

  assert.equal(documentElement.style['--we-taskbar-height'], '44px');
  assert.equal(body.dataset.pixelFont, 'pixelify');
  assert.ok(storage.has('diorama_we_prop_snapshot_v1'), 'Baseline property snapshot should be captured on initial boot');
});

test('desktop bridge indexes local applications and filters by query and category', async () => {
  const index = await getDesktopIndex();
  assert.ok(Array.isArray(index) && index.length >= 10, 'Desktop index should include built-in and local items');

  const explorerSearch = await searchDesktopItems({ query: 'Dosya Gezgini', category: 'apps' });
  assert.ok(explorerSearch.results.some((item) => item.name === 'Dosya Gezgini' && item.kind === 'app'));

  const englishSystemSearch = await searchDesktopItems({ query: 'File Explorer', category: 'system' });
  assert.ok(englishSystemSearch.results.some((item) => item.nameEn === 'File Explorer' && item.isSystemTool === true));

  const highLimitSearch = await searchDesktopItems({ query: '', category: 'all', limit: 200 });
  if (index.length > 28) {
    assert.ok(highLimitSearch.results.length > 28, 'App search limit must support fetching well beyond 28 entries');
  }

  const folderSearch = await searchDesktopItems({ query: 'İndirilenler', category: 'folders' });
  assert.ok(folderSearch.results.some((item) => item.name === 'İndirilenler' && item.kind === 'folder'));

  assert.ok(wallpaperBundle.includes('desktopAppPickerSearch'), 'App picker modal must include search input');
  assert.ok(wallpaperBundle.includes('desktop-picker-tabs'), 'App picker modal must include category filter tabs');
  assert.ok(wallpaperBundle.includes('limit=450'), 'Wallpaper picker must fetch full A-Z app catalog (limit=450)');
  assert.ok(wallpaperCss.includes('.desktop-picker-search-input'), 'Wallpaper CSS must style app picker search input');
});

test('Xiaomi MiOT telemetry parser disambiguates Air Purifier 4 (mb5/vb4) humidity & temp vs legacy 3H (mb3)', () => {
  // Standard Air Purifier 4 (zhimi.airp.mb5): siid 3 piid 1 = humidity (56%), piid 4 = PM2.5 (7), piid 7 = temp (22.8°C)
  const pur4Entries = [
    { did: 'power', code: 0, value: true },
    { did: 'mode_p4', code: 0, value: 0 },
    { did: 'hum_p1', code: 0, value: 56 },
    { did: 'pm25_p4', code: 0, value: 7 },
    { did: 'temp_p7', code: 0, value: 22.8 },
    { did: 'f_p3', code: 0, value: 84 },
    { did: 'f_p4', code: 0, value: 132 },
  ];
  const { telemetry: t4, modePiid } = parseXiaomiMiotTelemetry(pur4Entries, { ip: '192.168.1.50', model: 'zhimi.airp.mb5' });
  assert.equal(t4.humidity, 56);
  assert.equal(t4.temperature, 22.8);
  assert.equal(t4.pm25, 7);
  assert.equal(t4.filterLife, 84);
  assert.equal(t4.filterLeftDays, 132);
  assert.equal(modePiid, 4);

  // Air Purifier 4 Pro (zhimi.airp.vb4) where piid 8 is PM10
  const pur4Pro = parseXiaomiMiotTelemetry([
    ...pur4Entries,
    { did: 'env_p8', code: 0, value: 14 },
  ], { ip: '192.168.1.50', model: 'zhimi.airp.vb4' });
  assert.equal(pur4Pro.telemetry.humidity, 56);
  assert.equal(pur4Pro.telemetry.temperature, 22.8);
  assert.equal(pur4Pro.telemetry.pm10, 14);

  // Legacy Air Purifier 3H (zhimi.airpurifier.mb3): 3.1 absent, 3.7=humidity (49%), 3.8=temp (21.5°C)
  const pur3h = parseXiaomiMiotTelemetry([
    { did: 'power', code: 0, value: true },
    { did: 'mode_p5', code: 0, value: 1 },
    { did: 'pm25_p6', code: 0, value: 11 },
    { did: 'temp_p7', code: 0, value: 49 },
    { did: 'env_p8', code: 0, value: 21.5 },
  ], { ip: '192.168.1.51', model: 'zhimi.airpurifier.mb3' });
  assert.equal(pur3h.telemetry.humidity, 49);
  assert.equal(pur3h.telemetry.temperature, 21.5);
  assert.equal(pur3h.telemetry.pm25, 11);
  assert.equal(pur3h.modePiid, 5);
});

test('ESPN sports fixture parser converts UTC kickoff times to Istanbul TSİ and localizes Turkish leagues', () => {
  const parsed = parseEspnScheduleEvents([
    {
      id: '701234',
      date: '2026-11-24T17:45Z',
      name: 'Aston Villa at Galatasaray',
      league: { shortName: 'UEFA Champions League' },
      competitions: [{
        status: { type: { completed: false } },
        competitors: [
          { homeAway: 'home', team: { id: '432', shortDisplayName: 'Galatasaray' } },
          { homeAway: 'away', team: { id: '362', shortDisplayName: 'Aston Villa' } },
        ],
      }],
    },
    {
      id: '701235',
      date: '2026-11-15T19:45Z',
      name: 'Türkiye at France',
      league: { shortName: 'UEFA Nations League' },
      competitions: [{
        status: { type: { completed: true } },
        competitors: [
          { homeAway: 'home', team: { id: '478', shortDisplayName: 'France' }, score: { displayValue: '1' } },
          { homeAway: 'away', team: { id: '465', shortDisplayName: 'Türkiye' }, score: { displayValue: '2' } },
        ],
      }],
    },
  ], { teamKey: 'gs', teamId: '432', isNational: false });

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].date, '2026-11-24');
  assert.equal(parsed[0].time, '20:45');
  assert.equal(parsed[0].title, 'Galatasaray - Aston Villa');
  assert.equal(parsed[0].league, 'Şampiyonlar Ligi');
  assert.equal(parsed[1].title, 'Fransa - Türkiye');
  assert.equal(parsed[1].score, '1-2');
  assert.equal(parsed[1].league, 'UEFA Uluslar Ligi');

  // English localization + Europe/London timezone
  const parsedEn = parseEspnScheduleEvents([
    {
      id: '701236',
      date: '2026-11-24T20:00Z',
      name: 'Real Madrid at Arsenal',
      league: { shortName: 'UEFA Champions League' },
      competitions: [{
        status: { type: { completed: false } },
        competitors: [
          { homeAway: 'home', team: { id: '359', shortDisplayName: 'Arsenal' } },
          { homeAway: 'away', team: { id: '86', shortDisplayName: 'Real Madrid' } },
        ],
      }],
    },
  ], { teamKey: '359', teamId: '359', isNational: false, tz: 'Europe/London', lang: 'en' });
  assert.equal(parsedEn.length, 1);
  assert.equal(parsedEn[0].time, '20:00');
  assert.equal(parsedEn[0].title, 'Arsenal - Real Madrid');
  assert.equal(parsedEn[0].league, 'Champions League');
});

test('NVIDIA SMI telemetry parser extracts GPU name, load, VRAM, temperature and wattage', () => {
  const gpu = parseNvidiaSmiCsv('NVIDIA GeForce RTX 5050 Laptop GPU, 24, 1420, 8151, 52.4, 18.6\n');
  assert.ok(gpu);
  assert.equal(gpu.name, 'RTX 5050 Laptop');
  assert.equal(gpu.utilPct, 24);
  assert.equal(gpu.vramUsedMb, 1420);
  assert.equal(gpu.vramTotalMb, 8151);
  assert.equal(gpu.tempC, 52.4);
  assert.equal(gpu.powerW, 18.6);
});

test('generated launcher scripts and wallpaper bundle contain no hardcoded user paths or personal secrets', async () => {
  const files = [
    '../start-desktop-bridge.bat',
    '../install-startup-bridge.bat',
    '../dist-wallpaper/start-desktop-bridge.bat',
    '../dist-wallpaper/install-startup-bridge.bat',
    '../build-wallpaper.bat',
  ];
  for (const rel of files) {
    const text = await readFile(new URL(rel, import.meta.url), 'utf8');
    assert.doesNotMatch(text, /C:\\Users\\/i, `${rel} must not contain hardcoded C:\\Users\\ path`);
    assert.match(text, /%~dp0/, `${rel} must resolve scripts relative to %~dp0`);
  }
  assert.doesNotMatch(wallpaperBundle, /C:\\Users\\/i, 'wallpaper.bundle.js must not contain hardcoded user paths');
  assert.doesNotMatch(wallpaperBundle, /192\.168\.3\./, 'wallpaper.bundle.js must not contain personal LAN IPs');
});

test('getArcticLedges memoizes ledge geometry by dimensions to avoid per-frame allocations', () => {
  const first = getArcticLedges(420, 240);
  const second = getArcticLedges(420, 240);
  const resized = getArcticLedges(500, 240);
  assert.equal(first, second);
  assert.notEqual(first, resized);
});

