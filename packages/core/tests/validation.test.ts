import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkoutSchema,
  consultationSchema,
  contactSchema,
  parseAppConfig,
  ConfigError,
  registerSchema,
  utrSubmissionSchema,
  validate,
} from "../src";

test("registration checks every field and matching passwords", () => {
  const bad = validate(registerSchema, {
    name: "A",
    email: "nope",
    phone: "12",
    password: "short",
    confirmPassword: "x",
  });
  assert.equal(bad.success, false);
  if (!bad.success)
    assert.deepEqual(Object.keys(bad.fieldErrors).sort(), ["acceptTerms", "email", "name", "password", "phone"]);
  const mismatch = validate(registerSchema, {
    name: "Asha Rao",
    email: "Asha@Example.com",
    phone: "98765 43210",
    password: "calm-waters-42",
    confirmPassword: "calm-waters-43",
    acceptTerms: true,
  });
  assert.equal(mismatch.success, false);
  if (!mismatch.success) assert.equal(mismatch.fieldErrors.confirmPassword, "Passwords don't match");
  const good = validate(registerSchema, {
    name: "Asha Rao",
    email: " Asha@Example.com ",
    phone: "98765 43210",
    password: "calm-waters-42",
    confirmPassword: "calm-waters-42",
    acceptTerms: true,
  });
  assert.ok(good.success);
  if (good.success) {
    assert.equal(good.data.email, "asha@example.com");
    assert.equal(good.data.phone, "+919876543210");
  }
});

test("checkout requires a branch for pickup and an address for delivery", () => {
  const contact = { name: "Asha Rao", email: "asha@example.com", phone: "9876543210" };
  const pickup = validate(checkoutSchema, { fulfilment: "PICKUP", pickupBranchId: "", contact });
  assert.ok(!pickup.success && pickup.fieldErrors.pickupBranchId);
  const delivery = validate(checkoutSchema, {
    fulfilment: "DELIVERY",
    contact,
    address: { line1: "12 Lake Road", city: "Chennai", state: "Tamil Nadu", pincode: "6000" },
  });
  assert.ok(!delivery.success && delivery.fieldErrors["address.pincode"] === "Enter a valid 6-digit PIN code");
});

test("enquiry forms validate consent and optional phone", () => {
  const c = validate(consultationSchema, {
    name: "Asha Rao",
    phone: "9876543210",
    email: "a@b.co",
    preferredMethod: "PHONE",
    reason: "I'd like help with sleep",
    consent: false,
  });
  assert.ok(!c.success && c.fieldErrors.consent);
  const m = validate(contactSchema, {
    name: "Asha Rao",
    email: "a@b.co",
    phone: "",
    subject: "Parking",
    message: "Is there parking nearby?",
  });
  assert.ok(m.success);
  if (m.success) assert.equal(m.data.phone, undefined);
});

test("UTR input is cleaned before checking", () => {
  const r = validate(utrSubmissionSchema, { utr: "4123 5678 9012", payerName: "Asha Rao" });
  assert.ok(r.success);
  if (r.success) assert.equal(r.data.utr, "412356789012");
});

test("configuration: live mode needs an https base URL", () => {
  assert.equal(parseAppConfig({}, "web").apiMode, "mock");
  assert.throws(() => parseAppConfig({ API_MODE: "live" }, "web"), ConfigError);
  assert.throws(() => parseAppConfig({ API_MODE: "live", API_BASE_URL: "http://api.example.com" }, "web"), /https/);
  assert.equal(
    parseAppConfig({ API_MODE: "live", API_BASE_URL: "http://localhost:4000/v1/" }, "web").apiBaseUrl,
    "http://localhost:4000/v1",
  );
  assert.throws(
    () => parseAppConfig({ APP_ENV: "production", API_MODE: "live", API_BASE_URL: "http://localhost:4000" }, "ios"),
    /Production/,
  );
  assert.equal(
    parseAppConfig({ API_MODE: "live", API_BASE_URL: "https://api.example.com/v1", API_TIMEOUT_MS: "8000" }, "android")
      .timeoutMs,
    8000,
  );
});
