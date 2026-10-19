import { useState } from "react";
import { useForm, useSession, useT, useUpdateProfile } from "@sdw/controllers";
import { formatPhone, profileSchema, type User } from "@sdw/core";
import { AuthGate, Button, FormError, Notice, Screen, Stack, TextField } from "../../../components/ui";

function Content({ user }: { user: User }) {
  const t = useT();
  const update = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const form = useForm(profileSchema, { name: user.name, phone: formatPhone(user.phone) });
  const submit = form.handleSubmit(async (data) => {
    setSaved(false);
    await update.mutateAsync(data);
    setSaved(true);
  });
  return (
    <Screen keyboard>
      <Stack>
        {saved ? <Notice tone="success">{t("Your profile has been updated.")}</Notice> : null}
        <FormError message={form.formError} />
        <TextField
          label={t("Full name")}
          required
          autoComplete="name"
          value={form.values.name}
          onChangeText={(v) => (setSaved(false), form.setField("name", v))}
          error={form.errorFor("name")}
        />
        <TextField
          label={t("Mobile number")}
          required
          keyboardType="phone-pad"
          autoComplete="tel"
          value={form.values.phone}
          onChangeText={(v) => (setSaved(false), form.setField("phone", v))}
          error={form.errorFor("phone")}
        />
        <TextField
          label={t("Email")}
          required
          value={user.email}
          onChangeText={() => undefined}
          editable={false}
          hint={t("To change your email address, please contact the clinic.")}
        />
        <Button fullWidth loading={form.submitting} onPress={() => void submit()}>
          {t("Save changes")}
        </Button>
      </Stack>
    </Screen>
  );
}

export function ProfileScreen() {
  const { user } = useSession();
  return <AuthGate>{user ? <Content user={user} /> : null}</AuthGate>;
}
