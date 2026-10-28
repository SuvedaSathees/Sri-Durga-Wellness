/**
 * Small helpers for the Admin area: money typed in rupees, clinic-time date and time fields,
 * Google Meet links, lesson video links and the order steps staff can take next.
 */
import type { Bilingual, ISODateTime, OrderStatus, Paise, VideoProvider } from "../models";
import type { FulfilmentMethod } from "../models/shop";
import { clinicParts, clinicTimeToUtc, dateKey, isDateKey } from "./dates";

/** "1,500" / "1500.5" / "₹ 1,500.50" → paise (150050). Null when it isn't a plain amount. */
export function parseRupees(text: string | number | null | undefined): Paise | null {
  if (typeof text === "number") return Number.isFinite(text) && text >= 0 ? Math.round(text * 100) : null;
  const cleaned = String(text ?? "")
    .replace(/[₹,\s]/g, "")
    .replace(/^rs\.?/i, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".") as [string, string?];
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** 150050 → "1500.50", 150000 → "1500" (for filling a form field). */
export function rupeesText(paise: Paise | null | undefined): string {
  if (paise === null || paise === undefined) return "";
  const whole = Math.floor(paise / 100);
  const fraction = paise % 100;
  return fraction ? `${whole}.${String(fraction).padStart(2, "0")}` : String(whole);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** An instant → the clinic-time date ("2026-11-03") and time ("18:30") shown in a form. */
export function clinicDateTimeFields(value: ISODateTime): { date: string; time: string } {
  const p = clinicParts(value);
  return { date: dateKey(value), time: `${pad(p.hour)}:${pad(p.minute)}` };
}

/** Clinic-time date ("2026-11-03") and time ("18:30") → UTC instant, or null if either is invalid. */
export function clinicDateTimeToIso(date: string, time: string): ISODateTime | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!isDateKey(date.trim()) || !m) return null;
  return clinicTimeToUtc(date.trim(), Number(m[1]) * 60 + Number(m[2])).toISOString();
}

/** Google Meet joining links: https://meet.google.com/abc-defg-hij (optionally with ?query). */
export function isMeetLink(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" && u.hostname === "meet.google.com" && /^\/[a-z0-9-]{3,60}$/i.test(u.pathname);
  } catch {
    return false;
  }
}

/**
 * A YouTube or Vimeo link → the privacy-friendly embed address the lesson player shows.
 * Anything else returns null, so lessons can only play videos from these two hosts.
 */
export function videoEmbed(link: string): { provider: VideoProvider; embedUrl: string } | null {
  let u: URL;
  try {
    u = new URL(link.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^(www|m)\./, "");
  const youtubeId = (id: string | null | undefined) =>
    id && /^[A-Za-z0-9_-]{11}$/.test(id)
      ? { provider: "YOUTUBE" as const, embedUrl: `https://www.youtube-nocookie.com/embed/${id}` }
      : null;
  if (host === "youtu.be") return youtubeId(u.pathname.slice(1));
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") return youtubeId(u.searchParams.get("v"));
    const m = /^\/(embed|shorts|live)\/([^/]+)$/.exec(u.pathname);
    return youtubeId(m?.[2]);
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = /^\/(?:video\/)?(\d{6,12})$/.exec(u.pathname);
    return m ? { provider: "VIMEO", embedUrl: `https://player.vimeo.com/video/${m[1]}` } : null;
  }
  return null;
}

/** English text, or the Tamil version when the visitor reads Tamil and one was written. */
export function pickText(text: Bilingual, locale: "en" | "ta"): string {
  return locale === "ta" && text.ta ? text.ta : text.en;
}

/**
 * Where staff can move an order from its current status. Payment states (pending, submitted)
 * move only through the payment check, never by hand.
 */
export function nextOrderStatuses(status: OrderStatus, fulfilment: FulfilmentMethod): OrderStatus[] {
  switch (status) {
    case "PENDING_PAYMENT":
      return ["CANCELLED"];
    case "CONFIRMED":
      return ["PROCESSING", "CANCELLED"];
    case "PROCESSING":
      return [fulfilment === "DELIVERY" ? "SHIPPED" : "READY_FOR_PICKUP", "CANCELLED"];
    case "SHIPPED":
    case "READY_FOR_PICKUP":
      return ["COMPLETED"];
    default:
      return [];
  }
}

/** Button labels for the order steps staff take (English keys for t()). */
export const ORDER_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  PROCESSING: "Start packing",
  SHIPPED: "Mark as shipped",
  READY_FOR_PICKUP: "Ready for pickup",
  COMPLETED: "Mark as completed",
  CANCELLED: "Cancel order",
};
