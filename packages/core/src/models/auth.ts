import type { ID, ISODateTime, Locale } from "./common";

export type User = {
  id: ID;
  name: string;
  email: string;
  /** E.164, e.g. "+919876543210". */
  phone: string;
  locale: Locale;
  createdAt: ISODateTime;
};

/**
 * Returned by sign-in, registration and refresh.
 * Web: the refresh token is set as an httpOnly cookie and `refreshToken` is omitted.
 * Mobile (`X-Client-Platform: ios|android`): `refreshToken` is included in the body.
 */
export type AuthTokens = {
  accessToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  refreshToken?: string;
};

export type AuthSession = AuthTokens & { user: User };

export type LoginRequest = { email: string; password: string };

export type RegisterRequest = {
  name: string;
  email: string;
  phone: string;
  password: string;
  locale: Locale;
  /** Customer agreed to the terms and privacy policy. */
  acceptTerms: true;
};

export type RefreshRequest = { refreshToken?: string };

export type ForgotPasswordRequest = { email: string };

export type ResetPasswordRequest = { token: string; password: string };

export type UpdateProfileRequest = { name?: string; phone?: string; locale?: Locale };

export type ChangePasswordRequest = { currentPassword: string; newPassword: string };
