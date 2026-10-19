/**
 * The clinic's launch decisions (docs/REQUIREMENTS.md §6) as they appear on the website:
 * class fee types and monthly renewals, unlimited seats, sessions under an hour, course access
 * periods, all-India delivery, hidden service prices, the 10-minute consultation and daily UPI checks.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { open, signInAsSampleCustomer, staffVerifiesLatestPayment } from "./helpers.mjs";

async function session(fn, opts) {
  const s = await open(opts);
  try {
    await fn(s);
    assert.deepEqual(s.errors, [], "no browser errors");
  } finally {
    await s.close();
  }
}

async function payWithUtr(page, utr) {
  await page.getByLabel("UPI transaction reference (UTR)").fill(utr);
  await page.getByRole("button", { name: "Submit for verification" }).click();
  await page.getByRole("heading", { name: "We're checking your payment" }).waitFor();
}

test("class fees show how each class is charged; no seat counts; sessions under an hour", () =>
  session(async ({ page, go }) => {
    await go("/classes");
    for (const fee of ["₹1,200 / month", "₹250 / session", "₹800", "Free"])
      await page.getByText(fee, { exact: true }).first().waitFor();
    assert.equal(await page.getByText(/seats? left/).count(), 0);

    await go("/classes/yoga-nidra-drop-in");
    await page.getByText("Pay for each session").waitFor();
    await page.getByText("Under 60 minutes").waitFor();
    await page.getByText("4 sessions × ₹250 = ₹1,000").waitFor();
    assert.equal(await page.getByText(/seats? left/).count(), 0);
  }));

test("monthly class: first month, then the customer pays for the next month from their account", () =>
  session(async ({ page, go }) => {
    await go("/classes/morning-yoga-flow");
    await page.getByText("Monthly fee, renewed each month").waitFor();
    await signInAsSampleCustomer(page);
    await page.getByRole("button", { name: "Register and pay ₹1,200 for the first month" }).first().click();
    await page.waitForURL(/\/pay\/pay_/);
    await payWithUtr(page, "412345678901");
    await page.getByText("The clinic checks UPI payments once a day, so confirmation can take up to a day.").waitFor();
    await staffVerifiesLatestPayment(page);
    await page.getByRole("heading", { name: "Payment verified" }).waitFor();

    await page.getByRole("link", { name: "View my classes" }).click();
    await page
      .getByText(/^Paid until /)
      .first()
      .waitFor();
    await page.getByRole("link", { name: "Morning Yoga Flow" }).click();
    await page
      .getByText(/^Paid until /)
      .first()
      .waitFor();
    await page.getByRole("link", { name: "Join class" }).waitFor();

    await page.getByRole("button", { name: "Pay for next month (₹1,200)" }).click();
    await page.waitForURL(/\/pay\/pay_/);
    await page.getByText("Live class · next month").waitFor();
    await payWithUtr(page, "498765432101");
    await staffVerifiesLatestPayment(page);
    await page.getByRole("heading", { name: "Payment verified" }).waitFor();
  }));

test("recorded courses show lifetime or 12-month access", () =>
  session(async ({ page, go }) => {
    await go("/courses");
    await page.getByText("12 months of access").first().waitFor();
    await page.getByText("Lifetime access").first().waitFor();
  }));

test("service pages and booking show no prices", () =>
  session(async ({ page, go }) => {
    await go("/services");
    await page.getByRole("link", { name: "Wellness Consultation" }).waitFor();
    assert.equal(await page.locator("main").getByText(/₹/).count(), 0);
    await go("/book");
    await page.getByRole("heading", { level: 1 }).waitFor();
    assert.equal(await page.locator("main").getByText(/₹/).count(), 0);
  }));

test("free consultation: 10 minutes by phone, video call or in person", () =>
  session(async ({ page, go }) => {
    await go("/free-consultation");
    await page.getByText("A free 10-minute conversation — by phone, by video call or at the clinic.").waitFor();
    for (const name of ["Phone call", "Video call", "In person"]) await page.getByRole("radio", { name }).waitFor();
  }));

test("home delivery reaches every state in India", () =>
  session(async ({ page, go }) => {
    await go("/shop/calm-evening-herbal-tea");
    await page.getByRole("button", { name: "Add to cart" }).click();
    await signInAsSampleCustomer(page);
    await go("/checkout");
    await page.getByRole("radio", { name: /Home delivery anywhere in India/ }).check();
    await page.getByText("We deliver to every PIN code in India.").waitFor();
    const state = page.getByLabel("State / union territory");
    assert.equal(await state.locator("option:not([disabled])").count(), 36);
    await state.selectOption("Assam");
    assert.equal(await state.inputValue(), "Assam");
  }));
