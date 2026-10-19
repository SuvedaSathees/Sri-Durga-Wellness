/**
 * UPI payment helpers. The apps only *display* payment state; they never decide a payment is paid.
 */
import type { Payment, PaymentStatus, UpiInstructions } from "../models";

/** upi://pay link. Opens the customer's UPI app on a phone; the same text is encoded in the web QR code. */
export function buildUpiUri(upi: UpiInstructions, amountPaise: number): string {
  const params: Array<[string, string]> = [
    ["pa", upi.payeeVpa.trim()],
    ["pn", upi.payeeName.trim()],
    ["am", (amountPaise / 100).toFixed(2)],
    ["cu", "INR"],
    ["tn", upi.note.slice(0, 60)],
  ];
  return `upi://pay?${params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")}`;
}

/** Remove spaces and use capitals: " 4123 5678 9012 " → "412356789012". */
export function normalizeUtr(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

/** UPI references (UTR) are usually 12 digits; accept 6–30 letters and digits. */
export function isValidUtr(value: string): boolean {
  return /^[A-Z0-9]{6,30}$/.test(normalizeUtr(value));
}

/** What the payment screen should show. */
export type PaymentStage = "pay" | "retry" | "waiting" | "verified" | "closed";

export function paymentStage(payment: Pick<Payment, "status">): PaymentStage {
  switch (payment.status) {
    case "AWAITING_PAYMENT":
      return "pay";
    case "REJECTED":
      return "retry";
    case "SUBMITTED":
      return "waiting";
    case "VERIFIED":
      return "verified";
    case "CANCELLED":
      return "closed";
  }
}

/** The customer may enter a UTR only while the payment is awaiting payment or was rejected. */
export function canSubmitUtr(payment: Pick<Payment, "status" | "upi">): boolean {
  return (payment.status === "AWAITING_PAYMENT" || payment.status === "REJECTED") && payment.upi !== null;
}

/** Payment statuses that still need the customer's attention. */
export const OPEN_PAYMENT_STATUSES: readonly PaymentStatus[] = ["AWAITING_PAYMENT", "REJECTED"];

/** How often to re-check a payment the clinic is verifying (milliseconds). */
export const VERIFICATION_POLL_MS = 30_000;
