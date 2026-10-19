/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: string;
  readonly VITE_API_MODE?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_MOCK_LATENCY_MS?: string;
  readonly VITE_PREVIEW_UI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
