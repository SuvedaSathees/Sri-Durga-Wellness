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

/**
 * Mock-backend sample data — one copy per browser, shared by all its tabs (so an order placed in one
 * tab shows up in the Admin area open in another). Sample data only; the live site never uses it.
 */
export const mockSharedStorage = {
  load: () => safe(() => window.localStorage).getItem("sdw.mock.v3") as string | null,
  save: (value: string) => void safe(() => window.localStorage).setItem("sdw.mock.v3", value),
};

/** Who is signed in to the mock backend — per tab, so each tab can be a different person. */
export const mockTabStorage = {
  load: () => safe(() => window.sessionStorage).getItem("sdw.mock.tab") as string | null,
  save: (value: string) => void safe(() => window.sessionStorage).setItem("sdw.mock.tab", value),
};

/** A per-tab yes/no flag (e.g. "visitor paused the banner video"). */
export const sessionFlag = {
  get: (key: string) => safe(() => window.sessionStorage).getItem(key) === "1",
  set: (key: string, on: boolean) =>
    on ? safe(() => window.sessionStorage).setItem(key, "1") : safe(() => window.sessionStorage).removeItem(key),
};
