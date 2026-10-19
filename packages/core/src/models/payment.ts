import type { ID, ISODateTime, Paise, Reference } from "./common";

/** CLASS_RENEWAL = another month of a monthly live class. */
export type PaymentPurpose = "ORDER" | "CLASS" | "CLASS_RENEWAL" | "COURSE";

/**
 * AWAITING_PAYMENT → SUBMITTED (customer entered a UTR) → VERIFIED or REJECTED (clinic staff decide).
 * The apps never move a payment to VERIFIED; only the backend does, after a person has checked it.
 */
export type PaymentStatus = "AWAITING_PAYMENT" | "SUBMITTED" | "VERIFIED" | "REJECTED" | "CANCELLED";

export type UpiInstructions = {
  /** Clinic's UPI ID (VPA), configured on the backend — never hard-coded in the apps. */
  payeeVpa: string;
  payeeName: string;
  /** Note to put in the UPI app so staff can match the payment, e.g. "ORD-THVESQ". */
  note: string;
};

export type Payment = {
  id: ID;
  purpose: PaymentPurpose;
  /** Order / registration / enrolment reference. */
  reference: Reference;
  amount: Paise;
  status: PaymentStatus;
  /** Present while the payment can be made (AWAITING_PAYMENT or REJECTED). */
  upi: UpiInstructions | null;
  /** Pay before this time, or the order / seat is released. */
  dueAt: ISODateTime | null;
  /** Last 4 characters of the submitted UTR, for display. */
  utrLast4: string | null;
  submittedAt: ISODateTime | null;
  verifiedAt: ISODateTime | null;
  /** Shown to the customer when staff could not verify the payment. */
  rejectionReason: string | null;
  /** Human description, e.g. "Order ORD-THVESQ" or "Morning Yoga Flow · Morning batch". */
  description: string;
};

export type SubmitPaymentRequest = {
  /** UPI transaction reference (UTR), usually 12 digits. */
  utr: string;
  payerName: string;
};
