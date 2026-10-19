/**
 * The only place an Axios instance is created. Every API call in both apps goes through
 * `ApiClient.request(endpoint, options)`, which:
 *
 *  - joins the configured base URL with the endpoint path (no URLs anywhere else in the code)
 *  - adds Accept-Language, X-Client-Platform and, when the endpoint allows it, the Bearer token
 *  - refreshes an expired access token once (single-flight, shared by parallel requests)
 *  - retries idempotent GETs once or twice on network errors and 502/503/504
 *  - turns every failure into an ApiError with a consistent shape
 */
import axios, { type AxiosAdapter, type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { AppConfig } from "../config";
import type { AuthTokens } from "../models/auth";
import type { Locale } from "../models/common";
import { buildPath, endpoints, type Endpoint, type PathParams } from "./endpoints";
import { ApiError, toApiError } from "./errors";
import type { TokenStore } from "./token-store";

export type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  params?: PathParams;
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  /** Sent as Idempotency-Key so a retried POST can't create duplicates (orders, registrations). */
  idempotencyKey?: string;
};

export type ApiClientOptions = {
  config: AppConfig;
  tokenStore: TokenStore;
  getLocale: () => Locale;
  /** Called once when the session can no longer be refreshed — the app clears user data and asks to sign in. */
  onSessionExpired?: () => void;
  /** Replaces the network, e.g. with the mock backend. */
  adapter?: AxiosAdapter;
};

export interface ApiClient {
  request<T>(endpoint: Endpoint, options?: RequestOptions): Promise<T>;
  /** Try to restore a session (app start). Resolves true when a fresh access token was obtained. */
  refreshSession(): Promise<boolean>;
  readonly tokens: TokenStore;
  readonly config: AppConfig;
  /** Escape hatch for tests; application code must use `request`. */
  readonly http: AxiosInstance;
}

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_GET_RETRIES = 2;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new ApiError({ kind: "cancelled", status: 0, code: "CANCELLED", message: "Request cancelled" }));
    });
  });

function cleanQuery(query: Record<string, QueryValue> | undefined): Record<string, string> | undefined {
  if (!query) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") out[k] = String(v);
  return out;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const { config, tokenStore, getLocale, onSessionExpired, adapter } = options;

  const http = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: config.timeoutMs,
    // Web sends the httpOnly refresh cookie; native apps have no cookie jar to worry about.
    withCredentials: config.platform === "web",
    headers: { Accept: "application/json" },
    ...(adapter ? { adapter } : {}),
  });

  http.interceptors.request.use((cfg) => {
    cfg.headers.set("Accept-Language", getLocale());
    cfg.headers.set("X-Client-Platform", config.platform);
    return cfg;
  });

  let refreshing: Promise<boolean> | null = null;
  let expiredNotified = false;

  async function doRefresh(): Promise<boolean> {
    if (!(await tokenStore.canRefresh())) return false;
    const refreshToken = await tokenStore.getRefreshToken();
    try {
      const res = await http.request<AuthTokens>({
        method: endpoints.auth.refresh.method,
        url: endpoints.auth.refresh.path,
        data: refreshToken ? { refreshToken } : {},
      });
      await tokenStore.save(res.data);
      expiredNotified = false;
      return true;
    } catch (error) {
      const e = toApiError(error);
      // Only a definite "no" from the server ends the session; a network blip keeps the stored token.
      if (e.status === 400 || e.status === 401 || e.status === 403) await tokenStore.clear();
      return false;
    }
  }

  /** Single-flight: concurrent 401s share one refresh request. */
  function refreshOnce(): Promise<boolean> {
    refreshing ??= doRefresh().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  function sessionExpired() {
    if (!expiredNotified) {
      expiredNotified = true;
      onSessionExpired?.();
    }
  }

  async function request<T>(endpoint: Endpoint, opts: RequestOptions = {}): Promise<T> {
    const url = buildPath(endpoint.path, opts.params);

    if (endpoint.auth === "required" && tokenStore.isAccessTokenStale()) {
      const ok = await refreshOnce();
      if (!ok) {
        sessionExpired();
        throw new ApiError({ kind: "http", status: 401, code: "UNAUTHENTICATED", message: "Not signed in" });
      }
    } else if (endpoint.auth === "optional" && tokenStore.getAccessToken() && tokenStore.isAccessTokenStale()) {
      await refreshOnce();
    }

    const send = (): Promise<T> => {
      const cfg: AxiosRequestConfig = {
        method: endpoint.method,
        url,
        params: cleanQuery(opts.query),
        data: opts.body,
        signal: opts.signal,
        headers: {},
      };
      const token = endpoint.auth === "none" ? null : tokenStore.getAccessToken();
      if (token) (cfg.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      if (opts.idempotencyKey) (cfg.headers as Record<string, string>)["Idempotency-Key"] = opts.idempotencyKey;
      return http.request<T>(cfg).then((res) => (res.status === 204 ? (undefined as T) : res.data));
    };

    for (let attempt = 0; ; attempt++) {
      try {
        return await send();
      } catch (raw) {
        const error = toApiError(raw);

        if (error.status === 401 && endpoint.auth !== "none" && attempt === 0) {
          if (await refreshOnce()) continue;
          await tokenStore.clear();
          if (endpoint.auth === "required") sessionExpired();
          else if (endpoint.auth === "optional") continue; // retry as a guest
          throw error;
        }

        const retryable =
          endpoint.method === "GET" &&
          (error.isNetworkError || RETRYABLE_STATUS.has(error.status)) &&
          attempt < MAX_GET_RETRIES;
        if (retryable) {
          await sleep(300 * 2 ** attempt, opts.signal);
          continue;
        }
        throw error;
      }
    }
  }

  return { request, refreshSession: refreshOnce, tokens: tokenStore, config, http };
}
