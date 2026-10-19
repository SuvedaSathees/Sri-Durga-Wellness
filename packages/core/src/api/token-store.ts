/**
 * Where the session tokens live. The access token is only ever kept in memory.
 *
 * Web: no persistence at all — the refresh token is an httpOnly cookie the app cannot read, so a
 *      page reload simply calls POST /auth/refresh and the browser sends the cookie.
 * Mobile: the refresh token is persisted through `secureStorage` (expo-secure-store → iOS Keychain /
 *      Android Keystore). Nothing goes to AsyncStorage or localStorage.
 */
import type { AuthTokens } from "../models/auth";

/** Minimal async key/value interface implemented by expo-secure-store (mobile) or a test double. */
export type SecureStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export interface TokenStore {
  getAccessToken(): string | null;
  /** True when there is no access token or it expires within the safety margin. */
  isAccessTokenStale(now?: number): boolean;
  save(tokens: AuthTokens, now?: number): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  /** Whether a refresh is worth trying (web: always, since the cookie is invisible; mobile: a token is stored). */
  canRefresh(): Promise<boolean>;
  clear(): Promise<void>;
}

const REFRESH_KEY = "sdw.refreshToken";
/** Refresh slightly before the server's expiry so requests don't race it. */
const EXPIRY_MARGIN_MS = 30_000;

export function createTokenStore(options: { secureStorage?: SecureStorage; cookieRefresh?: boolean } = {}): TokenStore {
  const { secureStorage, cookieRefresh = !secureStorage } = options;
  let accessToken: string | null = null;
  let expiresAt = 0;

  return {
    getAccessToken: () => accessToken,
    isAccessTokenStale: (now = Date.now()) => !accessToken || now >= expiresAt - EXPIRY_MARGIN_MS,
    async save(tokens, now = Date.now()) {
      accessToken = tokens.accessToken;
      expiresAt = now + tokens.expiresIn * 1000;
      if (secureStorage && tokens.refreshToken) await secureStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    },
    async getRefreshToken() {
      return secureStorage ? secureStorage.getItem(REFRESH_KEY) : null;
    },
    async canRefresh() {
      if (cookieRefresh) return true;
      return !!(secureStorage && (await secureStorage.getItem(REFRESH_KEY)));
    },
    async clear() {
      accessToken = null;
      expiresAt = 0;
      if (secureStorage) await secureStorage.removeItem(REFRESH_KEY);
    },
  };
}
