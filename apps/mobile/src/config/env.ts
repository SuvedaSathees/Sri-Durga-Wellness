/**
 * Mobile configuration from EXPO_PUBLIC_* variables, validated by the shared schema.
 * Each variable is read with a literal `process.env.EXPO_PUBLIC_…` so Expo can inline it.
 * This is the only place the API base URL is read.
 */
import { Platform } from "react-native";
import { parseAppConfig, type AppConfig } from "@sdw/core";

export function readMobileConfig(): AppConfig {
  return parseAppConfig(
    {
      APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
      API_MODE: process.env.EXPO_PUBLIC_API_MODE,
      API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
      API_TIMEOUT_MS: process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
      MOCK_LATENCY_MS: process.env.EXPO_PUBLIC_MOCK_LATENCY_MS,
    },
    Platform.OS === "ios" ? "ios" : "android",
  );
}
