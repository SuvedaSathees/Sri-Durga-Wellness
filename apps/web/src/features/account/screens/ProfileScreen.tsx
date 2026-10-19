import { useState, type FormEvent } from "react";
import { useForm, useSession, useT, useUpdateProfile } from "@sdw/controllers";
import { formatPhone, profileSchema } from "@sdw/core";
import { Button, FormError, Notice, TextField } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AccountPanel } from "../components/AccountPanel";
import styles from "../components/Account.module.css";

export function ProfileScreen() {
  const t = useT();
  useDocumentTitle(t("Profile"));
  const { user } = useSession();
  const update = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const form = useForm(profileSchema, { name: user?.name ?? "", phone: user ? formatPhone(user.phone) : "" });

  const submit = form.handleSubmit(async (data) => {
    setSaved(false);
    await update.mutateAsync(data);
    setSaved(true);
  });
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  return (
    <AccountPanel title={t("Profile")}>
      <form className={styles.form} onSubmit={onSubmit} noValidate aria-label={t("Profile")}>
        {saved ? <Notice tone="success">{t("Your profile has been updated.")}</Notice> : null}
        <FormError message={form.formError} />
        <TextField
          label={t("Full name")}
          autoComplete="name"
          required
          value={form.values.name}
          onChange={(v) => (setSaved(false), form.setField("name", v))}
          error={form.errorFor("name")}
        />
        <TextField
          label={t("Mobile number")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={form.values.phone}
          onChange={(v) => (setSaved(false), form.setField("phone", v))}
          error={form.errorFor("phone")}
        />
        <TextField
          label={t("Email")}
          type="email"
          required
          value={user?.email ?? ""}
          onChange={() => undefined}
          readOnly
          hint={t("To change your email address, please contact the clinic.")}
        />
        <div>
          <Button type="submit" loading={form.submitting}>
            {t("Save changes")}
          </Button>
        </div>
      </form>
    </AccountPanel>
  );
}
