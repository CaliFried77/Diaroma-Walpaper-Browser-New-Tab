import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  WEATHER_SYNC_INTERVAL_MS,
  WEATHER_WAKE_STALE_MS,
  WEATHER_RETRY_BACKOFF_MS,
  computeLiveSolarState,
  shouldRefreshWeather,
} from '../js/weather-solar.js';

const weather = await readFile(new URL('../js/03-weather.js', import.meta.url), 'utf8');
const headers = await readFile(new URL('../_headers', import.meta.url), 'utf8');
const docs = await readFile(new URL('../docs/SECURITY.md', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const distHtml = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const widgetsCss = await readFile(new URL('../css/widgets.css', import.meta.url), 'utf8');
const launcher = await readFile(new URL('../wallpaper/wallpaper-launcher.js', import.meta.url), 'utf8');
const wallpaperBundle = await readFile(new URL('../dist-wallpaper/js/wallpaper.bundle.js', import.meta.url), 'utf8');

function makeForecastPayload(overrides = {}) {
  return {
    utc_offset_seconds: 10800,
    current: {
      time: '2026-11-19T14:00',
      is_day: 1,
    },
    daily: {
      time: ['2026-11-19', '2026-11-20'],
      sunrise: ['2026-11-19T07:54', '2026-11-20T07:55'],
      sunset: ['2026-11-19T17:42', '2026-11-20T17:41'],
    },
    ...overrides,
  };
}

test('air quality uses the documented Open-Meteo current variables', () => {
  assert.match(weather, /air-quality-api\.open-meteo\.com\/v1\/air-quality/);
  assert.match(weather, /current: 'european_aqi,pm2_5,pm10'/);
  assert.match(weather, /Number\.isFinite\(current\.european_aqi\)/);
  assert.match(headers, /https:\/\/air-quality-api\.open-meteo\.com/);
});

test('air quality is optional and cannot block a successful weather forecast', () => {
  assert.match(weather, /void fetchAirQuality\(latitude, longitude, requestId\)/);
  assert.match(weather, /async function fetchAirQuality/);
  assert.match(weather, /catch \{\s*if \(requestId === weatherRequestSeq\)/);
  assert.match(weather, /wx-air-unavailable/);
});

test('air quality panel discloses model forecast instead of implying a local sensor reading', () => {
  assert.match(weather, /CAMS model tahmini/);
  assert.match(weather, /yaklaşık 11–45 km çözünürlük/);
  assert.match(docs, /not a measurement from a nearby physical sensor/);
});

test('computeLiveSolarState switches at sunset and sunrise in real time without waiting for an API refetch', () => {
  const payloadDaySnapshot = makeForecastPayload({ current: { time: '2026-11-19T15:00', is_day: 1 } });
  const beforeSunset = computeLiveSolarState(payloadDaySnapshot, Date.UTC(2026, 10, 19, 14, 41, 0)); // 17:41 +03
  assert.equal(beforeSunset.isDay, true);
  assert.equal(beforeSunset.dayIdx, 0);
  assert.ok(beforeSunset.sunP > 0.95 && beforeSunset.sunP < 1);

  const afterSunset = computeLiveSolarState(payloadDaySnapshot, Date.UTC(2026, 10, 19, 14, 43, 0)); // 17:43 +03
  assert.equal(afterSunset.isDay, false);
  assert.ok(afterSunset.moonP > 0 && afterSunset.moonP < 0.05);

  const payloadNightSnapshot = makeForecastPayload({ current: { time: '2026-11-19T05:00', is_day: 0 } });
  const beforeSunrise = computeLiveSolarState(payloadNightSnapshot, Date.UTC(2026, 10, 19, 4, 53, 0)); // 07:53 +03
  assert.equal(beforeSunrise.isDay, false);
  assert.ok(beforeSunrise.moonP > 0.95 && beforeSunrise.moonP < 1);

  const afterSunrise = computeLiveSolarState(payloadNightSnapshot, Date.UTC(2026, 10, 19, 4, 55, 0)); // 07:55 +03
  assert.equal(afterSunrise.isDay, true);
  assert.ok(afterSunrise.sunP > 0 && afterSunrise.sunP < 0.05);
});

test('computeLiveSolarState handles overnight rollover, distant timezones, and stale caches', () => {
  const istanbul = makeForecastPayload();
  const nextDayMorning = computeLiveSolarState(istanbul, Date.UTC(2026, 10, 20, 5, 30, 0)); // 08:30 +03 on Nov 20
  assert.equal(nextDayMorning.dayIdx, 1);
  assert.equal(nextDayMorning.isDay, true);

  // Tokyo (UTC+9, 32400s): 16:40 local == 07:40 UTC -> sunset is 16:33 -> night
  const tokyo = makeForecastPayload({
    utc_offset_seconds: 32400,
    daily: {
      time: ['2026-11-19', '2026-11-20'],
      sunrise: ['2026-11-19T06:21', '2026-11-20T06:22'],
      sunset: ['2026-11-19T16:33', '2026-11-20T16:32'],
    },
  });
  const tokyoNight = computeLiveSolarState(tokyo, Date.UTC(2026, 10, 19, 7, 40, 0));
  assert.equal(tokyoNight.isDay, false);

  // New York (UTC-5, -18000s): 15:00 local == 20:00 UTC -> sunset is 16:35 -> day
  const newYork = makeForecastPayload({
    utc_offset_seconds: -18000,
    daily: {
      time: ['2026-11-19', '2026-11-20'],
      sunrise: ['2026-11-19T06:48', '2026-11-20T06:49'],
      sunset: ['2026-11-19T16:35', '2026-11-20T16:34'],
    },
  });
  const nyDay = computeLiveSolarState(newYork, Date.UTC(2026, 10, 19, 20, 0, 0));
  assert.equal(nyDay.isDay, true);

  // Stale cache well past forecast horizon projects day 0 sunrise/sunset onto current date
  const stalePastHorizon = computeLiveSolarState(istanbul, Date.UTC(2026, 10, 25, 16, 0, 0)); // 19:00 +03
  assert.equal(stalePastHorizon.isDay, false);
});

test('shouldRefreshWeather enforces sync intervals, wake freshness, retry backoff, and manual bypass', () => {
  const baseNow = Date.UTC(2026, 10, 19, 12, 0, 0);

  assert.equal(shouldRefreshWeather({
    nowMs: baseNow,
    lastFetchedAt: baseNow - 4 * 60 * 1000,
    hasData: true,
    reason: 'tick',
  }), false);

  assert.equal(shouldRefreshWeather({
    nowMs: baseNow,
    lastFetchedAt: baseNow - WEATHER_SYNC_INTERVAL_MS,
    hasData: true,
    reason: 'tick',
  }), true);

  assert.equal(shouldRefreshWeather({
    nowMs: baseNow,
    lastFetchedAt: baseNow - 2 * 60 * 1000,
    hasData: true,
    reason: 'wake',
  }), false);

  assert.equal(shouldRefreshWeather({
    nowMs: baseNow,
    lastFetchedAt: baseNow - WEATHER_WAKE_STALE_MS,
    hasData: true,
    reason: 'wake',
  }), true);

  assert.equal(shouldRefreshWeather({
    nowMs: baseNow,
    lastFetchedAt: baseNow - WEATHER_WAKE_STALE_MS,
    hasData: true,
    reason: 'popover',
  }), true);

  // Retry backoff after failed attempt
  assert.equal(shouldRefreshWeather({
    nowMs: baseNow,
    lastFetchedAt: baseNow - WEATHER_SYNC_INTERVAL_MS,
    lastAttemptAt: baseNow - 30 * 1000,
    lastFailed: true,
    consecutiveFailures: 1,
    hasData: true,
    reason: 'tick',
  }), false);

  assert.equal(shouldRefreshWeather({
    nowMs: baseNow,
    lastFetchedAt: baseNow - WEATHER_SYNC_INTERVAL_MS,
    lastAttemptAt: baseNow - WEATHER_RETRY_BACKOFF_MS[0],
    lastFailed: true,
    consecutiveFailures: 1,
    hasData: true,
    reason: 'tick',
  }), true);

  assert.equal(shouldRefreshWeather({
    nowMs: baseNow,
    lastFetchedAt: baseNow - WEATHER_SYNC_INTERVAL_MS,
    lastAttemptAt: baseNow - WEATHER_RETRY_BACKOFF_MS[0],
    lastFailed: true,
    consecutiveFailures: 2,
    hasData: true,
    reason: 'tick',
  }), false);

  // Paused / hidden / offline guards
  assert.equal(shouldRefreshWeather({ nowMs: baseNow, hasData: false, isHidden: true, reason: 'tick' }), false);
  assert.equal(shouldRefreshWeather({ nowMs: baseNow, hasData: false, isPaused: true, reason: 'tick' }), false);
  assert.equal(shouldRefreshWeather({ nowMs: baseNow, hasData: false, isOnline: false, reason: 'wake' }), false);

  // Manual refresh always triggers immediately
  assert.equal(shouldRefreshWeather({
    nowMs: baseNow,
    lastFetchedAt: baseNow - 1000,
    hasData: true,
    isPaused: true,
    inFlight: true,
    reason: 'manual',
  }), true);
});

test('weather refresh button and solar auto-theme hooks are wired for both Web and Wallpaper Engine', () => {
  const popoverStart = html.indexOf('id="weatherPopover"');
  const focusStart = html.indexOf('id="focusBtn"');
  const weatherSection = html.slice(popoverStart, focusStart);
  assert.match(weatherSection, /id="refreshWeatherBtn"/);
  assert.match(distHtml, /id="refreshWeatherBtn"/);

  assert.match(widgetsCss, /\.wx-icon-btn\b/);
  assert.match(widgetsCss, /@keyframes wx-spin/);

  assert.match(weather, /refreshWeatherBtn/);
  assert.match(weather, /WEATHER_SOLAR_TICK_MS/);
  assert.match(weather, /syncWeatherSolarAndTheme/);
  assert.match(weather, /window\.__weSyncWeatherOnWake/);

  assert.match(launcher, /window\.__weSyncWeatherOnWake/);
  assert.match(launcher, /const isDay = WX\.live \? Boolean\(WX\.live\.isDay\) : Boolean\(c\.is_day\)/);
  assert.match(launcher, /lsRaw\('diorama_wx_autotheme'\)/);
  assert.match(wallpaperBundle, /window\.__weSyncWeatherOnWake/);
  assert.match(wallpaperBundle, /WX\.live \? Boolean\(WX\.live\.isDay\)/);
});
