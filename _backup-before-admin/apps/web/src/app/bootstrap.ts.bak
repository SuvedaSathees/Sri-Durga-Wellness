/**
 * Web composition root: builds the runtime once. This is the only web module that decides between
 * the mock backend and the live API; screens never know which one they are talking to.
 */
import { createRuntime, loadInitialLocale, type AppRuntime } from "@sdw/controllers";
import { createTokenStore } from "@sdw/core/api";
import { readPreviewUi, readWebConfig } from "../config/env";
import { mockSessionStorage, preferences } from "../platform/storage";

export async function createWebRuntime(): Promise<AppRuntime> {
  const config = readWebConfig();
  const initialLocale = await loadInitialLocale(preferences, navigator.languages ?? [navigator.language]);

  // Access token in memory only; the refresh token is an httpOnly cookie set by the backend.
  const tokenStore = createTokenStore({ cookieRefresh: true });

  if (config.apiMode === "mock") {
    // Loaded on demand, so the sample backend is not part of a live build's main bundle.
    const { createMockApi } = await import("@sdw/core/mocks");
    const mock = createMockApi({ latencyMs: config.mockLatencyMs, persistence: mockSessionStorage });
    return createRuntime({
      config,
      tokenStore,
      preferences,
      initialLocale,
      adapter: mock.adapter,
      demo: mock.controls,
    });
  }
  return createRuntime({ config, tokenStore, preferences, initialLocale });
}
