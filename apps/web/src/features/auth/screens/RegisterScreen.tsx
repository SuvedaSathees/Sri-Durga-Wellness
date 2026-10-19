import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useForm, useLocale, useRegister, useSession, useT } from "@sdw/controllers";
import { registerSchema } from "@sdw/core";
import { safeNext } from "../../../app/RequireAuth";
import { Button, CheckboxField, FormError, TextField } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AuthCard, AuthForm } from "../components/AuthCard";

export function RegisterScreen() {
  const t = useT();
  useDocumentTitle(t("Create an account"));
  const [locale] = useLocale();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"), "/account");
  const navigate = useNavigate();
  const { status } = useSession();
  const register = useRegister();
  const form = useForm(registerSchema, {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false as unknown as true,
  });

  if (status === "signedIn" && !register.isPending && !register.isSuccess) return <Navigate to={next} replace />;

  const submit = form.handleSubmit(async ({ name, email, phone, password }) => {
    try {
      await register.mutateAsync({ name, email, phone, password, locale, acceptTerms: true });
      navigate(next, { replace: true });
    } catch (error) {
      form.setField("password", "");
      form.setField("confirmPassword", "");
      throw error;
    }
  });

  const loginHref = params.get("next") ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <AuthCard
      eyebrow={t("My account")}
      title={t("Create your account")}
      intro={t("One account for bookings, classes, courses and shop orders.")}
      footer={
        <p>
          {t("Already have an account?")} <Link to={loginHref}>{t("Log in")}</Link>
        </p>
      }
    >
      <AuthForm onSubmit={submit} label={t("Create account")}>
        <FormError message={form.formError} />
        <TextField
          label={t("Full name")}
          autoComplete="name"
          required
          value={form.values.name}
          onChange={(v) => form.setField("name", v)}
          error={form.errorFor("name")}
        />
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
        <TextField
          label={t("Mobile number")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          hint={t("We'll only call or message you about your bookings and orders.")}
          value={form.values.phone}
          onChange={(v) => form.setField("phone", v)}
          error={form.errorFor("phone")}
        />
        <TextField
          label={t("Password")}
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
        <CheckboxField
          label={t("I agree to the Terms of Use and Privacy Policy")}
          checked={form.values.acceptTerms === true}
          onChange={(v) => form.setField("acceptTerms", v)}
          error={form.errorFor("acceptTerms")}
          hint={
            <>
              <Link to="/policies/terms-of-use">{t("Terms of Use")}</Link> ·{" "}
              <Link to="/policies/privacy-policy">{t("Privacy Policy")}</Link>
            </>
          }
        />
        <Button type="submit" size="lg" fullWidth loading={form.submitting}>
          {t("Create account")}
        </Button>
      </AuthForm>
    </AuthCard>
  );
}
