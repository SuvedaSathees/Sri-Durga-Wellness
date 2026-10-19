/** Live classes, recorded courses and the lesson player (mock backend). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { horizontalOverflow, open, signInAsSampleCustomer, VIEWPORTS } from "./helpers.mjs";

const COURSE = "foundations-of-mindful-breathing";
const LOCKED_LESSON = `les_${COURSE}_2`;
const PREVIEW_LESSON = `les_${COURSE}_1`;

async function session(fn, opts) {
  const s = await open(opts);
  try {
    await fn(s);
    assert.deepEqual(s.errors, [], "no browser errors");
  } finally {
    await s.close();
  }
}

test("classes list and class detail show batches but never a meeting link", () =>
  session(async ({ page, go }) => {
    await go("/classes");
    await page.getByRole("heading", { name: "Practise together, from wherever you are", level: 1 }).waitFor();
    for (const name of ["Morning Yoga Flow", "Guided Meditation Circle", "Breathwork Basics"])
      await page.getByRole("link", { name }).waitFor();
    await page.getByRole("link", { name: "Morning Yoga Flow" }).click();
    await page.getByRole("heading", { name: "Morning Yoga Flow", level: 1 }).waitFor();
    await page.getByRole("heading", { name: "Upcoming batches" }).waitFor();
    assert.equal(await page.getByRole("heading", { name: "Morning batch" }).count(), 1);
    assert.ok(!(await page.content()).includes("meet."), "no meeting link in public class data");
  }));

test("a guest who wants to register is sent to sign in and brought back", () =>
  session(async ({ page, go }) => {
    await go("/classes/guided-meditation-circle");
    const link = page.getByRole("link", { name: "Sign in to register" }).first();
    await link.waitFor();
    assert.match(await link.getAttribute("href"), /^\/login\?next=%2Fclasses%2Fguided-meditation-circle$/);
    await link.click();
    await page.waitForURL(/\/login/);
  }));

test("a signed-in customer registers for a free class and is confirmed straight away", () =>
  session(async ({ page, go }) => {
    await go("/classes/guided-meditation-circle");
    await signInAsSampleCustomer(page);
    await page.getByRole("button", { name: "Register for free" }).click();
    await page.getByText("You're registered").waitFor();
    await page.getByText("Confirmed", { exact: true }).waitFor();
    const link = page.getByRole("link", { name: "View your registration" }).first();
    assert.match(await link.getAttribute("href"), /^\/account\/classes\/reg_/);
    assert.ok(!(await page.content()).includes("meet."), "the class page still has no meeting link");
  }));

test("registering for a paid class goes to the payment page", () =>
  session(async ({ page, go }) => {
    await go("/classes/morning-yoga-flow");
    await signInAsSampleCustomer(page);
    await page.getByRole("button", { name: "Register and pay ₹1,200 for the first month" }).first().click();
    await page.waitForURL(/\/pay\/pay_/);
  }));

test("course outline shows locked lessons; a locked lesson shows no content; the free preview opens", () =>
  session(async ({ page, go }) => {
    await go(`/courses/${COURSE}`);
    await page.getByRole("heading", { name: "Foundations of Mindful Breathing", level: 1 }).waitFor();
    assert.ok((await page.getByText("Locked", { exact: true }).count()) >= 4);
    assert.equal(
      await page.getByRole("link", { name: /Finding a comfortable posture/ }).count(),
      0,
      "locked lessons are not links",
    );
    await page.getByRole("link", { name: "Sign in to enrol" }).waitFor();

    await go(`/learn/${COURSE}/${LOCKED_LESSON}`);
    await page.getByRole("heading", { name: "This lesson is locked" }).waitFor();
    assert.equal(await page.getByText("Sample lesson").count(), 0, "no lesson notes leak into a locked lesson");

    await go(`/learn/${COURSE}/${PREVIEW_LESSON}`);
    await page.getByText("Sample lesson.", { exact: false }).first().waitFor();
    await page.getByText("The video for this lesson will be added soon.").waitFor();
    await page.getByRole("link", { name: "Next lesson" }).waitFor();
  }));

test("enrolling in the free course unlocks its lessons and progress can be marked", () =>
  session(async ({ page, go }) => {
    await go("/courses/mindful-eating-basics");
    await signInAsSampleCustomer(page);
    await page.getByRole("button", { name: "Enrol for free" }).click();
    await page.getByRole("link", { name: "Start the course" }).click();
    await page.waitForURL(/\/learn\/mindful-eating-basics\//);
    await page.getByRole("button", { name: "Mark as complete" }).click();
    await page.getByRole("button", { name: "Completed — mark as not done" }).waitFor();
    await page.getByRole("link", { name: "Next lesson" }).click();
    await page.getByRole("button", { name: "Mark as complete" }).waitFor();
    await go("/courses/mindful-eating-basics");
    await page.getByText("Completed", { exact: true }).first().waitFor();
    await page.getByRole("link", { name: "Continue learning" }).waitFor();
    assert.equal(await page.getByText("Locked", { exact: true }).count(), 0);
  }));

test("a paid course enrolment goes to the payment page", () =>
  session(async ({ page, go }) => {
    await go(`/courses/${COURSE}`);
    await signInAsSampleCustomer(page);
    await page.getByRole("button", { name: "Enrol for ₹1,499" }).click();
    await page.waitForURL(/\/pay\/pay_/);
  }));

for (const path of [
  "/classes",
  "/classes/morning-yoga-flow",
  "/courses",
  `/courses/${COURSE}`,
  `/learn/${COURSE}/${PREVIEW_LESSON}`,
]) {
  test(`${path} fits a phone screen in English and Tamil`, async () => {
    for (const locale of ["en", "ta"]) {
      await session(
        async ({ page, go }) => {
          await go(path);
          await page.getByRole("heading", { level: 1 }).waitFor();
          assert.equal(await horizontalOverflow(page), 0, `${locale} overflow`);
        },
        { viewport: { width: 320, height: 720 }, locale },
      );
    }
  });
}

test("course categories filter the list", () =>
  session(
    async ({ page, go }) => {
      await go("/courses");
      await page.getByRole("navigation", { name: "Course categories" }).getByRole("link", { name: "Yoga" }).click();
      await page.waitForURL(/category=Yoga/);
      await page.getByRole("link", { name: "Gentle Yoga for Everyday Movement" }).waitFor();
      await page.getByRole("link", { name: "Mindful Eating Basics" }).waitFor({ state: "detached" });
    },
    { viewport: VIEWPORTS.tablet },
  ));
