import { useNavigation } from "@react-navigation/native";
import { useForm, useSignIn, useT } from "@sdw/controllers";
import { loginSchema } from "@sdw/core";
import { Button, FormError, Screen, Stack, Text, TextField } from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";

export function LoginScreen() {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  const signIn = useSignIn();
  const form = useForm(loginSchema, { email: "", password: "" });

  const submit = form.handleSubmit(async (data) => {
    try {
      await signIn.mutateAsync(data);
      navigation.goBack();
    } catch (error) {
      form.setField("password", "");
      throw error;
    }
  });

  return (
    <Screen keyboard>
      <Stack>
        <Text variant="h1">{t("Welcome back")}</Text>
        <Text variant="lead">{t("Sign in to see your appointments, orders, classes and courses.")}</Text>
        <FormError message={form.formError} />
        <TextField
          label={t("Email")}
          required
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          value={form.values.email}
          onChangeText={(v) => form.setField("email", v)}
          error={form.errorFor("email")}
        />
        <TextField
          label={t("Password")}
          required
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          value={form.values.password}
          onChangeText={(v) => form.setField("password", v)}
          error={form.errorFor("password")}
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        <Button fullWidth loading={form.submitting} onPress={() => void submit()}>
          {t("Log in")}
        </Button>
        <Button variant="ghost" onPress={() => navigation.navigate("ForgotPassword")}>
          {t("Forgot your password?")}
        </Button>
        <Button variant="secondary" fullWidth onPress={() => navigation.navigate("Register")}>
          {t("Create an account")}
        </Button>
      </Stack>
    </Screen>
  );
}
