import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { color, contrastPairs, contrastRatio, toCssVariables } from "../src/index";

test("text colours meet WCAG AA contrast on the backgrounds they are used on", () => {
  for (const [fg, bg] of contrastPairs) {
    const ratio = contrastRatio(color[fg], color[bg]);
    assert.ok(ratio >= 4.5, `${fg} on ${bg} is ${ratio.toFixed(2)}:1 (needs 4.5:1)`);
  }
});

test("form-control borders reach 3:1 against page and card backgrounds", () => {
  for (const bg of ["bg", "surface"] as const) {
    assert.ok(contrastRatio(color.inputBorder, color[bg]) >= 3, `inputBorder on ${bg}`);
  }
});

test("the web app's tokens.css is up to date (run `npm run tokens:css`)", () => {
  const css = readFileSync(new URL("../../../apps/web/src/styles/tokens.css", import.meta.url), "utf8");
  assert.equal(css, toCssVariables());
});
