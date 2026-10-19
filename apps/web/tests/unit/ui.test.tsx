/**
 * Accessibility contracts of the web UI kit, rendered to HTML in Node (no browser needed).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { AppProvider, createMemoryStorage, createRuntime } from "@sdw/controllers";
import { createTokenStore } from "@sdw/core/api";
import { parseAppConfig, type Locale } from "@sdw/core";
import { Button, CheckboxField, FormError, Markdown, Notice, RadioGroup, TextField } from "../../src/components/ui";

function render(node: ReactNode, locale: Locale = "en") {
  const runtime = createRuntime({
    config: parseAppConfig({}, "web"),
    tokenStore: createTokenStore(),
    preferences: createMemoryStorage(),
    initialLocale: locale,
  });
  return renderToStaticMarkup(
    <AppProvider runtime={runtime}>
      <MemoryRouter>{node}</MemoryRouter>
    </AppProvider>,
  );
}

const noop = () => undefined;

test("text fields link label, hint and error to the input", () => {
  const html = render(
    <TextField
      id="email"
      label="Email"
      hint="We'll send your confirmation here."
      error="Enter a valid email address"
      required
      value="x"
      onChange={noop}
    />,
  );
  assert.match(html, /<label for="email"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="email-hint email-error"/);
  assert.match(html, /id="email-error"[^>]*>Enter a valid email address</);
});

test("optional fields say so, and errors are translated in Tamil", () => {
  const html = render(
    <TextField id="n" label="Notes" error="Enter a valid email address" value="" onChange={noop} />,
    "ta",
  );
  assert.match(html, /விருப்பத்தேர்வு/);
  assert.match(html, /சரியான மின்னஞ்சல் முகவரியை உள்ளிடுங்கள்/);
});

test("radio groups use a fieldset with a legend", () => {
  const html = render(
    <RadioGroup
      legend="How should we contact you?"
      name="m"
      value="PHONE"
      onChange={noop}
      options={[
        { value: "PHONE", label: "Phone call" },
        { value: "VIDEO", label: "Video call" },
      ]}
    />,
  );
  assert.match(html, /<fieldset[^>]*><legend[^>]*>How should we contact you\?<\/legend>/);
  assert.equal((html.match(/type="radio"/g) ?? []).length, 2);
  assert.match(html, /checked="" value="PHONE"/);
});

test("checkbox errors are tied to the checkbox", () => {
  const html = render(
    <CheckboxField
      id="c"
      label="I agree"
      checked={false}
      onChange={noop}
      error="Please accept the terms to continue"
    />,
  );
  assert.match(html, /type="checkbox"[^>]*aria-invalid="true"[^>]*aria-describedby="c-error"/);
});

test("loading buttons are disabled, busy and announce it", () => {
  const html = render(<Button loading>Place order</Button>);
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /Please wait…/);
});

test("errors are announced; form-level messages are translated", () => {
  assert.match(render(<Notice tone="danger">Oops</Notice>), /role="alert"/);
  assert.match(render(<Notice tone="info">FYI</Notice>), /role="status"/);
  assert.match(
    render(<FormError message="Please check the highlighted fields." />, "ta"),
    /குறிக்கப்பட்ட புலங்களைச் சரிபாருங்கள்/,
  );
  assert.equal(render(<FormError message={null} />), "");
});

test("markdown renders safe elements only and opens external links in a new tab", () => {
  const html = render(
    <Markdown
      text={
        "## Hi\n\nSee [our site](https://example.com) and [home](/about). <script>alert(1)</script>\n\n[x](javascript:alert(1))"
      }
    />,
  );
  assert.match(html, /<h2>Hi<\/h2>/);
  assert.match(html, /href="https:\/\/example.com" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /href="\/about"/);
  assert.ok(!html.includes("<script>"), "raw HTML is escaped");
  assert.ok(!html.includes("javascript:"), "unsafe links are dropped");
});
