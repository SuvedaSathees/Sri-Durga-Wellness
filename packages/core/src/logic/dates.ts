/**
 * Dates and times. The API sends UTC instants (ISO-8601); everything is shown in the clinic's time
 * zone so the website, the mobile app and emails agree. "Date keys" are calendar dates in that
 * zone, formatted "YYYY-MM-DD".
 *
 * India Standard Time is a fixed UTC+05:30 with no daylight saving, so conversion is plain
 * arithmetic. Names are spelled out here (not left to Intl) so browsers, Hermes on Android/iOS
 * and Node all produce exactly the same text.
 */
import type { DateKey, ISODateTime, Locale } from "../models/common";

export const CLINIC_TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET_MINUTES = 330;

type DateInput = Date | ISODateTime;

const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_EN_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_EN_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const WEEKDAYS_TA = ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"];
const WEEKDAYS_TA_SHORT = ["ஞாயி.", "திங்.", "செவ்.", "புத.", "வியா.", "வெள்.", "சனி"];
const MONTHS_TA = [
  "ஜனவரி",
  "பிப்ரவரி",
  "மார்ச்",
  "ஏப்ரல்",
  "மே",
  "ஜூன்",
  "ஜூலை",
  "ஆகஸ்ட்",
  "செப்டம்பர்",
  "அக்டோபர்",
  "நவம்பர்",
  "டிசம்பர்",
];
const MONTHS_TA_SHORT = ["ஜன.", "பிப்.", "மார்.", "ஏப்.", "மே", "ஜூன்", "ஜூலை", "ஆக.", "செப்.", "அக்.", "நவ.", "டிச."];

const pad = (n: number) => String(n).padStart(2, "0");

export function toDate(value: DateInput): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError(`Invalid date: ${String(value)}`);
  return date;
}

export type ClinicParts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number };

/** Calendar and clock values of an instant in clinic time. */
export function clinicParts(value: DateInput): ClinicParts {
  const shifted = new Date(toDate(value).getTime() + IST_OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

/** Calendar date (clinic time) of an instant. */
export function dateKey(value: DateInput): DateKey {
  const p = clinicParts(value);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function todayKey(now: Date = new Date()): DateKey {
  return dateKey(now);
}

export function isDateKey(value: unknown): value is DateKey {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function addDaysToKey(key: DateKey, days: number): DateKey {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOfKey(key: DateKey): number {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Clinic-local date + minutes after midnight → UTC instant. */
export function clinicTimeToUtc(key: DateKey, minuteOfDay: number): Date {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, 0, minuteOfDay - IST_OFFSET_MINUTES));
}

/** Minutes after clinic-local midnight. */
export function minuteOfDay(value: DateInput): number {
  const p = clinicParts(value);
  return p.hour * 60 + p.minute;
}

// ── Formatting ───────────────────────────────────────────────

/** Tamil time of day: காலை (morning), மதியம் (midday), மாலை (evening), இரவு (night). */
function clock(hour: number, minute: number, lang: Locale): string {
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  if (lang === "ta") {
    const period = hour < 12 ? "காலை" : hour < 16 ? "மதியம்" : hour < 19 ? "மாலை" : "இரவு";
    return `${period} ${hour12}:${pad(minute)}`;
  }
  return `${hour12}:${pad(minute)} ${hour >= 12 ? "PM" : "AM"}`;
}

export function weekdayName(weekday: number, lang: Locale = "en", style: "long" | "short" = "long"): string {
  const names =
    lang === "ta"
      ? style === "short"
        ? WEEKDAYS_TA_SHORT
        : WEEKDAYS_TA
      : style === "short"
        ? WEEKDAYS_EN_SHORT
        : WEEKDAYS_EN;
  return names[weekday] ?? "";
}

export function monthName(month: number, lang: Locale = "en", style: "long" | "short" = "long"): string {
  const names =
    lang === "ta" ? (style === "short" ? MONTHS_TA_SHORT : MONTHS_TA) : style === "short" ? MONTHS_EN_SHORT : MONTHS_EN;
  return names[month - 1] ?? "";
}

/** "Sat, 17 Oct 2026" · "சனி, 17 அக்., 2026" */
export function formatDate(value: DateInput, lang: Locale = "en"): string {
  const p = clinicParts(value);
  const sep = lang === "ta" ? ", " : " ";
  return `${weekdayName(p.weekday, lang, "short")}, ${p.day} ${monthName(p.month, lang, "short")}${sep}${p.year}`;
}

/** "Saturday, 17 October 2026" · "சனி, 17 அக்டோபர் 2026" */
export function formatLongDate(value: DateInput, lang: Locale = "en"): string {
  const p = clinicParts(value);
  return `${weekdayName(p.weekday, lang)}, ${p.day} ${monthName(p.month, lang)} ${p.year}`;
}

/** "17 Oct 2026" · "17 அக்., 2026" */
export function formatShortDate(value: DateInput, lang: Locale = "en"): string {
  const p = clinicParts(value);
  return `${p.day} ${monthName(p.month, lang, "short")}${lang === "ta" ? ", " : " "}${p.year}`;
}

/** "10:30 AM" · "காலை 10:30" */
export function formatTime(value: DateInput, lang: Locale = "en"): string {
  const p = clinicParts(value);
  return clock(p.hour, p.minute, lang);
}

/** "Sat, 17 Oct 2026 · 10:30 AM" */
export function formatDateTime(value: DateInput, lang: Locale = "en"): string {
  return `${formatDate(value, lang)} · ${formatTime(value, lang)}`;
}

/** Format a date key without shifting it through a time zone. */
export function formatDateKey(
  key: DateKey,
  style: "short" | "long" | "default" = "default",
  lang: Locale = "en",
): string {
  const noon = clinicTimeToUtc(key, 12 * 60);
  if (style === "long") return formatLongDate(noon, lang);
  if (style === "short") return formatShortDate(noon, lang);
  return formatDate(noon, lang);
}

/** Day chip for a date picker: { weekday: "Mon", day: "21", month: "Oct" }. */
export function dayChipParts(key: DateKey, lang: Locale = "en"): { weekday: string; day: string; month: string } {
  const [, m, d] = key.split("-").map(Number) as [number, number, number];
  return { weekday: weekdayName(weekdayOfKey(key), lang, "short"), day: String(d), month: monthName(m, lang, "short") };
}

/** "1 hr 15 min" · "1 மணி 15 நிமி." */
export function formatDuration(minutes: number, lang: Locale = "en"): string {
  const [hr, min] = lang === "ta" ? ["மணி", "நிமி."] : ["hr", "min"];
  if (minutes < 60) return `${minutes} ${min}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} ${hr}` : `${h} ${hr} ${m} ${min}`;
}

/** Morning / afternoon / evening group for a slot list. */
export function dayPeriod(value: DateInput): "morning" | "afternoon" | "evening" {
  const hour = clinicParts(value).hour;
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
}

export function isPast(value: DateInput, now: Date = new Date()): boolean {
  return toDate(value).getTime() <= now.getTime();
}

/** Google Calendar "add event" link (no API access needed). */
export function googleCalendarLink(event: {
  title: string;
  start: DateInput;
  end: DateInput;
  details?: string;
  location?: string;
}): string {
  const fmt = (d: DateInput) =>
    toDate(d)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const params: Array<[string, string]> = [
    ["action", "TEMPLATE"],
    ["text", event.title],
    ["dates", `${fmt(event.start)}/${fmt(event.end)}`],
    ["ctz", CLINIC_TIME_ZONE],
  ];
  if (event.details) params.push(["details", event.details]);
  if (event.location) params.push(["location", event.location]);
  return `https://calendar.google.com/calendar/render?${params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")}`;
}
