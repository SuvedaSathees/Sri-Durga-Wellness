import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useChangePassword, useForm, useLocale, useSignOut, useT } from "@sdw/controllers";
import { changePasswordSchema, type Locale } from "@sdw/core";
import { Button, FormError, Notice, RadioGroup, TextField } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AccountPanel } from "../components/AccountPanel";
import styles from "../components/Account.module.css";

export function SettingsScreen() {
  const t = useT();
  useDocumentTitle(t("Settings"));
  const [locale, setLocale] = useLocale();
  const change = useChangePassword();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const [changed, setChanged] = useState(false);
  const form = useForm(changePasswordSchema, { currentPassword: "", newPassword: "", confirmPassword: "" });

  const submit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    setChanged(false);
    try {
      await change.mutateAsync({ currentPassword, newPassword });
      form.reset();
      setChanged(true);
    } catch (error) {
      form.setField("currentPassword", "");
      throw error;
    }
  });
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  return (
    <>
      <AccountPanel title={t("Language")}>
        <p className="muted">
          {t(
            "Choose the language for this website. Emails about your bookings, orders, classes and courses will use it too.",
          )}
        </p>
        <RadioGroup<Locale>
          legend={<span className="visually-hidden">{t("Language")}</span>}
          name="language"
          layout="row"
          value={locale}
          onChange={setLocale}
          options={[
            { value: "en", label: <span lang="en">English</span> },
            { value: "ta", label: <span lang="ta">தமிழ்</span> },
          ]}
        />
      </AccountPanel>

      <AccountPanel title={t("Change password")}>
        <form className={styles.form} onSubmit={onSubmit} noValidate aria-label={t("Change password")}>
          {changed ? <Notice tone="success">{t("Your password has been changed.")}</Notice> : null}
          <FormError message={form.formError} />
          <TextField
            label={t("Current password")}
            type="password"
            autoComplete="current-password"
            required
            value={form.values.currentPassword}
            onChange={(v) => form.setField("currentPassword", v)}
            error={form.errorFor("currentPassword")}
          />
          <TextField
            label={t("New password")}
            type="password"
            autoComplete="new-password"
            required
            hint={t("At least 8 characters.")}
            value={form.values.newPassword}
            onChange={(v) => form.setField("newPassword", v)}
            error={form.errorFor("newPassword")}
          />
          <TextField
            label={t("Confirm new password")}
            type="password"
            autoComplete="new-password"
            required
            value={form.values.confirmPassword}
            onChange={(v) => form.setField("confirmPassword", v)}
            error={form.errorFor("confirmPassword")}
          />
          <div>
            <Button type="submit" loading={form.submitting}>
              {t("Change password")}
            </Button>
          </div>
        </form>
      </AccountPanel>

      <AccountPanel title={t("Sign out")}>
        <p className="muted">{t("Signing out removes your account details from this browser.")}</p>
        <div>
          <Button
            variant="secondary"
            loading={signOut.isPending}
            onClick={() => {
              navigate("/", { replace: true });
              signOut.mutate();
            }}
          >
            {t("Log out")}
          </Button>
        </div>
      </AccountPanel>
    </>
  );
}
