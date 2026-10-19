/** Small pure helpers used by both apps. */
import type { Slot } from "../models";
import { dayPeriod } from "./dates";

/** Split multi-line text from the API into trimmed, non-empty lines. */
export function lines(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Store Indian 10-digit numbers as +91XXXXXXXXXX; keep other formats as digits with +. */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

/** "+919876543210" → "+91 98765 43210" for display. */
export function formatPhone(value: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(value);
  return m ? `+91 ${m[1]} ${m[2]}` : value;
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** WhatsApp click-to-chat link; `number` is digits with country code. */
export function whatsappLink(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function mailtoLink(email: string): string {
  return `mailto:${email}`;
}

/** Group a day's slots into morning / afternoon / evening, keeping order. Empty groups are dropped. */
export function groupSlots(slots: Slot[]): Array<{ period: "morning" | "afternoon" | "evening"; slots: Slot[] }> {
  const order = ["morning", "afternoon", "evening"] as const;
  return order
    .map((period) => ({ period, slots: slots.filter((s) => dayPeriod(s.startsAt) === period) }))
    .filter((g) => g.slots.length > 0);
}

export const PERIOD_LABEL = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" } as const;

/** Whole-number percentage, safe for zero totals. */
export function percent(done: number, total: number): number {
  return total <= 0 ? 0 : Math.round((done / total) * 100);
}

/** First letters of the first two words, for avatars. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Generates a random key for the `Idempotency-Key` header, so a retried "place order" request can't
 * create two orders. Uses crypto.getRandomValues when available (browsers, Hermes with a polyfill).
 */
export function idempotencyKey(): string {
  const bytes = new Uint8Array(16);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
