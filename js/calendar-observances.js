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
