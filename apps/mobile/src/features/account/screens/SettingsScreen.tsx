import { useState } from "react";
import { Alert, View } from "react-native";
import { useChangePassword, useForm, useSignOut, useT } from "@sdw/controllers";
import { changePasswordSchema } from "@sdw/core";
import {
  AuthGate,
  Button,
  FormError,
  LanguageToggle,
  Notice,
  Screen,
  Stack,
  Text,
  TextField,
} from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";
import { Group } from "../components/Group";

function Content({ navigation }: { navigation: RootScreenProps<"Settings">["navigation"] }) {
  const t = useT();
  const change = useChangePassword();
  const signOut = useSignOut();
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

  const confirmSignOut = () =>
    Alert.alert(t("Log out?"), t("Signing out removes your account details from this device."), [
      { text: t("Cancel"), style: "cancel" },
      {
        text: t("Log out"),
        style: "destructive",
        onPress: () =>
          signOut.mutate(undefined, { onSettled: () => navigation.navigate("Tabs", { screen: "AccountTab" }) }),
      },
    ]);

  return (
    <Screen keyboard>
      <Stack gap={24}>
        <Group
          title={t("Language")}
          footer={t(
            "Choose the language for this app. Emails about your bookings, orders, classes and courses will use it too.",
          )}
        >
          <View style={{ padding: 16 }}>
            <LanguageToggle />
          </View>
        </Group>

        <Stack>
          <Text variant="h3">{t("Change password")}</Text>
          {changed ? <Notice tone="success">{t("Your password has been changed.")}</Notice> : null}
          <FormError message={form.formError} />
          <TextField
            label={t("Current password")}
            required
            secureTextEntry
            autoComplete="current-password"
            value={form.values.currentPassword}
            onChangeText={(v) => form.setField("currentPassword", v)}
            error={form.errorFor("currentPassword")}
          />
          <TextField
            label={t("New password")}
            required
            secureTextEntry
            autoComplete="new-password"
            hint={t("At least 8 characters.")}
            value={form.values.newPassword}
            onChangeText={(v) => form.setField("newPassword", v)}
            error={form.errorFor("newPassword")}
          />
          <TextField
            label={t("Confirm new password")}
            required
            secureTextEntry
            autoComplete="new-password"
            value={form.values.confirmPassword}
            onChangeText={(v) => form.setField("confirmPassword", v)}
            error={form.errorFor("confirmPassword")}
          />
          <Button loading={form.submitting} onPress={() => void submit()}>
            {t("Change password")}
          </Button>
        </Stack>

        <Button variant="danger" fullWidth icon="log-out-outline" loading={signOut.isPending} onPress={confirmSignOut}>
          {t("Log out")}
        </Button>
      </Stack>
    </Screen>
  );
}

export function SettingsScreen({ navigation }: RootScreenProps<"Settings">) {
  return (
    <AuthGate>
      <Content navigation={navigation} />
    </AuthGate>
  );
}
