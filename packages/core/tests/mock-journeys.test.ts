/**
 * Customer journeys through the real API client + services against the mock backend.
 * These are the same calls the apps make, so they double as executable examples of the contract.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createApiClient, createServices, createTokenStore, type Services } from "../src/api";
import { createMockApi } from "../src/mocks";
import { addDaysToKey, ApiError, idempotencyKey, parseAppConfig, todayKey, type Locale } from "../src";

function setup(platform: "web" | "ios" = "web") {
  let locale: Locale = "en";
  const mock = createMockApi();
  const api = createApiClient({
    config: parseAppConfig({}, platform),
    tokenStore: createTokenStore(),
    getLocale: () => locale,
    adapter: mock.adapter,
  });
  return { s: createServices(api), mock, api, setLocale: (l: Locale) => (locale = l) };
}

async function signUp(s: Services, email = "asha@example.com") {
  return s.auth.register({
    name: "Asha Rao",
    email,
    phone: "98765 43210",
    password: "calm-waters-42",
    locale: "en",
    acceptTerms: true,
  });
}

test("register, sign out, sign in again; wrong password and duplicate email are refused", async () => {
  const { s } = setup();
  const user = await signUp(s);
  assert.equal(user.phone, "+919876543210");
  await assert.rejects(
    signUp(s),
    (e: unknown) => e instanceof ApiError && e.code === "EMAIL_TAKEN" && e.status === 409,
  );
  await s.auth.logout();
  await assert.rejects(s.auth.me(), (e: unknown) => e instanceof ApiError && e.status === 401);
  await assert.rejects(
    s.auth.login({ email: "asha@example.com", password: "wrong-password" }),
    (e: unknown) => e instanceof ApiError && e.code === "INVALID_CREDENTIALS",
  );
  const again = await s.auth.login({ email: "asha@example.com", password: "calm-waters-42" });
  assert.equal(again.name, "Asha Rao");
});

test("web sessions survive a reload through the refresh cookie; mobile gets a refresh token in the body", async () => {
  const web = setup("web");
  await signUp(web.s);
  const reloaded = createApiClient({
    config: parseAppConfig({}, "web"),
    tokenStore: createTokenStore(),
    getLocale: () => "en",
    adapter: web.mock.adapter,
  });
  assert.equal((await createServices(reloaded).auth.restore())?.name, "Asha Rao");

  const mobile = setup("ios");
  const store = new Map<string, string>();
  const secure = {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    removeItem: async (k: string) => void store.delete(k),
  };
  const api = createApiClient({
    config: parseAppConfig({}, "ios"),
    tokenStore: createTokenStore({ secureStorage: secure }),
    getLocale: () => "en",
    adapter: mobile.mock.adapter,
  });
  await createServices(api).auth.register({
    name: "Ravi K",
    email: "ravi@example.com",
    phone: "9876543211",
    password: "calm-waters-42",
    locale: "en",
    acceptTerms: true,
  });
  assert.ok(store.get("sdw.refreshToken")?.startsWith("rt_"));
});

test("guest books an appointment; the same slot can't be booked twice; server validates too", async () => {
  const { s } = setup();
  const service = (await s.catalog.services()).find((x) => x.slug === "wellness-consultation")!;
  const detail = await s.catalog.service(service.slug);
  const doctor = detail.doctors[0]!;
  const availability = await s.booking.availability({
    serviceId: service.id,
    doctorId: doctor.id,
    from: todayKey(),
    days: 14,
  });
  const slot = availability.days.flatMap((d) => d.slots)[0]!;
  assert.ok(slot, "sample schedule has free slots");
  const body = {
    serviceId: service.id,
    doctorId: doctor.id,
    startsAt: slot.startsAt,
    patientName: "Asha Rao",
    patientPhone: "9876543210",
    patientEmail: "asha@example.com",
    reason: "First visit",
    consent: true as const,
  };
  const key = idempotencyKey();
  const appt = await s.booking.book(body, key);
  assert.match(appt.reference, /^APT-/);
  assert.equal((await s.booking.book(body, key)).id, appt.id, "same idempotency key → same booking");
  await assert.rejects(
    s.booking.book(body, idempotencyKey()),
    (e: unknown) => e instanceof ApiError && e.code === "SLOT_TAKEN",
  );
  await assert.rejects(
    s.booking.book({ ...body, patientEmail: "nope" }, idempotencyKey()),
    (e: unknown) => e instanceof ApiError && e.status === 422 && !!e.fieldErrors.patientEmail,
  );
  const again = await s.booking.availability({
    serviceId: service.id,
    doctorId: doctor.id,
    from: todayKey(),
    days: 14,
  });
  assert.ok(!again.days.flatMap((d) => d.slots).some((x) => x.startsAt === slot.startsAt), "booked slot disappears");
});

test("shop: server-priced quote, order reserves stock, UTR waits for staff, verification confirms", async () => {
  const { s, mock } = setup();
  await signUp(s);
  const { items } = await s.shop.products({ sort: "price-asc" });
  const tea = items.find((p) => p.slug === "calm-evening-herbal-tea")!;
  const mat = items.find((p) => p.slug === "natural-rubber-yoga-mat")!;
  assert.equal(mat.stockStatus, "OUT_OF_STOCK");

  const quote = await s.shop.quote({
    items: [
      { productId: tea.id, quantity: 2 },
      { productId: mat.id, quantity: 1 },
    ],
    fulfilment: "DELIVERY",
  });
  assert.equal(quote.subtotal, 70000);
  assert.equal(quote.deliveryFee, 6000);
  assert.deepEqual(
    quote.problems.map((p) => p.code),
    ["OUT_OF_STOCK"],
  );

  const site = await s.content.site();
  const { order, payment } = await s.shop.placeOrder(
    {
      items: [{ productId: tea.id, quantity: 2 }],
      fulfilment: "PICKUP",
      pickupBranchId: site.branches[0]!.id,
      contact: { name: "Asha Rao", email: "asha@example.com", phone: "9876543210" },
    },
    idempotencyKey(),
  );
  assert.equal(order.status, "PENDING_PAYMENT");
  assert.equal(payment.status, "AWAITING_PAYMENT");
  assert.ok(payment.upi?.payeeVpa.endsWith("@invalid"), "demo UPI ID can't receive money");

  const submitted = await s.payments.submit(payment.id, { utr: "4123 5678 9012", payerName: "Asha Rao" });
  assert.equal(submitted.status, "SUBMITTED");
  assert.equal(submitted.upi, null);
  assert.equal((await s.account.order(order.reference)).status, "PAYMENT_SUBMITTED");

  mock.controls.verifyPayment(payment.id);
  const confirmed = await s.account.order(order.reference);
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal(confirmed.payment?.status, "VERIFIED");
});

test("a used UTR is refused; a rejected payment can be submitted again", async () => {
  const { s, mock } = setup();
  await signUp(s);
  const course = (await s.courses.list()).find((c) => c.price > 0)!;
  const other = (await s.courses.list()).filter((c) => c.price > 0)[1]!;
  const a = await s.courses.enrol(course.slug, idempotencyKey());
  const b = await s.courses.enrol(other.slug, idempotencyKey());
  await s.payments.submit(a.enrolment.payment!.id, { utr: "111122223333", payerName: "Asha Rao" });
  await assert.rejects(
    s.payments.submit(b.enrolment.payment!.id, { utr: "111122223333", payerName: "Asha Rao" }),
    (e: unknown) => e instanceof ApiError && e.code === "DUPLICATE_UTR",
  );
  mock.controls.rejectPayment(a.enrolment.payment!.id, "We couldn't find this payment.");
  const rejected = await s.payments.get(a.enrolment.payment!.id);
  assert.equal(rejected.status, "REJECTED");
  assert.equal(rejected.rejectionReason, "We couldn't find this payment.");
  assert.equal(
    (await s.payments.submit(rejected.id, { utr: "999988887777", payerName: "Asha Rao" })).status,
    "SUBMITTED",
  );
});

test("paid class: seat held, no Meet link until staff verify; free class confirms straight away", async () => {
  const { s, mock } = setup();
  await signUp(s);
  const paid = await s.classes.get("morning-yoga-flow");
  const reg = await s.classes.register(paid.batches[0]!.id, idempotencyKey());
  assert.equal(reg.registration.status, "PENDING_PAYMENT");
  assert.equal(reg.registration.meeting, null);
  await assert.rejects(
    s.classes.register(paid.batches[0]!.id, idempotencyKey()),
    (e: unknown) => e instanceof ApiError && e.code === "ALREADY_REGISTERED",
  );
  await s.payments.submit(reg.registration.payment!.id, { utr: "555566667777", payerName: "Asha Rao" });
  assert.equal((await s.account.registration(reg.registration.id)).meeting, null, "still private while verifying");
  mock.controls.verifyPayment(reg.registration.payment!.id);
  const confirmed = await s.account.registration(reg.registration.id);
  assert.equal(confirmed.status, "CONFIRMED");
  assert.ok(confirmed.meeting?.url.startsWith("https://"));
  assert.ok(
    !JSON.stringify(await s.classes.get("morning-yoga-flow")).includes("meet."),
    "public class data never has the link",
  );

  const free = await s.classes.get("guided-meditation-circle");
  const freeReg = await s.classes.register(free.batches[0]!.id, idempotencyKey());
  assert.equal(freeReg.registration.status, "CONFIRMED");
  assert.equal(freeReg.registration.payment, null);
});

test("class fees: per-session batches cost fee × sessions; monthly classes are renewed a month at a time", async () => {
  let clock = Date.now();
  const mock = createMockApi({ now: () => new Date(clock) });
  const api = createApiClient({
    config: parseAppConfig({}, "web"),
    tokenStore: createTokenStore(),
    getLocale: () => "en",
    adapter: mock.adapter,
  });
  const s = createServices(api);
  await signUp(s);

  // Per session: the 4-week pack is 4 × the session fee; no seat limits anywhere.
  const nidra = await s.classes.get("yoga-nidra-drop-in");
  assert.equal(nidra.feeType, "PER_SESSION");
  const pack = nidra.batches.find((b) => b.sessionsCount === 4)!;
  assert.equal(pack.price, nidra.fee * 4);
  assert.ok(nidra.batches.every((b) => b.seatsLeft === null && b.durationMinutes < 60));
  const packReg = await s.classes.register(pack.id, idempotencyKey());
  assert.equal(packReg.registration.payment!.amount, nidra.fee * 4);
  assert.equal(packReg.registration.monthly, null);

  // Monthly: first month paid at registration; renewal only after it is verified.
  const yoga = await s.classes.get("morning-yoga-flow");
  assert.equal(yoga.feeType, "MONTHLY");
  const reg = (await s.classes.register(yoga.batches[0]!.id, idempotencyKey())).registration;
  assert.equal(reg.amount, yoga.fee);
  assert.equal(reg.monthly?.paidUntil, null);
  await assert.rejects(
    s.account.renewRegistration(reg.id, idempotencyKey()),
    (e: unknown) => e instanceof ApiError && e.code === "NOT_CONFIRMED",
  );
  await s.payments.submit(reg.payment!.id, { utr: "111122223333", payerName: "Asha Rao" });
  mock.controls.verifyPayment(reg.payment!.id);
  const first = await s.account.registration(reg.id);
  const paidUntil = new Date(first.monthly!.paidUntil!);
  const start = new Date(first.batch.startsAt);
  assert.equal(paidUntil.getUTCDate(), start.getUTCDate(), "one calendar month from the batch start");
  assert.ok(paidUntil > start);
  assert.equal(first.monthly!.canRenew, true);
  assert.ok(first.meeting, "link while the month is paid");

  const renewal = await s.account.renewRegistration(reg.id, idempotencyKey());
  assert.equal(renewal.payment.purpose, "CLASS_RENEWAL");
  assert.equal(renewal.payment.amount, yoga.fee);
  assert.equal(renewal.registration.monthly!.renewal!.periodStart, first.monthly!.paidUntil);
  await assert.rejects(
    s.account.renewRegistration(reg.id, idempotencyKey()),
    (e: unknown) => e instanceof ApiError && e.code === "RENEWAL_IN_PROGRESS",
  );
  await s.payments.submit(renewal.payment.id, { utr: "444455556666", payerName: "Asha Rao" });
  assert.equal(
    (await s.account.registration(reg.id)).monthly!.paidUntil,
    first.monthly!.paidUntil,
    "not until verified",
  );
  mock.controls.verifyPayment(renewal.payment.id);
  const second = await s.account.registration(reg.id);
  assert.equal(second.monthly!.paidUntil, renewal.registration.monthly!.renewal!.periodEnd);
  assert.equal(second.monthly!.renewal, null);

  // When the paid period runs out, the joining link is withheld until the next month is paid.
  clock = new Date(second.monthly!.paidUntil!).getTime() + 3_600_000;
  const lapsed = await s.account.registration(reg.id);
  assert.equal(lapsed.meeting, null);
  assert.equal(lapsed.monthly!.canRenew, true);
});

test("site settings carry the clinic's decisions; service prices are hidden", async () => {
  const { s } = setup();
  const site = await s.content.site();
  assert.equal(site.shop.deliversAllIndia, true);
  assert.deepEqual(site.consultation, { durationMinutes: 10, methods: ["PHONE", "VIDEO", "IN_PERSON"] });
  assert.equal(site.payments.checksPerDay, 1);
  assert.ok((await s.catalog.services()).every((x) => x.price === null));
  const courses = await s.courses.list();
  assert.ok(courses.some((c) => c.accessDays === null) && courses.some((c) => c.accessDays === 365));
});

test("course lessons stay locked (no data) until the enrolment is active", async () => {
  const { s, mock } = setup();
  const guestView = await s.courses.get("foundations-of-mindful-breathing");
  const preview = guestView.lessons.find((l) => l.isFreePreview)!;
  const locked = guestView.lessons.find((l) => l.isLocked)!;
  assert.ok((await s.courses.lesson(guestView.slug, preview.id)).notes);
  await assert.rejects(
    s.courses.lesson(guestView.slug, locked.id),
    (e: unknown) => e instanceof ApiError && e.code === "NOT_ENROLLED",
  );

  await signUp(s);
  const { enrolment } = await s.courses.enrol(guestView.slug, idempotencyKey());
  assert.equal(enrolment.status, "PENDING_PAYMENT");
  await assert.rejects(
    s.courses.lesson(guestView.slug, locked.id),
    (e: unknown) => e instanceof ApiError && e.status === 403,
  );
  await s.payments.submit(enrolment.payment!.id, { utr: "123412341234", payerName: "Asha Rao" });
  mock.controls.verifyPayment(enrolment.payment!.id);
  const lesson = await s.courses.lesson(guestView.slug, locked.id);
  assert.equal(lesson.id, locked.id);
  await s.courses.setLessonComplete(locked.id, true);
  const mine = await s.account.courses();
  assert.equal(mine[0]?.completedLessons, 1);
  assert.equal(mine[0]?.enrolment.status, "ACTIVE");
});

test("appointments can be cancelled online only before the cut-off", async () => {
  const { s } = setup();
  await signUp(s);
  const service = (await s.catalog.services())[0]!;
  const doctor = (await s.catalog.service(service.slug)).doctors[0]!;
  const days = (
    await s.booking.availability({
      serviceId: service.id,
      doctorId: doctor.id,
      from: addDaysToKey(todayKey(), 3),
      days: 14,
    })
  ).days;
  const slot = days.flatMap((d) => d.slots)[0]!;
  const appt = await s.booking.book(
    {
      serviceId: service.id,
      doctorId: doctor.id,
      startsAt: slot.startsAt,
      patientName: "Asha Rao",
      patientPhone: "9876543210",
      patientEmail: "asha@example.com",
      reason: "Check-up",
      consent: true,
    },
    idempotencyKey(),
  );
  assert.equal(appt.canCancel, true);
  const upcoming = await s.account.appointments({ scope: "upcoming" });
  assert.equal(upcoming.items.length, 1);
  const cancelled = await s.account.cancelAppointment(appt.id, { reason: "Travelling" });
  assert.equal(cancelled.status, "CANCELLED");
  assert.equal(cancelled.canCancel, false);
});

test("content follows Accept-Language; policies stay English until approved; no invented testimonials", async () => {
  const { s, setLocale } = setup();
  setLocale("ta");
  const services = await s.catalog.services();
  assert.equal(services.find((x) => x.slug === "wellness-consultation")?.name, "நலவாழ்வு ஆலோசனை");
  const blocks = await s.content.blocks("home.");
  assert.match(blocks["home.hero.title"] ?? "", /சமநிலை/);
  const policy = await s.content.policy("privacy-policy");
  assert.equal(policy.title, "தனியுரிமைக் கொள்கை");
  assert.equal(policy.bodyLocale, "en");
  assert.deepEqual(await s.content.testimonials(), []);
  const site = await s.content.site();
  assert.equal(site.contact.phone, null, "no made-up contact details");
});

test("other customers' records are not visible", async () => {
  const { s, api, mock } = setup();
  await signUp(s);
  const site = await s.content.site();
  const product = (await s.shop.products()).items.find((p) => p.stockStatus === "IN_STOCK")!;
  const { order } = await s.shop.placeOrder(
    {
      items: [{ productId: product.id, quantity: 1 }],
      fulfilment: "PICKUP",
      pickupBranchId: site.branches[0]!.id,
      contact: { name: "Asha Rao", email: "asha@example.com", phone: "9876543210" },
    },
    idempotencyKey(),
  );
  await s.auth.logout();
  const other = createServices(
    createApiClient({
      config: api.config,
      tokenStore: createTokenStore(),
      getLocale: () => "en",
      adapter: mock.adapter,
    }),
  );
  await signUp(other, "ravi@example.com");
  await assert.rejects(other.account.order(order.reference), (e: unknown) => e instanceof ApiError && e.status === 404);
  assert.deepEqual((await other.account.orders()).items, []);
});
