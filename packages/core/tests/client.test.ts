import { test } from "node:test";
import assert from "node:assert/strict";
import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { createApiClient, createTokenStore, endpoints, type SecureStorage } from "../src/api";
import { ApiError, errorMessage, parseAppConfig } from "../src";

type Reply = { status: number; data?: unknown } | "network";

/** A scripted adapter: replies are taken in order per "METHOD path". */
function scripted(script: Record<string, Reply[]>) {
  const calls: Array<{ key: string; headers: Record<string, string>; data: unknown }> = [];
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const key = `${config.method?.toUpperCase()} ${config.url}`;
    const headers = Object.fromEntries(
      Object.entries(AxiosHeaders.from(config.headers).toJSON()).map(([k, v]) => [k.toLowerCase(), String(v)]),
    );
    calls.push({ key, headers, data: config.data ? JSON.parse(String(config.data)) : undefined });
    const reply = script[key]?.shift();
    if (!reply) throw new Error(`No scripted reply for ${key}`);
    if (reply === "network") throw new AxiosError("Network Error", AxiosError.ERR_NETWORK, config, {});
    const response = {
      data: reply.data ?? "",
      status: reply.status,
      statusText: "",
      headers: new AxiosHeaders(),
      config,
      request: {},
    };
    if (reply.status >= 400) throw new AxiosError("fail", AxiosError.ERR_BAD_REQUEST, config, {}, response);
    return response;
  };
  return { adapter, calls };
}

const config = (platform: "web" | "ios" = "web") =>
  parseAppConfig({ API_MODE: "live", API_BASE_URL: "https://api.example.com/v1" }, platform);

function memoryStorage(): SecureStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => void data.set(k, v),
    removeItem: async (k) => void data.delete(k),
  };
}

test("every request carries language and platform headers; public endpoints get no token", async () => {
  const { adapter, calls } = scripted({ "GET /services": [{ status: 200, data: [] }] });
  const tokens = createTokenStore();
  await tokens.save({ accessToken: "secret", expiresIn: 900 });
  const api = createApiClient({ config: config(), tokenStore: tokens, getLocale: () => "ta", adapter });
  await api.request(endpoints.catalog.services);
  assert.equal(calls[0]!.headers["accept-language"], "ta");
  assert.equal(calls[0]!.headers["x-client-platform"], "web");
  assert.equal(calls[0]!.headers.authorization, undefined);
});

test("an expired session is refreshed once for parallel requests, then requests are retried", async () => {
  const { adapter, calls } = scripted({
    "POST /auth/refresh": [{ status: 200, data: { accessToken: "new", expiresIn: 900, refreshToken: "r2" } }],
    "GET /me": [
      { status: 401, data: { error: { code: "UNAUTHENTICATED", message: "expired" } } },
      { status: 200, data: { id: "u1" } },
    ],
    "GET /me/orders": [
      { status: 401, data: { error: { code: "UNAUTHENTICATED", message: "expired" } } },
      { status: 200, data: { items: [] } },
    ],
  });
  const storage = memoryStorage();
  storage.data.set("sdw.refreshToken", "r1");
  const tokens = createTokenStore({ secureStorage: storage });
  await tokens.save({ accessToken: "old", expiresIn: 900 });
  const api = createApiClient({ config: config("ios"), tokenStore: tokens, getLocale: () => "en", adapter });

  const [me, orders] = await Promise.all([api.request(endpoints.me.get), api.request(endpoints.account.orders)]);
  assert.deepEqual(me, { id: "u1" });
  assert.deepEqual(orders, { items: [] });
  assert.equal(calls.filter((c) => c.key === "POST /auth/refresh").length, 1, "single-flight refresh");
  assert.deepEqual(calls.find((c) => c.key === "POST /auth/refresh")!.data, { refreshToken: "r1" });
  assert.equal(storage.data.get("sdw.refreshToken"), "r2", "rotated refresh token is stored");
  assert.equal(calls.at(-1)!.headers.authorization, "Bearer new");
});

test("when refresh is refused the session ends and the app is told once", async () => {
  const { adapter } = scripted({
    "POST /auth/refresh": [{ status: 401, data: { error: { code: "UNAUTHENTICATED", message: "no" } } }],
  });
  const tokens = createTokenStore();
  let expired = 0;
  const api = createApiClient({
    config: config(),
    tokenStore: tokens,
    getLocale: () => "en",
    adapter,
    onSessionExpired: () => expired++,
  });
  await assert.rejects(api.request(endpoints.me.get), (e: unknown) => e instanceof ApiError && e.status === 401);
  assert.equal(expired, 1);
  assert.equal(tokens.getAccessToken(), null);
});

test("GET requests are retried on network errors and 503; POSTs are not", async () => {
  const { adapter, calls } = scripted({
    "GET /faqs": ["network", { status: 503 }, { status: 200, data: [{ id: "f1" }] }],
    "POST /contact-messages": ["network"],
  });
  const api = createApiClient({ config: config(), tokenStore: createTokenStore(), getLocale: () => "en", adapter });
  assert.deepEqual(await api.request(endpoints.content.faqs), [{ id: "f1" }]);
  assert.equal(calls.filter((c) => c.key === "GET /faqs").length, 3);
  await assert.rejects(
    api.request(endpoints.booking.contact, { body: {} }),
    (e: unknown) => e instanceof ApiError && e.isNetworkError,
  );
  assert.equal(calls.filter((c) => c.key === "POST /contact-messages").length, 1);
});

test("errors keep the server's code and field messages; unknown failures get safe messages", async () => {
  const { adapter } = scripted({
    "POST /appointments": [
      {
        status: 422,
        data: {
          error: {
            code: "VALIDATION_FAILED",
            message: "bad",
            fieldErrors: { patientEmail: "Enter a valid email address" },
          },
        },
      },
    ],
    "GET /site": [{ status: 500, data: "<html>oops</html>" }],
  });
  const api = createApiClient({ config: config(), tokenStore: createTokenStore(), getLocale: () => "en", adapter });
  const err = await api.request(endpoints.booking.create, { body: {}, idempotencyKey: "k1" }).catch((e: unknown) => e);
  assert.ok(err instanceof ApiError);
  assert.equal(err.code, "VALIDATION_FAILED");
  assert.equal(err.fieldErrors.patientEmail, "Enter a valid email address");
  const server = await api.request(endpoints.content.site).catch((e: unknown) => e);
  assert.ok(server instanceof ApiError && server.code === "SERVER_ERROR");
  assert.equal(errorMessage(server), "Something went wrong on our side. Please try again.");
});

test("path parameters are encoded and the Idempotency-Key header is sent", async () => {
  const { adapter, calls } = scripted({ "POST /class-batches/a%2Fb/registrations": [{ status: 201, data: {} }] });
  const tokens = createTokenStore();
  await tokens.save({ accessToken: "t", expiresIn: 900 });
  const api = createApiClient({ config: config(), tokenStore: tokens, getLocale: () => "en", adapter });
  await api.request(endpoints.classes.register, { params: { batchId: "a/b" }, body: {}, idempotencyKey: "idem-1" });
  assert.equal(calls[0]!.headers["idempotency-key"], "idem-1");
  assert.equal(calls[0]!.headers.authorization, "Bearer t");
});
