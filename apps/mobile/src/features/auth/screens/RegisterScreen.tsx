import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useForm, useLocale, useRegister, useT } from "@sdw/controllers";
import { registerSchema } from "@sdw/core";
import { Button, Checkbox, FormError, Screen, Stack, Text, TextField } from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";

export function RegisterScreen() {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  const [locale] = useLocale();
  const register = useRegister();
  const form = useForm(registerSchema, {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false as unknown as true,
  });

  const submit = form.handleSubmit(async ({ name, email, phone, password }) => {
    try {
      await register.mutateAsync({ name, email, phone, password, locale, acceptTerms: true });
      // Close the whole sign-in flow (Login may be underneath).
      navigation.navigate("Tabs", { screen: "AccountTab" });
    } catch (error) {
      form.setField("password", "");
      form.setField("confirmPassword", "");
      throw error;
    }
  });

  return (
    <Screen keyboard>
      <Stack>
        <Text variant="h1">{t("Create your account")}</Text>
        <Text variant="lead">{t("One account for bookings, classes, courses and shop orders.")}</Text>
        <FormError message={form.formError} />
        <TextField
          label={t("Full name")}
          required
          autoComplete="name"
          textContentType="name"
          value={form.values.name}
          onChangeText={(v) => form.setField("name", v)}
          error={form.errorFor("name")}
        />
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
          label={t("Mobile number")}
          required
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          hint={t("We'll only call or message you about your bookings and orders.")}
          value={form.values.phone}
          onChangeText={(v) => form.setField("phone", v)}
          error={form.errorFor("phone")}
        />
        <TextField
          label={t("Password")}
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
        <Checkbox
          label={t("I agree to the Terms of Use and Privacy Policy")}
          checked={form.values.acceptTerms === true}
          onChange={(v) => form.setField("acceptTerms", v)}
          error={form.errorFor("acceptTerms")}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
          <Button variant="ghost" size="sm" onPress={() => navigation.navigate("Policy", { slug: "terms-of-use" })}>
            {t("Terms of Use")}
          </Button>
          <Button variant="ghost" size="sm" onPress={() => navigation.navigate("Policy", { slug: "privacy-policy" })}>
            {t("Privacy Policy")}
          </Button>
        </View>
        <Button fullWidth loading={form.submitting} onPress={() => void submit()}>
          {t("Create account")}
        </Button>
      </Stack>
    </Screen>
  );
}
