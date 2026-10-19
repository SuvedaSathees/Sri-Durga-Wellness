/**
 * Shop journeys in mock mode: browse, cart, checkout, UPI payment and clinic verification.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { horizontalOverflow, open, signInAsSampleCustomer, staffVerifiesLatestPayment, VIEWPORTS } from "./helpers.mjs";

test("categories filter the shop and the choice lives in the URL", async () => {
  const s = await open();
  try {
    await s.go("/shop");
    await s.page.getByRole("heading", { name: "Calm Evening Herbal Tea" }).waitFor();
    await s.page
      .getByRole("navigation", { name: "Product categories" })
      .getByRole("link", { name: "Practice Essentials" })
      .click();
    await s.page.waitForURL(/category=practice-essentials/);
    await s.page.getByRole("heading", { name: "Calm Evening Herbal Tea" }).waitFor({ state: "detached" });
    await s.page.getByRole("heading", { name: "Meditation Cushion" }).waitFor();
    await s.page.getByLabel("Sort by").selectOption("price-desc");
    await s.page.waitForURL(/sort=price-desc/);
    await s.page.locator("article h3").first().filter({ hasText: "Natural Rubber Yoga Mat" }).waitFor();
    const names = await s.page.locator("article h3").allTextContents();
    assert.equal(names[0], "Natural Rubber Yoga Mat");
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("an out-of-stock product can't be added to the cart", async () => {
  const s = await open();
  try {
    await s.go("/shop/natural-rubber-yoga-mat");
    await s.page.getByRole("heading", { level: 1, name: "Natural Rubber Yoga Mat" }).waitFor();
    await s.page.getByText("This product is out of stock at the moment.").waitFor();
    assert.equal(await s.page.getByRole("button", { name: "Add to cart" }).count(), 0);
  } finally {
    await s.close();
  }
});

test("adding to the cart uses server prices and checkout needs sign-in", async () => {
  const s = await open();
  try {
    await s.go("/shop/calm-evening-herbal-tea");
    await s.page.getByRole("button", { name: "Increase quantity" }).click();
    await s.page.getByRole("button", { name: "Add to cart" }).click();
    await s.page.getByRole("status").getByText("Added to cart: Calm Evening Herbal Tea").waitFor();
    await s.page.getByRole("link", { name: "Cart, 2 items" }).click();
    await s.page.waitForURL(/\/cart$/);
    const summary = s.page.locator("dl");
    await summary.getByText("₹700").waitFor();
    await s.page.getByRole("link", { name: "Checkout" }).click();
    await s.page.waitForURL(/\/login\?next=%2Fcheckout/);
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("delivery needs an address; errors are shown next to the fields", async () => {
  const s = await open();
  try {
    await s.go("/shop/meditation-cushion");
    await s.page.getByRole("button", { name: "Add to cart" }).click();
    await signInAsSampleCustomer(s.page);
    await s.go("/checkout");
    await s.page.getByRole("radio", { name: /Home delivery/ }).check();
    await s.page.getByRole("button", { name: "Place order and pay" }).click();
    await s.page.getByRole("alert").getByText("Please check the highlighted fields.").waitFor();
    await s.page.getByText("Enter a valid 6-digit PIN code").waitFor();
    assert.equal(await s.page.getByLabel("PIN code").getAttribute("aria-invalid"), "true");
    // Delivery is free above ₹2,000; the cushion is ₹1,650, so the fee shows.
    await s.page.locator("dl").getByText("₹60").waitFor();
  } finally {
    await s.close();
  }
});

test("order → UPI payment → UTR → waiting for the clinic → verified", async () => {
  const s = await open();
  try {
    await s.go("/shop/calm-evening-herbal-tea");
    await s.page.getByRole("button", { name: "Add to cart" }).click();
    await signInAsSampleCustomer(s.page);
    await s.go("/checkout");
    assert.equal(await s.page.getByLabel("Full name").inputValue(), "Sample Customer");
    await s.page.getByText(/Pickup from/).waitFor();
    await s.page.getByRole("button", { name: "Place order and pay" }).click();
    await s.page.waitForURL(/\/pay\//);

    await s.page.getByText("sample.clinic@invalid").waitFor();
    await s.page.getByRole("img", { name: /UPI QR code for ₹350/ }).waitFor();
    const qr = await s.page.getByRole("img", { name: /UPI QR code/ }).getAttribute("src");
    assert.match(qr ?? "", /^data:image\/svg\+xml/);
    assert.match(
      await s.page.getByRole("link", { name: "Pay with a UPI app" }).getAttribute("href"),
      /^upi:\/\/pay\?pa=sample\.clinic%40invalid&.*am=350\.00/,
    );
    await s.page.getByText("Demo payment").waitFor();
    assert.equal(await s.page.getByRole("link", { name: "Cart, empty" }).count(), 1, "cart is emptied after ordering");

    await s.page.getByLabel("UPI transaction reference (UTR)").fill("12");
    await s.page.getByRole("button", { name: "Submit for verification" }).click();
    await s.page.getByText("Enter the UPI transaction reference (usually 12 digits)").waitFor();

    await s.page.getByLabel("UPI transaction reference (UTR)").fill("4123 4567 8901");
    await s.page.getByRole("button", { name: "Submit for verification" }).click();
    await s.page.getByRole("heading", { name: "We're checking your payment" }).waitFor();
    await s.page.getByText(/ending 8901/).waitFor();
    assert.equal(
      await s.page.getByText("Payment verified").count(),
      0,
      "never shown as paid before the clinic verifies",
    );
    assert.equal(await s.page.getByText("Under verification").count(), 1);

    await staffVerifiesLatestPayment(s.page);
    await s.page.getByRole("heading", { name: "Payment verified" }).waitFor();
    await s.page.getByRole("link", { name: "View my order" }).waitFor();
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("shop, cart and payment pages fit a phone screen", async () => {
  const s = await open({ viewport: VIEWPORTS.phone });
  try {
    await s.go("/shop");
    await s.page.getByRole("heading", { name: "Calm Evening Herbal Tea" }).waitFor();
    assert.equal(await horizontalOverflow(s.page), 0, "shop");
    await s.go("/shop/copper-water-bottle");
    await s.page.getByRole("button", { name: "Add to cart" }).click();
    await s.go("/cart");
    await s.page.getByRole("heading", { name: "Order summary" }).waitFor();
    assert.equal(await horizontalOverflow(s.page), 0, "cart");
    await signInAsSampleCustomer(s.page);
    await s.go("/checkout");
    await s.page.getByRole("button", { name: "Place order and pay" }).click();
    await s.page.waitForURL(/\/pay\//);
    await s.page.getByText("sample.clinic@invalid").waitFor();
    assert.equal(await horizontalOverflow(s.page), 0, "payment");
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("shop pages in Tamil", async () => {
  const s = await open({ locale: "ta" });
  try {
    await s.go("/shop");
    await s.page.getByRole("heading", { name: "அமைதியான மாலை மூலிகைத் தேநீர்" }).waitFor();
    await s.page.getByText("அனைத்துப் பொருட்களும்").waitFor();
    await s.go("/cart");
    await s.page.getByText("உங்கள் கூடை காலியாக உள்ளது").first().waitFor();
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
