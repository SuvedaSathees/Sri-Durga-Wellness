import { useEffect, useState } from "react";
import type { RootScreenProps } from "../../../navigation/types";
import { useForm, useResetPassword, useT } from "@sdw/controllers";
import { resetPasswordSchema } from "@sdw/core";
import { Button, FormError, Notice, Screen, Stack, Text, TextField } from "../../../components/ui";

/** Opened from the emailed link (sridurgawellness://reset-password?token=…). */
export function ResetPasswordScreen({ route, navigation }: RootScreenProps<"ResetPassword">) {
  const t = useT();
  // Keep the token in memory only; clear it from the route so it isn't kept in navigation state.
  const [token] = useState(() => route.params?.token ?? null);
  const reset = useResetPassword();
  const form = useForm(resetPasswordSchema, { password: "", confirmPassword: "" });
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (route.params?.token) navigation.setParams({ token: undefined });
  }, [navigation, route.params?.token]);

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
    <Screen keyboard>
      <Stack>
        <Text variant="h1">{t("Choose a new password")}</Text>
        {done ? (
          <>
            <Notice tone="success" title={t("Password changed")}>
              {t("You can now log in with your new password.")}
            </Notice>
            <Button fullWidth onPress={() => navigation.replace("Login")}>
              {t("Log in")}
            </Button>
          </>
        ) : !token ? (
          <>
            <Notice tone="warning">{t("This reset link is incomplete. Please request a new one.")}</Notice>
            <Button onPress={() => navigation.replace("ForgotPassword")}>{t("Request a new link")}</Button>
          </>
        ) : (
          <>
            <FormError message={form.formError} />
            <TextField
              label={t("New password")}
              required
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              hint={t("At least 8 characters.")}
              value={form.values.password}
              onChangeText={(v) => form.setField("password", v)}
              error={form.errorFor("password")}
            />
            <TextField
              label={t("Confirm password")}
              required
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              value={form.values.confirmPassword}
              onChangeText={(v) => form.setField("confirmPassword", v)}
              error={form.errorFor("confirmPassword")}
            />
            <Button fullWidth loading={form.submitting} onPress={() => void submit()}>
              {t("Save new password")}
            </Button>
            <Button variant="ghost" onPress={() => navigation.replace("ForgotPassword")}>
              {t("Request a new link")}
            </Button>
          </>
        )}
      </Stack>
    </Screen>
  );
}
