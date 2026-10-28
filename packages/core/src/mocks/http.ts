/** Request/response plumbing for the mock backend. */
import type { ClientPlatform } from "../config";
import type { Locale } from "../models/common";
import type { Endpoint } from "../api/endpoints";

export type MockRequest = {
  endpoint: Endpoint;
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, unknown>;
  headers: Record<string, string>;
  locale: Locale;
  platform: ClientPlatform;
  /** Signed-in user id from a valid Bearer token, else null. */
  userId: string | null;
  now: Date;
};

export type MockResponse = { status: number; data?: unknown; headers?: Record<string, string> };

/** Thrown by handlers; becomes an error response with the contract's error body. */
export class MockHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export const ok = (data: unknown): MockResponse => ({ status: 200, data });
export const created = (data: unknown): MockResponse => ({ status: 201, data });
export const accepted = (): MockResponse => ({ status: 202, data: { accepted: true } });
export const noContent = (): MockResponse => ({ status: 204 });

export const notFound = (what = "Resource") => new MockHttpError(404, "NOT_FOUND", `${what} not found`);
export const unauthenticated = () => new MockHttpError(401, "UNAUTHENTICATED", "Sign in to continue");
export const forbidden = () => new MockHttpError(403, "FORBIDDEN", "Only the clinic owner can do this");
export const invalid = (fieldErrors: Record<string, string>) =>
  new MockHttpError(422, "VALIDATION_FAILED", "Some fields need attention", fieldErrors);

/** Compile "/services/:slug" into a matcher. */
export function compilePath(path: string): (url: string) => Record<string, string> | null {
  const names: string[] = [];
  const pattern = path.replace(/:([A-Za-z]+)/g, (_, name: string) => {
    names.push(name);
    return "([^/]+)";
  });
  const regex = new RegExp(`^${pattern}$`);
  return (url) => {
    const m = regex.exec(url);
    if (!m) return null;
    const params: Record<string, string> = {};
    names.forEach((n, i) => (params[n] = decodeURIComponent(m[i + 1] ?? "")));
    return params;
  };
}
