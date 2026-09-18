import {
  HolidayDefinition,
  ComputedHoliday,
  DBHolidayWish,
  HolidayThemeAccent,
} from "./types";

/**
 * 14 Ghana Statutory Public Holidays Definitions
 */
export const GHANA_STATUTORY_HOLIDAYS: HolidayDefinition[] = [
  {
    key: "new_years_day",
    title: "New Year’s Day",
    dateType: "fixed",
    month: 1,
    day: 1,
    themeAccent: "festive",
    defaultHeadline: "Happy New Year from Voice of UPSA!",
    defaultBody: "May this new academic and professional year bring immense growth, groundbreaking achievements, and academic excellence to the entire UPSA community.",
    academicStatus: "University offices, faculties, and lecture halls closed.",
  },
  {
    key: "constitution_day",
    title: "Constitution Day",
    dateType: "fixed",
    month: 1,
    day: 7,
    themeAccent: "ghana_flag",
    defaultHeadline: "Commemorating Constitution Day",
    defaultBody: "Celebrating the enduring strength of the 1992 Fourth Republican Constitution of Ghana, upholding good governance, academic freedom, and democratic rule of law.",
    academicStatus: "Statutory public holiday — Lectures and administrative duties suspended.",
  },
  {
    key: "independence_day",
    title: "Independence Day",
    dateType: "fixed",
    month: 3,
    day: 6,
    themeAccent: "ghana_flag",
    defaultHeadline: "Happy Independence Day, Ghana! 🇬🇭",
    defaultBody: "Voice of UPSA salutes our national sovereignty, heritage, and collective resolve to build an exceptional African nation led by ethical professionals and leaders.",
    academicStatus: "National holiday — Campus academic activities suspended.",
  },
  {
    key: "good_friday",
    title: "Good Friday",
    dateType: "easter",
    themeAccent: "gold",
    defaultHeadline: "Reflective and Blessed Good Friday",
    defaultBody: "Wishing all Christian students, faculty, alumni, and friends of UPSA a peaceful and spiritually renewing Good Friday.",
    academicStatus: "Statutory public holiday — All campus operations suspended.",
  },
  {
    key: "easter_monday",
    title: "Easter Monday",
    dateType: "easter",
    themeAccent: "gold",
    defaultHeadline: "Joyous Easter Monday Wishes",
    defaultBody: "Celebrating life, renewal, and hope with the entire UPSA family. Have a joyful, restful, and safe holiday celebration.",
    academicStatus: "Statutory public holiday — Lectures resume on Tuesday.",
  },
  {
    key: "workers_day",
    title: "Workers’ Day (Labour Day)",
    dateType: "fixed",
    month: 5,
    day: 1,
    themeAccent: "gold",
    defaultHeadline: "Honouring All Workers & Lecturers on May Day",
    defaultBody: "We honor the dedication, scholarship, and tireless contributions of our lecturers, administrative personnel, and service staff who keep UPSA thriving.",
    academicStatus: "Labour Day holiday — Campus offices and classes closed.",
  },
  {
    key: "eid_ul_fitr",
    title: "Eid-ul-Fitr",
    dateType: "islamic",
    themeAccent: "crescent",
    defaultHeadline: "Eid Mubarak to the UPSA Muslim Community! 🌙",
    defaultBody: "May the blessings, sacrifice, and prayers of Ramadan enrich your spiritual walk and bring lasting peace, unity, and abundance to your families.",
    academicStatus: "Public holiday — Subject to official moon sighting announcement.",
  },
  {
    key: "shaqq_day",
    title: "Shaqq Day",
    dateType: "islamic",
    themeAccent: "crescent",
    defaultHeadline: "Blessed Shaqq Day Celebrations",
    defaultBody: "Extending continuous warm greetings to all Muslims as we observe Shaqq Day following the joyous Eid-ul-Fitr feast.",
    academicStatus: "Public holiday observed in Ghana.",
  },
  {
    key: "eid_ul_adha",
    title: "Eid-ul-Adha",
    dateType: "islamic",
    themeAccent: "crescent",
    defaultHeadline: "Eid-ul-Adha Mubarak! 🌙",
    defaultBody: "May the inspiring lessons of unwavering faith, obedience, and selflessness inspire our academic journey and personal lives.",
    academicStatus: "Public holiday — Gazetted by the Ministry of the Interior.",
  },
  {
    key: "republic_day",
    title: "Republic Day",
    dateType: "fixed",
    month: 7,
    day: 1,
    themeAccent: "ghana_flag",
    defaultHeadline: "Celebrating Ghana’s Republic Day 🇬🇭",
    defaultBody: "Remembering our republic’s journey and reaffirming our pledge as professional scholars to contribute constructively to national development.",
    academicStatus: "Senior Citizens & Republic Day commemoration.",
  },
  {
    key: "founders_day",
    title: "Founder’s Day",
    dateType: "fixed",
    month: 9,
    day: 21,
    themeAccent: "ghana_flag",
    defaultHeadline: "Commemorating Founder’s Day",
    defaultBody: "Honoring Osagyefo Dr. Kwame Nkrumah and the founding fathers whose visionary sacrifice ignited the flame of freedom across the African continent.",
    academicStatus: "Statutory public holiday.",
  },
  {
    key: "farmers_day",
    title: "National Farmers’ Day",
    dateType: "relative",
    month: 12,
    themeAccent: "laurel",
    defaultHeadline: "Saluting Ghana’s Farmers & Fishers",
    defaultBody: "Voice of UPSA celebrates the hardworking farmers and agribusiness champions who sustain our economy, universities, and communities.",
    academicStatus: "Statutory public holiday — Observed on the first Friday of December.",
  },
  {
    key: "christmas_day",
    title: "Christmas Day",
    dateType: "fixed",
    month: 12,
    day: 25,
    themeAccent: "festive",
    defaultHeadline: "Merry Christmas from Voice of UPSA! 🎄",
    defaultBody: "Wishing our student body, leadership, staff, and cherished readers a joyful and blessed Christmas filled with harmony, love, and goodwill.",
    academicStatus: "Christmas break — University in recess.",
  },
  {
    key: "boxing_day",
    title: "Boxing Day",
    dateType: "fixed",
    month: 12,
    day: 26,
    themeAccent: "festive",
    defaultHeadline: "Warm Boxing Day Wishes",
    defaultBody: "May the spirit of benevolence and generosity gladden your homes as we celebrate Boxing Day and reflect on the year’s blessings.",
    academicStatus: "Statutory public holiday.",
  },
];

/**
 * Meeus/Jones/Butcher Gregorian Easter Algorithm
 * Returns exact Easter Sunday for any year.
 */
export function getEasterSunday(year: number): Date {
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
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Good Friday: Easter Sunday - 2 days
 */
export function getGoodFriday(year: number): Date {
  const easter = getEasterSunday(year);
  return new Date(Date.UTC(year, easter.getUTCMonth(), easter.getUTCDate() - 2));
}

/**
 * Easter Monday: Easter Sunday + 1 day
 */
export function getEasterMonday(year: number): Date {
  const easter = getEasterSunday(year);
  return new Date(Date.UTC(year, easter.getUTCMonth(), easter.getUTCDate() + 1));
}

/**
 * National Farmers' Day: First Friday of December
 */
export function getFarmersDay(year: number): Date {
  const firstOfDec = new Date(Date.UTC(year, 11, 1));
  const dayOfWeek = firstOfDec.getUTCDay(); // 0 = Sun, 5 = Fri
  const offset = (5 - dayOfWeek + 7) % 7;
  return new Date(Date.UTC(year, 11, 1 + offset));
}

/**
 * Islamic Astronomical Projections (Reference baseline when no gazette override is provided)
 */
const ISLAMIC_ESTIMATES: Record<number, { eid_ul_fitr: [number, number]; eid_ul_adha: [number, number] }> = {
  2025: { eid_ul_fitr: [3, 31], eid_ul_adha: [6, 7] },
  2026: { eid_ul_fitr: [3, 20], eid_ul_adha: [5, 27] },
  2027: { eid_ul_fitr: [3, 10], eid_ul_adha: [5, 17] },
  2028: { eid_ul_fitr: [2, 27], eid_ul_adha: [5, 5] },
  2029: { eid_ul_fitr: [2, 15], eid_ul_adha: [4, 24] },
  2030: { eid_ul_fitr: [2, 5], eid_ul_adha: [4, 14] },
};

export function getEstimatedIslamicHoliday(key: "eid_ul_fitr" | "shaqq_day" | "eid_ul_adha", year: number): Date {
  const fallbackYear = ISLAMIC_ESTIMATES[year] || ISLAMIC_ESTIMATES[2026];
  if (key === "eid_ul_fitr") {
    const [m, d] = fallbackYear.eid_ul_fitr;
    return new Date(Date.UTC(year, m - 1, d));
  }
  if (key === "shaqq_day") {
    const [m, d] = fallbackYear.eid_ul_fitr;
    // Shaqq Day is immediately following Eid-ul-Fitr
    return new Date(Date.UTC(year, m - 1, d + 1));
  }
  const [m, d] = fallbackYear.eid_ul_adha;
  return new Date(Date.UTC(year, m - 1, d));
}

/**
 * Format Date to YYYY-MM-DD in UTC
 */
export function formatDateISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calculate the Observed Date in accordance with Ghana Public Holidays Act (Act 601)
 * If holiday falls on Saturday -> Monday (+2 days)
 * If holiday falls on Sunday -> Monday (+1 day)
 */
export function computeObservedDate(actualDate: Date, holidayKey?: string): { observedDate: Date; isRollover: boolean } {
  const dayOfWeek = actualDate.getUTCDay();

  // Special handling for consecutive Christmas (Dec 25) and Boxing Day (Dec 26)
  if (holidayKey === "boxing_day") {
    const y = actualDate.getUTCFullYear();
    const christmasDayOfWeek = new Date(Date.UTC(y, 11, 25)).getUTCDay();
    // If Christmas was Saturday (observed Mon Dec 27), Boxing Day (Sun) is observed Tue Dec 28
    if (christmasDayOfWeek === 6) {
      return {
        observedDate: new Date(Date.UTC(y, 11, 28)),
        isRollover: true,
      };
    }
    // If Christmas was Sunday (observed Mon Dec 26), Boxing Day (Mon) is observed Tue Dec 27
    if (christmasDayOfWeek === 0) {
      return {
        observedDate: new Date(Date.UTC(y, 11, 27)),
        isRollover: true,
      };
    }
  }

  if (dayOfWeek === 6) { // Saturday -> Monday
    const observed = new Date(Date.UTC(
      actualDate.getUTCFullYear(),
      actualDate.getUTCMonth(),
      actualDate.getUTCDate() + 2
    ));
    return { observedDate: observed, isRollover: true };
  }

  if (dayOfWeek === 0) { // Sunday -> Monday
    const observed = new Date(Date.UTC(
      actualDate.getUTCFullYear(),
      actualDate.getUTCMonth(),
      actualDate.getUTCDate() + 1
    ));
    return { observedDate: observed, isRollover: true };
  }

  return { observedDate: actualDate, isRollover: false };
}

/**
 * Resolve the exact date of a holiday for a given year, incorporating DB overrides if available.
 */
export function resolveHolidayDate(
  def: HolidayDefinition,
  year: number,
  dbOverride?: string | null
): { actual: Date; observed: Date; isRollover: boolean } {
  // If administrator provided an explicit gazette date override in YYYY-MM-DD
  if (dbOverride) {
    const [oy, om, od] = dbOverride.split("-").map(Number);
    if (oy && om && od) {
      const overrideDate = new Date(Date.UTC(oy, om - 1, od));
      return { actual: overrideDate, observed: overrideDate, isRollover: false };
    }
  }

  let actual: Date;

  switch (def.dateType) {
    case "fixed":
      actual = new Date(Date.UTC(year, (def.month || 1) - 1, def.day || 1));
      break;
    case "easter":
      actual = def.key === "good_friday" ? getGoodFriday(year) : getEasterMonday(year);
      break;
    case "relative":
      actual = getFarmersDay(year);
      break;
    case "islamic":
      actual = getEstimatedIslamicHoliday(def.key as any, year);
      break;
    default:
      actual = new Date(Date.UTC(year, 0, 1));
  }

  const { observedDate, isRollover } = computeObservedDate(actual, def.key);
  return { actual, observed: observedDate, isRollover };
}

/**
 * Compile all computed holidays for a specific year, merged with database overrides.
 */
export function getAllHolidaysForYear(year: number, dbRecords: DBHolidayWish[] = []): ComputedHoliday[] {
  const dbMap = new Map<string, DBHolidayWish>();
  for (const r of dbRecords) {
    dbMap.set(r.holiday_key, r);
  }

  return GHANA_STATUTORY_HOLIDAYS.map((def) => {
    const dbItem = dbMap.get(def.key);
    const isOverridden = dbItem?.custom_date_override;
    const { actual, observed, isRollover } = resolveHolidayDate(def, year, isOverridden);

    return {
      key: def.key,
      title: dbItem?.title || def.title,
      actualDate: formatDateISO(actual),
      observedDate: formatDateISO(observed),
      isRollover,
      themeAccent: (dbItem?.theme_accent || def.themeAccent) as HolidayThemeAccent,
      headline: dbItem?.headline || def.defaultHeadline,
      bodyMessage: dbItem?.body_message || def.defaultBody,
      academicStatus: dbItem?.academic_status || def.academicStatus,
      featuredArticleSlug: dbItem?.featured_article_slug || null,
    };
  }).sort((a, b) => a.observedDate.localeCompare(b.observedDate));
}

/**
 * Determine if a specific date (YYYY-MM-DD or Date object) is an observed or actual public holiday.
 */
export function getActiveHolidayForDate(
  dateInput: Date | string,
  dbRecords: DBHolidayWish[] = []
): ComputedHoliday | null {
  const dateStr = typeof dateInput === "string" ? dateInput : formatDateISO(dateInput);
  const year = parseInt(dateStr.slice(0, 4), 10);
  const holidays = getAllHolidaysForYear(year, dbRecords);

  // Match either the observed date or actual date
  const found = holidays.find((h) => h.observedDate === dateStr || h.actualDate === dateStr);
  return found || null;
}

/**
 * Find the next upcoming holiday relative to a given date.
 */
export function getNextUpcomingHoliday(
  fromDateInput: Date | string,
  dbRecords: DBHolidayWish[] = []
): (ComputedHoliday & { daysRemaining: number }) | null {
  const fromDateStr = typeof fromDateInput === "string" ? fromDateInput : formatDateISO(fromDateInput);
  const fromYear = parseInt(fromDateStr.slice(0, 4), 10);

  // Check current year and next year
  const currentYearHolidays = getAllHolidaysForYear(fromYear, dbRecords);
  const nextYearHolidays = getAllHolidaysForYear(fromYear + 1, dbRecords);
  const combined = [...currentYearHolidays, ...nextYearHolidays];

  const futureHolidays = combined.filter((h) => h.observedDate >= fromDateStr);

  if (futureHolidays.length === 0) return null;

  const next = futureHolidays[0];
  const fromTime = new Date(fromDateStr).getTime();
  const nextTime = new Date(next.observedDate).getTime();
  const diffDays = Math.max(0, Math.round((nextTime - fromTime) / (1000 * 60 * 60 * 24)));

  return {
    ...next,
    daysRemaining: diffDays,
  };
}
