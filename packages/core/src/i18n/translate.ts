/**
 * Translation lookup, shared by the web and mobile apps.
 *
 * English text is the key: t("Book now") returns the Tamil entry from ./ta, or the
 * English text when no translation exists yet. Placeholders such as {name} are filled from `vars`.
 *
 * Messages built elsewhere with values already inside (for example "Email is required" or
 * "Only 3 left") are matched against the Tamil entries that contain placeholders, so
 * "{label} is required" also translates "Email is required" — and the label is translated too.
 */
import type { Locale } from "./config";
import { TA } from "./ta";

export type Vars = Record<string, string | number | null | undefined>;
export type Translate = (text: string, vars?: Vars) => string;

function fill(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = vars[name];
    return value === undefined || value === null ? whole : String(value);
  });
}

type Pattern = { regex: RegExp; names: string[]; tamil: string; weight: number };
let patterns: Pattern[] | null = null;

function compilePatterns(): Pattern[] {
  const list: Pattern[] = [];
  for (const [english, tamil] of Object.entries(TA)) {
    if (!english.includes("{")) continue;
    const names: string[] = [];
    const source = english
      .split(/(\{\w+\})/)
      .map((part) => {
        const m = /^\{(\w+)\}$/.exec(part);
        if (m) {
          names.push(m[1]!);
          return "(.+?)";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("");
    if (names.length === 0) continue;
    // More fixed text = more specific, so it is tried first.
    list.push({ regex: new RegExp(`^${source}$`, "s"), names, tamil, weight: english.replace(/\{\w+\}/g, "").length });
  }
  return list.sort((a, b) => b.weight - a.weight);
}

/** Tamil for a whole message that already has its values filled in, or null. */
function matchPattern(text: string): string | null {
  patterns ??= compilePatterns();
  for (const p of patterns) {
    const m = p.regex.exec(text);
    if (!m) continue;
    // Short patterns such as "{count} lesson" must not swallow ordinary English ("Choose a lesson"):
    // unless the fixed text is long enough to be unambiguous, every value must be a number or a known word.
    const values = m.slice(1);
    if (p.weight < 12 && !values.every((v) => /\d/.test(v) || TA[v] !== undefined)) continue;
    const vars: Vars = {};
    p.names.forEach((name, i) => {
      const value = m[i + 1] ?? "";
      vars[name] = TA[value] ?? TA[value.toLowerCase()] ?? value;
    });
    return fill(p.tamil, vars);
  }
  return null;
}

export function translate(locale: Locale, text: string, vars?: Vars): string {
  if (locale !== "ta" || !text) return fill(text, vars);
  const exact = TA[text];
  if (exact !== undefined) return fill(exact, vars);
  if (!vars) {
    const matched = matchPattern(text);
    if (matched !== null) return matched;
  }
  return fill(text, vars);
}

export function translator(locale: Locale): Translate {
  return (text, vars) => translate(locale, text, vars);
}
