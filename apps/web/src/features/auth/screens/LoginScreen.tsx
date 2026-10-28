import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useForm, useSession, useSignIn, useT } from "@sdw/controllers";
import { loginSchema } from "@sdw/core";
import { safeNext } from "../../../app/RequireAuth";
import { Button, FormError, TextField } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AuthCard, AuthForm } from "../components/AuthCard";
import styles from "../components/AuthCard.module.css";

export function LoginScreen() {
  const t = useT();
  useDocumentTitle(t("Log in"));
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const navigate = useNavigate();
  const { status, user } = useSession();
  const signIn = useSignIn();
  const form = useForm(loginSchema, { email: "", password: "" });
  // The clinic owner lands in the Admin area unless they were on their way somewhere else.
  const landing = (role: string | undefined) => (role === "OWNER" && !params.get("next") ? "/admin" : next);

  if (status === "signedIn" && !signIn.isPending && !signIn.isSuccess)
    return <Navigate to={landing(user?.role)} replace />;

  const submit = form.handleSubmit(async (data) => {
    try {
      const signedIn = await signIn.mutateAsync(data);
      navigate(landing(signedIn.role), { replace: true });
    } catch (error) {
      // Never keep a rejected password in the form.
      form.setField("password", "");
      throw error;
    }
  });

  const registerHref = params.get("next") ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <AuthCard
      eyebrow={t("My account")}
      title={t("Welcome back")}
      intro={t("Sign in to see your appointments, orders, classes and courses.")}
      footer={
        <p>
          {t("New here?")} <Link to={registerHref}>{t("Create an account")}</Link>
        </p>
      }
    >
      <AuthForm onSubmit={submit} label={t("Log in")}>
        <FormError message={form.formError} />
        <TextField
          label={t("Email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={form.values.email}
          onChange={(v) => form.setField("email", v)}
          error={form.errorFor("email")}
        />
        <TextField
          label={t("Password")}
          type="password"
          autoComplete="current-password"
          required
          value={form.values.password}
          onChange={(v) => form.setField("password", v)}
          error={form.errorFor("password")}
        />
        <div className={styles.row}>
          <Link to="/forgot-password">{t("Forgot your password?")}</Link>
        </div>
        <Button type="submit" size="lg" fullWidth loading={form.submitting}>
          {t("Log in")}
        </Button>
      </AuthForm>
    </AuthCard>
  );
}
