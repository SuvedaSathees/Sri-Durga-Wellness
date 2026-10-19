import type { Locale } from "../models/common";

export type { Locale };

/** The apps' two languages. English is the source text; Tamil translations live in ./ta. */
export const LOCALES: readonly Locale[] = ["en", "ta"];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ta";
}

/** BCP 47 tag for <html lang>, Intl formatting and the Accept-Language header. */
export function languageTag(locale: Locale): string {
  return locale === "ta" ? "ta-IN" : "en-IN";
}

/** Best match from a list of preferred languages (browser `navigator.languages` or the device locale list). */
export function pickLocale(preferred: readonly string[] | null | undefined): Locale {
  for (const tag of preferred ?? []) {
    const lower = tag.toLowerCase();
    if (lower.startsWith("ta")) return "ta";
    if (lower.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}
