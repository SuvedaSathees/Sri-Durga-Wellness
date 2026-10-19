/**
 * Non-sensitive device preferences (cart contents, language). Web uses localStorage, mobile uses
 * AsyncStorage. Tokens never go through this — see TokenStore in @sdw/core/api.
 */
export type PreferenceStorage = {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
};

export function createMemoryStorage(initial: Record<string, string> = {}): PreferenceStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

export const STORAGE_KEYS = { cart: "sdw.cart", locale: "sdw.locale" } as const;
