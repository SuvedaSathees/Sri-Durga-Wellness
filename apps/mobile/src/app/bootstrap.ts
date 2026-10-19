/**
 * Mobile composition root: the only module that decides between the mock backend and the live API.
 */
import { getLocales } from "expo-localization";
import { createRuntime, loadInitialLocale, type AppRuntime } from "@sdw/controllers";
import { createTokenStore } from "@sdw/core/api";
import { createMockApi } from "@sdw/core/mocks";
import { readMobileConfig } from "../config/env";
import { preferences } from "../platform/preferences";
import { secureStorage } from "../platform/secure-storage";

export async function createMobileRuntime(): Promise<AppRuntime> {
  const config = readMobileConfig();
  const initialLocale = await loadInitialLocale(
    preferences,
    getLocales().map((l) => l.languageTag),
  );
  // Access token in memory; refresh token in the Keychain / Keystore.
  const tokenStore = createTokenStore({ secureStorage });

  if (config.apiMode === "mock") {
    const mock = createMockApi({ latencyMs: config.mockLatencyMs });
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
