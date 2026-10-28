/**
 * Web configuration from VITE_* environment variables (see .env.example), validated by the shared
 * schema. This is the only place the API base URL is read.
 */
import { parseAppConfig, type AppConfig } from "@sdw/core";

export function readWebConfig(): AppConfig {
  return parseAppConfig(
    {
      APP_ENV: import.meta.env.VITE_APP_ENV,
      API_MODE: import.meta.env.VITE_API_MODE,
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      API_TIMEOUT_MS: import.meta.env.VITE_API_TIMEOUT_MS,
      MOCK_LATENCY_MS: import.meta.env.VITE_MOCK_LATENCY_MS,
    },
    "web",
  );
}

/**
 * Mock mode only: show the "sample content" banner and the Demo tools button. Off unless
 * VITE_PREVIEW_UI=on (the browser tests turn it on, see .env.test). In live mode the banner
 * follows the backend's `isSampleContent` flag and the Demo tools never exist.
 */
export function readPreviewUi(): boolean {
  return import.meta.env.MODE === "test" && import.meta.env.VITE_PREVIEW_UI === "on";
}

/**
 * Mock mode only: a clinic-owner login for trying the Admin area, read from the development
 * settings file (apps/web/.env.development, used by `npm run dev`). Production builds don't read
 * that file, and the live site checks staff logins on the server — this login never works there.
 */
export function readMockOwnerLogin(): { email: string; password: string } | null {
  const email = import.meta.env.VITE_MOCK_OWNER_EMAIL?.trim();
  const password = import.meta.env.VITE_MOCK_OWNER_PASSWORD ?? "";
  return email && password.length >= 8 ? { email, password } : null;
}
