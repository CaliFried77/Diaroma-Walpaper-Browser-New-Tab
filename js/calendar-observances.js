/* CALENDAR-OBSERVANCES — Pure offline public holiday & special observance resolver (TR/US/UK/DE).
   Zero DOM, Canvas or network dependencies. */

const TR_FIXED_HOLIDAYS = {
  '01-01': { tr: 'Yılbaşı', en: "New Year's Day" },
  '04-23': { tr: 'Ulusal Egemenlik ve Çocuk Bayramı', en: 'National Sovereignty & Children’s Day' },
  '05-01': { tr: 'Emek ve Dayanışma Günü', en: 'Labour & Solidarity Day' },
  '05-19': { tr: 'Atatürk’ü Anma, Gençlik ve Spor Bayramı', en: 'Commemoration of Atatürk, Youth & Sports' },
  '07-15': { tr: 'Demokrasi ve Millî Birlik Günü', en: 'Democracy & National Unity Day' },
  '08-30': { tr: 'Zafer Bayramı', en: 'Victory Day' },
  '10-29': { tr: 'Cumhuriyet Bayramı', en: 'Republic Day' },
};

const TR_SPECIAL_DAYS = {
  '03-18': { tr: '18 Mart Çanakkale Zaferi', en: 'Gallipoli Victory Day' },
  '11-10': { tr: '10 Kasım Atatürk’ü Anma Günü', en: 'Atatürk Memorial Day' },
  '11-24': { tr: 'Öğretmenler Günü', en: "Teachers' Day" },
};

const TR_RELIGIOUS_HOLIDAYS = {
  2025: [
    ['2025-03-30', '2025-04-01', 'Ramazan Bayramı', 'Eid al-Fitr'],
    ['2025-06-06', '2025-06-09', 'Kurban Bayramı', 'Eid al-Adha'],
  ],
  2026: [
    ['2026-03-20', '2026-03-22', 'Ramazan Bayramı', 'Eid al-Fitr'],
    ['2026-05-27', '2026-05-30', 'Kurban Bayramı', 'Eid al-Adha'],
  ],
  2027: [
    ['2027-03-09', '2027-03-11', 'Ramazan Bayramı', 'Eid al-Fitr'],
    ['2027-05-16', '2027-05-19', 'Kurban Bayramı', 'Eid al-Adha'],
  ],
  2028: [
    ['2028-02-26', '2028-02-28', 'Ramazan Bayramı', 'Eid al-Fitr'],
    ['2028-05-05', '2028-05-08', 'Kurban Bayramı', 'Eid al-Adha'],
  ],
};

function nthWeekdayOfMonth(year, month1, weekday0Sun, nth) {
  const first = new Date(year, month1 - 1, 1);
  const offset = (weekday0Sun - first.getDay() + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function lastWeekdayOfMonth(year, month1, weekday0Sun) {
  const last = new Date(year, month1, 0);
  const back = (last.getDay() - weekday0Sun + 7) % 7;
  const day = last.getDate() - back;
  return `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function easterSundayDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function formatYmd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDaysYmd(baseDate, days) {
  const copy = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + days);
  return formatYmd(copy);
}

/** Resolve official holidays & special observances offline without external APIs. */
export function getWebPublicObservances(dateKeyStr, country = 'TR', lang = 'tr') {
  const holidays = [];
  const specials = [];
  if (country === 'none') return { holidays, specials };
  if (typeof dateKeyStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKeyStr)) {
    return { holidays, specials };
  }
  const year = Number(dateKeyStr.slice(0, 4));
  const mmdd = dateKeyStr.slice(5);
  const useEn = lang === 'en';
  const cc = ['TR', 'US', 'UK', 'DE'].includes(country) ? country : 'TR';

  if (cc === 'TR') {
    if (TR_FIXED_HOLIDAYS[mmdd]) holidays.push(useEn ? TR_FIXED_HOLIDAYS[mmdd].en : TR_FIXED_HOLIDAYS[mmdd].tr);
    for (const [start, end, trName, enName] of TR_RELIGIOUS_HOLIDAYS[year] || []) {
      if (dateKeyStr >= start && dateKeyStr <= end) holidays.push(useEn ? enName : trName);
    }
    if (TR_SPECIAL_DAYS[mmdd]) specials.push(useEn ? TR_SPECIAL_DAYS[mmdd].en : TR_SPECIAL_DAYS[mmdd].tr);
    return { holidays, specials };
  }

  if (cc === 'US') {
    if (mmdd === '01-01') holidays.push(useEn ? "New Year's Day" : 'Yılbaşı');
    if (dateKeyStr === nthWeekdayOfMonth(year, 1, 1, 3)) holidays.push('Martin Luther King Jr. Day');
    if (dateKeyStr === lastWeekdayOfMonth(year, 5, 1)) holidays.push('Memorial Day');
    if (mmdd === '07-04') holidays.push(useEn ? 'Independence Day' : 'Bağımsızlık Günü (ABD)');
    if (dateKeyStr === nthWeekdayOfMonth(year, 9, 1, 1)) holidays.push('Labor Day');
    if (dateKeyStr === nthWeekdayOfMonth(year, 11, 4, 4)) holidays.push(useEn ? 'Thanksgiving Day' : 'Şükran Günü');
    if (mmdd === '12-25') holidays.push(useEn ? 'Christmas Day' : 'Noel');
    return { holidays, specials };
  }

  const easter = easterSundayDate(year);
  if (cc === 'UK') {
    if (mmdd === '01-01') holidays.push(useEn ? "New Year's Day" : 'Yılbaşı');
    if (dateKeyStr === addDaysYmd(easter, -2)) holidays.push('Good Friday');
    if (dateKeyStr === addDaysYmd(easter, 1)) holidays.push('Easter Monday');
    if (mmdd === '12-25') holidays.push(useEn ? 'Christmas Day' : 'Noel');
    if (mmdd === '12-26') holidays.push('Boxing Day');
    return { holidays, specials };
  }

  // DE (Germany)
  if (mmdd === '01-01') holidays.push(useEn ? 'New Year (Neujahr)' : 'Yılbaşı (Neujahr)');
  if (dateKeyStr === addDaysYmd(easter, -2)) holidays.push('Karfreitag');
  if (dateKeyStr === addDaysYmd(easter, 1)) holidays.push('Ostermontag');
  if (mmdd === '05-01') holidays.push(useEn ? 'Labour Day (Tag der Arbeit)' : 'İşçi Bayramı (Tag der Arbeit)');
  if (mmdd === '10-03') holidays.push(useEn ? 'German Unity Day' : 'Almanya Birlik Günü');
  if (mmdd === '12-25') holidays.push('1. Weihnachtstag');
  if (mmdd === '12-26') holidays.push('2. Weihnachtstag');
  return { holidays, specials };
}

const VALID_COUNTRIES = new Set(['TR', 'US', 'UK', 'DE', 'none']);
const VALID_ROUTINE_CATEGORIES = new Set(['school', 'work', 'routine']);

/** Parse 'HH:MM' into total minutes since midnight, or null if invalid. */
export function parseTimeToMins(str) {
  if (typeof str !== 'string') return null;
  const m = str.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

/** Format integer minutes since midnight as 'HH:MM'. */
export function formatMinsToTime(mins) {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(Number(mins) || 0)));
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Parse 'YYYY-MM-DD', 'DD.MM.YYYY', or 'DD/MM/YYYY' into validated 'YYYY-MM-DD'. */
export function parseFlexibleDateInput(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  let yyyy; let mm; let dd;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const tr = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (iso) {
    yyyy = Number(iso[1]); mm = Number(iso[2]); dd = Number(iso[3]);
  } else if (tr) {
    dd = Number(tr[1]); mm = Number(tr[2]); yyyy = Number(tr[3]);
  } else {
    return null;
  }
  if (yyyy < 1970 || yyyy > 2100 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const dt = new Date(yyyy, mm - 1, dd);
  if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null;
  return formatYmd(dt);
}

/** Format ISO 'YYYY-MM-DD' date key for user display. */
export function formatIsoToDisplayDate(isoKey, lang = 'tr') {
  if (typeof isoKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(isoKey)) return String(isoKey || '');
  if (lang === 'en') return isoKey;
  return `${isoKey.slice(8, 10)}.${isoKey.slice(5, 7)}.${isoKey.slice(0, 4)}`;
}

/** Convert 'YYYY-MM-DD' to ISO weekday (1 = Monday .. 7 = Sunday). */
export function getIsoWeekdayFromKey(dateKeyStr) {
  const dt = new Date(`${dateKeyStr}T12:00:00`);
  if (!Number.isFinite(dt.getTime())) return 1;
  return ((dt.getDay() + 6) % 7) + 1;
}

/** Normalize persisted web smart-calendar preferences. */
export function normalizeWebCalendarConfig(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const holidayCountry = VALID_COUNTRIES.has(src.holidayCountry) ? src.holidayCountry : 'TR';
  const dayStartHour = Number.isInteger(Number(src.dayStartHour))
    ? Math.max(5, Math.min(12, Number(src.dayStartHour)))
    : 8;
  const dayEndHour = Number.isInteger(Number(src.dayEndHour))
    ? Math.max(17, Math.min(24, Number(src.dayEndHour)))
    : 23;
  return {
    holidayCountry,
    showHolidays: src.showHolidays !== false,
    showSpecialDays: src.showSpecialDays !== false,
    dayStartHour,
    dayEndHour,
  };
}

/** Normalize recurring weekly school / work / personal routine rules. */
export function normalizeWebCalendarRoutines(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const item of raw.slice(0, 120)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const id = typeof item.id === 'string' && /^[a-z0-9_-]{4,80}$/i.test(item.id)
      ? item.id
      : `rt-${out.length + 1}`;
    if (seen.has(id)) continue;
    const title = String(item.title || '').trim().slice(0, 80);
    const category = VALID_ROUTINE_CATEGORIES.has(item.category) ? item.category : 'school';
    const days = Array.isArray(item.days)
      ? [...new Set(item.days.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b)
      : [];
    const startMin = parseTimeToMins(item.startTime);
    const endMin = parseTimeToMins(item.endTime);
    const mode = item.mode === 'permanent' ? 'permanent' : 'range';
    const startDate = mode === 'range' ? parseFlexibleDateInput(item.startDate) : null;
    const endDate = mode === 'range' ? parseFlexibleDateInput(item.endDate) : null;
    if (!title || !days.length || startMin === null || endMin === null || endMin <= startMin) continue;
    if (mode === 'range' && (!startDate || !endDate || endDate < startDate)) continue;
    seen.add(id);
    out.push({
      id,
      title,
      category,
      days,
      startTime: formatMinsToTime(startMin),
      endTime: formatMinsToTime(endMin),
      mode,
      startDate: startDate || '',
      endDate: endDate || '',
      skipHolidays: item.skipHolidays !== false,
    });
  }
  return out;
}

/** Merge busy time intervals and compute contiguous free-time slots (>= 15 min). */
export function computeFreeTimeWindows(busyIntervals, dayStart = 8 * 60, dayEnd = 23 * 60) {
  const safeStart = Math.max(0, Math.min(23 * 60, Number(dayStart) || 0));
  const safeEnd = Math.max(safeStart + 60, Math.min(24 * 60, Number(dayEnd) || 23 * 60));
  const clipped = [];
  for (const iv of Array.isArray(busyIntervals) ? busyIntervals : []) {
    if (!iv) continue;
    const s = Math.max(safeStart, Math.min(safeEnd, Number(iv.start)));
    const e = Math.max(safeStart, Math.min(safeEnd, Number(iv.end)));
    if (Number.isFinite(s) && Number.isFinite(e) && e > s) clipped.push({ start: s, end: e });
  }
  clipped.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged = [];
  for (const iv of clipped) {
    const last = merged[merged.length - 1];
    if (last && iv.start <= last.end) last.end = Math.max(last.end, iv.end);
    else merged.push({ start: iv.start, end: iv.end });
  }
  const free = [];
  let cursor = safeStart;
  for (const iv of merged) {
    if (iv.start - cursor >= 15) {
      free.push({
        start: cursor,
        end: iv.start,
        mins: iv.start - cursor,
        label: `${formatMinsToTime(cursor)}–${formatMinsToTime(iv.start)}`,
      });
    }
    cursor = Math.max(cursor, iv.end);
  }
  if (safeEnd - cursor >= 15) {
    free.push({
      start: cursor,
      end: safeEnd,
      mins: safeEnd - cursor,
      label: `${formatMinsToTime(cursor)}–${formatMinsToTime(safeEnd)}`,
    });
  }
  const totalFreeMins = free.reduce((sum, x) => sum + x.mins, 0);
  return { free, totalFreeMins, mergedBusy: merged };
}

/** Build the unified daily agenda, holiday skip state and free-time map offline. */
export function getWebSmartDayData(dateKeyStr, manualEventsList = [], routinesList = [], rawCfg = {}, lang = 'tr') {
  const en = lang === 'en';
  const L = (tr, enText) => (en ? enText : tr);
  const cfg = normalizeWebCalendarConfig(rawCfg);
  const obs = getWebPublicObservances(dateKeyStr, cfg.holidayCountry, lang);
  const isOfficialHoliday = cfg.holidayCountry !== 'none' && obs.holidays.length > 0;
  const isoDay = getIsoWeekdayFromKey(dateKeyStr);
  const items = [];
  const busy = [];
  let skippedByHolidayCount = 0;

  if (cfg.showHolidays && obs.holidays.length) {
    obs.holidays.forEach((name, idx) => {
      items.push({
        id: `hol-${dateKeyStr}-${idx}`,
        kind: 'holiday',
        badge: L('Resmî Tatil', 'Holiday'),
        timeText: L('Gün boyu', 'All day'),
        sortMin: -20,
        title: name,
        subtitle: L('Resmî tatil günü', 'Public holiday'),
      });
    });
  }

  if (cfg.showSpecialDays && obs.specials.length) {
    obs.specials.forEach((name, idx) => {
      items.push({
        id: `spc-${dateKeyStr}-${idx}`,
        kind: 'special',
        badge: L('Önemli Gün', 'Special'),
        timeText: L('Gün boyu', 'All day'),
        sortMin: -10,
        title: name,
        subtitle: '',
      });
    });
  }

  for (const rule of Array.isArray(routinesList) ? routinesList : []) {
    if (!rule || !Array.isArray(rule.days) || !rule.days.includes(isoDay)) continue;
    if (rule.mode === 'range' && (dateKeyStr < rule.startDate || dateKeyStr > rule.endDate)) continue;
    if (isOfficialHoliday && rule.skipHolidays) {
      skippedByHolidayCount += 1;
      continue;
    }
    const startMin = parseTimeToMins(rule.startTime);
    const endMin = parseTimeToMins(rule.endTime);
    const catBadge = rule.category === 'school'
      ? L('Ders', 'Class')
      : rule.category === 'work'
        ? L('İş', 'Work')
        : L('Rutin', 'Routine');
    const subText = rule.mode === 'permanent'
      ? L('Kalıcı haftalık program', 'Permanent weekly schedule')
      : `${formatIsoToDisplayDate(rule.startDate, lang)} – ${formatIsoToDisplayDate(rule.endDate, lang)}`;
    items.push({
      id: `occ-${rule.id}-${dateKeyStr}`,
      ruleId: rule.id,
      kind: rule.category,
      badge: catBadge,
      timeText: `${rule.startTime}–${rule.endTime}`,
      sortMin: startMin ?? 540,
      startMin,
      endMin,
      title: rule.title,
      subtitle: subText,
    });
    if (startMin !== null && endMin !== null) {
      busy.push({ start: startMin, end: endMin, kind: rule.category });
    }
  }

  for (const ev of Array.isArray(manualEventsList) ? manualEventsList : []) {
    if (!ev || ev.date !== dateKeyStr) continue;
    const startMin = parseTimeToMins(ev.time);
    items.push({
      id: ev.id,
      manualId: ev.id,
      kind: 'event',
      badge: L('Etkinlik', 'Event'),
      timeText: ev.time || L('Gün boyu', 'All day'),
      sortMin: startMin ?? 9999,
      startMin,
      endMin: startMin !== null ? Math.min(24 * 60, startMin + 60) : null,
      title: ev.title,
      subtitle: '',
    });
    if (startMin !== null) {
      busy.push({ start: startMin, end: Math.min(24 * 60, startMin + 60), kind: 'event' });
    }
  }

  items.sort((a, b) => a.sortMin - b.sortMin || a.title.localeCompare(b.title, en ? 'en' : 'tr'));
  const freeStats = computeFreeTimeWindows(busy, cfg.dayStartHour * 60, cfg.dayEndHour * 60);

  return {
    dateKey: dateKeyStr,
    isOfficialHoliday,
    holidays: obs.holidays,
    specials: obs.specials,
    skippedByHolidayCount,
    items,
    busy,
    free: freeStats.free,
    totalFreeMins: freeStats.totalFreeMins,
    hasHoliday: cfg.showHolidays && obs.holidays.length > 0,
    hasSpecial: cfg.showSpecialDays && obs.specials.length > 0,
    hasRoutine: items.some((i) => i.kind === 'school' || i.kind === 'work' || i.kind === 'routine'),
    hasManual: items.some((i) => i.kind === 'event'),
  };
}

/** Collect upcoming public holidays and observances for the next 365 days offline. */
export function getUpcomingWebObservances(fromDate = new Date(), rawCfg = {}, lang = 'tr', limit = 10) {
  const cfg = normalizeWebCalendarConfig(rawCfg);
  if (cfg.holidayCountry === 'none') return [];
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const out = [];
  for (let offset = 0; offset < 365 && out.length < limit; offset += 1) {
    const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    const key = formatYmd(dt);
    const obs = getWebPublicObservances(key, cfg.holidayCountry, lang);
    if (cfg.showHolidays && obs.holidays.length) {
      out.push({ dateKey: key, kind: 'holiday', names: obs.holidays });
    } else if (cfg.showSpecialDays && obs.specials.length) {
      out.push({ dateKey: key, kind: 'special', names: obs.specials });
    }
  }
  return out;
}
