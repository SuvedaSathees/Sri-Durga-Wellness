import { test } from "node:test";
import assert from "node:assert/strict";
import { horizontalOverflow, open } from "./helpers.mjs";

test("about page shows the sample practitioner profiles exactly as the API sends them", async () => {
  const s = await open();
  try {
    await s.go("/about");
    await s.page.getByRole("heading", { level: 1, name: "A calm place to begin" }).waitFor();
    await s.page.getByRole("heading", { name: "Meet the people who will care for you" }).waitFor();
    const cards = s.page.locator("article").filter({ hasText: "Sample profile" });
    assert.equal(await cards.count(), 3);
    assert.equal(await s.page.getByText("Qualifications to be added by the clinic").count(), 3);
    const text = await s.page.locator("main").innerText();
    for (const invented of ["MBBS", "Reg. No", "Registration No", "years of practice"])
      assert.ok(!text.includes(invented), `unexpected "${invented}"`);
    const book = s.page.getByRole("link", { name: "Book with Consulting Physician" });
    assert.equal(await book.getAttribute("href"), "/book?doctor=consulting-physician");
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("contact form validates, then sends and shows a reference; no invented contact details", async () => {
  const s = await open();
  try {
    await s.go("/contact");
    await s.page.locator("main").getByText("Contact details will be added soon.").waitFor();
    await s.page.getByRole("button", { name: "Send message" }).click();
    await s.page.getByRole("alert").filter({ hasText: "Please check the highlighted fields." }).waitFor();
    await s.page.getByText("Please enter your full name").waitFor();
    assert.equal(await s.page.getByLabel("Your name").getAttribute("aria-invalid"), "true");

    await s.page.getByLabel("Your name").fill("Asha Rao");
    await s.page.getByLabel("Email", { exact: true }).fill("asha@example.com");
    await s.page.getByLabel("Subject").fill("Parking");
    await s.page.getByLabel("Message", { exact: true }).fill("Is there parking near the clinic?");
    await s.page.getByRole("button", { name: "Send message" }).click();
    await s.page.getByText("Thank you — your message has been sent.").waitFor();
    assert.match(await s.page.locator("main").innerText(), /MSG-[A-Z0-9]{6}/);
    assert.equal(await s.page.locator('a[href^="tel:"], a[href^="mailto:"]').count(), 0);
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("journal list opens an article and filters by topic", async () => {
  const s = await open();
  try {
    await s.go("/blog");
    await s.page.getByRole("link", { name: "Building a Gentle Morning Routine" }).click();
    await s.page.getByRole("heading", { level: 1, name: "Building a Gentle Morning Routine" }).waitFor();
    await s.page.getByRole("heading", { name: "Start smaller than you think" }).waitFor();
    await s.page.getByRole("link", { name: "Back to the journal" }).click();
    await s.page.getByRole("link", { name: "Visiting us" }).click();
    await s.page.waitForURL(/tag=Visiting/);
    await s.page.getByRole("link", { name: "Building a Gentle Morning Routine" }).waitFor({ state: "detached" });
    await s.page.getByRole("link", { name: "What to Expect at Your First Consultation" }).waitFor();
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("policy pages load; in Tamil they say the text is English-only for now", async () => {
  const en = await open();
  try {
    await en.go("/policies/privacy-policy");
    await en.page.getByRole("heading", { level: 1, name: "Privacy Policy" }).waitFor();
    await en.page
      .getByText(/Last updated/)
      .first()
      .waitFor();
    await en.page.getByRole("link", { name: "Terms of Use" }).first().click();
    await en.page.getByRole("heading", { level: 1, name: "Terms of Use" }).waitFor();
    assert.deepEqual(en.errors, []);
  } finally {
    await en.close();
  }
  const ta = await open({ locale: "ta" });
  try {
    await ta.go("/policies/medical-disclaimer");
    await ta.page.getByRole("heading", { level: 1, name: "மருத்துவப் பொறுப்புத் துறப்பு" }).waitFor();
    await ta.page.getByText("இந்தப் பக்கம் தற்போது ஆங்கிலத்தில் மட்டுமே உள்ளது.", { exact: false }).waitFor();
    assert.deepEqual(ta.errors, []);
  } finally {
    await ta.close();
  }
});

test("unknown pages and unknown policies show the not-found page", async () => {
  const s = await open();
  try {
    for (const path of ["/no-such-page", "/policies/not-a-policy"]) {
      await s.go(path);
      await s.page.getByRole("heading", { level: 1, name: "We couldn't find that page" }).waitFor();
      await s.page.getByRole("link", { name: "Go to the homepage" }).waitFor();
    }
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

for (const width of [320, 390]) {
  test(`content pages fit a ${width}px screen in English and Tamil`, async () => {
    for (const locale of ["en", "ta"]) {
      const s = await open({ viewport: { width, height: 800 }, locale });
      try {
        for (const path of [
          "/about",
          "/contact",
          "/blog",
          "/blog/how-our-live-online-classes-work",
          "/policies/refund-and-cancellation-policy",
          "/nope",
        ]) {
          await s.go(path);
          await s.page.getByRole("heading", { level: 1 }).first().waitFor();
          assert.equal(await horizontalOverflow(s.page), 0, `${path} (${locale}) scrolls sideways`);
        }
        assert.deepEqual(s.errors, []);
      } finally {
        await s.close();
      }
    }
  });
}
