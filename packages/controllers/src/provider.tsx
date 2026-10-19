import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { translator, type AppConfig, type Locale, type Translate, type User } from "@sdw/core";
import type { Services } from "@sdw/core/api";
import { qk } from "./query-keys";
import type { AppRuntime, DemoControls } from "./runtime";

type AppContextValue = {
  runtime: AppRuntime;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
};

const AppContext = createContext<AppContextValue | null>(null);

/** Wrap each app once, in its composition root. */
export function AppProvider({ runtime, children }: { runtime: AppRuntime; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(runtime.getLocale());

  const setLocale = useCallback(
    (next: Locale) => {
      runtime.setLocale(next);
      setLocaleState(next);
      // Remember the choice on the account too, so emails use it. Best effort only.
      const user = runtime.queryClient.getQueryData<User | null>(qk.session);
      if (user && user.locale !== next) {
        runtime.services.auth
          .updateProfile({ locale: next })
          .then((updated) => runtime.queryClient.setQueryData(qk.session, updated))
          .catch(() => undefined);
      }
    },
    [runtime],
  );

  useEffect(
    () =>
      runtime.onSessionExpired(() => {
        runtime.queryClient.setQueryData(qk.session, null);
        runtime.queryClient.removeQueries({ queryKey: qk.me });
      }),
    [runtime],
  );

  const value = useMemo(() => ({ runtime, locale, setLocale, t: translator(locale) }), [runtime, locale, setLocale]);

  return (
    <QueryClientProvider client={runtime.queryClient}>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </QueryClientProvider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

/** The API services — for hooks in this package only; screens use the feature hooks. */
export function useApi(): Services {
  return useApp().runtime.services;
}

export function useT(): Translate {
  return useApp().t;
}

export function useLocale(): [Locale, (locale: Locale) => void] {
  const { locale, setLocale } = useApp();
  return [locale, setLocale];
}

export function useConfig(): AppConfig {
  return useApp().runtime.config;
}

/** Demo tools for the mock backend; null against the live API. */
export function useDemoControls(): DemoControls | null {
  return useApp().runtime.demo;
}
