/**
 * Layer rules (docs/ARCHITECTURE.md). UI code — screens and components in both apps — talks to the
 * backend only through @sdw/controllers hooks. These checks keep it that way.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { read, rel, sourceFiles } from "./helpers";

const UI_DIRS = [
  "apps/web/src/features",
  "apps/web/src/components",
  "apps/mobile/src/features",
  "apps/mobile/src/components",
];
const uiFiles = UI_DIRS.flatMap((d) => sourceFiles(d));

const offending = (pattern: RegExp, files = uiFiles) =>
  files.flatMap((f) =>
    read(f)
      .split("\n")
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => pattern.test(line) && !line.includes("architecture-allow"))
      .map(({ i, line }) => `${rel(f)}:${i + 1}: ${line.trim()}`),
  );

test("there is UI code to check", () => {
  assert.ok(uiFiles.length > 20, `found ${uiFiles.length} files`);
});

test("screens and components never import the HTTP client, the API layer or the mocks", () => {
  assert.deepEqual(offending(/from\s+["'](axios|@sdw\/core\/api|@sdw\/core\/mocks)["']/), []);
});

test("screens and components never call fetch/XMLHttpRequest directly", () => {
  assert.deepEqual(offending(/\bfetch\s*\(|XMLHttpRequest/), []);
});

test("no hard-coded http(s) URLs in screens and components", () => {
  assert.deepEqual(offending(/["'`]https?:\/\//), []);
});

test("device storage is only touched in the platform layer", () => {
  assert.deepEqual(offending(/\b(localStorage|sessionStorage|AsyncStorage|SecureStore)\b/), []);
});

test("query functions live in @sdw/controllers, not in screens", () => {
  assert.deepEqual(offending(/\buseQuery\s*\(|\buseMutation\s*\(/), []);
});

test("no console.log in app or package source (avoids leaking personal data or tokens)", () => {
  const all = ["apps/web/src", "apps/mobile/src", "packages/core/src", "packages/controllers/src"].flatMap((d) =>
    sourceFiles(d),
  );
  assert.deepEqual(offending(/console\.log\(/, all), []);
});

test("the API base URL is read only in each app's config module", () => {
  const all = ["apps/web/src", "apps/mobile/src"].flatMap((d) => sourceFiles(d));
  const readers = all.filter((f) => !f.endsWith(".d.ts") && /API_BASE_URL/.test(read(f))).map(rel);
  assert.deepEqual(readers.sort(), ["apps/mobile/src/config/env.ts", "apps/web/src/config/env.ts"]);
});
