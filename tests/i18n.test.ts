/**
 * Every English string the apps show must have a Tamil entry (packages/core/src/i18n/ta).
 * Scans t("…") calls in both apps and the shared label tables in core.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  APPOINTMENT_STATUS,
  BATCH_CLOSED_LABEL,
  CONSULTATION_METHOD_LABEL,
  ENROLMENT_STATUS,
  ERROR_MESSAGES,
  FULFILMENT_LABEL,
  LEVEL_LABEL,
  ORDER_STATUS,
  PAYMENT_PURPOSE_LABEL,
  PAYMENT_STATUS,
  PERIOD_LABEL,
  REGISTRATION_STATUS,
  SERVICE_MODE_LABEL,
  STOCK_STATUS,
  translate,
  TA,
} from "@sdw/core";
import { BOOKING_STEP_LABEL, CHECK_FIELDS_MESSAGE } from "@sdw/controllers";
import { read, rel, sourceFiles } from "./helpers";

function usedStrings(): Map<string, string> {
  const found = new Map<string, string>();
  const files = ["apps/web/src", "apps/mobile/src", "packages/controllers/src"].flatMap((d) => sourceFiles(d));
  const call = /\bt\(\s*"((?:[^"\\]|\\.)*)"/g;
  for (const f of files) {
    const text = read(f);
    for (const m of text.matchAll(call)) found.set(JSON.parse(`"${m[1]}"`), rel(f));
  }
  // Navigation labels are written as `label: "…"` in the nav config and passed through t().
  for (const m of read(`${process.cwd()}/apps/web/src/components/layout/navigation.ts`).matchAll(/label: "([^"]+)"/g))
    found.set(m[1]!, "navigation.ts");
  return found;
}

const tables: Record<string, Record<string, { label: string; description?: string } | string>> = {
  APPOINTMENT_STATUS,
  ENROLMENT_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  STOCK_STATUS,
  CONSULTATION_METHOD_LABEL,
  FULFILMENT_LABEL,
  LEVEL_LABEL,
  SERVICE_MODE_LABEL,
  PAYMENT_PURPOSE_LABEL,
  PERIOD_LABEL,
  BATCH_CLOSED_LABEL,
  BOOKING_STEP_LABEL,
};

/** Validation messages from packages/core/src/validation (literal messages and the labels used in templates). */
function validationStrings(): string[] {
  const src = read(`${process.cwd()}/packages/core/src/validation/index.ts`);
  const literals = [...src.matchAll(/"([A-Z][^"]*\s[^"]*)"/g)].map((m) => m[1]!);
  const labels = [...src.matchAll(/requiredText\("([^"]+)"/g)].map((m) => m[1]!);
  return [...literals, ...labels];
}

/** Field messages the mock backend can return (the live backend should use the same wording or codes). */
const SERVER_FIELD_MESSAGES = [
  "An account with this email already exists",
  "This UPI reference has already been used",
  "Your current password is incorrect",
  "Choose pickup or delivery",
  "Choose a branch for pickup",
  "Your cart is empty",
  "Choose a service",
  "Choose a practitioner",
  "Choose a time",
];

test('every t("…") string in both apps has Tamil', () => {
  const missing = [...usedStrings()]
    .filter(([s]) => TA[s] === undefined && translate("ta", s) === s && !/^[\W\d]*$/.test(s))
    .map(([s, f]) => `${f}: ${s}`);
  assert.deepEqual(missing, [], `${missing.length} strings without Tamil`);
});

test("status labels, error messages and validation messages have Tamil", () => {
  const strings = new Set<string>([
    ...ERROR_MESSAGES,
    CHECK_FIELDS_MESSAGE,
    ...validationStrings(),
    ...SERVER_FIELD_MESSAGES,
  ]);
  for (const table of Object.values(tables))
    for (const v of Object.values(table)) {
      if (typeof v === "string") strings.add(v);
      else {
        strings.add(v.label);
        if (v.description) strings.add(v.description);
      }
    }
  const missing = [...strings].filter((s) => TA[s] === undefined && translate("ta", s) === s);
  assert.deepEqual(missing, []);
});

test("Tamil entries keep their {placeholders}", () => {
  const broken = Object.entries(TA).filter(([en, ta]) => {
    const names = (s: string) =>
      [...s.matchAll(/\{(\w+)\}/g)]
        .map((m) => m[1])
        .sort()
        .join(",");
    return names(en) !== names(ta);
  });
  assert.deepEqual(
    broken.map(([en]) => en),
    [],
  );
});
