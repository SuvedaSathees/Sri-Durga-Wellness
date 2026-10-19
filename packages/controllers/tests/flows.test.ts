import { test } from "node:test";
import assert from "node:assert/strict";
import { bookingReducer, initialBookingState, reachableSteps } from "../src/booking/booking-flow";
import { createCartStore } from "../src/shop/cart-store";
import { createMemoryStorage, STORAGE_KEYS } from "../src/storage";
import { describeSubmitError, getPath, setPath } from "../src/forms";
import { ApiError } from "@sdw/core";

const slot = { startsAt: "2026-10-21T04:30:00.000Z", endsAt: "2026-10-21T05:15:00.000Z", branchId: null };

test("booking flow moves forward step by step and skips the practitioner when there is only one", () => {
  let s = initialBookingState({ patientEmail: "asha@example.com" });
  assert.equal(s.step, "service");
  assert.equal(s.details.patientEmail, "asha@example.com");
  s = bookingReducer(s, { type: "chooseService", serviceId: "svc1", onlyDoctorId: "doc1" });
  assert.equal(s.step, "time");
  s = bookingReducer(s, { type: "chooseDate", date: "2026-10-21" });
  s = bookingReducer(s, { type: "chooseSlot", slot });
  assert.equal(s.step, "details");
  assert.deepEqual(reachableSteps(s), ["service", "doctor", "time", "details"]);
  s = bookingReducer(s, { type: "goTo", step: "review" });
  assert.equal(s.step, "details", "can't skip ahead");
});

test("changing the service clears the practitioner and time; a taken slot sends you back with a new key", () => {
  let s = initialBookingState();
  s = bookingReducer(s, { type: "chooseService", serviceId: "svc1" });
  s = bookingReducer(s, { type: "chooseDoctor", doctorId: "doc1" });
  s = bookingReducer(s, { type: "chooseSlot", slot });
  const key = s.idempotencyKey;
  const taken = bookingReducer(s, { type: "slotTaken" });
  assert.equal(taken.step, "time");
  assert.equal(taken.slot, null);
  assert.notEqual(taken.idempotencyKey, key);
  const other = bookingReducer(s, { type: "chooseService", serviceId: "svc2" });
  assert.equal(other.doctorId, null);
  assert.equal(other.slot, null);
  assert.equal(other.step, "doctor");
});

test("the cart store loads saved lines, keeps items added while loading, and persists changes", async () => {
  const storage = createMemoryStorage({ [STORAGE_KEYS.cart]: JSON.stringify([{ productId: "a", quantity: 1 }]) });
  const cart = createCartStore(storage);
  cart.add("b", 2);
  await cart.ready;
  assert.deepEqual(cart.getSnapshot(), [
    { productId: "a", quantity: 1 },
    { productId: "b", quantity: 2 },
  ]);
  let notified = 0;
  cart.subscribe(() => notified++);
  cart.setQuantity("a", 3, 2);
  assert.deepEqual(cart.getSnapshot()[0], { productId: "a", quantity: 2 });
  assert.equal(notified, 1);
  cart.clear();
  assert.equal(await storage.getItem(STORAGE_KEYS.cart), null);
});

test("a corrupted saved cart is ignored", async () => {
  const cart = createCartStore(createMemoryStorage({ [STORAGE_KEYS.cart]: "{not json" }));
  await cart.ready;
  assert.deepEqual(cart.getSnapshot(), []);
});

test("form helpers read and write nested fields and map server errors", () => {
  const v = setPath({ contact: { name: "A" } }, "contact.phone", "98765");
  assert.deepEqual(v, { contact: { name: "A", phone: "98765" } });
  assert.equal(getPath(v, "contact.phone"), "98765");
  const server = new ApiError({
    kind: "http",
    status: 422,
    code: "VALIDATION_FAILED",
    message: "x",
    fieldErrors: { "address.pincode": "Enter a valid 6-digit PIN code" },
  });
  assert.deepEqual(describeSubmitError(server), {
    fieldErrors: { "address.pincode": "Enter a valid 6-digit PIN code" },
    message: "Please check the highlighted fields.",
  });
  const offline = new ApiError({ kind: "network", status: 0, code: "NETWORK_ERROR", message: "x" });
  assert.equal(describeSubmitError(offline).message, "You seem to be offline. Check your connection and try again.");
});
