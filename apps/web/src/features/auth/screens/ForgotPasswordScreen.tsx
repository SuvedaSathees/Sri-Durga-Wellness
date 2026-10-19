import { useState } from "react";
import { Link } from "react-router";
import { useForgotPassword, useForm, useT } from "@sdw/controllers";
import { forgotPasswordSchema } from "@sdw/core";
import { Button, FormError, Notice, TextField } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AuthCard, AuthForm } from "../components/AuthCard";

export function ForgotPasswordScreen() {
  const t = useT();
  useDocumentTitle(t("Reset your password"));
  const forgot = useForgotPassword();
  const form = useForm(forgotPasswordSchema, { email: "" });
  const [sent, setSent] = useState(false);

  const submit = form.handleSubmit(async (data) => {
    await forgot.mutateAsync(data);
    setSent(true);
  });

  return (
    <AuthCard
      title={t("Reset your password")}
      intro={t("Enter the email address you registered with and we'll send you a link to choose a new password.")}
      footer={
        <p>
          <Link to="/login">{t("Back to log in")}</Link>
        </p>
      }
    >
      {sent ? (
        // The same message whether or not the email has an account, so nobody can check who is registered.
        <Notice tone="success" title={t("Check your email")}>
          {t(
            "If an account exists for that email, we've sent a link to reset your password. The link works for one hour.",
          )}
        </Notice>
      ) : (
        <AuthForm onSubmit={submit} label={t("Reset your password")}>
          <FormError message={form.formError} />
          <TextField
            label={t("Email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={form.values.email}
            onChange={(v) => form.setField("email", v)}
            error={form.errorFor("email")}
          />
          <Button type="submit" size="lg" fullWidth loading={form.submitting}>
            {t("Send reset link")}
          </Button>
        </AuthForm>
      )}
    </AuthCard>
  );
}
