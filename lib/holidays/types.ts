export type HolidayDateType = "fixed" | "relative" | "easter" | "islamic";

export type HolidayThemeAccent = "gold" | "ghana_flag" | "crescent" | "festive" | "laurel";

export interface HolidayDefinition {
  key: string;
  title: string;
  dateType: HolidayDateType;
  month?: number; // 1-12
  day?: number;   // 1-31
  themeAccent: HolidayThemeAccent;
  defaultHeadline: string;
  defaultBody: string;
  academicStatus: string;
}

export interface ComputedHoliday {
  key: string;
  title: string;
  actualDate: string;     // YYYY-MM-DD
  observedDate: string;   // YYYY-MM-DD (accounting for weekend rollover)
  isRollover: boolean;
  themeAccent: HolidayThemeAccent;
  headline: string;
  bodyMessage: string;
  academicStatus: string;
  featuredArticleSlug?: string | null;
}

export interface DBHolidayWish {
  id: string;
  holiday_key: string;
  title: string;
  date_type: HolidayDateType;
  month: number | null;
  day: number | null;
  custom_date_override: string | null; // YYYY-MM-DD
  headline: string;
  body_message: string;
  theme_accent: HolidayThemeAccent;
  academic_status: string;
  featured_article_slug: string | null;
  send_push_notification: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TodayHolidayResponse {
  isHoliday: boolean;
  holiday: ComputedHoliday | null;
  timestamp: string;
}

export interface UpcomingHolidayResponse {
  upcoming: (ComputedHoliday & { daysRemaining: number }) | null;
  timestamp: string;
}
