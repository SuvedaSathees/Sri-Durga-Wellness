import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useForm, useResetPassword, useT } from "@sdw/controllers";
import { resetPasswordSchema } from "@sdw/core";
import { Button, ButtonLink, FormError, Notice, TextField } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AuthCard, AuthForm } from "../components/AuthCard";

export function ResetPasswordScreen() {
  const t = useT();
  useDocumentTitle(t("Choose a new password"));
  const [params, setParams] = useSearchParams();
  // Read the emailed token once and keep it only in memory.
  const [token] = useState(() => params.get("token"));
  const reset = useResetPassword();
  const form = useForm(resetPasswordSchema, { password: "", confirmPassword: "" });
  const [done, setDone] = useState(false);

  // Remove the token from the address bar (and so from history, screenshots and shared links).
  useEffect(() => {
    if (params.has("token")) {
      const next = new URLSearchParams(params);
      next.delete("token");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const submit = form.handleSubmit(async ({ password }) => {
    try {
      await reset.mutateAsync({ token: token ?? "", password });
      setDone(true);
    } catch (error) {
      form.setField("password", "");
      form.setField("confirmPassword", "");
      throw error;
    }
  });

  return (
    <AuthCard
      title={t("Choose a new password")}
      footer={
        <p>
          {t("Link not working?")} <Link to="/forgot-password">{t("Request a new link")}</Link>
        </p>
      }
    >
      {done ? (
        <>
          <Notice tone="success" title={t("Password changed")}>
            {t("You can now log in with your new password.")}
          </Notice>
          <ButtonLink to="/login" fullWidth>
            {t("Log in")}
          </ButtonLink>
        </>
      ) : !token ? (
        <Notice tone="warning">{t("This reset link is incomplete. Please request a new one.")}</Notice>
      ) : (
        <AuthForm onSubmit={submit} label={t("Choose a new password")}>
          <FormError message={form.formError} />
          <TextField
            label={t("New password")}
            type="password"
            autoComplete="new-password"
            required
            hint={t("At least 8 characters.")}
            value={form.values.password}
            onChange={(v) => form.setField("password", v)}
            error={form.errorFor("password")}
          />
          <TextField
            label={t("Confirm password")}
            type="password"
            autoComplete="new-password"
            required
            value={form.values.confirmPassword}
            onChange={(v) => form.setField("confirmPassword", v)}
            error={form.errorFor("confirmPassword")}
          />
          <Button type="submit" size="lg" fullWidth loading={form.submitting}>
            {t("Save new password")}
          </Button>
        </AuthForm>
      )}
    </AuthCard>
  );
}
