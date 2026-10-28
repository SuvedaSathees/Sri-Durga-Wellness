/**
 * Form validation shared by the web and mobile apps. The same rules should be applied by the
 * backend; these schemas can be handed to the backend team as the reference.
 *
 * Messages are English i18n keys — screens translate them with t(). Field names match the
 * request bodies in docs/API_CONTRACT.md, so server-side `fieldErrors` land on the same inputs.
 */
import { z } from "zod";
import { isValidUtr, normalizeUtr } from "../logic/payments";
import { INDIAN_STATES } from "../logic/india";
import { normalizePhone } from "../logic/misc";
import { clinicDateTimeToIso, isMeetLink, parseRupees, videoEmbed } from "../logic/admin";
import { isDateKey } from "../logic/dates";

// ── Reusable fields ──────────────────────────────────────────

export const nameField = z.string().trim().min(2, "Please enter your full name").max(120, "Name is too long");

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .email("Enter a valid email address");

/** Accepts "98765 43210", "+91 98765-43210", etc.; outputs E.164 ("+919876543210"). */
export const phoneField = z
  .string()
  .trim()
  .refine((value) => {
    if (!/^\+?[\d\s()-]+$/.test(value)) return false;
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }, "Enter a valid phone number")
  .transform(normalizePhone);

export const passwordField = z.string().min(8, "Use at least 8 characters").max(200, "Password is too long");

export const pincodeField = z
  .string()
  .trim()
  // Indian PIN codes are six digits and never start with 0.
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code");

const requiredText = (label: string, max: number, min = 1) =>
  z
    .string()
    .trim()
    .min(min, min > 1 ? `${label} needs at least ${min} characters` : `${label} is required`)
    .max(max, `${label} must be under ${max} characters`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));

const agreed = (message: string) => z.literal(true, { message });

// ── Auth and profile ─────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    name: nameField,
    email: emailField,
    phone: phoneField,
    password: passwordField,
    confirmPassword: z.string(),
    acceptTerms: agreed("Please accept the terms to continue"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({ password: passwordField, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export const profileSchema = z.object({ name: nameField, phone: phoneField });

// ── Booking and enquiries ────────────────────────────────────

export const patientDetailsSchema = z.object({
  patientName: nameField,
  patientPhone: phoneField,
  patientEmail: emailField,
  reason: requiredText("Reason for visit", 1000, 3),
  consent: agreed("Please confirm you agree to be contacted about this booking"),
});

export const cancelAppointmentSchema = z.object({ reason: optionalText(500) });

export const consultationMethods = ["PHONE", "VIDEO", "IN_PERSON"] as const;

export const consultationSchema = z.object({
  name: nameField,
  phone: phoneField,
  email: emailField,
  preferredMethod: z.enum(consultationMethods, "Please choose one of the options."),
  reason: requiredText("What you'd like help with", 1500, 10),
  consent: agreed("Please agree so we can contact you"),
});

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(phoneField.optional()),
  subject: requiredText("Subject", 150, 3),
  message: requiredText("Message", 3000, 10),
});

// ── Checkout and payment ─────────────────────────────────────

export const contactDetailsSchema = z.object({ name: nameField, email: emailField, phone: phoneField });

export const addressSchema = z.object({
  line1: requiredText("Address line 1", 200, 3),
  line2: optionalText(200),
  landmark: optionalText(120),
  city: requiredText("City", 80, 2),
  state: z.enum(INDIAN_STATES, { message: "Choose your state" }),
  pincode: pincodeField,
});

export const checkoutSchema = z.discriminatedUnion("fulfilment", [
  z.object({
    fulfilment: z.literal("PICKUP"),
    pickupBranchId: z.string().min(1, "Choose a branch for pickup"),
    contact: contactDetailsSchema,
    notes: optionalText(500),
  }),
  z.object({
    fulfilment: z.literal("DELIVERY"),
    address: addressSchema,
    contact: contactDetailsSchema,
    notes: optionalText(500),
  }),
]);

export const utrSubmissionSchema = z.object({
  utr: z.string().transform(normalizeUtr).refine(isValidUtr, "Enter the UPI transaction reference (usually 12 digits)"),
  payerName: nameField,
});

// ── Admin area (clinic owner) ────────────────────────────────
// Form schemas take what the owner types (rupees, dates and numbers as text) and output the API
// request body. Input schemas are what the server checks (amounts already in paise).

const MAX_AMOUNT = 10_000_000; // ₹1,00,000 in paise
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"] as const;
const FEE_TYPES = ["PER_BATCH", "MONTHLY", "PER_SESSION"] as const;
const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAYMENT_SUBMITTED",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;

/** Empty text → null. */
const textOrNull = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters`)
    .nullish()
    .transform((v) => (v ? v : null));

/** English (required) with an optional Tamil version. */
const bilingual = (label: string, max: number, min = 1) =>
  z.object({ en: requiredText(label, max, min), ta: textOrNull(max) });

/** English and Tamil both optional (long descriptions and notes). */
const bilingualOptional = (max: number) =>
  z.object({
    en: z.string().trim().max(max, `Please keep this under ${max} characters`).default(""),
    ta: textOrNull(max),
  });

/** A whole number typed as text (or sent as a number). */
const wholeNumber = (min: number, max: number, message: string) =>
  z.union([z.string(), z.number()]).transform((v, ctx) => {
    const n = typeof v === "number" ? v : /^\s*\d+\s*$/.test(v) ? Number(v) : NaN;
    if (!Number.isInteger(n) || n < min || n > max) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return n;
  });

/** Like wholeNumber, but empty means null. */
const wholeNumberOrNull = (min: number, max: number, message: string) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v, ctx) => {
      if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) return null;
      const n = typeof v === "number" ? v : /^\s*\d+\s*$/.test(v) ? Number(v) : NaN;
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return n;
    });

/** Rupees as typed ("1,500", "1500.50") → paise. */
const rupeesField = (min = 0) =>
  z.string().transform((v, ctx) => {
    const paise = parseRupees(v);
    if (paise === null) {
      ctx.addIssue({ code: "custom", message: "Enter an amount in rupees, like 1500" });
      return z.NEVER;
    }
    if (paise > MAX_AMOUNT) {
      ctx.addIssue({ code: "custom", message: "This amount is too large" });
      return z.NEVER;
    }
    if (paise < min) {
      ctx.addIssue({ code: "custom", message: "Enter a price of at least ₹1" });
      return z.NEVER;
    }
    return paise;
  });

const optionalRupeesField = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v || !v.trim()) return null;
    const paise = parseRupees(v);
    if (paise === null || paise > MAX_AMOUNT) {
      ctx.addIssue({ code: "custom", message: "Enter an amount in rupees, like 1500" });
      return z.NEVER;
    }
    return paise;
  });

/** Amounts in API bodies are integer paise. */
const paiseField = (min = 0) =>
  z
    .number("Enter an amount in rupees, like 1500")
    .int("Enter an amount in rupees, like 1500")
    .min(min, min > 0 ? "Enter a price of at least ₹1" : "Enter an amount in rupees, like 1500")
    .max(MAX_AMOUNT, "This amount is too large");

const meetLinkField = z
  .string()
  .nullish()
  .transform((v, ctx) => {
    const link = (v ?? "").trim();
    if (!link) return null;
    if (!isMeetLink(link)) {
      ctx.addIssue({ code: "custom", message: "Enter a Google Meet link (meet.google.com/…)" });
      return z.NEVER;
    }
    return link;
  });

const videoLinkField = z
  .string()
  .nullish()
  .transform((v, ctx) => {
    const link = (v ?? "").trim();
    if (!link) return null;
    if (!videoEmbed(link)) {
      ctx.addIssue({ code: "custom", message: "Paste a YouTube or Vimeo link" });
      return z.NEVER;
    }
    return link;
  });

const classFields = {
  title: bilingual("Title", 120, 3),
  summary: bilingual("Summary", 300, 10),
  description: bilingualOptional(5000),
  level: z.enum(LEVELS, "Choose a level"),
  language: bilingual("Language", 60, 2),
  feeType: z.enum(FEE_TYPES, "Choose how the fee is charged"),
  instructorName: textOrNull(120),
  isPublished: z.boolean(),
};
export const classFormSchema = z.object({ ...classFields, fee: rupeesField() });
export const classInputSchema = z.object({ ...classFields, fee: paiseField() });

const batchFields = {
  name: textOrNull(80),
  durationMinutes: wholeNumber(15, 60, "Live sessions can be 15 to 60 minutes"),
  sessionsCount: wholeNumber(1, 200, "Enter between 1 and 200 sessions"),
  scheduleNote: textOrNull(160),
  seatLimit: wholeNumberOrNull(1, 1000, "Leave empty for no limit, or enter 1 to 1000"),
  registrationOpen: z.boolean(),
  meetingUrl: meetLinkField,
};
/** The owner picks the start as a clinic-time date and time; the API gets a UTC instant. */
export const batchFormSchema = z
  .object({
    ...batchFields,
    date: z.string().refine((v) => isDateKey(v.trim()), "Choose a date"),
    time: z.string().regex(/^\s*([01]\d|2[0-3]):[0-5]\d\s*$/, "Enter a time, like 18:30"),
  })
  .transform(({ date, time, ...rest }) => ({ ...rest, startsAt: clinicDateTimeToIso(date, time)! }));
export const batchInputSchema = z.object({
  ...batchFields,
  startsAt: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), "Choose a date"),
});

const productFields = {
  name: bilingual("Product name", 120, 2),
  categoryId: z
    .string()
    .nullish()
    .transform((v) => (v ? v : null)),
  size: textOrNull(40),
  stock: wholeNumber(0, 100_000, "Enter a stock count from 0 to 100000"),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  shortDescription: bilingual("Short description", 200, 10),
  description: bilingualOptional(5000),
};
const mrpNotBelowPrice = (v: { price: number; mrp: number | null }) => v.mrp === null || v.mrp >= v.price;
export const productFormSchema = z
  .object({ ...productFields, price: rupeesField(100), mrp: optionalRupeesField })
  .refine(mrpNotBelowPrice, { message: "MRP can't be lower than the price", path: ["mrp"] });
export const productInputSchema = z
  .object({ ...productFields, price: paiseField(100), mrp: paiseField().nullable() })
  .refine(mrpNotBelowPrice, { message: "MRP can't be lower than the price", path: ["mrp"] });

const courseFields = {
  title: bilingual("Title", 120, 3),
  summary: bilingual("Summary", 300, 10),
  description: bilingualOptional(5000),
  level: z.enum(LEVELS, "Choose a level"),
  accessDays: wholeNumberOrNull(1, 3650, "Leave empty for lifetime access, or enter 1 to 3650 days"),
  isPublished: z.boolean(),
};
export const courseFormSchema = z.object({ ...courseFields, price: rupeesField() });
export const courseInputSchema = z.object({ ...courseFields, price: paiseField() });

/** Lessons have no money fields, so the form and the server use the same rules. */
export const lessonSchema = z.object({
  title: bilingual("Lesson title", 120, 3),
  durationMinutes: wholeNumberOrNull(1, 600, "Enter minutes from 1 to 600, or leave empty"),
  isFreePreview: z.boolean(),
  notes: bilingualOptional(10_000),
  videoUrl: videoLinkField,
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, "Choose what happens next"),
  note: optionalText(300),
  trackingInfo: optionalText(160),
});

export const verifyPaymentSchema = z.object({
  foundInBankStatement: agreed("Confirm you found this payment in the bank statement"),
});

export const rejectPaymentSchema = z.object({ reason: requiredText("Reason", 300, 5) });

// ── Helpers ──────────────────────────────────────────────────

export type FieldErrors = Record<string, string>;

export type ValidationResult<T> = { success: true; data: T } | { success: false; fieldErrors: FieldErrors };

/** Validate form values; field errors are keyed by dot path ("contact.phone"), first message wins. */
export function validate<S extends z.ZodType>(schema: S, input: unknown): ValidationResult<z.output<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { success: false, fieldErrors };
}

export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type PatientDetailsInput = z.input<typeof patientDetailsSchema>;
export type ConsultationInput = z.input<typeof consultationSchema>;
export type ContactInput = z.input<typeof contactSchema>;
export type CheckoutInput = z.input<typeof checkoutSchema>;
export type UtrSubmissionInput = z.input<typeof utrSubmissionSchema>;
export type ClassFormInput = z.input<typeof classFormSchema>;
export type BatchFormInput = z.input<typeof batchFormSchema>;
export type ProductFormInput = z.input<typeof productFormSchema>;
export type CourseFormInput = z.input<typeof courseFormSchema>;
export type LessonFormInput = z.input<typeof lessonSchema>;
export type OrderStatusInput = z.input<typeof orderStatusSchema>;
