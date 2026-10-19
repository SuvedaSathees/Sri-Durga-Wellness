/**
 * Labels and colour tones for every status the API returns. Labels are English i18n keys —
 * screens pass them through t(). Tones map to Badge colours on both platforms.
 */
import type {
  AppointmentStatus,
  ClassFeeType,
  ConsultationMethod,
  EnrolmentStatus,
  FulfilmentMethod,
  Level,
  OrderStatus,
  PaymentPurpose,
  PaymentStatus,
  RegistrationStatus,
  ServiceMode,
  StockStatus,
} from "../models";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

export type StatusMeta = { label: string; tone: Tone; description?: string };

export const ORDER_STATUS: Record<OrderStatus, StatusMeta> = {
  PENDING_PAYMENT: { label: "Payment pending", tone: "warning", description: "Waiting for your UPI payment details." },
  PAYMENT_SUBMITTED: { label: "Verifying payment", tone: "info", description: "Our team is checking your payment." },
  CONFIRMED: {
    label: "Confirmed",
    tone: "success",
    description: "Payment verified. We'll start preparing your order.",
  },
  PROCESSING: { label: "Being prepared", tone: "info", description: "Your order is being packed." },
  READY_FOR_PICKUP: { label: "Ready for pickup", tone: "success", description: "Your order is ready to collect." },
  SHIPPED: { label: "Shipped", tone: "success", description: "Your order is on its way." },
  COMPLETED: { label: "Completed", tone: "neutral", description: "This order is complete." },
  CANCELLED: { label: "Cancelled", tone: "danger", description: "This order was cancelled." },
  EXPIRED: {
    label: "Expired",
    tone: "neutral",
    description: "Payment wasn't received in time, so the items were released.",
  },
};

export const PAYMENT_STATUS: Record<PaymentStatus, StatusMeta> = {
  AWAITING_PAYMENT: { label: "Awaiting payment", tone: "warning" },
  SUBMITTED: { label: "Under verification", tone: "info" },
  VERIFIED: { label: "Verified", tone: "success" },
  REJECTED: { label: "Not verified", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const REGISTRATION_STATUS: Record<RegistrationStatus, StatusMeta> = {
  PENDING_PAYMENT: {
    label: "Payment pending",
    tone: "warning",
    description: "Your seat is held while we wait for payment.",
  },
  PAYMENT_SUBMITTED: { label: "Registration pending", tone: "info", description: "We're verifying your payment." },
  CONFIRMED: { label: "Confirmed", tone: "success" },
  COMPLETED: { label: "Completed", tone: "neutral", description: "This batch has finished." },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  EXPIRED: { label: "Expired", tone: "neutral", description: "The seat hold expired before payment was received." },
};

export const ENROLMENT_STATUS: Record<EnrolmentStatus, StatusMeta> = {
  PENDING_PAYMENT: { label: "Payment pending", tone: "warning" },
  PAYMENT_SUBMITTED: { label: "Verifying payment", tone: "info" },
  ACTIVE: { label: "Active", tone: "success" },
  EXPIRED: { label: "Access ended", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
};

export const APPOINTMENT_STATUS: Record<AppointmentStatus, StatusMeta> = {
  CONFIRMED: { label: "Confirmed", tone: "success" },
  COMPLETED: { label: "Completed", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  NO_SHOW: { label: "Missed", tone: "warning" },
};

export const STOCK_STATUS: Record<StockStatus, StatusMeta> = {
  IN_STOCK: { label: "In stock", tone: "success" },
  LOW_STOCK: { label: "Only a few left", tone: "warning" },
  OUT_OF_STOCK: { label: "Out of stock", tone: "neutral" },
};

export const CONSULTATION_METHOD_LABEL: Record<ConsultationMethod, string> = {
  PHONE: "Phone call",
  VIDEO: "Video call",
  IN_PERSON: "In person",
};

export const FULFILMENT_LABEL: Record<FulfilmentMethod, string> = {
  PICKUP: "Clinic pickup",
  DELIVERY: "Home delivery",
};

export const LEVEL_LABEL: Record<Level, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  ALL_LEVELS: "All levels",
};

export const SERVICE_MODE_LABEL: Record<ServiceMode, string> = {
  IN_PERSON: "In person",
  ONLINE: "Online",
  BOTH: "In person or online",
};

export const PAYMENT_PURPOSE_LABEL: Record<PaymentPurpose, string> = {
  ORDER: "Shop order",
  CLASS: "Live class",
  CLASS_RENEWAL: "Live class · next month",
  COURSE: "Recorded course",
};

export const CLASS_FEE_TYPE_LABEL: Record<ClassFeeType, string> = {
  PER_BATCH: "One fee for the whole batch",
  MONTHLY: "Monthly fee, renewed each month",
  PER_SESSION: "Pay for each session",
};

/**
 * How long a recorded course stays open, as an English key for `t()`:
 * null → lifetime; 365 → "12 months"; anything else in days.
 */
export function accessPeriod(days: number | null): { label: string; vars?: Record<string, number> } {
  if (days === null) return { label: "Lifetime access" };
  if (days % 365 === 0) return { label: "{months} months of access", vars: { months: (days / 365) * 12 } };
  return { label: "{days} days of access", vars: { days } };
}

export const BATCH_CLOSED_LABEL = {
  FULL: "Full",
  STARTED: "Already started",
  CLOSED: "Registration closed",
  CANCELLED: "Cancelled",
} as const;
