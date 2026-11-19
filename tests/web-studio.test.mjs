import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getWebPublicObservances } from '../js/calendar-observances.js';

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

test('website build includes Unified Hybrid Liquid Glass studio CSS, fonts and Service Worker precache', () => {
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
  const forbiddenSizes = ['font-size:7px', 'font-size:8px', 'font-size:9px', 'font-size:10px', 'font-size:11px', 'font-size: 7px', 'font-size: 8px', 'font-size: 9px', 'font-size: 10px', 'font-size: 11px'];
  assert.ok(forbiddenSizes.every((s) => !webStudioCss.includes(s)), 'web-studio.css must avoid tiny fixed-pixel labels');
});

test('Wallpaper Engine build remains cleanly isolated from website studio layer', () => {
  assert.doesNotMatch(wallpaperHtml, /web-studio\.css/);
  assert.doesNotMatch(wallpaperBundle, /initWebStudio/);
  assert.doesNotMatch(wallpaperBundle, /WEB_PERF_PROFILES/);
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
});
