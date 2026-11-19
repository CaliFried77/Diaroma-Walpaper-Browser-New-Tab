import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  getWebPublicObservances,
  parseFlexibleDateInput,
  normalizeWebCalendarRoutines,
  computeFreeTimeWindows,
  getWebSmartDayData,
  getUpcomingWebObservances,
} from '../js/calendar-observances.js';

const [
  builtHtml,
  builtSw,
  webStudioCss,
  wallpaperHtml,
  wallpaperBundle,
] = await Promise.all([
  readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist/sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../dist/css/web-studio.css', import.meta.url), 'utf8'),
  readFile(new URL('../dist-wallpaper/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../dist-wallpaper/js/wallpaper.bundle.js', import.meta.url), 'utf8'),
]);

test('website build includes Unified Hybrid Liquid Glass studio CSS, fonts, 2-col news and Service Worker precache', () => {
  assert.match(builtHtml, /href="\.\/css\/web-studio\.css"/);
  assert.match(builtHtml, /rel="modulepreload" href="\.\/js\/12-web-studio\.js"/);
  assert.match(builtHtml, /rel="modulepreload" href="\.\/js\/calendar-observances\.js"/);
  assert.ok(builtSw.includes('./css/web-studio.css'));
  assert.ok(builtSw.includes('./js/12-web-studio.js'));
  assert.ok(builtSw.includes('./js/calendar-observances.js'));

  for (const token of ['--we-glass-border:', '--we-glass-plate-bg:', '--we-glass-pocket-bg:', '--we-glass-float-scrim:']) {
    assert.ok(webStudioCss.includes(token), `Missing Hybrid Liquid Glass token in dist/css/web-studio.css: ${token}`);
  }
  for (const family of ["'Departure Mono'", "'Jersey 20'", "'Jersey 15'"]) {
    assert.ok(webStudioCss.includes(family), `Missing font declaration in web-studio.css: ${family}`);
  }
  // Ensure minifyCss preserved descendant spaces before :is(...) / :where(...)
  for (const broken of [']:is(', 'modal:is(', ']:where(', 'modal:where(']) {
    assert.ok(!webStudioCss.includes(broken), `CSS minifier corrupted descendant selector: ${broken}`);
  }
  assert.ok(webStudioCss.includes('body[data-pixel-font] :is('), 'Font switcher must preserve descendant :is() selector in dist CSS');
  assert.ok(webStudioCss.includes('.editorial-modal :is('), 'Readability pocket rule must preserve descendant :is() selector in dist CSS');

  for (const cls of ['.we-editorial-card', '.we-news-drawer', 'grid-template-columns:repeat(2,minmax(0,1fr))', '.we-cal-tabs', '.we-cal-timeline-track', '.we-cal-free-box', '.we-cal-day-pill']) {
    assert.ok(webStudioCss.includes(cls), `Missing ported feature rule in dist/css/web-studio.css: ${cls}`);
  }

  const forbiddenSizes = ['font-size:7px', 'font-size:8px', 'font-size:9px', 'font-size:10px', 'font-size:11px', 'font-size: 7px', 'font-size: 8px', 'font-size: 9px', 'font-size: 10px', 'font-size: 11px'];
  assert.ok(forbiddenSizes.every((s) => !webStudioCss.includes(s)), 'web-studio.css must avoid tiny fixed-pixel labels');
});

test('Wallpaper Engine build remains cleanly isolated from website studio layer', () => {
  assert.doesNotMatch(wallpaperHtml, /web-studio\.css/);
  assert.doesNotMatch(wallpaperBundle, /initWebStudio/);
  assert.doesNotMatch(wallpaperBundle, /WEB_PERF_PROFILES/);
  assert.doesNotMatch(wallpaperBundle, /getWebSmartDayData/);
});

test('getWebPublicObservances resolves TR, US, UK and DE public holidays & special days offline', () => {
  const trOct29 = getWebPublicObservances('2026-10-29', 'TR', 'tr');
  assert.ok(trOct29.holidays.some((h) => h.includes('Cumhuriyet')));
  const trEid = getWebPublicObservances('2026-03-20', 'TR', 'tr');
  assert.ok(trEid.holidays.some((h) => h.includes('Ramazan')));
  const trNov10 = getWebPublicObservances('2026-11-10', 'TR', 'tr');
  assert.equal(trNov10.holidays.length, 0);
  assert.ok(trNov10.specials.some((s) => s.includes('10 Kasım')));

  assert.ok(getWebPublicObservances('2026-07-04', 'US', 'en').holidays.includes('Independence Day'));
  assert.ok(getWebPublicObservances('2026-12-26', 'UK', 'en').holidays.includes('Boxing Day'));
  assert.ok(getWebPublicObservances('2026-10-03', 'DE', 'en').holidays.includes('German Unity Day'));
  assert.deepEqual(getWebPublicObservances('2026-10-29', 'none', 'tr'), { holidays: [], specials: [] });
});

test('offline Smart Calendar engine handles routines, automatic holiday skipping, free time & upcoming holidays', () => {
  assert.equal(parseFlexibleDateInput('29.10.2026'), '2026-10-29');
  assert.equal(parseFlexibleDateInput('2026-10-29'), '2026-10-29');
  assert.equal(parseFlexibleDateInput('31.02.2026'), null);

  const routines = normalizeWebCalendarRoutines([
    {
      id: 'cs-101',
      title: 'Veri Yapıları',
      category: 'school',
      days: [4], // Thursday
      startTime: '09:00',
      endTime: '11:00',
      mode: 'range',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
      skipHolidays: true,
    },
    {
      id: 'invalid-time',
      title: 'Bozuk Saat',
      category: 'work',
      days: [1],
      startTime: '14:00',
      endTime: '13:00',
      mode: 'permanent',
    },
  ]);
  assert.equal(routines.length, 1);

  // Normal Thursday (2026-10-22): 09:00-11:00 class active => 13h free in 08:00-23:00
  const normalThu = getWebSmartDayData('2026-10-22', [], routines, { holidayCountry: 'TR' }, 'tr');
  assert.equal(normalThu.isOfficialHoliday, false);
  assert.equal(normalThu.hasRoutine, true);
  assert.equal(normalThu.skippedByHolidayCount, 0);
  assert.equal(normalThu.totalFreeMins, 13 * 60);

  // Republic Day Thursday (2026-10-29): official holiday skips class => 15h free
  const holidayThu = getWebSmartDayData('2026-10-29', [], routines, { holidayCountry: 'TR' }, 'tr');
  assert.equal(holidayThu.isOfficialHoliday, true);
  assert.equal(holidayThu.hasHoliday, true);
  assert.equal(holidayThu.hasRoutine, false);
  assert.equal(holidayThu.skippedByHolidayCount, 1);
  assert.equal(holidayThu.totalFreeMins, 15 * 60);

  const freeMerged = computeFreeTimeWindows([
    { start: 9 * 60, end: 11 * 60 },
    { start: 10 * 60, end: 12 * 60 },
  ], 8 * 60, 23 * 60);
  assert.equal(freeMerged.mergedBusy.length, 1);
  assert.equal(freeMerged.free.map((x) => x.label).join(','), '08:00–09:00,12:00–23:00');
  assert.equal(freeMerged.totalFreeMins, 12 * 60);

  const upcomingTr = getUpcomingWebObservances(new Date('2026-10-20T12:00:00'), { holidayCountry: 'TR' }, 'tr', 5);
  assert.ok(upcomingTr.some((x) => x.dateKey === '2026-10-29' && x.kind === 'holiday'));
  assert.deepEqual(getUpcomingWebObservances(new Date('2026-10-20T12:00:00'), { holidayCountry: 'none' }, 'tr', 5), []);
});
