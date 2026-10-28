/**
 * Builds everything the hooks need, once, in each app's composition root:
 * the API client and services, the React Query cache, the cart store and the language.
 */
import { QueryClient } from "@tanstack/react-query";
import { createApiClient, createServices, type AxiosAdapter, type Services, type TokenStore } from "@sdw/core/api";
import { DEFAULT_LOCALE, isLocale, pickLocale, type AppConfig, type Locale } from "@sdw/core";
import { createCartStore, type CartStore } from "./shop/cart-store";
import { STORAGE_KEYS, type PreferenceStorage } from "./storage";

/** Demo-only hooks into the mock backend (verify a payment, …). Null when talking to the live API. */
export type DemoControls = {
  pendingPayments(): Array<{ id: string; reference: string; amount: number; purpose: string; status: string }>;
  verifyPayment(paymentId: string): void;
  rejectPayment(paymentId: string, reason: string): void;
  setUpiEnabled(enabled: boolean): void;
  lastResetToken(): string | null;
  reset(): void;
};

export type RuntimeOptions = {
  config: AppConfig;
  tokenStore: TokenStore;
  preferences: PreferenceStorage;
  initialLocale: Locale;
  /** The mock backend's adapter in mock mode; omitted in live mode. */
  adapter?: AxiosAdapter;
  demo?: DemoControls | null;
};

export type AppRuntime = {
  config: AppConfig;
  services: Services;
  queryClient: QueryClient;
  cart: CartStore;
  preferences: PreferenceStorage;
  demo: DemoControls | null;
  getLocale(): Locale;
  setLocale(locale: Locale): void;
  /** Subscribe to "session can't be refreshed any more". Returns an unsubscribe function. */
  onSessionExpired(listener: () => void): () => void;
};

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // The API client already retries idempotent requests on network errors; don't multiply retries.
      queries: { staleTime: 60_000, gcTime: 10 * 60_000, retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

export function createRuntime(options: RuntimeOptions): AppRuntime {
  let locale = options.initialLocale;
  const expiredListeners = new Set<() => void>();

  const api = createApiClient({
    config: options.config,
    tokenStore: options.tokenStore,
    getLocale: () => locale,
    adapter: options.adapter,
    onSessionExpired: () => expiredListeners.forEach((listener) => listener()),
  });

  return {
    config: options.config,
    services: createServices(api),
    queryClient: createQueryClient(),
    cart: createCartStore(options.preferences),
    preferences: options.preferences,
    demo: options.demo ?? null,
    getLocale: () => locale,
    setLocale(next) {
      locale = next;
      void Promise.resolve(options.preferences.setItem(STORAGE_KEYS.locale, next)).catch(() => undefined);
    },
    onSessionExpired(listener) {
      expiredListeners.add(listener);
      return () => expiredListeners.delete(listener);
    },
  };
}

/** The saved language, else the best match from the device / browser languages, else English. */
export async function loadInitialLocale(
  preferences: PreferenceStorage,
  deviceLanguages: readonly string[],
): Promise<Locale> {
  try {
    const saved = await preferences.getItem(STORAGE_KEYS.locale);
    if (isLocale(saved)) return saved;
  } catch {
    // storage unavailable — fall through
  }
  return pickLocale(deviceLanguages) ?? DEFAULT_LOCALE;
}
