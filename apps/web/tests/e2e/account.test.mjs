import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE_URL, horizontalOverflow, open, registerCustomer, VIEWPORTS } from "./helpers.mjs";

async function logOut(page) {
  await page.getByRole("button", { name: "Log out" }).first().click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: "commit" });
  await page.getByRole("link", { name: "Log in" }).first().waitFor({ state: "attached" });
}

async function logIn(page, email, password) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).last().click();
}

test("register lands on the account overview with empty states", async () => {
  const s = await open();
  try {
    const user = await registerCustomer(s.page);
    await s.page.getByRole("heading", { level: 1, name: `Hello, ${user.name}` }).waitFor();
    await s.page.getByText("No upcoming appointments.").waitFor();
    await s.page.getByText("You haven't placed any orders yet.").waitFor();
    await s.page.getByRole("link", { name: "Orders", exact: true }).click();
    await s.page.getByRole("heading", { name: "No orders yet" }).waitFor();
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("registration validates fields and refuses a used email", async () => {
  const s = await open();
  try {
    const user = await registerCustomer(s.page);
    await logOut(s.page);
    await s.go("/register");
    await s.page.getByRole("button", { name: "Create account" }).click();
    await s.page.getByText("Please check the highlighted fields.").waitFor();
    await s.page.getByText("Please enter your full name").waitFor();
    await s.page.getByText("Please accept the terms to continue").waitFor();
    await s.page.getByLabel("Full name").fill("Second Person");
    await s.page.getByLabel("Email").fill(user.email);
    await s.page.getByLabel("Mobile number").fill("9876500000");
    await s.page.getByLabel("Password", { exact: true }).fill("another-pass-1");
    await s.page.getByLabel("Confirm password").fill("another-pass-1");
    await s.page.getByLabel(/I agree/).check();
    await s.page.getByRole("button", { name: "Create account" }).click();
    await s.page.getByText("An account with this email already exists").first().waitFor();
    assert.equal(
      await s.page.getByLabel("Password", { exact: true }).inputValue(),
      "",
      "password is cleared after an error",
    );
  } finally {
    await s.close();
  }
});

test("sign out, wrong password is refused, sign back in", async () => {
  const s = await open();
  try {
    const user = await registerCustomer(s.page);
    await logOut(s.page);
    await s.go("/login");
    await logIn(s.page, user.email, "not-the-password");
    await s.page.getByText("That email and password don't match. Please try again.").waitFor();
    assert.equal(await s.page.getByLabel("Password", { exact: true }).inputValue(), "");
    await logIn(s.page, user.email, user.password);
    await s.page.waitForURL(/\/account$/);
    await s.page.getByRole("heading", { level: 1, name: `Hello, ${user.name}` }).waitFor();
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("private pages send visitors to log in, then back to where they were going", async () => {
  const s = await open();
  try {
    const user = await registerCustomer(s.page);
    await logOut(s.page);
    await s.go("/account/orders");
    await s.page.waitForURL(/\/login\?next=%2Faccount%2Forders/);
    await logIn(s.page, user.email, user.password);
    await s.page.waitForURL(/\/account\/orders$/);
    await s.page.getByRole("heading", { name: "Your orders" }).waitFor();
  } finally {
    await s.close();
  }
});

test("a signed-in customer opening the login page is taken to their account", async () => {
  const s = await open();
  try {
    await registerCustomer(s.page);
    await s.go("/login");
    await s.page.waitForURL(/\/account$/);
  } finally {
    await s.close();
  }
});

test("password reset: same message for any email, token removed from the address bar, new password works", async () => {
  const s = await open();
  try {
    const user = await registerCustomer(s.page);
    await logOut(s.page);
    await s.go("/forgot-password");
    await s.page.getByLabel("Email").fill("nobody@example.com");
    await s.page.getByRole("button", { name: "Send reset link" }).click();
    const message =
      "If an account exists for that email, we've sent a link to reset your password. The link works for one hour.";
    await s.page.getByText(message).waitFor();

    await s.go("/forgot-password");
    await s.page.getByLabel("Email").fill(user.email);
    await s.page.getByRole("button", { name: "Send reset link" }).click();
    await s.page.getByText(message).waitFor();

    // The mock backend stands in for the email: the demo panel opens the latest link.
    await s.page.getByRole("button", { name: "Demo" }).click();
    await s.page.getByRole("link", { name: "Open the latest password-reset link" }).click();
    await s.page.getByRole("heading", { name: "Choose a new password" }).waitFor();
    await s.page.waitForFunction(() => !location.search.includes("token"));
    assert.ok(!s.page.url().includes("token"), `token still in URL: ${s.page.url()}`);

    await s.page.getByLabel("New password", { exact: true }).fill("fresh-start-77");
    await s.page.getByLabel("Confirm password").fill("fresh-start-77");
    await s.page.getByRole("button", { name: "Save new password" }).click();
    await s.page.getByText("You can now log in with your new password.").waitFor();
    await s.go("/login");
    await logIn(s.page, user.email, "fresh-start-77");
    await s.page.waitForURL(/\/account$/);
  } finally {
    await s.close();
  }
});

test("profile changes are saved and survive a reload", async () => {
  const s = await open();
  try {
    await registerCustomer(s.page);
    await s.go("/account/profile");
    await s.page.getByLabel("Full name").fill("Asha R. Iyer");
    await s.page.getByRole("button", { name: "Save changes" }).click();
    await s.page.getByText("Your profile has been updated.").waitFor();
    await s.page.reload({ waitUntil: "networkidle" });
    await s.page.getByRole("heading", { level: 1, name: "Hello, Asha R. Iyer" }).waitFor();
    assert.equal(await s.page.getByLabel("Email").isEditable(), false, "email is read-only");
  } finally {
    await s.close();
  }
});

test("settings: change password checks the current one; language switches to Tamil", async () => {
  const s = await open();
  try {
    const user = await registerCustomer(s.page);
    await s.go("/account/settings");
    await s.page.getByLabel("Current password").fill("wrong-current-1");
    await s.page.getByLabel("New password", { exact: true }).fill("brand-new-pass-2");
    await s.page.getByLabel("Confirm new password").fill("brand-new-pass-2");
    await s.page.getByRole("button", { name: "Change password" }).click();
    await s.page.getByText("Your current password is incorrect").waitFor();
    await s.page.getByLabel("Current password").fill(user.password);
    await s.page.getByLabel("New password", { exact: true }).fill("brand-new-pass-2");
    await s.page.getByLabel("Confirm new password").fill("brand-new-pass-2");
    await s.page.getByRole("button", { name: "Change password" }).click();
    await s.page.getByText("Your password has been changed.").waitFor();

    await s.page.getByRole("radio", { name: "தமிழ்" }).check();
    await s.page.getByRole("heading", { name: "கடவுச்சொல்லை மாற்று" }).waitFor();
    assert.equal(await s.page.evaluate(() => document.documentElement.lang), "ta-IN");
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

for (const [name, viewport] of Object.entries({ phone: VIEWPORTS.phone, small: { width: 320, height: 700 } })) {
  test(`account navigation works at ${name} width without sideways scrolling (English and Tamil)`, async () => {
    const s = await open({ viewport });
    try {
      await registerCustomer(s.page);
      for (const path of ["/account", "/account/appointments", "/account/payments", "/account/settings"]) {
        await s.go(path);
        await s.page.getByRole("navigation", { name: "My account" }).waitFor();
        assert.equal(await horizontalOverflow(s.page), 0, `overflow on ${path}`);
      }
      await s.page.getByRole("navigation", { name: "My account" }).getByRole("link", { name: "Orders" }).click();
      await s.page.waitForURL(/\/account\/orders$/);
      await s.page.evaluate(() => localStorage.setItem("sdw.locale", "ta"));
      for (const path of ["/account", "/account/settings", "/login"]) {
        await s.go(path);
        await s.page.waitForTimeout(150);
        assert.equal(await horizontalOverflow(s.page), 0, `Tamil overflow on ${path}`);
      }
      assert.deepEqual(s.errors, []);
    } finally {
      await s.close();
    }
  });
}
