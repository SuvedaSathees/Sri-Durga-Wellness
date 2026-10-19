/** Sign-in state and account actions. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
} from "@sdw/core";
import { useApi, useApp } from "./provider";
import { qk } from "./query-keys";

export type SessionStatus = "loading" | "signedIn" | "signedOut";

/** The signed-in customer, restored on app start with a silent token refresh. */
export function useSession(): { user: User | null; status: SessionStatus } {
  const api = useApi();
  const q = useQuery({
    queryKey: qk.session,
    queryFn: ({ signal }) => api.auth.restore(signal),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const user = q.data ?? null;
  return { user, status: q.isPending ? "loading" : user ? "signedIn" : "signedOut" };
}

function useStartSession() {
  const qc = useQueryClient();
  const { setLocale, locale } = useApp();
  return (user: User) => {
    qc.removeQueries({ queryKey: qk.me });
    qc.setQueryData(qk.session, user);
    if (user.locale !== locale) setLocale(user.locale);
  };
}

export function useSignIn() {
  const api = useApi();
  const start = useStartSession();
  return useMutation({ mutationFn: (body: LoginRequest) => api.auth.login(body), onSuccess: start });
}

export function useRegister() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterRequest) => api.auth.register(body),
    onSuccess: (user) => {
      qc.removeQueries({ queryKey: qk.me });
      qc.setQueryData(qk.session, user);
    },
  });
}

export function useSignOut() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSettled: () => {
      qc.setQueryData(qk.session, null);
      qc.removeQueries({ queryKey: qk.me });
    },
  });
}

export function useUpdateProfile() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => api.auth.updateProfile(body),
    onSuccess: (user) => qc.setQueryData(qk.session, user),
  });
}

export function useChangePassword() {
  const api = useApi();
  return useMutation({ mutationFn: (body: ChangePasswordRequest) => api.auth.changePassword(body) });
}

export function useForgotPassword() {
  const api = useApi();
  return useMutation({ mutationFn: (body: ForgotPasswordRequest) => api.auth.forgotPassword(body) });
}

export function useResetPassword() {
  const api = useApi();
  return useMutation({ mutationFn: (body: ResetPasswordRequest) => api.auth.resetPassword(body) });
}
