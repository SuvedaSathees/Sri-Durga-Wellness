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
