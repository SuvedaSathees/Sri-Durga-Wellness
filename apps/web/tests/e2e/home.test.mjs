import { test } from "node:test";
import assert from "node:assert/strict";
import { horizontalOverflow, open, VIEWPORTS } from "./helpers.mjs";

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test(`home page loads every section at ${name} width without sideways scrolling`, async () => {
    const s = await open({ viewport });
    try {
      await s.go("/");
      await s.page.getByRole("heading", { level: 1 }).waitFor();
      for (const heading of [
        "Care shaped around you",
        "Practise together, from wherever you are",
        "Thoughtfully chosen essentials",
        "Questions, answered",
      ]) {
        await s.page.getByRole("heading", { name: heading }).waitFor();
      }
      assert.equal(await horizontalOverflow(s.page), 0);
      assert.deepEqual(s.errors, []);
    } finally {
      await s.close();
    }
  });
}

test("the language toggle switches the interface and content to Tamil and remembers it", async () => {
  const s = await open();
  try {
    await s.go("/");
    await s.page.getByRole("button", { name: "தமிழ் (Tamil)" }).first().click();
    await s.page.getByRole("heading", { name: "உங்களுக்கேற்ற பராமரிப்பு" }).waitFor();
    assert.equal(await s.page.evaluate(() => document.documentElement.lang), "ta-IN");
    await s.page.reload({ waitUntil: "networkidle" });
    await s.page.getByRole("heading", { name: "உங்களுக்கேற்ற பராமரிப்பு" }).waitFor();
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test(`the EN | தமிழ் switch is in the top bar at ${name} width, without opening the menu`, async () => {
    const s = await open({ viewport });
    try {
      await s.go("/");
      const bar = s.page.locator("header > div").first();
      const tamil = bar.getByRole("button", { name: "தமிழ் (Tamil)" });
      assert.equal(await tamil.isVisible(), true);
      await tamil.click();
      await s.page.getByRole("heading", { name: "உங்களுக்கேற்ற பராமரிப்பு" }).waitFor();
      await bar.getByRole("button", { name: "English" }).click();
      await s.page.getByRole("heading", { name: "Care shaped around you" }).waitFor();
      assert.deepEqual(s.errors, []);
    } finally {
      await s.close();
    }
  });
}

test("the mobile menu opens as a dialog and closes after choosing a page", async () => {
  const s = await open({ viewport: VIEWPORTS.phone });
  try {
    await s.go("/");
    await s.page.getByRole("button", { name: "Open menu" }).click();
    const menu = s.page.getByRole("dialog", { name: "Menu" });
    await menu.waitFor();
    await menu.getByRole("link", { name: "Shop" }).click();
    await s.page.waitForURL(/\/shop$/);
    await menu.waitFor({ state: "hidden", timeout: 5000 });
  } finally {
    await s.close();
  }
});

test("the loading screen shows on every page load and refresh, but not when moving between pages", async () => {
  const s = await open();
  const visible = () => s.page.locator("#sdw-splash:not(.sdw-leaving)").count();
  try {
    await s.page.goto(`${process.env.BASE_URL ?? "http://localhost:4173"}/`, { waitUntil: "domcontentloaded" });
    assert.equal(await visible(), 1, "shown while the site loads");
    await s.page.locator("#sdw-splash").waitFor({ state: "detached", timeout: 10000 });
    await s.page.getByRole("link", { name: "Shop", exact: true }).first().click();
    await s.page.waitForURL(/\/shop$/);
    assert.equal(await visible(), 0, "not shown for in-site navigation");
    await s.page.reload({ waitUntil: "domcontentloaded" });
    assert.equal(await visible(), 1, "shown again after a refresh");
    await s.page.locator("#sdw-splash").waitFor({ state: "detached", timeout: 10000 });
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("the banner video has no visible label or button; keyboard users can still pause it", async () => {
  const s = await open();
  try {
    await s.go("/");
    await s.page.locator("#sdw-splash").waitFor({ state: "detached", timeout: 10000 });
    assert.equal(await s.page.getByText("AI-generated video").count(), 0);
    const toggle = s.page.getByRole("button", { name: /background video/ });
    if ((await toggle.count()) > 0) {
      assert.equal(await toggle.evaluate((el) => getComputedStyle(el).opacity), "0");
      await toggle.focus();
      await s.page.keyboard.press("Shift+Tab");
      await s.page.keyboard.press("Tab");
      assert.equal(await toggle.evaluate((el) => getComputedStyle(el).opacity), "1");
    }
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
