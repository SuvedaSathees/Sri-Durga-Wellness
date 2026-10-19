/**
 * Runtime configuration, validated once at start-up. Each app maps its own environment
 * variables (VITE_* on web, EXPO_PUBLIC_* on mobile) to these keys — nothing is hard-coded.
 */
import { z } from "zod";

export type ClientPlatform = "web" | "ios" | "android";
export type ApiMode = "mock" | "live";
export type AppEnv = "development" | "staging" | "production";

export type AppConfig = {
  appEnv: AppEnv;
  /** "mock" serves the in-memory sample backend; "live" calls `apiBaseUrl`. */
  apiMode: ApiMode;
  /** Base URL of the REST API including the version prefix, e.g. "https://api.example.com/v1". No trailing slash. */
  apiBaseUrl: string;
  timeoutMs: number;
  /** Artificial delay for mock responses, so loading states are visible during development. */
  mockLatencyMs: number;
  platform: ClientPlatform;
};

export type RawEnv = {
  APP_ENV?: string;
  API_MODE?: string;
  API_BASE_URL?: string;
  API_TIMEOUT_MS?: string;
  MOCK_LATENCY_MS?: string;
};

export class ConfigError extends Error {
  override name = "ConfigError";
}

const isLocalHost = (url: URL) => ["localhost", "127.0.0.1", "10.0.2.2", "[::1]"].includes(url.hostname);

const schema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  API_MODE: z.enum(["mock", "live"]).default("mock"),
  API_BASE_URL: z.string().trim().optional(),
  API_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(15_000),
  MOCK_LATENCY_MS: z.coerce.number().int().min(0).max(10_000).default(350),
});

export function parseAppConfig(raw: RawEnv, platform: ClientPlatform): AppConfig {
  const cleaned = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined && v !== ""));
  const parsed = schema.safeParse(cleaned);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new ConfigError(`Invalid app configuration — ${detail}`);
  }
  const env = parsed.data;

  let apiBaseUrl = "";
  if (env.API_MODE === "live") {
    if (!env.API_BASE_URL) throw new ConfigError('API_BASE_URL is required when API_MODE is "live".');
    let url: URL;
    try {
      url = new URL(env.API_BASE_URL);
    } catch {
      throw new ConfigError(`API_BASE_URL is not a valid URL: ${env.API_BASE_URL}`);
    }
    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalHost(url))) {
      throw new ConfigError("API_BASE_URL must use https (http is allowed only for localhost during development).");
    }
    if (env.APP_ENV === "production" && url.protocol !== "https:") {
      throw new ConfigError("Production builds must use an https API_BASE_URL.");
    }
    apiBaseUrl = url.toString().replace(/\/+$/, "");
  } else {
    apiBaseUrl = "https://mock.invalid/v1";
  }

  return {
    appEnv: env.APP_ENV,
    apiMode: env.API_MODE,
    apiBaseUrl,
    timeoutMs: env.API_TIMEOUT_MS,
    mockLatencyMs: env.MOCK_LATENCY_MS,
    platform,
  };
}
