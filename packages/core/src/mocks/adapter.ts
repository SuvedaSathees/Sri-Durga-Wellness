/**
 * Axios adapter that answers requests from the mock backend instead of the network.
 * Requests still pass through the real ApiClient (headers, auth, refresh, retries, error
 * normalisation), so switching to the live backend changes nothing else.
 */
import {
  AxiosError,
  AxiosHeaders,
  CanceledError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ClientPlatform } from "../config";
import { allEndpoints } from "../api/endpoints";
import { isLocale } from "../i18n/config";
import { createMockBackend, type MockBackend, type MockControls, type MockStaffLogin, type MockState } from "./backend";
import { compilePath, MockHttpError, type MockResponse } from "./http";

const routes = allEndpoints.map((endpoint) => ({ endpoint, match: compilePath(endpoint.path) }));

/**
 * Optional place to keep mock data between page loads.
 * - `persistence`: the sample data (web: localStorage, shared by every tab of the browser, so a
 *   customer's order placed in one tab shows up in the Admin area open in another).
 * - `tabPersistence`: who is signed in (web: sessionStorage), so each tab can be signed in as a
 *   different person — handy for testing as a customer and as the clinic owner side by side.
 */
export type MockPersistence = { load(): string | null; save(value: string): void };

export type MockApi = { adapter: AxiosAdapter; controls: MockControls; backend: MockBackend };

function headersObject(config: InternalAxiosRequestConfig): Record<string, string> {
  const raw = AxiosHeaders.from(config.headers).toJSON() as Record<string, unknown>;
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), String(v)]));
}

function parseBody(data: unknown): Record<string, unknown> {
  if (data === undefined || data === null || data === "") return {};
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof data === "object" ? (data as Record<string, unknown>) : {};
}

function wait(ms: number, signal: InternalAxiosRequestConfig["signal"]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new CanceledError());
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener?.("abort", () => {
      clearTimeout(timer);
      reject(new CanceledError());
    });
  });
}

function parseState(raw: string | null | undefined): MockState | undefined {
  try {
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as MockState;
    return parsed && parsed.version === 3 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function createMockApi(
  options: {
    latencyMs?: number;
    persistence?: MockPersistence;
    tabPersistence?: MockPersistence;
    /** Development-only staff logins (see apps/web/.env.development). */
    staff?: MockStaffLogin[];
    now?: () => Date;
  } = {},
): MockApi {
  const { latencyMs = 0, persistence, tabPersistence, staff, now = () => new Date() } = options;
  /** The last data string this tab read or wrote — another tab has saved when storage differs. */
  let lastRaw: string | null = null;

  const read = (): MockState | undefined => {
    let raw: string | null = null;
    try {
      raw = persistence?.load() ?? null;
    } catch {
      raw = null;
    }
    lastRaw = raw;
    const state = parseState(raw);
    if (state && tabPersistence) {
      try {
        state.webRefreshCookie = tabPersistence.load() || null;
      } catch {
        state.webRefreshCookie = null;
      }
    }
    return state;
  };

  const write = (state: MockState) => {
    try {
      if (tabPersistence) {
        // The simulated sign-in cookie belongs to this tab only.
        tabPersistence.save(state.webRefreshCookie ?? "");
        lastRaw = JSON.stringify({ ...state, webRefreshCookie: null });
      } else {
        lastRaw = JSON.stringify(state);
      }
      persistence?.save(lastRaw);
    } catch {
      // storage full or blocked — the mock keeps working in memory
    }
  };

  const backend = createMockBackend({ now, initialState: read(), onChange: write, staff });

  /** Pick up anything another tab saved since this tab last looked. */
  const syncFromOtherTabs = () => {
    if (!persistence) return;
    let raw: string | null = null;
    try {
      raw = persistence.load();
    } catch {
      return;
    }
    if (!raw || raw === lastRaw) return;
    const state = read();
    if (state) backend.replaceState(state);
  };

  const adapter: AxiosAdapter = async (config) => {
    if (latencyMs > 0) await wait(latencyMs, config.signal);
    else if (config.signal?.aborted) throw new CanceledError();

    const url = new URL(config.url ?? "", "https://mock.invalid");
    const path = url.pathname.replace(/^\/v1(?=\/)/, "");
    const method = (config.method ?? "get").toUpperCase();
    const headers = headersObject(config);
    const query: Record<string, string> = Object.fromEntries(url.searchParams.entries());
    for (const [k, v] of Object.entries((config.params ?? {}) as Record<string, unknown>))
      if (v !== undefined && v !== null) query[k] = String(v);

    let response: MockResponse;
    const route = routes.find((r) => r.endpoint.method === method && r.match(path));
    syncFromOtherTabs();
    try {
      if (!route) throw new MockHttpError(404, "NOT_FOUND", `No endpoint ${method} ${path} in the API contract`);
      const token = headers.authorization?.replace(/^Bearer\s+/i, "") ?? null;
      const platform = (
        ["web", "ios", "android"].includes(headers["x-client-platform"] ?? "") ? headers["x-client-platform"] : "web"
      ) as ClientPlatform;
      const lang = headers["accept-language"]?.slice(0, 2);
      response = await backend.handle({
        endpoint: route.endpoint,
        params: route.match(path) ?? {},
        query,
        body: parseBody(config.data),
        headers,
        locale: isLocale(lang) ? lang : "en",
        platform,
        userId: backend.userIdForToken(token),
        now: now(),
      });
    } catch (error) {
      const e =
        error instanceof MockHttpError
          ? error
          : new MockHttpError(500, "SERVER_ERROR", error instanceof Error ? error.message : "Mock error");
      response = {
        status: e.status,
        data: {
          error: {
            code: e.code,
            message: e.message,
            ...(e.fieldErrors ? { fieldErrors: e.fieldErrors } : {}),
            requestId: `mock-${Date.now()}`,
          },
        },
      };
      if (!(error instanceof MockHttpError)) console.error("[mock api]", error);
    }

    const axiosResponse: AxiosResponse = {
      // Serialised like a real response, so callers never share objects with the mock's state.
      data: response.data === undefined ? "" : JSON.stringify(response.data),
      status: response.status,
      statusText: String(response.status),
      headers: AxiosHeaders.from({ "content-type": "application/json", ...(response.headers ?? {}) }),
      config,
      request: {},
    };
    if (response.status >= 200 && response.status < 300) return axiosResponse;
    throw new AxiosError(
      `Request failed with status code ${response.status}`,
      response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      axiosResponse,
    );
  };

  return { adapter, controls: backend.controls, backend };
}
