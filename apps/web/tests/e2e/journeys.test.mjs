/**
 * Cross-feature journeys: what a customer does in one area must show up correctly in their account.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE_URL, open, signInAsSampleCustomer, staffVerifiesLatestPayment } from "./helpers.mjs";

const SLOT = /^\s*(\d{1,2}:\d{2} (AM|PM))\s*$/;

test("a signed-in customer books, sees the appointment in their account and cancels it", async () => {
  const s = await open();
  try {
    await s.go("/");
    await signInAsSampleCustomer(s.page);
    await s.page.goto(`${BASE_URL}/book?service=wellness-consultation`, { waitUntil: "networkidle" });
    await s.page.getByRole("heading", { name: "Choose a date and time" }).waitFor();
    // Pick a day well beyond the 24-hour online-cancellation cut-off.
    await s.page
      .getByRole("group", { name: "Date" })
      .getByRole("button", { name: /times? available/ })
      .nth(3)
      .click();
    await s.page.locator("button").filter({ hasText: SLOT }).first().click();
    await s.page.getByRole("heading", { name: "Your details" }).waitFor();
    assert.equal(
      await s.page.getByLabel("Full name").inputValue(),
      "Sample Customer",
      "details are prefilled from the account",
    );
    await s.page.getByLabel(/Reason for visit/).fill("Follow-up on sleep routines");
    await s.page.getByLabel(/I agree to the clinic storing/).check();
    await s.page.getByRole("button", { name: "Review booking" }).click();
    await s.page.getByRole("button", { name: "Confirm booking" }).click();
    await s.page.getByRole("heading", { name: "Your appointment is booked" }).waitFor();
    const reference = (await s.page.getByTestId("booking-reference").textContent()).trim();

    await s.page.goto(`${BASE_URL}/account/appointments`, { waitUntil: "networkidle" });
    await s.page.getByText(reference).first().waitFor();
    await s.page
      .getByRole("link", { name: /Wellness Consultation/ })
      .first()
      .click();
    await s.page.getByRole("button", { name: "Cancel appointment" }).click();
    const dialog = s.page.getByRole("dialog", { name: "Cancel this appointment?" });
    await dialog.waitFor();
    await dialog.getByRole("button", { name: "Yes, cancel it" }).click();
    await s.page.getByText("Your appointment has been cancelled.").waitFor();
    assert.equal(await s.page.getByRole("button", { name: "Cancel appointment" }).count(), 0);
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("a paid class shows the private Meet link only after the clinic verifies the payment", async () => {
  const s = await open();
  try {
    await s.go("/");
    await signInAsSampleCustomer(s.page);
    await s.page.goto(`${BASE_URL}/classes/morning-yoga-flow`, { waitUntil: "networkidle" });
    await s.page
      .getByRole("button", { name: /Register and pay/ })
      .first()
      .click();
    await s.page.waitForURL(/\/pay\//);
    await s.page.getByLabel("UPI transaction reference (UTR)").fill("5555 6666 7777");
    await s.page.getByRole("button", { name: "Submit for verification" }).click();
    await s.page.getByRole("heading", { name: "We're checking your payment" }).waitFor();

    await s.page.goto(`${BASE_URL}/account/classes`, { waitUntil: "networkidle" });
    await s.page
      .getByRole("link", { name: /Morning Yoga Flow/ })
      .first()
      .click();
    await s.page
      .getByText("We're verifying your payment. The joining link will appear here once it's confirmed.")
      .waitFor();
    assert.equal(await s.page.getByRole("link", { name: /Join class/ }).count(), 0, "no link while verifying");
    assert.ok(!(await s.page.content()).includes("meet.example.com"), "link is not anywhere in the page");

    await staffVerifiesLatestPayment(s.page);
    await s.page.reload({ waitUntil: "networkidle" });
    const join = s.page.getByRole("link", { name: /Join class/ });
    await join.waitFor();
    assert.match(await join.getAttribute("href"), /^https:\/\//);
    assert.ok(!s.page.url().includes("meet."), "the link never goes into the address bar");
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("an order placed in the shop appears in the account with its payment status", async () => {
  const s = await open();
  try {
    await s.go("/");
    await signInAsSampleCustomer(s.page);
    await s.page.goto(`${BASE_URL}/shop/calm-evening-herbal-tea`, { waitUntil: "networkidle" });
    await s.page.getByRole("button", { name: "Add to cart" }).click();
    await s.page.goto(`${BASE_URL}/checkout`, { waitUntil: "networkidle" });
    await s.page.getByRole("button", { name: "Place order and pay" }).click();
    await s.page.waitForURL(/\/pay\//);

    await s.page.goto(`${BASE_URL}/account/orders`, { waitUntil: "networkidle" });
    const order = s.page.getByRole("link", { name: /ORD-/ }).first();
    await order.waitFor();
    await order.click();
    await s.page.getByText("Payment pending").first().waitFor();
    await s.page.getByText("Calm Evening Herbal Tea").first().waitFor();
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
