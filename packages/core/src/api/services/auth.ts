import type {
  AuthSession,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
} from "../../models";
import type { ApiClient } from "../client";
import { endpoints } from "../endpoints";

/** Sign-in, registration, password and profile. Saves and clears tokens so callers never touch them. */
export function createAuthService(api: ApiClient) {
  async function start(session: AuthSession): Promise<User> {
    await api.tokens.save(session);
    return session.user;
  }

  return {
    login: async (body: LoginRequest) => start(await api.request<AuthSession>(endpoints.auth.login, { body })),
    register: async (body: RegisterRequest) => start(await api.request<AuthSession>(endpoints.auth.register, { body })),
    async logout(): Promise<void> {
      try {
        await api.request<void>(endpoints.auth.logout, { body: {} });
      } finally {
        await api.tokens.clear();
      }
    },
    /** Restore a session on app start: refresh, then load the profile. Null when signed out. */
    async restore(signal?: AbortSignal): Promise<User | null> {
      if (!(await api.refreshSession())) return null;
      return api.request<User>(endpoints.me.get, { signal });
    },
    me: (signal?: AbortSignal) => api.request<User>(endpoints.me.get, { signal }),
    updateProfile: (body: UpdateProfileRequest) => api.request<User>(endpoints.me.update, { body }),
    changePassword: (body: ChangePasswordRequest) => api.request<void>(endpoints.me.changePassword, { body }),
    forgotPassword: (body: ForgotPasswordRequest) => api.request<void>(endpoints.auth.forgotPassword, { body }),
    resetPassword: (body: ResetPasswordRequest) => api.request<void>(endpoints.auth.resetPassword, { body }),
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
