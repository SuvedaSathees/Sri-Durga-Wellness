/**
 * The endpoint list in code, the documented contract and the mock backend must agree.
 * (All endpoints are PROPOSED until the backend team confirms them — see docs/API_CONTRACT.md.)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { allEndpoints } from "@sdw/core/api";
import { mockHandlerIds } from "@sdw/core/mocks";
import { read } from "./helpers";

const doc = read(`${process.cwd()}/docs/API_CONTRACT.md`);

test("every endpoint the apps call is documented in docs/API_CONTRACT.md", () => {
  const missing = allEndpoints
    .filter((e) => !doc.includes(`${e.method} ${e.path}`))
    .map((e) => `${e.method} ${e.path}`);
  assert.deepEqual(missing, []);
});

test("the contract documents no endpoint the apps don't know about", () => {
  const documented = [...doc.matchAll(/^###\s+`(GET|POST|PUT|PATCH|DELETE) ([^`]+)`/gm)].map((m) => `${m[1]} ${m[2]}`);
  const known = new Set(allEndpoints.map((e) => `${e.method} ${e.path}`));
  assert.deepEqual(
    documented.filter((d) => !known.has(d)),
    [],
  );
  assert.equal(documented.length, allEndpoints.length);
});

test("the mock backend implements every endpoint", () => {
  const implemented = new Set(mockHandlerIds());
  assert.deepEqual(
    allEndpoints.filter((e) => !implemented.has(e.id)).map((e) => e.id),
    [],
  );
});

test("endpoint ids and method+path pairs are unique", () => {
  assert.equal(new Set(allEndpoints.map((e) => e.id)).size, allEndpoints.length);
  assert.equal(new Set(allEndpoints.map((e) => `${e.method} ${e.path}`)).size, allEndpoints.length);
});
