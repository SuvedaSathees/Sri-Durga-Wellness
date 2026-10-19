/**
 * In-memory mock backend implementing the PROPOSED API contract (docs/API_CONTRACT.md).
 *
 * It exists so both apps can be built and tested before the real backend is ready. It applies the
 * same rules the real backend must: server-side validation, ownership checks, stock reservation,
 * payment states that only staff can move to VERIFIED, private meeting links, locked lessons.
 *
 * Nothing here is a real person, address, UPI ID or credential. There is no built-in account —
 * register one in the app (data lives only in memory / the browser session).
 */
import type {
  Appointment,
  AuthSession,
  Availability,
  AvailabilityDay,
  BlogPostSummary,
  CartLine,
  CartProblem,
  CartQuote,
  ClassBatch,
  ClassRegistration,
  Course,
  CourseEnrolment,
  CourseSummary,
  Doctor,
  DoctorDetail,
  EnrolmentStatus,
  Lesson,
  LessonOutline,
  LiveClass,
  LiveClassSummary,
  Locale,
  MyCourse,
  Order,
  OrderEvent,
  OrderStatus,
  OrderSummary,
  Paginated,
  Payment,
  PaymentPurpose,
  PaymentStatus,
  PolicyPage,
  Product,
  ProductSummary,
  RegistrationStatus,
  Service,
  ServiceDetail,
  User,
} from "../models";
import type { ClientPlatform } from "../config";
import { endpoints } from "../api/endpoints";
import { addDaysToKey, clinicTimeToUtc, isDateKey, weekdayOfKey } from "../logic/dates";
import { idempotencyKey } from "../logic/misc";
import { batchPrice } from "../logic/money";
import {
  addressSchema,
  consultationSchema,
  contactDetailsSchema,
  contactSchema,
  emailField,
  nameField,
  passwordField,
  patientDetailsSchema,
  phoneField,
  utrSubmissionSchema,
  validate,
} from "../validation";
import { z } from "zod";
import {
  buildCatalog,
  MOCK_UPI,
  type Catalog,
  type ClassRec,
  type CourseRec,
  type ProductRec,
  type ServiceRec,
} from "./catalog";
import {
  accepted,
  created,
  invalid,
  MockHttpError,
  noContent,
  notFound,
  ok,
  unauthenticated,
  type MockRequest,
  type MockResponse,
} from "./http";

// ── State ────────────────────────────────────────────────────

type UserRec = Omit<User, "createdAt"> & { password: string; createdAt: string };
type AppointmentRec = {
  id: string;
  reference: string;
  status: Appointment["status"];
  serviceId: string;
  doctorId: string;
  branchId: string | null;
  userId: string | null;
  startsAt: string;
  endsAt: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string;
  cancelledAt: string | null;
  createdAt: string;
};
type OrderRec = {
  id: string;
  reference: string;
  userId: string;
  status: OrderStatus;
  fulfilment: Order["fulfilment"];
  pickupBranchId: string | null;
  address: Order["address"];
  contact: Order["contact"];
  items: Array<{ productId: string; name: string; size: string | null; unitPrice: number; quantity: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes: string | null;
  createdAt: string;
  paymentDueAt: string;
  paymentId: string;
  events: OrderEvent[];
};
type PaymentRec = {
  id: string;
  purpose: PaymentPurpose;
  reference: string;
  userId: string;
  targetId: string;
  amount: number;
  status: PaymentStatus;
  utr: string | null;
  payerName: string | null;
  dueAt: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
};
type RegistrationRec = {
  id: string;
  reference: string;
  userId: string;
  classId: string;
  batchId: string;
  status: RegistrationStatus;
  amount: number;
  holdExpiresAt: string | null;
  paymentId: string | null;
  createdAt: string;
  /** MONTHLY classes: end of the paid period (set when a payment is verified). */
  paidUntil: string | null;
  /** MONTHLY classes: the next month being paid for. */
  renewal: { paymentId: string; periodStart: string; periodEnd: string } | null;
};
type EnrolmentRec = {
  id: string;
  reference: string;
  userId: string;
  courseId: string;
  status: EnrolmentStatus;
  amount: number;
  accessExpiresAt: string | null;
  paymentId: string | null;
  createdAt: string;
};

export type MockState = {
  version: 2;
  epoch: string;
  users: UserRec[];
  sessions: Record<string, { userId: string; expiresAt: number }>;
  refreshTokens: Record<string, string>;
  /** Simulates the web app's httpOnly refresh cookie (the browser's cookie jar). */
  webRefreshCookie: string | null;
  resetTokens: Record<string, { userId: string; expiresAt: number }>;
  failedLogins: Record<string, number[]>;
  appointments: AppointmentRec[];
  enquiries: Array<{ kind: "consultation" | "contact"; reference: string; createdAt: string }>;
  stock: Record<string, number>;
  orders: OrderRec[];
  payments: PaymentRec[];
  registrations: RegistrationRec[];
  enrolments: EnrolmentRec[];
  progress: Record<string, string[]>;
  idempotency: Record<string, MockResponse>;
  upiEnabled: boolean;
};

const ACCESS_TOKEN_SECONDS = 15 * 60;
const LOW_STOCK = 5;
const MAX_LINE = 20;
const CANCEL_CUTOFF_HOURS = 24;
const BOOKING_LEAD_MINUTES = 120;
const SLOT_STEP_MINUTES = 30;
const MEETING_OPENS_MINUTES = 15;

export function createInitialState(now: Date, catalog: Catalog): MockState {
  return {
    version: 2,
    epoch: now.toISOString(),
    users: [],
    sessions: {},
    refreshTokens: {},
    webRefreshCookie: null,
    resetTokens: {},
    failedLogins: {},
    appointments: [],
    enquiries: [],
    stock: Object.fromEntries(catalog.products.map((p) => [p.id, p.initialStock])),
    orders: [],
    payments: [],
    registrations: [],
    enrolments: [],
    progress: {},
    idempotency: {},
    upiEnabled: true,
  };
}

// ── Small helpers ────────────────────────────────────────────

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function reference(prefix: string): string {
  const key = idempotencyKey();
  let out = "";
  for (let i = 0; i < 6; i++) out += REF_ALPHABET[parseInt(key.slice(i * 2, i * 2 + 2), 16) % REF_ALPHABET.length];
  return `${prefix}-${out}`;
}
const newId = (prefix: string) => `${prefix}_${idempotencyKey().slice(0, 20)}`;
const iso = (d: Date | number) => new Date(d).toISOString();
/** Same day next month (clamped, so 31 Jan → 28/29 Feb). */
function addOneMonth(d: Date): Date {
  const out = new Date(d.getTime());
  const day = out.getUTCDate();
  out.setUTCDate(1);
  out.setUTCMonth(out.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(out.getUTCFullYear(), out.getUTCMonth() + 1, 0)).getUTCDate();
  out.setUTCDate(Math.min(day, lastDay));
  return out;
}
const t = (locale: Locale, en: string, ta: string) => (locale === "ta" ? ta : en);

function page<T>(items: T[], query: Record<string, string>, defaultSize = 12): Paginated<T> {
  const pageSize = Math.min(48, Math.max(1, Number(query.pageSize) || defaultSize));
  const pageNo = Math.max(1, Number(query.page) || 1);
  return {
    items: items.slice((pageNo - 1) * pageSize, pageNo * pageSize),
    page: pageNo,
    pageSize,
    total: items.length,
  };
}

function check<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = validate(schema, input);
  if (!result.success) throw invalid(result.fieldErrors);
  return result.data;
}

// ── The backend ──────────────────────────────────────────────

export type MockBackend = {
  handle(req: MockRequest): Promise<MockResponse> | MockResponse;
  userIdForToken(token: string | null): string | null;
  state: MockState;
  controls: MockControls;
};

export type MockControls = {
  /** Payments waiting for clinic verification (for the demo tools panel). */
  pendingPayments(): Array<{
    id: string;
    reference: string;
    amount: number;
    purpose: PaymentPurpose;
    status: PaymentStatus;
  }>;
  /** Simulate a staff member verifying a submitted payment. */
  verifyPayment(paymentId: string): void;
  /** Simulate a staff member rejecting a submitted payment. */
  rejectPayment(paymentId: string, reason: string): void;
  /** Simulate the clinic turning UPI payments off (to see disabled checkout states). */
  setUpiEnabled(enabled: boolean): void;
  /** The most recent password-reset token issued (a real backend emails it). */
  lastResetToken(): string | null;
  /** Wipe all customer data and start again. */
  reset(): void;
};

export function createMockBackend(
  options: { now?: () => Date; initialState?: MockState; onChange?: (s: MockState) => void } = {},
): MockBackend {
  const now = options.now ?? (() => new Date());
  const firstEpoch = options.initialState ? new Date(options.initialState.epoch) : now();
  let catalogs: Record<Locale, Catalog> = { en: buildCatalog("en", firstEpoch), ta: buildCatalog("ta", firstEpoch) };
  let state: MockState = options.initialState ?? createInitialState(firstEpoch, catalogs.en);
  let lastResetToken: string | null = null;
  const changed = () => options.onChange?.(state);
  const cat = (locale: Locale) => catalogs[locale];

  // ── lazy expiry: unpaid orders and seat holds lapse ──
  function sweep(at: Date) {
    let dirty = false;
    for (const o of state.orders) {
      if (o.status !== "PENDING_PAYMENT" || new Date(o.paymentDueAt) > at) continue;
      const p = state.payments.find((x) => x.id === o.paymentId);
      if (p && p.status === "SUBMITTED") continue; // staff are already checking it
      o.status = "EXPIRED";
      o.events.push({ status: "EXPIRED", note: "Payment window ended", at: iso(at) });
      for (const item of o.items) state.stock[item.productId] = (state.stock[item.productId] ?? 0) + item.quantity;
      if (p) p.status = "CANCELLED";
      dirty = true;
    }
    for (const r of state.registrations) {
      if (r.status !== "PENDING_PAYMENT" || !r.holdExpiresAt || new Date(r.holdExpiresAt) > at) continue;
      r.status = "EXPIRED";
      const p = state.payments.find((x) => x.id === r.paymentId);
      if (p && p.status !== "SUBMITTED") p.status = "CANCELLED";
      dirty = true;
    }
    if (dirty) changed();
  }

  function userIdForToken(token: string | null): string | null {
    if (!token) return null;
    const s = state.sessions[token];
    if (!s || s.expiresAt <= now().getTime()) return null;
    return s.userId;
  }

  const requireUser = (req: MockRequest): UserRec => {
    const user = req.userId ? state.users.find((u) => u.id === req.userId) : undefined;
    if (!user) throw unauthenticated();
    return user;
  };

  const publicUser = (u: UserRec): User => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    locale: u.locale,
    createdAt: u.createdAt,
  });

  function issueSession(user: UserRec, platform: ClientPlatform): AuthSession {
    const accessToken = `at_${idempotencyKey()}`;
    state.sessions[accessToken] = { userId: user.id, expiresAt: now().getTime() + ACCESS_TOKEN_SECONDS * 1000 };
    const refreshToken = `rt_${idempotencyKey()}${idempotencyKey()}`;
    state.refreshTokens[refreshToken] = user.id;
    if (platform === "web") state.webRefreshCookie = refreshToken; // httpOnly cookie — never in the body
    changed();
    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_SECONDS,
      user: publicUser(user),
      ...(platform === "web" ? {} : { refreshToken }),
    };
  }

  // ── views (public shapes; internal fields are never leaked) ──

  const doctorView = (d: Catalog["doctors"][number]): Doctor => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    specialisation: d.specialisation,
    qualifications: d.qualifications,
    experienceYears: d.experienceYears,
    languages: d.languages,
    shortBio: d.shortBio,
    photo: d.photo,
    acceptsAppointments: d.acceptsAppointments,
    isSample: d.isSample,
  });

  const serviceView = (s: ServiceRec): Service => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    summary: s.summary,
    durationMinutes: s.durationMinutes,
    price: s.price,
    mode: s.mode,
    icon: s.icon,
    isBookable: s.isBookable && s.doctorIds.length > 0,
    isSample: s.isSample,
  });

  const stockOf = (id: string) => state.stock[id] ?? 0;
  const productSummary = (p: ProductRec, c: Catalog): ProductSummary => {
    const stock = stockOf(p.id);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: c.categories.find((x) => x.id === p.categoryId) ?? null,
      size: p.size,
      price: p.price,
      mrp: p.mrp,
      image: p.image,
      stockStatus: stock <= 0 ? "OUT_OF_STOCK" : stock <= LOW_STOCK ? "LOW_STOCK" : "IN_STOCK",
      maxQuantity: Math.max(0, Math.min(stock, MAX_LINE)),
      isSample: p.isSample,
    };
  };

  function seatsTaken(batchId: string, at: Date): number {
    return state.registrations.filter(
      (r) =>
        r.batchId === batchId &&
        (r.status === "CONFIRMED" ||
          r.status === "PAYMENT_SUBMITTED" ||
          (r.status === "PENDING_PAYMENT" && (!r.holdExpiresAt || new Date(r.holdExpiresAt) > at))),
    ).length;
  }

  function batchView(b: ClassRec["batches"][number], c: ClassRec, at: Date): ClassBatch {
    const seatsLeft = b.seatLimit === null ? null : Math.max(0, b.seatLimit - seatsTaken(b.id, at));
    const started = new Date(b.startsAt) <= at;
    const closedReason: ClassBatch["closedReason"] = !b.registrationOpen
      ? "CLOSED"
      : started
        ? "STARTED"
        : seatsLeft === 0
          ? "FULL"
          : null;
    return {
      id: b.id,
      name: b.name,
      startsAt: b.startsAt,
      durationMinutes: b.durationMinutes,
      sessionsCount: b.sessionsCount,
      scheduleNote: b.scheduleNote,
      price: batchPrice(c.fee, c.feeType, b.sessionsCount),
      seatsLeft,
      isOpen: closedReason === null,
      closedReason,
    };
  }

  function classSummary(c: ClassRec, at: Date): LiveClassSummary {
    const upcoming = c.batches
      .filter((b) => new Date(b.startsAt) > at)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      level: c.level,
      language: c.language,
      feeType: c.feeType,
      fee: c.fee,
      instructorName: c.instructorName,
      image: c.image,
      nextBatch: upcoming[0] ? batchView(upcoming[0], c, at) : null,
      isSample: c.isSample,
    };
  }

  function paymentView(p: PaymentRec, locale: Locale): Payment {
    const c = cat(locale);
    let description = p.reference;
    if (p.purpose === "ORDER") description = t(locale, `Order ${p.reference}`, `ஆர்டர் ${p.reference}`);
    if (p.purpose === "CLASS" || p.purpose === "CLASS_RENEWAL") {
      const r = state.registrations.find((x) => x.id === p.targetId);
      const cls = c.classes.find((x) => x.id === r?.classId);
      const b = cls?.batches.find((x) => x.id === r?.batchId);
      const extra = p.purpose === "CLASS_RENEWAL" ? t(locale, "Next month", "அடுத்த மாதம்") : null;
      description = [cls?.title, b?.name, extra].filter(Boolean).join(" · ") || p.reference;
    }
    if (p.purpose === "COURSE") {
      const e = state.enrolments.find((x) => x.id === p.targetId);
      description = c.courses.find((x) => x.id === e?.courseId)?.title ?? p.reference;
    }
    const payable = (p.status === "AWAITING_PAYMENT" || p.status === "REJECTED") && state.upiEnabled;
    return {
      id: p.id,
      purpose: p.purpose,
      reference: p.reference,
      amount: p.amount,
      status: p.status,
      upi: payable ? { ...MOCK_UPI, note: p.reference } : null,
      dueAt: p.dueAt,
      utrLast4: p.utr ? p.utr.slice(-4) : null,
      submittedAt: p.submittedAt,
      verifiedAt: p.verifiedAt,
      rejectionReason: p.rejectionReason,
      description,
    };
  }

  function appointmentView(a: AppointmentRec, locale: Locale, at: Date): Appointment {
    const c = cat(locale);
    const s = c.services.find((x) => x.id === a.serviceId)!;
    const d = c.doctors.find((x) => x.id === a.doctorId)!;
    const b = c.branches.find((x) => x.id === a.branchId);
    const cancelBefore = new Date(new Date(a.startsAt).getTime() - CANCEL_CUTOFF_HOURS * 3_600_000);
    return {
      id: a.id,
      reference: a.reference,
      status: a.status,
      service: { id: s.id, slug: s.slug, name: s.name, durationMinutes: s.durationMinutes, price: s.price },
      doctor: { id: d.id, slug: d.slug, name: d.name },
      branch: b ? { id: b.id, name: b.name, addressLine: b.addressLine, city: b.city } : null,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      patientName: a.patientName,
      patientPhone: a.patientPhone,
      patientEmail: a.patientEmail,
      reason: a.reason,
      canCancel: a.status === "CONFIRMED" && at < cancelBefore,
      cancelBefore: a.status === "CONFIRMED" ? cancelBefore.toISOString() : null,
      cancelledAt: a.cancelledAt,
    };
  }

  function orderSummary(o: OrderRec): OrderSummary {
    return {
      id: o.id,
      reference: o.reference,
      status: o.status,
      total: o.total,
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
      createdAt: o.createdAt,
    };
  }

  function orderView(o: OrderRec, locale: Locale): Order {
    const c = cat(locale);
    const branch = c.branches.find((b) => b.id === o.pickupBranchId);
    const p = state.payments.find((x) => x.id === o.paymentId);
    return {
      ...orderSummary(o),
      fulfilment: o.fulfilment,
      pickupBranch: branch
        ? { id: branch.id, name: branch.name, addressLine: branch.addressLine, city: branch.city }
        : null,
      address: o.address,
      contact: o.contact,
      items: o.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        size: i.size,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        lineTotal: i.unitPrice * i.quantity,
        image: c.products.find((x) => x.id === i.productId)?.image ?? null,
      })),
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      notes: o.notes,
      trackingInfo: null,
      paymentDueAt: o.status === "PENDING_PAYMENT" ? o.paymentDueAt : null,
      payment: p ? paymentView(p, locale) : null,
      events: o.events,
    };
  }

  function registrationView(r: RegistrationRec, locale: Locale, at: Date): ClassRegistration {
    const c = cat(locale);
    const cls = c.classes.find((x) => x.id === r.classId)!;
    const batch = cls.batches.find((b) => b.id === r.batchId)!;
    const p = state.payments.find((x) => x.id === r.paymentId);
    const monthly = cls.feeType === "MONTHLY" && cls.fee > 0;
    // A monthly seat keeps its joining link only while the month is paid for.
    const lapsed = monthly && (!r.paidUntil || new Date(r.paidUntil) <= at);
    const renewalPayment = r.renewal ? state.payments.find((x) => x.id === r.renewal!.paymentId) : undefined;
    return {
      id: r.id,
      reference: r.reference,
      status: r.status,
      amount: r.amount,
      feeType: cls.feeType,
      class: { id: cls.id, slug: cls.slug, title: cls.title },
      batch: batchView(batch, cls, at),
      holdExpiresAt: r.status === "PENDING_PAYMENT" ? r.holdExpiresAt : null,
      payment: p ? paymentView(p, locale) : null,
      monthly: monthly
        ? {
            paidUntil: r.paidUntil,
            monthlyFee: cls.fee,
            renewal:
              r.renewal && renewalPayment
                ? {
                    periodStart: r.renewal.periodStart,
                    periodEnd: r.renewal.periodEnd,
                    payment: paymentView(renewalPayment, locale),
                  }
                : null,
            canRenew: r.status === "CONFIRMED" && !!r.paidUntil && !r.renewal && state.upiEnabled,
          }
        : null,
      // Private: only for this customer's confirmed seat. A sample link on example.com — not a real meeting.
      meeting:
        r.status === "CONFIRMED" && !lapsed
          ? {
              url: `https://meet.example.com/sample-${cls.slug}`,
              opensAt: iso(new Date(batch.startsAt).getTime() - MEETING_OPENS_MINUTES * 60_000),
            }
          : null,
    };
  }

  const activeEnrolment = (userId: string | null, courseId: string, at: Date) =>
    userId
      ? state.enrolments.find(
          (e) =>
            e.userId === userId &&
            e.courseId === courseId &&
            e.status === "ACTIVE" &&
            (!e.accessExpiresAt || new Date(e.accessExpiresAt) > at),
        )
      : undefined;

  const currentEnrolment = (userId: string | null, courseId: string) =>
    userId
      ? [...state.enrolments]
          .reverse()
          .find((e) => e.userId === userId && e.courseId === courseId && e.status !== "CANCELLED")
      : undefined;

  function enrolmentView(e: EnrolmentRec, locale: Locale, at: Date): CourseEnrolment {
    const expired = e.status === "ACTIVE" && e.accessExpiresAt && new Date(e.accessExpiresAt) <= at;
    const p = state.payments.find((x) => x.id === e.paymentId);
    return {
      id: e.id,
      reference: e.reference,
      status: expired ? "EXPIRED" : e.status,
      amount: e.amount,
      accessExpiresAt: e.accessExpiresAt,
      payment: p ? paymentView(p, locale) : null,
    };
  }

  const courseSummary = (c: CourseRec): CourseSummary => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    category: c.category,
    level: c.level,
    language: c.language,
    price: c.price,
    accessDays: c.accessDays,
    lessonCount: c.lessons.length,
    cover: c.cover,
    isSample: c.isSample,
  });

  function lessonOutline(c: CourseRec, userId: string | null, at: Date): LessonOutline[] {
    const access = !!activeEnrolment(userId, c.id, at);
    const done = new Set(userId ? (state.progress[userId] ?? []) : []);
    return c.lessons.map((l) => ({
      id: l.id,
      position: l.position,
      title: l.title,
      durationMinutes: l.durationMinutes,
      isFreePreview: l.isFreePreview,
      isLocked: !(access || l.isFreePreview),
      isCompleted: done.has(l.id),
    }));
  }

  // ── availability ──

  function freeSlots(
    service: ServiceRec,
    doctorId: string,
    from: string,
    days: number,
    at: Date,
    locale: Locale,
  ): AvailabilityDay[] {
    const doctor = cat(locale).doctors.find((d) => d.id === doctorId)!;
    const branchId = service.mode === "ONLINE" ? null : (cat(locale).branches[0]?.id ?? null);
    const busy = state.appointments
      .filter((a) => a.doctorId === doctorId && a.status === "CONFIRMED")
      .map((a) => [new Date(a.startsAt).getTime(), new Date(a.endsAt).getTime()] as const);
    const earliest = at.getTime() + BOOKING_LEAD_MINUTES * 60_000;
    const out: AvailabilityDay[] = [];
    for (let i = 0; i < days; i++) {
      const key = addDaysToKey(from, i);
      const windows = doctor.schedule.filter((w) => w.weekday === weekdayOfKey(key));
      if (windows.length === 0) {
        out.push({ date: key, slots: [], closedReason: t(locale, "Not available", "கிடைக்கவில்லை") });
        continue;
      }
      const slots = [];
      for (const w of windows) {
        for (let m = w.start; m + service.durationMinutes <= w.end; m += SLOT_STEP_MINUTES) {
          const start = clinicTimeToUtc(key, m).getTime();
          const end = start + service.durationMinutes * 60_000;
          if (start < earliest) continue;
          if (busy.some(([bs, be]) => start < be && end > bs)) continue;
          slots.push({ startsAt: iso(start), endsAt: iso(end), branchId });
        }
      }
      out.push({ date: key, slots, closedReason: null });
    }
    return out;
  }

  // ── payments ──

  function createPayment(
    purpose: PaymentPurpose,
    ref: string,
    userId: string,
    targetId: string,
    amount: number,
    dueAt: string | null,
  ): PaymentRec {
    const p: PaymentRec = {
      id: newId("pay"),
      purpose,
      reference: ref,
      userId,
      targetId,
      amount,
      status: "AWAITING_PAYMENT",
      utr: null,
      payerName: null,
      dueAt,
      submittedAt: null,
      verifiedAt: null,
      rejectionReason: null,
      createdAt: iso(now()),
    };
    state.payments.push(p);
    return p;
  }

  function setTargetStatus(p: PaymentRec, outcome: "submitted" | "verified" | "rejected") {
    const at = iso(now());
    if (p.purpose === "ORDER") {
      const o = state.orders.find((x) => x.id === p.targetId);
      if (!o) return;
      const next: OrderStatus =
        outcome === "submitted" ? "PAYMENT_SUBMITTED" : outcome === "verified" ? "CONFIRMED" : "PENDING_PAYMENT";
      o.status = next;
      const note =
        outcome === "submitted"
          ? "UPI reference submitted"
          : outcome === "verified"
            ? "Payment verified"
            : "Payment could not be verified";
      o.events.push({ status: next, note, at });
      if (outcome === "rejected") o.paymentDueAt = iso(now().getTime() + 24 * 3_600_000);
    }
    if (p.purpose === "CLASS") {
      const r = state.registrations.find((x) => x.id === p.targetId);
      if (r)
        r.status =
          outcome === "submitted" ? "PAYMENT_SUBMITTED" : outcome === "verified" ? "CONFIRMED" : "PENDING_PAYMENT";
      if (r && outcome === "rejected") r.holdExpiresAt = iso(now().getTime() + 24 * 3_600_000);
      if (r && outcome === "verified") {
        const cls = cat("en").classes.find((c) => c.id === r.classId);
        const batch = cls?.batches.find((b) => b.id === r.batchId);
        // The first month runs from the batch start (or today, if it has already started).
        if (cls?.feeType === "MONTHLY" && batch) {
          const from = new Date(Math.max(new Date(batch.startsAt).getTime(), now().getTime()));
          r.paidUntil = addOneMonth(from).toISOString();
        }
      }
    }
    if (p.purpose === "CLASS_RENEWAL" && outcome === "verified") {
      const r = state.registrations.find((x) => x.id === p.targetId);
      if (r?.renewal) {
        r.paidUntil = r.renewal.periodEnd;
        r.renewal = null;
      }
    }
    if (p.purpose === "COURSE") {
      const e = state.enrolments.find((x) => x.id === p.targetId);
      if (!e) return;
      e.status = outcome === "submitted" ? "PAYMENT_SUBMITTED" : outcome === "verified" ? "ACTIVE" : "PENDING_PAYMENT";
      if (outcome === "verified") {
        const course = cat("en").courses.find((c) => c.id === e.courseId);
        e.accessExpiresAt = course?.accessDays ? iso(now().getTime() + course.accessDays * 86_400_000) : null;
      }
    }
  }

  function idempotent(req: MockRequest, run: () => MockResponse): MockResponse {
    const key = req.headers["idempotency-key"];
    if (!key) return run();
    const scoped = `${req.endpoint.id}:${req.userId ?? "guest"}:${key}`;
    const previous = state.idempotency[scoped];
    if (previous) return previous;
    const response = run();
    state.idempotency[scoped] = response;
    return response;
  }

  // ── handlers, keyed by endpoint id ──

  const serverRegister = z.object({
    name: nameField,
    email: emailField,
    phone: phoneField,
    password: passwordField,
    locale: z.enum(["en", "ta"]).default("en"),
    acceptTerms: z.literal(true, { message: "Please accept the terms to continue" }),
  });

  const handlers: Record<string, (req: MockRequest) => MockResponse> = {
    // Auth
    [endpoints.auth.register.id]: (req) => {
      const body = check(serverRegister, req.body);
      if (state.users.some((u) => u.email === body.email)) {
        throw new MockHttpError(409, "EMAIL_TAKEN", "An account with this email already exists", {
          email: "An account with this email already exists",
        });
      }
      const user: UserRec = {
        id: newId("usr"),
        name: body.name,
        email: body.email,
        phone: body.phone,
        locale: body.locale,
        password: body.password,
        createdAt: iso(req.now),
      };
      state.users.push(user);
      return created(issueSession(user, req.platform));
    },
    [endpoints.auth.login.id]: (req) => {
      const email = String(req.body.email ?? "")
        .trim()
        .toLowerCase();
      const recent = (state.failedLogins[email] ?? []).filter((ts) => ts > req.now.getTime() - 10 * 60_000);
      if (recent.length >= 5) throw new MockHttpError(429, "RATE_LIMITED", "Too many attempts");
      const user = state.users.find((u) => u.email === email);
      if (!user || user.password !== req.body.password) {
        state.failedLogins[email] = [...recent, req.now.getTime()];
        changed();
        throw new MockHttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
      }
      delete state.failedLogins[email];
      return ok(issueSession(user, req.platform));
    },
    [endpoints.auth.refresh.id]: (req) => {
      const token =
        req.platform === "web"
          ? state.webRefreshCookie
          : typeof req.body.refreshToken === "string"
            ? req.body.refreshToken
            : null;
      const userId = token ? state.refreshTokens[token] : undefined;
      const user = state.users.find((u) => u.id === userId);
      if (!token || !user) throw new MockHttpError(401, "UNAUTHENTICATED", "Refresh token is invalid or expired");
      delete state.refreshTokens[token]; // rotation: every refresh token works once
      const { user: _ignored, ...tokens } = issueSession(user, req.platform);
      return ok(tokens);
    },
    [endpoints.auth.logout.id]: (req) => {
      const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (bearer) delete state.sessions[bearer];
      if (req.platform === "web" && state.webRefreshCookie) {
        delete state.refreshTokens[state.webRefreshCookie];
        state.webRefreshCookie = null;
      }
      if (typeof req.body.refreshToken === "string") delete state.refreshTokens[req.body.refreshToken];
      changed();
      return noContent();
    },
    [endpoints.auth.forgotPassword.id]: (req) => {
      const { email } = check(z.object({ email: emailField }), req.body);
      const user = state.users.find((u) => u.email === email);
      if (user) {
        lastResetToken = `rst_${idempotencyKey()}`;
        state.resetTokens[lastResetToken] = { userId: user.id, expiresAt: req.now.getTime() + 3_600_000 };
        changed();
      }
      return accepted(); // same answer whether or not the account exists
    },
    [endpoints.auth.resetPassword.id]: (req) => {
      const body = check(z.object({ token: z.string().min(1), password: passwordField }), req.body);
      const rec = state.resetTokens[body.token];
      const user = rec && rec.expiresAt > req.now.getTime() ? state.users.find((u) => u.id === rec.userId) : undefined;
      if (!user) throw new MockHttpError(400, "RESET_TOKEN_INVALID", "Reset link is invalid or has expired");
      user.password = body.password;
      delete state.resetTokens[body.token];
      for (const [k, v] of Object.entries(state.refreshTokens)) if (v === user.id) delete state.refreshTokens[k];
      changed();
      return noContent();
    },

    // Me
    [endpoints.me.get.id]: (req) => ok(publicUser(requireUser(req))),
    [endpoints.me.update.id]: (req) => {
      const user = requireUser(req);
      const body = check(
        z.object({ name: nameField.optional(), phone: phoneField.optional(), locale: z.enum(["en", "ta"]).optional() }),
        req.body,
      );
      Object.assign(user, Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)));
      changed();
      return ok(publicUser(user));
    },
    [endpoints.me.changePassword.id]: (req) => {
      const user = requireUser(req);
      const body = check(z.object({ currentPassword: z.string(), newPassword: passwordField }), req.body);
      if (body.currentPassword !== user.password)
        throw invalid({ currentPassword: "Your current password is incorrect" });
      user.password = body.newPassword;
      changed();
      return noContent();
    },

    // Content
    [endpoints.content.site.id]: (req) =>
      ok({ ...cat(req.locale).site, features: { ...cat(req.locale).site.features, upiPayments: state.upiEnabled } }),
    [endpoints.content.blocks.id]: (req) => {
      const prefix = req.query.prefix ?? "";
      const all = cat(req.locale).content;
      return ok(
        Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith(prefix) && !k.startsWith("policy."))),
      );
    },
    [endpoints.content.policy.id]: (req) => {
      const map: Record<string, [string, string, string]> = {
        "privacy-policy": ["policy.privacy", "Privacy Policy", "தனியுரிமைக் கொள்கை"],
        "terms-of-use": ["policy.terms", "Terms of Use", "பயன்பாட்டு விதிமுறைகள்"],
        "refund-and-cancellation-policy": [
          "policy.refund",
          "Refund and Cancellation Policy",
          "பணத்திருப்பம் மற்றும் ரத்துக் கொள்கை",
        ],
        "medical-disclaimer": ["policy.disclaimer", "Medical Disclaimer", "மருத்துவப் பொறுப்புத் துறப்பு"],
      };
      const entry = map[req.params.slug ?? ""];
      if (!entry) throw notFound("Policy");
      const page: PolicyPage = {
        slug: req.params.slug as PolicyPage["slug"],
        title: t(req.locale, entry[1], entry[2]),
        body: cat("en").content[entry[0]] ?? "",
        updatedAt: state.epoch,
        bodyLocale: "en", // no clinic-approved Tamil version yet
      };
      return ok(page);
    },
    [endpoints.content.faqs.id]: (req) => ok(cat(req.locale).faqs),
    // Only approved testimonials with recorded consent may be returned. The sample data has none.
    [endpoints.content.testimonials.id]: () => ok([]),
    [endpoints.content.posts.id]: (req) => {
      const tag = req.query.tag;
      const posts = cat(req.locale).posts.filter((p) => !tag || p.tags.includes(tag));
      const summaries: BlogPostSummary[] = posts.map(({ content: _c, ...rest }) => rest);
      return ok(page(summaries, req.query, 9));
    },
    [endpoints.content.post.id]: (req) => {
      const post = cat(req.locale).posts.find((p) => p.slug === req.params.slug);
      if (!post) throw notFound("Post");
      return ok(post);
    },

    // Catalog
    [endpoints.catalog.services.id]: (req) => ok(cat(req.locale).services.map(serviceView)),
    [endpoints.catalog.service.id]: (req) => {
      const c = cat(req.locale);
      const s = c.services.find((x) => x.slug === req.params.slug);
      if (!s) throw notFound("Service");
      const detail: ServiceDetail = {
        ...serviceView(s),
        description: s.description,
        doctors: c.doctors.filter((d) => s.doctorIds.includes(d.id)).map(doctorView),
      };
      return ok(detail);
    },
    [endpoints.catalog.doctors.id]: (req) => {
      const serviceId = req.query.serviceId;
      const c = cat(req.locale);
      const list = serviceId ? c.doctors.filter((d) => d.serviceIds.includes(serviceId)) : c.doctors;
      return ok(list.map(doctorView));
    },
    [endpoints.catalog.doctor.id]: (req) => {
      const d = cat(req.locale).doctors.find((x) => x.slug === req.params.slug);
      if (!d) throw notFound("Practitioner");
      const detail: DoctorDetail = { ...doctorView(d), bio: d.bio, serviceIds: d.serviceIds };
      return ok(detail);
    },

    // Booking
    [endpoints.booking.availability.id]: (req) => {
      const c = cat(req.locale);
      const service = c.services.find((s) => s.id === req.query.serviceId);
      const errors: Record<string, string> = {};
      if (!service) errors.serviceId = "Choose a service";
      if (!service?.doctorIds.includes(req.query.doctorId ?? "")) errors.doctorId = "Choose a practitioner";
      if (!isDateKey(req.query.from)) errors.from = "Enter a valid date";
      const days = Number(req.query.days ?? 14);
      if (!Number.isInteger(days) || days < 1 || days > 31) errors.days = "Choose between 1 and 31 days";
      if (Object.keys(errors).length) throw invalid(errors);
      const result: Availability = {
        timeZone: "Asia/Kolkata",
        days: freeSlots(service!, req.query.doctorId!, req.query.from!, days, req.now, req.locale),
      };
      return ok(result);
    },
    [endpoints.booking.create.id]: (req) =>
      idempotent(req, () => {
        const c = cat(req.locale);
        const details = check(patientDetailsSchema, req.body);
        const service = c.services.find((s) => s.id === req.body.serviceId);
        if (!service || !service.isBookable) throw invalid({ serviceId: "Choose a service" });
        const doctorId = String(req.body.doctorId ?? "");
        if (!service.doctorIds.includes(doctorId)) throw invalid({ doctorId: "Choose a practitioner" });
        const startsAt = String(req.body.startsAt ?? "");
        const start = new Date(startsAt);
        if (Number.isNaN(start.getTime())) throw invalid({ startsAt: "Choose a time" });
        const dayKey = startsAt ? new Date(start.getTime() + 330 * 60_000).toISOString().slice(0, 10) : "";
        const day = freeSlots(service, doctorId, dayKey, 1, req.now, req.locale)[0];
        const slot = day?.slots.find((s) => s.startsAt === start.toISOString());
        if (!slot) throw new MockHttpError(409, "SLOT_TAKEN", "That time is no longer available");
        const rec: AppointmentRec = {
          id: newId("apt"),
          reference: reference("APT"),
          status: "CONFIRMED",
          serviceId: service.id,
          doctorId,
          branchId: slot.branchId,
          userId: req.userId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          patientName: details.patientName,
          patientPhone: details.patientPhone,
          patientEmail: details.patientEmail,
          reason: details.reason,
          cancelledAt: null,
          createdAt: iso(req.now),
        };
        state.appointments.push(rec);
        changed();
        return created(appointmentView(rec, req.locale, req.now));
      }),
    [endpoints.booking.consultation.id]: (req) => {
      check(consultationSchema, req.body);
      const ref = reference("FC");
      state.enquiries.push({ kind: "consultation", reference: ref, createdAt: iso(req.now) });
      changed();
      return created({ reference: ref });
    },
    [endpoints.booking.contact.id]: (req) => {
      check(contactSchema, req.body);
      const ref = reference("MSG");
      state.enquiries.push({ kind: "contact", reference: ref, createdAt: iso(req.now) });
      changed();
      return created({ reference: ref });
    },

    // Shop
    [endpoints.shop.categories.id]: (req) => ok(cat(req.locale).categories),
    [endpoints.shop.products.id]: (req) => {
      const c = cat(req.locale);
      const q = (req.query.q ?? "").trim().toLowerCase();
      let list = c.products.filter((p) => {
        if (req.query.category && c.categories.find((x) => x.id === p.categoryId)?.slug !== req.query.category)
          return false;
        return !q || p.name.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q);
      });
      const sort = req.query.sort ?? "featured";
      list = [...list].sort((a, b) => {
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "newest") return b.sortOrder - a.sortOrder;
        return Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder;
      });
      return ok(
        page(
          list.map((p) => productSummary(p, c)),
          req.query,
          12,
        ),
      );
    },
    [endpoints.shop.product.id]: (req) => {
      const c = cat(req.locale);
      const p = c.products.find((x) => x.slug === req.params.slug);
      if (!p) throw notFound("Product");
      const detail: Product = {
        ...productSummary(p, c),
        shortDescription: p.shortDescription,
        description: p.description,
        benefits: p.benefits,
        ingredients: p.ingredients,
        usage: p.usage,
        images: p.image ? [p.image] : [],
      };
      return ok(detail);
    },
    [endpoints.shop.quote.id]: (req) =>
      ok(quote(req.body.items, req.body.fulfilment === "DELIVERY" ? "DELIVERY" : "PICKUP", req.locale)),
    [endpoints.shop.createOrder.id]: (req) =>
      idempotent(req, () => {
        const user = requireUser(req);
        if (!state.upiEnabled)
          throw new MockHttpError(503, "PAYMENTS_NOT_CONFIGURED", "Online payment is not configured yet");
        const c = cat(req.locale);
        const fulfilment =
          req.body.fulfilment === "DELIVERY" ? "DELIVERY" : req.body.fulfilment === "PICKUP" ? "PICKUP" : null;
        if (!fulfilment) throw invalid({ fulfilment: "Choose pickup or delivery" });
        const contact = check(contactDetailsSchema, req.body.contact ?? {});
        let address: Order["address"] = null;
        let pickupBranchId: string | null = null;
        if (fulfilment === "DELIVERY") {
          const parsed = validate(addressSchema, req.body.address ?? {});
          if (!parsed.success)
            throw invalid(Object.fromEntries(Object.entries(parsed.fieldErrors).map(([k, v]) => [`address.${k}`, v])));
          address = parsed.data;
        } else {
          pickupBranchId = String(req.body.pickupBranchId ?? "");
          if (!c.branches.some((b) => b.id === pickupBranchId && b.isPickupPoint))
            throw invalid({ pickupBranchId: "Choose a branch for pickup" });
        }
        const q = quote(req.body.items, fulfilment, req.locale);
        if (q.lines.length === 0) throw invalid({ items: "Your cart is empty" });
        if (q.problems.length > 0)
          throw new MockHttpError(409, "OUT_OF_STOCK", "Some items are no longer available in that quantity");
        for (const line of q.lines) state.stock[line.product.id] = stockOf(line.product.id) - line.quantity;
        const ref = reference("ORD");
        const due = iso(req.now.getTime() + c.site.shop.paymentWindowHours * 3_600_000);
        const orderId = newId("ord");
        const payment = createPayment("ORDER", ref, user.id, orderId, q.total, due);
        const order: OrderRec = {
          id: orderId,
          reference: ref,
          userId: user.id,
          status: "PENDING_PAYMENT",
          fulfilment,
          pickupBranchId,
          address,
          contact,
          items: q.lines.map((l) => ({
            productId: l.product.id,
            name: l.product.name,
            size: l.product.size,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
          })),
          subtotal: q.subtotal,
          deliveryFee: q.deliveryFee,
          total: q.total,
          notes:
            typeof req.body.notes === "string" && req.body.notes.trim() ? req.body.notes.trim().slice(0, 500) : null,
          createdAt: iso(req.now),
          paymentDueAt: due,
          paymentId: payment.id,
          events: [{ status: "PENDING_PAYMENT", note: "Order placed", at: iso(req.now) }],
        };
        state.orders.push(order);
        changed();
        return created({ order: orderView(order, req.locale), payment: paymentView(payment, req.locale) });
      }),

    // Payments
    [endpoints.payments.get.id]: (req) => {
      const user = requireUser(req);
      const p = state.payments.find((x) => x.id === req.params.paymentId && x.userId === user.id);
      if (!p) throw notFound("Payment");
      return ok(paymentView(p, req.locale));
    },
    [endpoints.payments.submit.id]: (req) => {
      const user = requireUser(req);
      const p = state.payments.find((x) => x.id === req.params.paymentId && x.userId === user.id);
      if (!p) throw notFound("Payment");
      if (!(p.status === "AWAITING_PAYMENT" || p.status === "REJECTED"))
        throw new MockHttpError(409, "PAYMENT_NOT_PAYABLE", "This payment can't be updated");
      const body = check(utrSubmissionSchema, req.body);
      if (state.payments.some((x) => x.id !== p.id && x.utr === body.utr && x.status !== "REJECTED")) {
        throw new MockHttpError(409, "DUPLICATE_UTR", "This UPI reference has already been used", {
          utr: "This UPI reference has already been used",
        });
      }
      Object.assign(p, {
        status: "SUBMITTED",
        utr: body.utr,
        payerName: body.payerName,
        submittedAt: iso(req.now),
        rejectionReason: null,
      });
      setTargetStatus(p, "submitted");
      changed();
      return ok(paymentView(p, req.locale));
    },

    // Classes
    [endpoints.classes.list.id]: (req) => ok(cat(req.locale).classes.map((c) => classSummary(c, req.now))),
    [endpoints.classes.get.id]: (req) => {
      const c = cat(req.locale).classes.find((x) => x.slug === req.params.slug);
      if (!c) throw notFound("Class");
      const detail: LiveClass = {
        ...classSummary(c, req.now),
        description: c.description,
        audience: c.audience,
        feeIncludes: c.feeIncludes,
        materials: c.materials,
        batches: c.batches
          .filter((b) => new Date(b.startsAt).getTime() > req.now.getTime() - 86_400_000)
          .map((b) => batchView(b, c, req.now)),
        myRegistrations: req.userId
          ? state.registrations
              .filter(
                (r) =>
                  r.userId === req.userId && r.classId === c.id && r.status !== "CANCELLED" && r.status !== "EXPIRED",
              )
              .map((r) => ({ batchId: r.batchId, registrationId: r.id, status: r.status }))
          : [],
      };
      return ok(detail);
    },
    [endpoints.classes.register.id]: (req) =>
      idempotent(req, () => {
        const user = requireUser(req);
        const c = cat(req.locale).classes.find((x) => x.batches.some((b) => b.id === req.params.batchId));
        const batch = c?.batches.find((b) => b.id === req.params.batchId);
        if (!c || !batch) throw notFound("Batch");
        if (
          state.registrations.some(
            (r) => r.userId === user.id && r.batchId === batch.id && r.status !== "CANCELLED" && r.status !== "EXPIRED",
          )
        ) {
          throw new MockHttpError(409, "ALREADY_REGISTERED", "You are already registered for this batch");
        }
        if (!batchView(batch, c, req.now).isOpen)
          throw new MockHttpError(409, "BATCH_CLOSED", "Registration for this batch is closed");
        if (c.fee > 0 && !state.upiEnabled)
          throw new MockHttpError(503, "PAYMENTS_NOT_CONFIGURED", "Online payment is not configured yet");
        const amount = batchPrice(c.fee, c.feeType, batch.sessionsCount);
        const rec: RegistrationRec = {
          id: newId("reg"),
          reference: reference("CLS"),
          userId: user.id,
          classId: c.id,
          batchId: batch.id,
          status: c.fee === 0 ? "CONFIRMED" : "PENDING_PAYMENT",
          amount,
          holdExpiresAt: null,
          paymentId: null,
          createdAt: iso(req.now),
          paidUntil: null,
          renewal: null,
        };
        if (amount > 0) {
          const hold = Math.min(req.now.getTime() + 24 * 3_600_000, new Date(batch.startsAt).getTime());
          rec.holdExpiresAt = iso(hold);
          rec.paymentId = createPayment("CLASS", rec.reference, user.id, rec.id, amount, rec.holdExpiresAt).id;
        }
        state.registrations.push(rec);
        changed();
        return created({ registration: registrationView(rec, req.locale, req.now) });
      }),

    // Courses
    [endpoints.courses.list.id]: (req) => {
      const list = cat(req.locale).courses.filter((c) => !req.query.category || c.category === req.query.category);
      return ok(list.map(courseSummary));
    },
    [endpoints.courses.get.id]: (req) => {
      const c = cat(req.locale).courses.find((x) => x.slug === req.params.slug);
      if (!c) throw notFound("Course");
      const e = currentEnrolment(req.userId, c.id);
      const detail: Course = {
        ...courseSummary(c),
        description: c.description,
        outcomes: c.outcomes,
        instructor: c.instructor,
        lessons: lessonOutline(c, req.userId, req.now),
        enrolment: e ? enrolmentView(e, req.locale, req.now) : null,
      };
      return ok(detail);
    },
    [endpoints.courses.lesson.id]: (req) => {
      const c = cat(req.locale).courses.find((x) => x.slug === req.params.slug);
      const idx = c?.lessons.findIndex((l) => l.id === req.params.lessonId) ?? -1;
      const l = c?.lessons[idx];
      if (!c || !l) throw notFound("Lesson");
      const access = !!activeEnrolment(req.userId, c.id, req.now) || l.isFreePreview;
      // Locked lessons return no lesson data at all — not even notes.
      if (!access) throw new MockHttpError(403, "NOT_ENROLLED", "Enrol in this course to open this lesson");
      const done = new Set(req.userId ? (state.progress[req.userId] ?? []) : []);
      const lesson: Lesson = {
        id: l.id,
        courseSlug: c.slug,
        position: l.position,
        title: l.title,
        summary: null,
        durationMinutes: l.durationMinutes,
        notes: l.notes,
        video: null, // the clinic adds real videos on the backend
        resources: [],
        isCompleted: done.has(l.id),
        previousLessonId: c.lessons[idx - 1]?.id ?? null,
        nextLessonId: c.lessons[idx + 1]?.id ?? null,
      };
      return ok(lesson);
    },
    [endpoints.courses.enrol.id]: (req) =>
      idempotent(req, () => {
        const user = requireUser(req);
        const c = cat(req.locale).courses.find((x) => x.slug === req.params.slug);
        if (!c) throw notFound("Course");
        const existing = currentEnrolment(user.id, c.id);
        if (
          existing &&
          existing.status !== "EXPIRED" &&
          enrolmentView(existing, req.locale, req.now).status !== "EXPIRED"
        ) {
          throw new MockHttpError(409, "ALREADY_ENROLLED", "You are already enrolled in this course");
        }
        if (c.price > 0 && !state.upiEnabled)
          throw new MockHttpError(503, "PAYMENTS_NOT_CONFIGURED", "Online payment is not configured yet");
        const rec: EnrolmentRec = {
          id: newId("enr"),
          reference: reference("CRS"),
          userId: user.id,
          courseId: c.id,
          status: c.price === 0 ? "ACTIVE" : "PENDING_PAYMENT",
          amount: c.price,
          accessExpiresAt: c.price === 0 && c.accessDays ? iso(req.now.getTime() + c.accessDays * 86_400_000) : null,
          paymentId: null,
          createdAt: iso(req.now),
        };
        if (c.price > 0) rec.paymentId = createPayment("COURSE", rec.reference, user.id, rec.id, c.price, null).id;
        state.enrolments.push(rec);
        changed();
        return created({ enrolment: enrolmentView(rec, req.locale, req.now) });
      }),
    [endpoints.courses.completeLesson.id]: (req) => {
      const user = requireUser(req);
      const course = cat("en").courses.find((c) => c.lessons.some((l) => l.id === req.params.lessonId));
      const lesson = course?.lessons.find((l) => l.id === req.params.lessonId);
      if (!course || !lesson) throw notFound("Lesson");
      if (!activeEnrolment(user.id, course.id, req.now) && !lesson.isFreePreview)
        throw new MockHttpError(403, "NOT_ENROLLED", "Enrol in this course first");
      const done = new Set(state.progress[user.id] ?? []);
      if (req.body.completed === false) done.delete(lesson.id);
      else done.add(lesson.id);
      state.progress[user.id] = [...done];
      changed();
      return noContent();
    },

    // Account
    [endpoints.account.appointments.id]: (req) => {
      const user = requireUser(req);
      const nowMs = req.now.getTime();
      let list = state.appointments.filter((a) => a.userId === user.id);
      if (req.query.scope === "upcoming")
        list = list.filter((a) => new Date(a.endsAt).getTime() > nowMs && a.status === "CONFIRMED");
      if (req.query.scope === "past")
        list = list.filter((a) => new Date(a.endsAt).getTime() <= nowMs || a.status !== "CONFIRMED");
      list.sort((a, b) =>
        req.query.scope === "upcoming" ? a.startsAt.localeCompare(b.startsAt) : b.startsAt.localeCompare(a.startsAt),
      );
      return ok(
        page(
          list.map((a) => appointmentView(a, req.locale, req.now)),
          req.query,
          20,
        ),
      );
    },
    [endpoints.account.appointment.id]: (req) => {
      const user = requireUser(req);
      const a = state.appointments.find((x) => x.id === req.params.appointmentId && x.userId === user.id);
      if (!a) throw notFound("Appointment");
      return ok(appointmentView(a, req.locale, req.now));
    },
    [endpoints.account.cancelAppointment.id]: (req) => {
      const user = requireUser(req);
      const a = state.appointments.find((x) => x.id === req.params.appointmentId && x.userId === user.id);
      if (!a) throw notFound("Appointment");
      if (!appointmentView(a, req.locale, req.now).canCancel) {
        throw new MockHttpError(409, "TOO_LATE_TO_CANCEL", "This appointment can no longer be cancelled online");
      }
      a.status = "CANCELLED";
      a.cancelledAt = iso(req.now);
      changed();
      return ok(appointmentView(a, req.locale, req.now));
    },
    [endpoints.account.orders.id]: (req) => {
      const user = requireUser(req);
      const list = state.orders
        .filter((o) => o.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return ok(page(list.map(orderSummary), req.query, 20));
    },
    [endpoints.account.order.id]: (req) => {
      const user = requireUser(req);
      const o = state.orders.find((x) => x.reference === req.params.reference && x.userId === user.id);
      if (!o) throw notFound("Order");
      return ok(orderView(o, req.locale));
    },
    [endpoints.account.payments.id]: (req) => {
      const user = requireUser(req);
      let list = state.payments.filter((p) => p.userId === user.id);
      if (req.query.open === "true")
        list = list.filter((p) => p.status === "AWAITING_PAYMENT" || p.status === "REJECTED");
      return ok(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((p) => paymentView(p, req.locale)));
    },
    [endpoints.account.registrations.id]: (req) => {
      const user = requireUser(req);
      const list = state.registrations
        .filter((r) => r.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return ok(list.map((r) => registrationView(r, req.locale, req.now)));
    },
    [endpoints.account.registration.id]: (req) => {
      const user = requireUser(req);
      const r = state.registrations.find((x) => x.id === req.params.registrationId && x.userId === user.id);
      if (!r) throw notFound("Registration");
      return ok(registrationView(r, req.locale, req.now));
    },
    [endpoints.account.renewRegistration.id]: (req) =>
      idempotent(req, () => {
        const user = requireUser(req);
        const r = state.registrations.find((x) => x.id === req.params.registrationId && x.userId === user.id);
        if (!r) throw notFound("Registration");
        const cls = cat(req.locale).classes.find((c) => c.id === r.classId)!;
        if (cls.feeType !== "MONTHLY" || cls.fee === 0)
          throw new MockHttpError(409, "NOT_MONTHLY", "Only monthly classes are renewed");
        if (r.status !== "CONFIRMED" || !r.paidUntil)
          throw new MockHttpError(409, "NOT_CONFIRMED", "The first month must be confirmed before renewing");
        if (r.renewal) throw new MockHttpError(409, "RENEWAL_IN_PROGRESS", "A renewal is already in progress");
        if (!state.upiEnabled)
          throw new MockHttpError(503, "PAYMENTS_NOT_CONFIGURED", "Online payment is not configured yet");
        // The next month starts where the paid one ends, or today if it has already lapsed.
        const start = new Date(Math.max(new Date(r.paidUntil).getTime(), req.now.getTime()));
        const end = addOneMonth(start);
        const payment = createPayment("CLASS_RENEWAL", r.reference, user.id, r.id, cls.fee, null);
        r.renewal = { paymentId: payment.id, periodStart: start.toISOString(), periodEnd: end.toISOString() };
        changed();
        return created({
          registration: registrationView(r, req.locale, req.now),
          payment: paymentView(payment, req.locale),
        });
      }),
    [endpoints.account.courses.id]: (req) => {
      const user = requireUser(req);
      const c = cat(req.locale);
      const done = new Set(state.progress[user.id] ?? []);
      const mine: MyCourse[] = state.enrolments
        .filter((e) => e.userId === user.id && e.status !== "CANCELLED")
        .flatMap((e) => {
          const course = c.courses.find((x) => x.id === e.courseId);
          if (!course) return [];
          const outline = lessonOutline(course, user.id, req.now);
          return [
            {
              course: courseSummary(course),
              enrolment: enrolmentView(e, req.locale, req.now),
              completedLessons: course.lessons.filter((l) => done.has(l.id)).length,
              nextLessonId: outline.find((l) => !l.isLocked && !l.isCompleted)?.id ?? null,
            },
          ];
        });
      return ok(mine);
    },
  };

  function quote(rawItems: unknown, fulfilment: "PICKUP" | "DELIVERY", locale: Locale): CartQuote {
    const c = cat(locale);
    const items: CartLine[] = Array.isArray(rawItems)
      ? rawItems
          .filter(
            (i): i is CartLine =>
              !!i &&
              typeof i === "object" &&
              typeof (i as CartLine).productId === "string" &&
              Number.isInteger((i as CartLine).quantity),
          )
          .slice(0, 50)
      : [];
    const problems: CartProblem[] = [];
    const lines: CartQuote["lines"] = [];
    for (const item of items) {
      const p = c.products.find((x) => x.id === item.productId);
      if (!p) {
        problems.push({ productId: item.productId, code: "UNAVAILABLE", availableQuantity: 0 });
        continue;
      }
      const available = Math.min(stockOf(p.id), MAX_LINE);
      const quantity = Math.min(Math.max(item.quantity, 0), available);
      if (item.quantity > available) {
        problems.push({
          productId: p.id,
          code: available === 0 ? "OUT_OF_STOCK" : "QUANTITY_REDUCED",
          availableQuantity: available,
        });
      }
      if (quantity > 0)
        lines.push({ product: productSummary(p, c), quantity, unitPrice: p.price, lineTotal: p.price * quantity });
    }
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const { deliveryFee: fee, freeDeliveryFrom } = c.site.shop;
    const deliveryFee =
      fulfilment === "DELIVERY" && subtotal > 0 && !(freeDeliveryFrom !== null && subtotal >= freeDeliveryFrom)
        ? fee
        : 0;
    return { lines, problems, subtotal, deliveryFee, total: subtotal + deliveryFee };
  }

  const controls: MockControls = {
    pendingPayments: () =>
      state.payments
        .filter((p) => p.status === "SUBMITTED")
        .map((p) => ({ id: p.id, reference: p.reference, amount: p.amount, purpose: p.purpose, status: p.status })),
    verifyPayment(paymentId) {
      const p = state.payments.find((x) => x.id === paymentId);
      if (!p || p.status !== "SUBMITTED") return;
      p.status = "VERIFIED";
      p.verifiedAt = iso(now());
      setTargetStatus(p, "verified");
      changed();
    },
    rejectPayment(paymentId, reason) {
      const p = state.payments.find((x) => x.id === paymentId);
      if (!p || p.status !== "SUBMITTED") return;
      p.status = "REJECTED";
      p.rejectionReason = reason;
      setTargetStatus(p, "rejected");
      changed();
    },
    setUpiEnabled(enabled) {
      state.upiEnabled = enabled;
      changed();
    },
    lastResetToken: () => lastResetToken,
    reset() {
      const epoch = now();
      catalogs = { en: buildCatalog("en", epoch), ta: buildCatalog("ta", epoch) };
      state = createInitialState(epoch, catalogs.en);
      backend.state = state;
      changed();
    },
  };

  const backend: MockBackend = {
    state,
    userIdForToken,
    controls,
    handle(req) {
      sweep(req.now);
      const handler = handlers[req.endpoint.id];
      if (!handler) throw new MockHttpError(501, "NOT_IMPLEMENTED", `Mock has no handler for ${req.endpoint.id}`);
      return handler(req);
    },
  };
  return backend;
}

/** Endpoint ids the mock implements (checked against the endpoint list by the contract test). */
export function mockHandlerIds(): string[] {
  const probe = createMockBackend();
  const ids: string[] = [];
  for (const group of Object.values(endpoints)) {
    for (const e of Object.values(group)) {
      try {
        probe.handle({
          endpoint: e,
          params: {},
          query: {},
          body: {},
          headers: {},
          locale: "en",
          platform: "web",
          userId: null,
          now: new Date(),
        });
        ids.push(e.id);
      } catch (error) {
        if (!(error instanceof MockHttpError && error.status === 501)) ids.push(e.id);
      }
    }
  }
  return ids;
}
