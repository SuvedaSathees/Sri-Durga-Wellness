/**
 * Money is always integer paise. Formatting is done by hand (Indian digit grouping) so every
 * platform prints the same thing, with or without full Intl support.
 */
import type { Locale, Paise } from "../models/common";
import type { ClassFeeType } from "../models/learning";

/** 1250000 → "12,50,000" (lakh grouping). */
function groupIndian(whole: number): string {
  const s = String(whole);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

/** 35000 → "₹350" · 125050 → "₹1,250.50" */
export function formatPrice(paise: Paise): string {
  const negative = paise < 0;
  const abs = Math.abs(Math.round(paise));
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  const text = `₹${groupIndian(whole)}${fraction ? `.${String(fraction).padStart(2, "0")}` : ""}`;
  return negative ? `-${text}` : text;
}

/** "₹1,250", or "Free" / "இலவசம்" for zero. */
export function formatFee(paise: Paise, lang: Locale = "en"): string {
  return paise === 0 ? (lang === "ta" ? "இலவசம்" : "Free") : formatPrice(paise);
}

/** Whole-percent saving when the MRP is higher than the price, else null. */
export function discountPercent(price: Paise, mrp: Paise | null | undefined): number | null {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

/** A live-class fee with its unit: "₹1,200 / month", "₹250 / session", "₹800" (whole batch) or "Free". */
export function formatClassFee(fee: Paise, feeType: ClassFeeType, lang: Locale = "en"): string {
  if (fee === 0) return formatFee(0, lang);
  const amount = formatPrice(fee);
  if (feeType === "MONTHLY") return lang === "ta" ? `${amount} / மாதம்` : `${amount} / month`;
  if (feeType === "PER_SESSION") return lang === "ta" ? `${amount} / அமர்வு` : `${amount} / session`;
  return amount;
}

/** What one batch costs to register for: the batch fee, the first month, or fee × sessions. */
export function batchPrice(fee: Paise, feeType: ClassFeeType, sessionsCount: number): Paise {
  return feeType === "PER_SESSION" ? fee * Math.max(1, sessionsCount) : fee;
}
