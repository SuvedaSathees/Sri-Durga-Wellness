/**
 * Admin area (clinic owner) in mock mode, signed in with the practice owner login from .env.test.
 * Two tabs of one browser share the sample data, each with its own sign-in — a customer in one tab,
 * the owner in the other — exactly as on a computer running `npm run dev`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE_URL, horizontalOverflow, open, signInAsSampleCustomer, VIEWPORTS } from "./helpers.mjs";

const OWNER = { email: "owner@sridurga.demo", password: "demo-owner-2026" };

async function signInAsOwner(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(OWNER.email);
  await page.getByLabel("Password", { exact: true }).fill(OWNER.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/admin$/);
  await page.getByRole("heading", { level: 1, name: "Clinic dashboard" }).waitFor();
}

test("the practice owner login opens the Admin area; customers are kept out", async () => {
  const s = await open();
  try {
    await signInAsOwner(s.page);
    await s.page.getByRole("link", { name: /Payments to check/ }).waitFor();
    assert.equal(await s.page.locator("header").getByRole("link", { name: "Admin area" }).count() > 0, true);
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }

  const c = await open();
  try {
    await c.go("/");
    await signInAsSampleCustomer(c.page);
    await c.go("/admin");
    await c.page.getByRole("heading", { name: "The Admin area is for the clinic owner" }).waitFor();
    assert.equal(await c.page.getByRole("heading", { name: "Clinic dashboard" }).count(), 0);
  } finally {
    await c.close();
  }
});

test("a customer's UPI payment reaches the owner's tab; the owner verifies it and moves the order on", async () => {
  const s = await open();
  try {
    // Tab 1: the customer orders and sends a UPI reference.
    const customer = s.page;
    await s.go("/shop/calm-evening-herbal-tea");
    await customer.getByRole("button", { name: "Add to cart" }).click();
    await signInAsSampleCustomer(customer);
    await s.go("/checkout");
    await customer.getByRole("button", { name: "Place order and pay" }).click();
    await customer.waitForURL(/\/pay\//);
    await customer.getByLabel("UPI transaction reference (UTR)").fill("4123 4567 8901");
    await customer.getByRole("button", { name: "Submit for verification" }).click();
    await customer.getByRole("heading", { name: "We're checking your payment" }).waitFor();

    // Tab 2: the owner, in the same browser.
    const owner = await customer.context().newPage();
    await signInAsOwner(owner);
    await owner.getByRole("link", { name: "Payments" }).first().click();
    await owner.waitForURL(/\/admin\/payments$/);
    await owner.getByText("412345678901").waitFor();
    await owner.getByRole("button", { name: "Verify", exact: true }).click();
    const dialog = owner.getByRole("dialog", { name: "Verify this payment?" });
    await dialog.getByRole("button", { name: "Verify payment" }).click();
    await dialog.getByText("Confirm you found this payment in the bank statement").waitFor();
    await dialog.getByLabel("I found this payment in the clinic's bank statement").check();
    await dialog.getByRole("button", { name: "Verify payment" }).click();
    await owner.getByRole("heading", { name: "All caught up" }).waitFor();

    // The customer tab is still the customer, and now sees the payment verified.
    await customer.getByRole("heading", { name: "Payment verified" }).waitFor({ timeout: 40_000 });

    // The owner packs the order and marks it ready for pickup.
    await owner.goto(`${BASE_URL}/admin/orders`, { waitUntil: "networkidle" });
    await owner.getByRole("link", { name: /^Order ORD-/ }).first().click();
    await owner.getByRole("button", { name: "Start packing" }).click();
    await owner.getByRole("dialog").getByRole("button", { name: "Start packing" }).click();
    await owner.getByRole("button", { name: "Ready for pickup" }).click();
    await owner.getByRole("dialog").getByRole("button", { name: "Ready for pickup" }).click();
    await owner.getByRole("button", { name: "Mark as completed" }).waitFor();

    await customer.goto(`${BASE_URL}/account/orders`, { waitUntil: "networkidle" });
    await customer.getByRole("link", { name: /^Order ORD-/ }).first().click();
    await customer.getByText("Your order is ready to collect at the clinic").waitFor();
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("the owner posts a class with a batch and a Meet link; customers see the class but never the link", async () => {
  const s = await open();
  try {
    await signInAsOwner(s.page);
    await s.go("/admin/classes/new");
    await s.page.getByLabel("Title", { exact: true }).fill("Evening Pranayama");
    await s.page.getByLabel("Summary", { exact: true }).fill("Gentle breathing practice after work.");
    await s.page.getByLabel("Fee (₹)").fill("1200");
    await s.page.getByRole("button", { name: "Add class" }).click();
    await s.page.waitForURL(/\/admin\/classes\/cls_/);
    await s.page.getByText("No batches yet. Add one so customers can register.").waitFor();

    await s.page.getByRole("button", { name: "Add a batch" }).click();
    const dialog = s.page.getByRole("dialog", { name: "Add a batch" });
    await dialog.getByLabel("Batch name").fill("November batch");
    await dialog.getByLabel("Minutes per session").fill("90");
    await dialog.getByLabel("Google Meet link").fill("https://zoom.us/j/123");
    await dialog.getByRole("button", { name: "Add batch" }).click();
    await dialog.getByText("Live sessions can be 15 to 60 minutes").waitFor();
    await dialog.getByText("Enter a Google Meet link (meet.google.com/…)").waitFor();
    await dialog.getByLabel("Minutes per session").fill("45");
    await dialog.getByLabel("Google Meet link").fill("https://meet.google.com/abc-defg-hij");
    await dialog.getByRole("button", { name: "Add batch" }).click();
    await s.page.getByText("Meet link added").waitFor();

    await s.go("/classes");
    await s.page.getByRole("heading", { name: "Evening Pranayama" }).waitFor();
    await s.page.getByRole("link", { name: /Evening Pranayama/ }).first().click();
    await s.page.getByRole("heading", { level: 1, name: "Evening Pranayama" }).waitFor();
    await s.page.getByText("November batch").first().waitFor();
    assert.equal((await s.page.content()).includes("meet.google.com"), false);
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("the owner adds a product and a course with a lesson video; both appear on the website", async () => {
  const s = await open();
  try {
    await signInAsOwner(s.page);
    await s.go("/admin/products/new");
    await s.page.getByLabel("Product name", { exact: true }).fill("Tulsi Ginger Tea");
    await s.page.getByLabel("Price (₹)").fill("240");
    await s.page.getByLabel("MRP (₹)").fill("200");
    await s.page.getByLabel("Stock").fill("12");
    await s.page.getByLabel("Short description", { exact: true }).fill("A warming blend for winter mornings.");
    await s.page.getByRole("button", { name: "Add product" }).click();
    await s.page.getByText("MRP can't be lower than the price").waitFor();
    await s.page.getByLabel("MRP (₹)").fill("280");
    await s.page.getByRole("button", { name: "Add product" }).click();
    await s.page.waitForURL(/\/admin\/products\/prd_/);
    await s.go("/shop");
    await s.page.getByRole("heading", { name: "Tulsi Ginger Tea" }).waitFor();

    await s.go("/admin/courses/new");
    await s.page.getByLabel("Title", { exact: true }).fill("Morning Mobility");
    await s.page.getByLabel("Summary", { exact: true }).fill("Ten minutes a day to loosen stiff joints.");
    await s.page.getByLabel("Price (₹)").fill("499");
    await s.page.getByRole("button", { name: "Add course" }).click();
    await s.page.waitForURL(/\/admin\/courses\/crs_/);
    await s.page.getByRole("button", { name: "Add a lesson" }).click();
    const dialog = s.page.getByRole("dialog", { name: "Add a lesson" });
    await dialog.getByLabel("Lesson title", { exact: true }).fill("Welcome");
    await dialog.getByLabel("Video link").fill("https://youtu.be/dQw4w9WgXcQ");
    await dialog.getByLabel(/Free preview/).check();
    await dialog.getByRole("button", { name: "Add lesson" }).click();
    await s.page.getByText("Video added").waitFor();

    await s.go("/courses");
    await s.page.getByRole("heading", { name: "Morning Mobility" }).waitFor();
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("Admin pages fit a phone screen and read in Tamil", async () => {
  const s = await open({ viewport: VIEWPORTS.phone });
  try {
    await signInAsOwner(s.page);
    for (const path of [
      "/admin",
      "/admin/payments",
      "/admin/orders",
      "/admin/classes",
      "/admin/classes/new",
      "/admin/products",
      "/admin/products/new",
      "/admin/courses",
      "/admin/courses/new",
    ]) {
      await s.go(path);
      await s.page.getByRole("heading", { level: 1 }).waitFor();
      assert.equal(await horizontalOverflow(s.page), 0, `${path} scrolls sideways`);
    }
    await s.go("/admin");
    await s.page.locator("header > div").first().getByRole("button", { name: "தமிழ் (Tamil)" }).click();
    await s.page.getByRole("heading", { level: 1, name: "மைய நிர்வாகப் பலகை" }).waitFor();
    assert.equal(await horizontalOverflow(s.page), 0);
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
