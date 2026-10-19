import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { useForgotPassword, useForm, useT } from "@sdw/controllers";
import { forgotPasswordSchema } from "@sdw/core";
import { Button, FormError, Notice, Screen, Stack, Text, TextField } from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";

export function ForgotPasswordScreen() {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  const forgot = useForgotPassword();
  const form = useForm(forgotPasswordSchema, { email: "" });
  const [sent, setSent] = useState(false);
  const submit = form.handleSubmit(async (data) => {
    await forgot.mutateAsync(data);
    setSent(true);
  });

  return (
    <Screen keyboard>
      <Stack>
        <Text variant="h1">{t("Reset your password")}</Text>
        {sent ? (
          <>
            {/* Same message whether or not the email has an account. */}
            <Notice tone="success" title={t("Check your email")}>
              {t(
                "If an account exists for that email, we've sent a link to reset your password. The link works for one hour.",
              )}
            </Notice>
            <Button fullWidth onPress={() => navigation.goBack()}>
              {t("Back to log in")}
            </Button>
          </>
        ) : (
          <>
            <Text variant="lead">
              {t("Enter the email address you registered with and we'll send you a link to choose a new password.")}
            </Text>
            <FormError message={form.formError} />
            <TextField
              label={t("Email")}
              required
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={form.values.email}
              onChangeText={(v) => form.setField("email", v)}
              error={form.errorFor("email")}
              onSubmitEditing={() => void submit()}
            />
            <Button fullWidth loading={form.submitting} onPress={() => void submit()}>
              {t("Send reset link")}
            </Button>
          </>
        )}
      </Stack>
    </Screen>
  );
}
