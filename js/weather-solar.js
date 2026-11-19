/* WEATHER-SOLAR — Living Pixel Diorama
   Pure real-time solar state & weather sync scheduling helpers. */

export const WEATHER_SYNC_INTERVAL_MS = 10 * 60 * 1000;
export const WEATHER_WAKE_STALE_MS = 5 * 60 * 1000;
export const WEATHER_SOLAR_TICK_MS = 30 * 1000;
export const WEATHER_RETRY_BACKOFF_MS = [90 * 1000, 3 * 60 * 1000, 5 * 60 * 1000, 10 * 60 * 1000];

function clampSolarUnit(v) {
    return Math.max(0, Math.min(1, v));
}

export function parseWeatherLocalTime(value) {
    if (typeof value !== 'string' || !value) return new Date(NaN);
    // Open-Meteo returns wall-clock ISO values for timezone=auto. Keeping them
    // on one neutral timeline makes sun-progress differences independent of
    // the device timezone; explicit offsets are preserved when present.
    return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
}

export function computeLiveSolarState(data, nowMs = Date.now()) {
    const fallback = {
        isDay: Boolean(data?.current?.is_day),
        sunP: 0.5,
        moonP: 0.5,
        dayIdx: 0,
        cityWallMs: NaN,
        cityHourPrefix: '',
    };
    if (!data || !data.current || !data.daily || !Array.isArray(data.daily.sunrise) || !Array.isArray(data.daily.sunset) || !Number.isFinite(nowMs)) {
        return fallback;
    }

    let cityWallMs;
    if (Number.isFinite(data.utc_offset_seconds)) {
        cityWallMs = nowMs + data.utc_offset_seconds * 1000;
    } else {
        const local = new Date(nowMs);
        cityWallMs = Date.UTC(
            local.getFullYear(),
            local.getMonth(),
            local.getDate(),
            local.getHours(),
            local.getMinutes(),
            local.getSeconds(),
        );
    }
    if (!Number.isFinite(cityWallMs)) return fallback;

    const cityIso = new Date(cityWallMs).toISOString();
    const cityDateStr = cityIso.slice(0, 10);
    const cityHourPrefix = `${cityIso.slice(0, 13)}:00`;
    let dayIdx = Array.isArray(data.daily.time) ? data.daily.time.indexOf(cityDateStr) : -1;

    let srMs;
    let ssMs;
    let nextSrMs;
    let prevSsMs;
    if (dayIdx >= 0 && data.daily.sunrise[dayIdx] && data.daily.sunset[dayIdx]) {
        srMs = parseWeatherLocalTime(data.daily.sunrise[dayIdx]).getTime();
        ssMs = parseWeatherLocalTime(data.daily.sunset[dayIdx]).getTime();
        nextSrMs = dayIdx + 1 < data.daily.sunrise.length
            ? parseWeatherLocalTime(data.daily.sunrise[dayIdx + 1]).getTime()
            : srMs + 864e5;
        prevSsMs = dayIdx > 0
            ? parseWeatherLocalTime(data.daily.sunset[dayIdx - 1]).getTime()
            : ssMs - 864e5;
    } else {
        // Stale multi-day cache fallback: project day 0 sunrise/sunset wall-clock time onto current city date.
        dayIdx = 0;
        const baseSr = parseWeatherLocalTime(data.daily.sunrise[0]);
        const baseSs = parseWeatherLocalTime(data.daily.sunset[0]);
        const wallDate = new Date(cityWallMs);
        const dayStartMs = Date.UTC(wallDate.getUTCFullYear(), wallDate.getUTCMonth(), wallDate.getUTCDate());
        srMs = Number.isFinite(baseSr.getTime())
            ? dayStartMs + (baseSr.getUTCHours() * 3600 + baseSr.getUTCMinutes() * 60 + baseSr.getUTCSeconds()) * 1000
            : NaN;
        ssMs = Number.isFinite(baseSs.getTime())
            ? dayStartMs + (baseSs.getUTCHours() * 3600 + baseSs.getUTCMinutes() * 60 + baseSs.getUTCSeconds()) * 1000
            : NaN;
        nextSrMs = srMs + 864e5;
        prevSsMs = ssMs - 864e5;
    }

    if (Number.isFinite(srMs) && Number.isFinite(ssMs) && ssMs > srMs) {
        const isDay = cityWallMs >= srMs && cityWallMs < ssMs;
        let sunP = 0.5;
        let moonP = 0.5;
        if (isDay) {
            sunP = clampSolarUnit((cityWallMs - srMs) / (ssMs - srMs));
        } else if (cityWallMs >= ssMs) {
            moonP = Number.isFinite(nextSrMs) && nextSrMs > ssMs
                ? clampSolarUnit((cityWallMs - ssMs) / (nextSrMs - ssMs))
                : 0.5;
        } else {
            moonP = Number.isFinite(prevSsMs) && srMs > prevSsMs
                ? clampSolarUnit((cityWallMs - prevSsMs) / (srMs - prevSsMs))
                : 0.5;
        }
        return { isDay, sunP, moonP, dayIdx, cityWallMs, cityHourPrefix };
    }

    return {
        isDay: Boolean(data.current.is_day),
        sunP: 0.5,
        moonP: 0.5,
        dayIdx: Math.max(0, dayIdx),
        cityWallMs,
        cityHourPrefix,
    };
}

export function shouldRefreshWeather({
    nowMs = Date.now(),
    lastFetchedAt = 0,
    lastAttemptAt = 0,
    lastFailed = false,
    consecutiveFailures = 0,
    hasData = false,
    reason = 'tick',
    isHidden = false,
    isPaused = false,
    isOnline = true,
    inFlight = false,
} = {}) {
    if (reason === 'manual') return true;
    if (inFlight || isHidden || isPaused || isOnline === false) return false;

    const backoffIdx = Math.max(0, Math.min(WEATHER_RETRY_BACKOFF_MS.length - 1, Math.max(1, consecutiveFailures) - 1));
    const retryDelay = WEATHER_RETRY_BACKOFF_MS[backoffIdx];

    if (!hasData || !Number.isFinite(lastFetchedAt) || lastFetchedAt <= 0) {
        if (lastFailed && Number.isFinite(lastAttemptAt) && lastAttemptAt > 0) {
            if (reason === 'online') return true;
            return (nowMs - lastAttemptAt) >= retryDelay;
        }
        return true;
    }

    const ageMs = Math.max(0, nowMs - lastFetchedAt);
    if (lastFailed) {
        if (reason === 'online') return true;
        if (!Number.isFinite(lastAttemptAt) || lastAttemptAt <= 0 || (nowMs - lastAttemptAt) >= retryDelay) return true;
        return false;
    }

    if (reason === 'online') return ageMs >= 60 * 1000;
    if (reason === 'wake' || reason === 'popover') return ageMs >= WEATHER_WAKE_STALE_MS;
    return ageMs >= WEATHER_SYNC_INTERVAL_MS;
}
