/**
 * Admin area (clinic owner only). Every /admin endpoint answers 403 to anyone who is not an OWNER.
 * These responses carry customers' contact details and full UPI references, so they are never cached
 * on the device beyond the session and never appear in URLs.
 */
import type { ID, ISODateTime, PageQuery, Paise, Reference } from "./common";
import type { ClassFeeType, Level, RegistrationStatus } from "./learning";
import type { PaymentPurpose, PaymentStatus } from "./payment";
import type { FulfilmentMethod, Order, OrderStatus, OrderSummary } from "./shop";

/** Text the clinic writes in English, with an optional Tamil version. Tamil visitors see English when `ta` is null. */
export type Bilingual = { en: string; ta: string | null };

export type AdminCustomer = { name: string; email: string; phone: string };

export type AdminOverview = {
  /** UPI payments a customer has submitted that nobody has checked yet. */
  paymentsToCheck: number;
  /** Paid orders that still need packing, shipping or handing over. */
  ordersToPrepare: number;
  /** Class batches that haven't started yet. */
  upcomingBatches: number;
  /** Shop products with 5 or fewer left. */
  lowStockProducts: number;
};

// ── Payments ─────────────────────────────────────────────────

export type AdminPayment = {
  id: ID;
  purpose: PaymentPurpose;
  reference: Reference;
  amount: Paise;
  status: PaymentStatus;
  /** e.g. "Order ORD-THVESQ" or "Morning Yoga Flow · Morning batch". */
  description: string;
  /** The full UPI transaction reference, to find the payment in the bank statement. */
  utr: string | null;
  payerName: string | null;
  customer: AdminCustomer;
  createdAt: ISODateTime;
  submittedAt: ISODateTime | null;
  verifiedAt: ISODateTime | null;
  rejectionReason: string | null;
};

export type AdminPaymentQuery = { status?: PaymentStatus };

/** Verifying is a person's decision, made after finding the money in the clinic's bank account. */
export type VerifyPaymentRequest = { foundInBankStatement: true };

/** The reason is shown to the customer, who can then correct and resend their UPI reference. */
export type RejectPaymentRequest = { reason: string };

// ── Orders ───────────────────────────────────────────────────

export type AdminOrderSummary = OrderSummary & {
  customerName: string;
  fulfilment: FulfilmentMethod;
  paymentStatus: PaymentStatus | null;
};

export type AdminOrderQuery = PageQuery & { status?: OrderStatus };

export type AdminOrder = Order & {
  customer: AdminCustomer;
  /** The statuses staff may move this order to now (decided by the server). */
  nextStatuses: OrderStatus[];
};

export type UpdateOrderStatusRequest = {
  status: OrderStatus;
  /** Shown to the customer in the order's progress. */
  note?: string;
  /** Courier and tracking number, for SHIPPED. Shown to the customer. */
  trackingInfo?: string;
};

// ── Live classes ─────────────────────────────────────────────

export type AdminClassSummary = {
  id: ID;
  slug: string;
  title: string;
  feeType: ClassFeeType;
  fee: Paise;
  isPublished: boolean;
  isSample: boolean;
  batchCount: number;
  nextBatchStartsAt: ISODateTime | null;
  confirmedStudents: number;
};

export type AdminBatchStudent = {
  registrationId: ID;
  reference: Reference;
  status: RegistrationStatus;
  name: string;
  phone: string;
  email: string;
  createdAt: ISODateTime;
};

export type AdminBatch = {
  id: ID;
  name: string | null;
  startsAt: ISODateTime;
  durationMinutes: number;
  sessionsCount: number;
  scheduleNote: string | null;
  /** Null = no seat limit. */
  seatLimit: number | null;
  registrationOpen: boolean;
  /** Private Google Meet link. Given only to students whose payment is verified; never on public pages. */
  meetingUrl: string | null;
  /** What registering costs: the batch fee, the first month, or fee × sessions. */
  price: Paise;
  students: AdminBatchStudent[];
};

export type AdminClass = {
  id: ID;
  slug: string;
  title: Bilingual;
  summary: Bilingual;
  /** Markdown. */
  description: Bilingual;
  level: Level;
  language: Bilingual;
  feeType: ClassFeeType;
  fee: Paise;
  instructorName: string | null;
  isPublished: boolean;
  isSample: boolean;
  batches: AdminBatch[];
};

export type ClassInput = {
  title: Bilingual;
  summary: Bilingual;
  description: Bilingual;
  level: Level;
  language: Bilingual;
  feeType: ClassFeeType;
  fee: Paise;
  instructorName: string | null;
  isPublished: boolean;
};

export type BatchInput = {
  name: string | null;
  startsAt: ISODateTime;
  durationMinutes: number;
  sessionsCount: number;
  scheduleNote: string | null;
  seatLimit: number | null;
  registrationOpen: boolean;
  meetingUrl: string | null;
};

// ── Shop products ────────────────────────────────────────────

export type AdminProductSummary = {
  id: ID;
  slug: string;
  name: string;
  categoryName: string | null;
  size: string | null;
  price: Paise;
  stock: number;
  isPublished: boolean;
  isSample: boolean;
};

export type AdminProduct = {
  id: ID;
  slug: string;
  name: Bilingual;
  categoryId: ID | null;
  size: string | null;
  price: Paise;
  mrp: Paise | null;
  stock: number;
  isFeatured: boolean;
  isPublished: boolean;
  shortDescription: Bilingual;
  /** Markdown. */
  description: Bilingual;
  isSample: boolean;
};

export type ProductInput = Omit<AdminProduct, "id" | "slug" | "isSample">;

// ── Recorded courses ─────────────────────────────────────────

export type AdminCourseSummary = {
  id: ID;
  slug: string;
  title: string;
  price: Paise;
  accessDays: number | null;
  lessonCount: number;
  activeStudents: number;
  isPublished: boolean;
  isSample: boolean;
};

export type AdminLesson = {
  id: ID;
  position: number;
  title: Bilingual;
  durationMinutes: number | null;
  isFreePreview: boolean;
  /** Markdown. */
  notes: Bilingual;
  /** YouTube or Vimeo link. Played only for enrolled students (and everyone on a free preview). */
  videoUrl: string | null;
};

export type AdminCourse = {
  id: ID;
  slug: string;
  title: Bilingual;
  summary: Bilingual;
  /** Markdown. */
  description: Bilingual;
  level: Level;
  price: Paise;
  /** Days of access after the payment is verified; null = lifetime. */
  accessDays: number | null;
  isPublished: boolean;
  isSample: boolean;
  lessons: AdminLesson[];
};

export type CourseInput = Omit<AdminCourse, "id" | "slug" | "isSample" | "lessons">;

export type LessonInput = Omit<AdminLesson, "id" | "position">;
