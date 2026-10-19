/**
 * Browser tests use Playwright's library with Node's built-in test runner.
 * Run against a preview build in mock mode:  npm run build && npm run preview  (then)  npm run test:e2e
 * BASE_URL defaults to the Vite preview server.
 */
import { chromium } from "playwright";

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:4173";

export const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1366, height: 900 },
};

/** Opens a fresh browser context (fresh storage = fresh mock backend). Collects page errors. */
export async function open({ viewport = VIEWPORTS.desktop, locale = "en" } = {}) {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const context = await browser.newContext({
    viewport,
    locale: locale === "ta" ? "ta-IN" : "en-IN",
    reducedMotion: "reduce",
  });
  if (locale === "ta") await context.addInitScript(() => localStorage.setItem("sdw.locale", "ta"));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon/.test(m.text())) errors.push(m.text());
  });
  return {
    page,
    errors,
    go: (path) => page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" }),
    close: () => browser.close(),
  };
}

/** Fails when the page scrolls sideways (layout wider than the viewport). */
export async function horizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

/** Registers a new customer through the UI and leaves them signed in. */
export async function registerCustomer(
  page,
  {
    name = "Asha Rao",
    email = `asha.${Date.now()}@example.com`,
    phone = "9876543210",
    password = "calm-waters-42",
  } = {},
) {
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByLabel(/I agree/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account/);
  return { name, email, phone, password };
}

/** Uses the demo tools panel (mock mode only) to act as clinic staff verifying a payment. */
export async function staffVerifiesLatestPayment(page) {
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await page.getByRole("region", { name: "Demo tools" }).getByRole("button", { name: "Verify" }).first().click();
  await page.getByRole("button", { name: "Demo", exact: true }).click();
}

/** Mock mode only: signs in as a brand-new sample customer through the demo tools panel. */
export async function signInAsSampleCustomer(page) {
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  const panel = page.getByRole("region", { name: "Demo tools" });
  await panel.getByRole("button", { name: "Sign in as a new sample customer" }).click();
  await panel.getByRole("button", { name: "Sign in as a new sample customer" }).waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Demo", exact: true }).click();
}
