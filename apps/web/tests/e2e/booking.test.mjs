import { test } from "node:test";
import assert from "node:assert/strict";
import { horizontalOverflow, open, VIEWPORTS } from "./helpers.mjs";

const SLOT = /^\s*(\d{1,2}:\d{2} (AM|PM))\s*$/;

test("a guest books an appointment end to end and gets a reference", async () => {
  const s = await open();
  try {
    await s.go("/book");
    await s.page.getByRole("heading", { name: "Choose a service" }).waitFor();
    await s.page.getByRole("button", { name: /Wellness Consultation/ }).click();

    // One practitioner offers this service, so the flow goes straight to date and time.
    await s.page.getByRole("heading", { name: "Choose a date and time" }).waitFor();
    const slot = s.page.locator("button").filter({ hasText: SLOT }).first();
    await slot.waitFor();
    const time = (await slot.textContent()).trim();
    await slot.click();

    // Validation: empty details are refused, with messages tied to their fields.
    await s.page.getByRole("heading", { name: "Your details" }).waitFor();
    await s.page.getByRole("button", { name: "Review booking" }).click();
    await s.page.getByText("Please check the highlighted fields.").waitFor();
    const name = s.page.getByLabel("Full name");
    assert.equal(await name.getAttribute("aria-invalid"), "true");
    const describedBy = await name.getAttribute("aria-describedby");
    assert.equal((await s.page.locator(`#${describedBy}`).textContent()).trim(), "Please enter your full name");

    await name.fill("Asha Rao");
    await s.page.getByLabel("Mobile number").fill("98765 43210");
    await s.page.getByLabel("Email").fill("asha@example.com");
    await s.page.getByLabel(/Reason for visit/).fill("First visit to talk about sleep and routines");
    await s.page.getByLabel(/I agree to the clinic storing/).check();
    await s.page.getByRole("button", { name: "Review booking" }).click();

    await s.page.getByRole("heading", { name: "Review and confirm" }).waitFor();
    await s.page.getByText(time).first().waitFor();
    await s.page.getByRole("button", { name: "Confirm booking" }).click();

    await s.page.getByRole("heading", { name: "Your appointment is booked" }).waitFor();
    assert.match((await s.page.getByTestId("booking-reference").textContent()).trim(), /^APT-[A-Z0-9]{6}$/);
    await s.page.getByRole("link", { name: /Add to Google Calendar/ }).waitFor();
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("the Book button on a service page preselects that service", async () => {
  const s = await open();
  try {
    await s.go("/services/follow-up-consultation");
    await s.page.getByRole("heading", { level: 1, name: "Follow-up Consultation" }).waitFor();
    await s.page.getByRole("link", { name: "Book this service" }).click();
    await s.page.waitForURL(/\/book\?service=follow-up-consultation$/);
    // Two practitioners offer it, so the customer chooses one.
    await s.page.getByRole("heading", { name: "Choose a practitioner" }).waitFor();
    await s.page.getByText("Practitioners who offer Follow-up Consultation.").waitFor();
    await s.page.getByRole("button", { name: /Nutrition Consultant/ }).click();
    await s.page.getByRole("heading", { name: "Choose a date and time" }).waitFor();
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("booking with a practitioner from the services page offers only their services", async () => {
  const s = await open();
  try {
    await s.go("/services");
    await s.page.getByRole("link", { name: "Book with Yoga Therapist" }).click();
    await s.page.waitForURL(/\/book\?doctor=yoga-therapist$/);
    await s.page.getByRole("button", { name: /Yoga Therapy Session/ }).waitFor();
    assert.equal(await s.page.getByRole("button", { name: /Wellness Consultation/ }).count(), 0);
    await s.page.getByRole("button", { name: /Yoga Therapy Session/ }).click();
    await s.page.getByRole("heading", { name: "Choose a date and time" }).waitFor();
    await s.page.getByText(/with Yoga Therapist/).waitFor();
  } finally {
    await s.close();
  }
});

test("a free consultation request is validated and submitted", async () => {
  const s = await open();
  try {
    await s.go("/free-consultation");
    await s.page.getByRole("button", { name: "Request my free consultation" }).click();
    await s.page.getByText("Please check the highlighted fields.").waitFor();
    await s.page.getByText("Please choose one of the options.").waitFor();

    await s.page.getByLabel("Full name").fill("Lakshmi Iyer");
    await s.page.getByLabel("Mobile number").fill("9876543210");
    await s.page.getByLabel("Email").fill("lakshmi@example.com");
    await s.page.getByRole("radio", { name: "Video call" }).check();
    await s.page.getByLabel(/What you'd like help with/).fill("I'd like help building a gentle daily routine.");
    await s.page.getByLabel(/I agree to the clinic contacting me/).check();
    await s.page.getByRole("button", { name: "Request my free consultation" }).click();
    await s.page.getByText("Your reference:").waitFor();
    assert.match((await s.page.getByTestId("consultation-reference").textContent()).trim(), /^FC-/);
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("services, booking and consultation fit a phone screen", async () => {
  const s = await open({ viewport: VIEWPORTS.phone });
  try {
    for (const path of ["/services", "/services/wellness-consultation", "/free-consultation"]) {
      await s.go(path);
      await s.page.getByRole("heading", { level: 1 }).waitFor();
      assert.equal(await horizontalOverflow(s.page), 0, path);
    }
    await s.go("/book?service=wellness-consultation");
    await s.page.getByRole("heading", { name: "Choose a date and time" }).waitFor();
    await s.page.locator("button").filter({ hasText: SLOT }).first().waitFor();
    assert.equal(await horizontalOverflow(s.page), 0, "booking time step");
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});

test("booking works in Tamil", async () => {
  const s = await open({ viewport: VIEWPORTS.phone, locale: "ta" });
  try {
    await s.go("/book");
    await s.page
      .getByRole("heading", { name: "சேவையைத் தேர்ந்தெடுங்கள்" })
      .or(s.page.getByRole("heading", { name: /தேர்ந்தெடுங்கள்/ }))
      .first()
      .waitFor();
    await s.page.getByRole("button", { name: /நலவாழ்வு ஆலோசனை/ }).click();
    await s.page.getByRole("heading", { name: "தேதியையும் நேரத்தையும் தேர்ந்தெடுங்கள்" }).waitFor();
    assert.equal(await horizontalOverflow(s.page), 0);
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
