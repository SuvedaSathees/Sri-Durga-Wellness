import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accessPeriod,
  addressSchema,
  batchPrice,
  formatClassFee,
  INDIAN_STATES,
  addToCart,
  applyQuoteProblems,
  buildUpiUri,
  canSubmitUtr,
  cartCount,
  clinicTimeToUtc,
  dateKey,
  discountPercent,
  formatDate,
  formatDateTime,
  formatDuration,
  formatFee,
  formatPhone,
  formatPrice,
  formatTime,
  groupSlots,
  isValidUtr,
  normalizePhone,
  parseStoredCart,
  paymentStage,
  setQuantity,
  translate,
  whatsappLink,
} from "../src";

test("prices use Indian digit grouping and paise", () => {
  assert.equal(formatPrice(35000), "₹350");
  assert.equal(formatPrice(125050), "₹1,250.50");
  assert.equal(formatPrice(125000000), "₹12,50,000");
  assert.equal(formatFee(0, "en"), "Free");
  assert.equal(formatFee(0, "ta"), "இலவசம்");
  assert.equal(discountPercent(35000, 40000), 13);
  assert.equal(discountPercent(35000, null), null);
});

test("dates are shown in clinic time (IST) in English and Tamil", () => {
  const instant = clinicTimeToUtc("2026-10-17", 10 * 60 + 30); // 10:30 IST
  assert.equal(instant.toISOString(), "2026-10-17T05:00:00.000Z");
  assert.equal(dateKey("2026-10-17T20:00:00.000Z"), "2026-10-18"); // 1:30 AM next day in IST
  assert.equal(formatDate(instant, "en"), "Sat, 17 Oct 2026");
  assert.equal(formatDate(instant, "ta"), "சனி, 17 அக்., 2026");
  assert.equal(formatTime(instant, "en"), "10:30 AM");
  assert.equal(formatTime(instant, "ta"), "காலை 10:30");
  assert.equal(formatTime("2026-10-17T13:30:00.000Z", "en"), "7:00 PM");
  assert.equal(formatDateTime(instant), "Sat, 17 Oct 2026 · 10:30 AM");
  assert.equal(formatDuration(75, "en"), "1 hr 15 min");
  assert.equal(formatDuration(45, "ta"), "45 நிமி.");
});

test("slots are grouped into morning, afternoon and evening", () => {
  const at = (m: number) => ({ startsAt: clinicTimeToUtc("2026-10-19", m).toISOString(), endsAt: "", branchId: null });
  const groups = groupSlots([at(600), at(630), at(16 * 60), at(18 * 60)]);
  assert.deepEqual(
    groups.map((g) => [g.period, g.slots.length]),
    [
      ["morning", 2],
      ["afternoon", 1],
      ["evening", 1],
    ],
  );
});

test("cart keeps ids and quantities only, within stock limits", () => {
  let cart = addToCart([], "p1", 2, 5);
  cart = addToCart(cart, "p1", 10, 5);
  assert.deepEqual(cart, [{ productId: "p1", quantity: 5 }]);
  cart = addToCart(cart, "p2", 1);
  assert.equal(cartCount(cart), 6);
  cart = setQuantity(cart, "p1", 0);
  assert.deepEqual(cart, [{ productId: "p2", quantity: 1 }]);
  cart = applyQuoteProblems(addToCart(cart, "p3", 3), [
    { productId: "p3", code: "QUANTITY_REDUCED", availableQuantity: 1 },
  ]);
  assert.deepEqual(cart, [
    { productId: "p2", quantity: 1 },
    { productId: "p3", quantity: 1 },
  ]);
});

test("a stored cart from the device is treated as untrusted input", () => {
  assert.deepEqual(parseStoredCart("nonsense"), []);
  assert.deepEqual(
    parseStoredCart([
      { productId: "a", quantity: 2 },
      { productId: "a", quantity: 9 },
      { productId: 5 },
      { productId: "b", quantity: 999 },
      null,
    ]),
    [
      { productId: "a", quantity: 2 },
      { productId: "b", quantity: 20 },
    ],
  );
});

test("UPI links encode payee, amount and reference; UTRs are checked", () => {
  const uri = buildUpiUri({ payeeVpa: "clinic@bank", payeeName: "Sri Durga Wellness", note: "ORD-ABC123" }, 35050);
  assert.equal(uri, "upi://pay?pa=clinic%40bank&pn=Sri%20Durga%20Wellness&am=350.50&cu=INR&tn=ORD-ABC123");
  assert.ok(isValidUtr(" 4123 5678 9012 "));
  assert.ok(!isValidUtr("12-34"));
});

test("the app never treats a submitted payment as paid", () => {
  assert.equal(paymentStage({ status: "SUBMITTED" }), "waiting");
  assert.equal(paymentStage({ status: "VERIFIED" }), "verified");
  assert.equal(paymentStage({ status: "REJECTED" }), "retry");
  assert.equal(canSubmitUtr({ status: "SUBMITTED", upi: null }), false);
  assert.equal(canSubmitUtr({ status: "AWAITING_PAYMENT", upi: { payeeVpa: "a@b", payeeName: "x", note: "n" } }), true);
});

test("phone numbers are normalised to E.164 and links are built safely", () => {
  assert.equal(normalizePhone("98765 43210"), "+919876543210");
  assert.equal(normalizePhone("+91 98765-43210"), "+919876543210");
  assert.equal(formatPhone("+919876543210"), "+91 98765 43210");
  assert.equal(whatsappLink("+91 98765 43210", "Hi there"), "https://wa.me/919876543210?text=Hi%20there");
});

test("translation: exact keys, placeholders and pattern matches", () => {
  assert.equal(translate("ta", "Save"), "சேமி");
  assert.equal(translate("en", "Save"), "Save");
  assert.equal(translate("ta", "Email is required"), "மின்னஞ்சல் தேவை");
  assert.equal(translate("ta", "Not in the dictionary"), "Not in the dictionary");
});

test("class fees show their unit, and per-session batches multiply", () => {
  assert.equal(formatClassFee(120000, "MONTHLY"), "₹1,200 / month");
  assert.equal(formatClassFee(120000, "MONTHLY", "ta"), "₹1,200 / மாதம்");
  assert.equal(formatClassFee(25000, "PER_SESSION"), "₹250 / session");
  assert.equal(formatClassFee(80000, "PER_BATCH"), "₹800");
  assert.equal(formatClassFee(0, "PER_SESSION"), "Free");
  assert.equal(batchPrice(25000, "PER_SESSION", 4), 100000);
  assert.equal(batchPrice(120000, "MONTHLY", 12), 120000);
  assert.equal(batchPrice(80000, "PER_BATCH", 2), 80000);
});

test("course access periods read as lifetime, months or days", () => {
  assert.deepEqual(accessPeriod(null), { label: "Lifetime access" });
  assert.deepEqual(accessPeriod(365), { label: "{months} months of access", vars: { months: 12 } });
  assert.deepEqual(accessPeriod(90), { label: "{days} days of access", vars: { days: 90 } });
});

test("delivery addresses accept every Indian state and real-looking PIN codes only", () => {
  const base = { line1: "12 Lake Road", city: "Guwahati", state: "Assam", pincode: "781001" };
  assert.equal(addressSchema.safeParse(base).success, true);
  assert.equal(INDIAN_STATES.length, 36);
  assert.equal(addressSchema.safeParse({ ...base, pincode: "081001" }).success, false);
  assert.equal(addressSchema.safeParse({ ...base, state: "Atlantis" }).success, false);
});
