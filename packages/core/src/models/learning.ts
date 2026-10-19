import type { ID, ImageRef, ISODateTime, Paise, Reference, SampleFlag } from "./common";
import type { Payment } from "./payment";

export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";

/**
 * How a live class is charged (clinic decision 2 — all three are used):
 * - PER_BATCH: one fee for the whole batch.
 * - MONTHLY: a fee each month; the customer renews every month by paying again over UPI.
 * - PER_SESSION: a fee for each session; a batch costs `fee × sessionsCount`.
 */
export type ClassFeeType = "PER_BATCH" | "MONTHLY" | "PER_SESSION";

// ── Live classes ─────────────────────────────────────────────

export type ClassBatch = {
  id: ID;
  name: string | null;
  startsAt: ISODateTime;
  /** Length of each session. The clinic keeps live sessions under 60 minutes (free Google Meet limit). */
  durationMinutes: number;
  /** Sessions in the batch — for MONTHLY classes, sessions in each month. */
  sessionsCount: number;
  scheduleNote: string | null;
  /** What registering for this batch costs now: the batch fee, the first month, or fee × sessions. */
  price: Paise;
  /** Null when the batch has no seat limit (the clinic's current choice). */
  seatsLeft: number | null;
  isOpen: boolean;
  /** Why registration is closed: "FULL", "STARTED", "CLOSED" or "CANCELLED". */
  closedReason: "FULL" | "STARTED" | "CLOSED" | "CANCELLED" | null;
};

export type LiveClassSummary = SampleFlag & {
  id: ID;
  slug: string;
  title: string;
  summary: string;
  level: Level;
  language: string;
  feeType: ClassFeeType;
  /** Fee per batch, per month or per session, depending on `feeType`. 0 = free. */
  fee: Paise;
  instructorName: string | null;
  image: ImageRef | null;
  nextBatch: ClassBatch | null;
};

export type LiveClass = LiveClassSummary & {
  /** Markdown. */
  description: string;
  audience: string;
  feeIncludes: string[];
  materials: string[];
  batches: ClassBatch[];
  /** The signed-in customer's registrations for this class (empty for guests). */
  myRegistrations: Array<{ batchId: ID; registrationId: ID; status: RegistrationStatus }>;
};

export type RegistrationStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_SUBMITTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type ClassRegistration = {
  id: ID;
  reference: Reference;
  status: RegistrationStatus;
  /** Amount of the first payment (the batch fee, the first month, or fee × sessions). */
  amount: Paise;
  feeType: ClassFeeType;
  class: { id: ID; slug: string; title: string };
  batch: ClassBatch;
  /** The seat is held until this time while payment is pending. */
  holdExpiresAt: ISODateTime | null;
  payment: Payment | null;
  /**
   * Google Meet details. The backend includes this ONLY for this customer's CONFIRMED registration;
   * it is never part of public class data and must never be put in URLs or logs.
   */
  meeting: { url: string; opensAt: ISODateTime } | null;
  /**
   * MONTHLY classes only (null otherwise): the paid month and the next month's payment.
   * The joining link is withheld once `paidUntil` has passed, until a renewal is verified.
   */
  monthly: {
    /** End of the paid period; null until the first payment is verified. */
    paidUntil: ISODateTime | null;
    /** Fee for one more month. */
    monthlyFee: Paise;
    /** The renewal in progress (awaiting payment, submitted or rejected), or null. */
    renewal: { periodStart: ISODateTime; periodEnd: ISODateTime; payment: Payment } | null;
    /** True when the customer may start paying for the next month now. */
    canRenew: boolean;
  } | null;
};

export type RegisterForBatchResponse = { registration: ClassRegistration };

export type RenewRegistrationResponse = { registration: ClassRegistration; payment: Payment };

// ── Recorded courses ─────────────────────────────────────────

export type LessonOutline = {
  id: ID;
  position: number;
  title: string;
  durationMinutes: number | null;
  isFreePreview: boolean;
  /** True when this viewer cannot open the lesson. Locked lessons never include video data. */
  isLocked: boolean;
  isCompleted: boolean;
};

export type CourseSummary = SampleFlag & {
  id: ID;
  slug: string;
  title: string;
  summary: string;
  category: string | null;
  level: Level;
  language: string | null;
  price: Paise;
  /** Days of access after enrolment is activated (365 = 12 months); null = lifetime access. */
  accessDays: number | null;
  lessonCount: number;
  cover: ImageRef | null;
};

export type EnrolmentStatus = "PENDING_PAYMENT" | "PAYMENT_SUBMITTED" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export type CourseEnrolment = {
  id: ID;
  reference: Reference;
  status: EnrolmentStatus;
  amount: Paise;
  accessExpiresAt: ISODateTime | null;
  payment: Payment | null;
};

export type Course = CourseSummary & {
  /** Markdown. */
  description: string;
  outcomes: string[];
  instructor: { name: string; bio: string | null } | null;
  lessons: LessonOutline[];
  /** The signed-in customer's enrolment, or null. */
  enrolment: CourseEnrolment | null;
};

export type VideoProvider = "YOUTUBE" | "VIMEO" | "BUNNY" | "EMBED_URL";

export type Lesson = {
  id: ID;
  courseSlug: string;
  position: number;
  title: string;
  summary: string | null;
  durationMinutes: number | null;
  /** Markdown notes. */
  notes: string | null;
  /** Embeddable player URL (https). Only returned when the viewer has access. Null if no video yet. */
  video: { provider: VideoProvider; embedUrl: string } | null;
  resources: Array<{ id: ID; title: string; url: string }>;
  isCompleted: boolean;
  previousLessonId: ID | null;
  nextLessonId: ID | null;
};

export type EnrolResponse = { enrolment: CourseEnrolment };

export type MyCourse = {
  course: CourseSummary;
  enrolment: CourseEnrolment;
  completedLessons: number;
  /** Lesson to continue from. */
  nextLessonId: ID | null;
};
