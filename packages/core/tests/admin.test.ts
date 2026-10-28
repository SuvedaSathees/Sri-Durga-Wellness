/**
 * Admin area against the mock backend, through the same client and services the website uses:
 * only the clinic owner gets in, payments are verified by a person, and what the owner posts is
 * what customers see.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createApiClient, createServices, createTokenStore, type Services } from "../src/api";
import { createMockApi, type MockPersistence } from "../src/mocks";
import {
  addDaysToKey,
  ApiError,
  batchFormSchema,
  classFormSchema,
  clinicDateTimeFields,
  clinicDateTimeToIso,
  idempotencyKey,
  isMeetLink,
  lessonSchema,
  nextOrderStatuses,
  parseAppConfig,
  parseRupees,
  productFormSchema,
  rupeesText,
  todayKey,
  validate,
  videoEmbed,
  type Locale,
} from "../src";

const OWNER = { email: "owner@clinic.test", password: "owner-pass-2026" };

function client(mock: ReturnType<typeof createMockApi>, locale: Locale = "en"): Services {
  return createServices(
    createApiClient({
      config: parseAppConfig({}, "ios"),
      tokenStore: createTokenStore(),
      getLocale: () => locale,
      adapter: mock.adapter,
    }),
  );
}

function setup() {
  const mock = createMockApi({ staff: [OWNER] });
  return { mock, customer: client(mock), owner: client(mock) };
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

const is = (code: string, status?: number) => (e: unknown) =>
  e instanceof ApiError && e.code === code && (status === undefined || e.status === status);

test("the owner login from settings works; customers and guests get no admin data", async () => {
  const { customer, owner } = setup();
  const me = await owner.auth.login(OWNER);
  assert.equal(me.role, "OWNER");
  assert.ok((await owner.admin.overview()).upcomingBatches > 0);

  const asha = await signUp(customer);
  assert.equal(asha.role, "CUSTOMER");
  await assert.rejects(customer.admin.overview(), is("FORBIDDEN", 403));
  await assert.rejects(customer.admin.payments(), is("FORBIDDEN", 403));

  const guest = client(setup().mock);
  await assert.rejects(guest.admin.orders(), is("UNAUTHENTICATED", 401));
});

test("registering can never create an owner, and the owner email can't be taken", async () => {
  const { customer } = setup();
  await assert.rejects(signUp(customer, OWNER.email), is("EMAIL_TAKEN", 409));
  const user = await signUp(customer, "someone@example.com");
  assert.equal(user.role, "CUSTOMER");
});

test("no staff login exists unless the app passes one in", async () => {
  const s = client(createMockApi());
  await assert.rejects(s.auth.login(OWNER), is("INVALID_CREDENTIALS"));
});

test("payments: the owner sees the full UPI reference and verifies it; a second check is refused", async () => {
  const { mock, customer, owner } = setup();
  await signUp(customer);
  await owner.auth.login(OWNER);
  const product = (await customer.shop.products()).items.find((p) => p.maxQuantity > 2)!;
  const site = await customer.content.site();
  const { order, payment } = await customer.shop.placeOrder(
    {
      items: [{ productId: product.id, quantity: 1 }],
      fulfilment: "PICKUP",
      pickupBranchId: site.branches.find((b) => b.isPickupPoint)!.id,
      contact: { name: "Asha Rao", email: "asha@example.com", phone: "9876543210" },
    },
    idempotencyKey(),
  );
  await customer.payments.submit(payment.id, { utr: "4123 5678 9012", payerName: "Asha Rao" });

  const toCheck = await owner.admin.payments({ status: "SUBMITTED" });
  assert.equal(toCheck.length, 1);
  assert.equal(toCheck[0]!.utr, "412356789012", "staff see the whole UTR to match the bank statement");
  assert.equal(toCheck[0]!.customer.email, "asha@example.com");
  assert.equal((await customer.payments.get(payment.id)).utrLast4, "9012", "customers only see the last 4");

  await assert.rejects(
    owner.admin.verifyPayment(payment.id, {} as never),
    is("VALIDATION_FAILED"),
    "verifying needs the explicit bank-statement confirmation",
  );
  const verified = await owner.admin.verifyPayment(payment.id, { foundInBankStatement: true });
  assert.equal(verified.status, "VERIFIED");
  assert.equal((await customer.account.order(order.reference)).status, "CONFIRMED");
  await assert.rejects(owner.admin.rejectPayment(payment.id, { reason: "Not found" }), is("PAYMENT_ALREADY_CHECKED"));
  assert.equal(mock.controls.pendingPayments().length, 0);
});

test("payments: a rejection reason reaches the customer, who can resend", async () => {
  const { customer, owner } = setup();
  await signUp(customer);
  await owner.auth.login(OWNER);
  const course = (await customer.courses.list()).find((c) => c.price > 0)!;
  const { enrolment } = await customer.courses.enrol(course.slug, idempotencyKey());
  await customer.payments.submit(enrolment.payment!.id, { utr: "111122223333", payerName: "Asha Rao" });
  await assert.rejects(owner.admin.rejectPayment(enrolment.payment!.id, { reason: "no" }), is("VALIDATION_FAILED"));
  await owner.admin.rejectPayment(enrolment.payment!.id, { reason: "We couldn't find this amount on that date." });
  const seen = await customer.payments.get(enrolment.payment!.id);
  assert.equal(seen.status, "REJECTED");
  assert.equal(seen.rejectionReason, "We couldn't find this amount on that date.");
});

test("orders: only allowed steps; delivery is shipped with tracking; cancelling returns stock", async () => {
  const { mock, customer, owner } = setup();
  await signUp(customer);
  await owner.auth.login(OWNER);
  const product = (await customer.shop.products()).items.find((p) => p.maxQuantity > 2)!;
  const before = (await owner.admin.product(product.id)).stock;
  const place = () =>
    customer.shop.placeOrder(
      {
        items: [{ productId: product.id, quantity: 2 }],
        fulfilment: "DELIVERY",
        address: { line1: "12 Temple Street", city: "Madurai", state: "Tamil Nadu", pincode: "625001" },
        contact: { name: "Asha Rao", email: "asha@example.com", phone: "9876543210" },
      },
      idempotencyKey(),
    );
  const { order, payment } = await place();
  assert.equal((await owner.admin.product(product.id)).stock, before - 2);

  const pending = await owner.admin.order(order.reference);
  assert.deepEqual(pending.nextStatuses, ["CANCELLED"], "payment states move only through the payment check");
  await assert.rejects(
    owner.admin.updateOrderStatus(order.reference, { status: "SHIPPED" }),
    is("INVALID_STATUS_CHANGE", 409),
  );

  await customer.payments.submit(payment.id, { utr: "222233334444", payerName: "Asha Rao" });
  mock.controls.verifyPayment(payment.id);
  assert.deepEqual((await owner.admin.order(order.reference)).nextStatuses, ["PROCESSING", "CANCELLED"]);
  await owner.admin.updateOrderStatus(order.reference, { status: "PROCESSING" });
  const shipped = await owner.admin.updateOrderStatus(order.reference, {
    status: "SHIPPED",
    trackingInfo: "India Post EK123456789IN",
  });
  assert.deepEqual(shipped.nextStatuses, ["COMPLETED"]);
  const mine = await customer.account.order(order.reference);
  assert.equal(mine.status, "SHIPPED");
  assert.equal(mine.trackingInfo, "India Post EK123456789IN");
  assert.equal(mine.events.at(-1)!.note, "Your order has been shipped");

  const second = await place();
  await owner.admin.updateOrderStatus(second.order.reference, { status: "CANCELLED", note: "Out of stock locally" });
  assert.equal((await owner.admin.product(product.id)).stock, before - 2, "the cancelled order's items are back");
  assert.equal((await customer.payments.get(second.payment.id)).status, "CANCELLED");
  const list = await owner.admin.orders({ status: "CANCELLED" });
  assert.deepEqual(
    list.items.map((o) => o.reference),
    [second.order.reference],
  );
});

test("classes: a new class and batch appear for customers; the Meet link only after verification", async () => {
  const { mock, customer, owner } = setup();
  await signUp(customer);
  await owner.auth.login(OWNER);
  const cls = await owner.admin.createClass({
    title: { en: "Evening Pranayama", ta: "மாலை பிராணாயாமம்" },
    summary: { en: "Gentle breathing practice after work.", ta: null },
    description: { en: "", ta: null },
    level: "BEGINNER",
    language: { en: "Tamil and English", ta: null },
    feeType: "MONTHLY",
    fee: 120_000,
    instructorName: null,
    isPublished: true,
  });
  assert.equal(cls.slug, "evening-pranayama");
  const startsAt = clinicDateTimeToIso(addDaysToKey(todayKey(), 5), "18:30")!;
  await assert.rejects(
    owner.admin.createBatch(cls.id, {
      name: "Batch 1",
      startsAt: new Date(Date.now() - 3_600_000).toISOString(),
      durationMinutes: 45,
      sessionsCount: 8,
      scheduleNote: null,
      seatLimit: null,
      registrationOpen: true,
      meetingUrl: null,
    }),
    is("VALIDATION_FAILED"),
  );
  await assert.rejects(
    owner.admin.createBatch(cls.id, {
      name: "Batch 1",
      startsAt,
      durationMinutes: 90,
      sessionsCount: 8,
      scheduleNote: null,
      seatLimit: null,
      registrationOpen: true,
      meetingUrl: "https://zoom.us/j/123",
    }),
    (e: unknown) => e instanceof ApiError && !!e.fieldErrors.durationMinutes && !!e.fieldErrors.meetingUrl,
    "sessions stay within the free Meet limit and only Meet links are accepted",
  );
  const withBatch = await owner.admin.createBatch(cls.id, {
    name: "Batch 1",
    startsAt,
    durationMinutes: 45,
    sessionsCount: 8,
    scheduleNote: "Mon, Wed, Fri",
    seatLimit: 20,
    registrationOpen: true,
    meetingUrl: "https://meet.google.com/abc-defg-hij",
  });
  const batch = withBatch.batches[0]!;

  // Public pages: listed, in Tamil too, and never with the Meet link.
  const listed = (await customer.classes.list()).find((c) => c.id === cls.id)!;
  assert.equal(listed.nextBatch?.id, batch.id);
  assert.equal((await client(mock, "ta").classes.list()).find((c) => c.id === cls.id)!.title, "மாலை பிராணாயாமம்");
  const detail = await customer.classes.get(cls.slug);
  assert.ok(!JSON.stringify(detail).includes("meet.google.com"));

  const { registration } = await customer.classes.register(batch.id, idempotencyKey());
  assert.equal(registration.meeting, null);
  await customer.payments.submit(registration.payment!.id, { utr: "333344445555", payerName: "Asha Rao" });
  assert.equal((await customer.account.registration(registration.id)).meeting, null);
  const students = (await owner.admin.class(cls.id)).batches[0]!.students;
  assert.deepEqual(
    students.map((x) => [x.name, x.status]),
    [["Asha Rao", "PAYMENT_SUBMITTED"]],
  );
  await owner.admin.verifyPayment(registration.payment!.id, { foundInBankStatement: true });
  assert.equal(
    (await customer.account.registration(registration.id)).meeting?.url,
    "https://meet.google.com/abc-defg-hij",
  );

  // A batch with students can't be deleted; closing registration works.
  await assert.rejects(owner.admin.deleteBatch(batch.id), is("BATCH_HAS_STUDENTS", 409));
  const closed = await owner.admin.updateBatch(batch.id, { registrationOpen: false });
  assert.equal(closed.batches[0]!.registrationOpen, false);
  assert.equal((await customer.classes.get(cls.slug)).batches[0]!.closedReason, "CLOSED");

  // Hiding the class removes it from the list but not from the registered student.
  await owner.admin.updateClass(cls.id, { isPublished: false });
  assert.equal(
    (await customer.classes.list()).some((c) => c.id === cls.id),
    false,
  );
  assert.equal((await customer.classes.get(cls.slug)).id, cls.id);
  await assert.rejects(client(mock).classes.get(cls.slug), is("NOT_FOUND", 404));
});

test("products: new products go on sale; hidden ones leave the shop and the cart quote", async () => {
  const { customer, owner } = setup();
  await owner.auth.login(OWNER);
  const categories = await customer.shop.categories();
  const created = await owner.admin.createProduct({
    name: { en: "Tulsi Ginger Tea", ta: null },
    categoryId: categories[0]!.id,
    size: "100 g",
    price: 24_000,
    mrp: 28_000,
    stock: 12,
    isFeatured: false,
    isPublished: true,
    shortDescription: { en: "A warming blend for winter mornings.", ta: null },
    description: { en: "", ta: null },
  });
  await assert.rejects(
    owner.admin.updateProduct(created.id, { mrp: 10_000 }),
    (e: unknown) => e instanceof ApiError && e.fieldErrors.mrp === "MRP can't be lower than the price",
  );
  const listed = await customer.shop.product(created.slug);
  assert.equal(listed.price, 24_000);
  assert.equal(listed.stockStatus, "IN_STOCK");

  await owner.admin.updateProduct(created.id, { isPublished: false, stock: 3 });
  await assert.rejects(customer.shop.product(created.slug), is("NOT_FOUND", 404));
  const quote = await customer.shop.quote({ items: [{ productId: created.id, quantity: 1 }] });
  assert.deepEqual(
    quote.problems.map((p) => p.code),
    ["UNAVAILABLE"],
  );
  assert.equal((await owner.admin.overview()).lowStockProducts >= 0, true);
});

test("courses: lessons with a video play only for enrolled students", async () => {
  const { customer, owner } = setup();
  await signUp(customer);
  await owner.auth.login(OWNER);
  const course = await owner.admin.createCourse({
    title: { en: "Morning Mobility", ta: null },
    summary: { en: "Ten minutes a day to loosen stiff joints.", ta: null },
    description: { en: "", ta: null },
    level: "ALL_LEVELS",
    price: 49_900,
    accessDays: 365,
    isPublished: true,
  });
  const withLessons = await owner.admin.createLesson(course.id, {
    title: { en: "Welcome", ta: null },
    durationMinutes: 5,
    isFreePreview: true,
    notes: { en: "Start here.", ta: null },
    videoUrl: "https://youtu.be/dQw4w9WgXcQ",
  });
  await owner.admin.createLesson(course.id, {
    title: { en: "Neck and shoulders", ta: null },
    durationMinutes: 10,
    isFreePreview: false,
    notes: { en: "", ta: null },
    videoUrl: "https://vimeo.com/76979871",
  });
  const preview = withLessons.lessons[0]!;
  const lesson = await customer.courses.lesson(course.slug, preview.id);
  assert.equal(lesson.video?.embedUrl, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");

  const outline = await customer.courses.get(course.slug);
  const locked = outline.lessons[1]!;
  assert.equal(locked.isLocked, true);
  await assert.rejects(customer.courses.lesson(course.slug, locked.id), is("NOT_ENROLLED", 403));

  const { enrolment } = await customer.courses.enrol(course.slug, idempotencyKey());
  await customer.payments.submit(enrolment.payment!.id, { utr: "555566667777", payerName: "Asha Rao" });
  await owner.admin.verifyPayment(enrolment.payment!.id, { foundInBankStatement: true });
  assert.equal(
    (await customer.courses.lesson(course.slug, locked.id)).video?.embedUrl,
    "https://player.vimeo.com/video/76979871",
  );

  await owner.admin.deleteLesson(preview.id);
  const after = await owner.admin.course(course.id);
  assert.deepEqual(
    after.lessons.map((l) => [l.position, l.title.en]),
    [[1, "Neck and shoulders"]],
  );
});

test("sample data is shared between tabs, while each tab keeps its own sign-in", async () => {
  const store: Record<string, string> = {};
  const shared: MockPersistence = { load: () => store.data ?? null, save: (v) => void (store.data = v) };
  const tab = (name: string): MockPersistence => ({
    load: () => store[name] ?? null,
    save: (v) => void (store[name] = v),
  });
  const web = (name: string) => {
    const mock = createMockApi({ persistence: shared, tabPersistence: tab(name), staff: [OWNER] });
    return createServices(
      createApiClient({
        config: parseAppConfig({}, "web"),
        tokenStore: createTokenStore({ cookieRefresh: true }),
        getLocale: () => "en",
        adapter: mock.adapter,
      }),
    );
  };
  const customerTab = web("tab-a");
  const ownerTab = web("tab-b");
  await signUp(customerTab);
  await ownerTab.auth.login(OWNER);
  const course = (await customerTab.courses.list()).find((c) => c.price > 0)!;
  const { enrolment } = await customerTab.courses.enrol(course.slug, idempotencyKey());
  await customerTab.payments.submit(enrolment.payment!.id, { utr: "666677778888", payerName: "Asha Rao" });

  // The owner tab sees the customer's payment, and the customer tab is still the customer.
  assert.equal((await ownerTab.admin.payments({ status: "SUBMITTED" })).length, 1);
  assert.equal((await customerTab.auth.me()).role, "CUSTOMER");
  await ownerTab.admin.verifyPayment(enrolment.payment!.id, { foundInBankStatement: true });
  assert.equal((await customerTab.payments.get(enrolment.payment!.id)).status, "VERIFIED");

  // A brand-new tab can sign in as the owner straight away, without registering.
  assert.equal((await web("tab-c").auth.login(OWNER)).role, "OWNER");
});

test("admin form rules: rupees, clinic-time dates, Meet and video links", () => {
  assert.equal(parseRupees("1,500"), 150_000);
  assert.equal(parseRupees("₹ 1500.5"), 150_050);
  assert.equal(parseRupees("15OO"), null);
  assert.equal(rupeesText(150_050), "1500.50");
  assert.equal(clinicDateTimeToIso("2026-11-03", "18:30"), "2026-11-03T13:00:00.000Z");
  assert.deepEqual(clinicDateTimeFields("2026-11-03T13:00:00.000Z"), { date: "2026-11-03", time: "18:30" });
  assert.equal(isMeetLink("https://meet.google.com/abc-defg-hij"), true);
  assert.equal(isMeetLink("http://meet.google.com/abc-defg-hij"), false);
  assert.equal(isMeetLink("https://meet.google.com.evil.example/abc"), false);
  assert.equal(videoEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")?.provider, "YOUTUBE");
  assert.equal(videoEmbed("https://example.com/video.mp4"), null);
  assert.equal(videoEmbed("javascript:alert(1)"), null);
  assert.deepEqual(nextOrderStatuses("PROCESSING", "PICKUP"), ["READY_FOR_PICKUP", "CANCELLED"]);

  const cls = validate(classFormSchema, {
    title: { en: "Yo", ta: "" },
    summary: { en: "Short", ta: "" },
    description: { en: "", ta: "" },
    level: "BEGINNER",
    language: { en: "Tamil", ta: "" },
    feeType: "PER_BATCH",
    fee: "abc",
    instructorName: "",
    isPublished: true,
  });
  assert.equal(cls.success, false);
  if (!cls.success) {
    assert.equal(cls.fieldErrors["title.en"], "Title needs at least 3 characters");
    assert.equal(cls.fieldErrors["summary.en"], "Summary needs at least 10 characters");
    assert.equal(cls.fieldErrors.fee, "Enter an amount in rupees, like 1500");
  }
  const batch = validate(batchFormSchema, {
    name: "",
    date: "2026-11-03",
    time: "18:30",
    durationMinutes: "45",
    sessionsCount: "8",
    scheduleNote: "",
    seatLimit: "",
    registrationOpen: true,
    meetingUrl: "",
  });
  assert.equal(batch.success, true);
  if (batch.success) {
    assert.equal(batch.data.startsAt, "2026-11-03T13:00:00.000Z");
    assert.equal(batch.data.seatLimit, null);
    assert.equal(batch.data.meetingUrl, null);
  }
  const product = validate(productFormSchema, {
    name: { en: "Tea", ta: "" },
    categoryId: "",
    size: "",
    price: "250",
    mrp: "200",
    stock: "4",
    isFeatured: false,
    isPublished: true,
    shortDescription: { en: "A calming herbal tea.", ta: "" },
    description: { en: "", ta: "" },
  });
  assert.equal(product.success, false);
  if (!product.success) assert.equal(product.fieldErrors.mrp, "MRP can't be lower than the price");
  const lesson = validate(lessonSchema, {
    title: { en: "Intro", ta: "" },
    durationMinutes: "",
    isFreePreview: false,
    notes: { en: "", ta: "" },
    videoUrl: "https://example.com/v.mp4",
  });
  assert.equal(lesson.success, false);
  if (!lesson.success) assert.equal(lesson.fieldErrors.videoUrl, "Paste a YouTube or Vimeo link");
});
