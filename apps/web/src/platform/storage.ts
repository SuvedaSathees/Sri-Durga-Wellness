/**
 * Browser storage wrappers. Every access is guarded: storage can be blocked (private mode,
 * strict privacy settings) and the site must keep working without it.
 * Only non-sensitive preferences are stored — never tokens or personal details.
 */
import type { PreferenceStorage } from "@sdw/controllers";

function safe(getStorage: () => Storage): PreferenceStorage {
  return {
    getItem(key) {
      try {
        return getStorage().getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        getStorage().setItem(key, value);
      } catch {
        // ignore — preference just won't be remembered
      }
    },
    removeItem(key) {
      try {
        getStorage().removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

/** Cart and language — kept between visits. */
export const preferences = safe(() => window.localStorage);

/** Mock-backend data for demos — kept for this browser tab only. */
export const mockSessionStorage = {
  load: () => safe(() => window.sessionStorage).getItem("sdw.mock") as string | null,
  save: (value: string) => void safe(() => window.sessionStorage).setItem("sdw.mock", value),
};

/** A per-tab yes/no flag (e.g. "visitor paused the banner video"). */
export const sessionFlag = {
  get: (key: string) => safe(() => window.sessionStorage).getItem(key) === "1",
  set: (key: string, on: boolean) =>
    on ? safe(() => window.sessionStorage).setItem(key, "1") : safe(() => window.sessionStorage).removeItem(key),
};
