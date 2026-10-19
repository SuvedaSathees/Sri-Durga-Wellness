/** Account tab: a welcome with sign-in buttons when signed out; the customer's hub when signed in. */
import { Alert, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMyPayments, useSession, useSignOut, useT } from "@sdw/controllers";
import {
  Button,
  Divider,
  Icon,
  LanguageToggle,
  ListRow,
  LoadingView,
  Screen,
  Stack,
  Text,
} from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";
import { theme } from "../../../theme";
import { Group } from "../components/Group";
import { PaymentRow } from "../components/Rows";

function MoreLinks() {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  return (
    <Group title={t("More")}>
      <ListRow icon="leaf-outline" title={t("About")} onPress={() => navigation.navigate("About")} />
      <Divider />
      <ListRow icon="call-outline" title={t("Contact")} onPress={() => navigation.navigate("Contact")} />
      <Divider />
      <ListRow icon="book-outline" title={t("Journal")} onPress={() => navigation.navigate("Blog")} />
      <Divider />
      <ListRow
        icon="lock-closed-outline"
        title={t("Privacy Policy")}
        onPress={() => navigation.navigate("Policy", { slug: "privacy-policy" })}
      />
      <Divider />
      <ListRow
        icon="information-circle-outline"
        title={t("Terms of Use")}
        onPress={() => navigation.navigate("Policy", { slug: "terms-of-use" })}
      />
      <Divider />
      <ListRow
        icon="receipt-outline"
        title={t("Refund & Cancellation")}
        onPress={() => navigation.navigate("Policy", { slug: "refund-and-cancellation-policy" })}
      />
      <Divider />
      <ListRow
        icon="medkit-outline"
        title={t("Medical Disclaimer")}
        onPress={() => navigation.navigate("Policy", { slug: "medical-disclaimer" })}
      />
    </Group>
  );
}

export function AccountScreen() {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  const { user, status } = useSession();
  const payments = useMyPayments(true);
  const signOut = useSignOut();

  if (status === "loading") return <LoadingView />;

  if (!user) {
    return (
      <Screen>
        <Stack gap={20}>
          <View style={{ alignItems: "center", gap: 12, paddingVertical: 12 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: theme.color.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="person-circle-outline" size={40} />
            </View>
            <Text variant="h2" style={{ textAlign: "center" }}>
              {t("Your wellness, in one place")}
            </Text>
            <Text variant="small" style={{ textAlign: "center" }}>
              {t("Sign in to see your appointments, orders, classes and courses.")}
            </Text>
          </View>
          <Button fullWidth icon="log-in-outline" onPress={() => navigation.navigate("Login")}>
            {t("Log in")}
          </Button>
          <Button fullWidth variant="secondary" onPress={() => navigation.navigate("Register")}>
            {t("Create an account")}
          </Button>
          <Group title={t("Language")}>
            <View style={{ padding: 16 }}>
              <LanguageToggle />
            </View>
          </Group>
          <MoreLinks />
        </Stack>
      </Screen>
    );
  }

  const confirmSignOut = () =>
    Alert.alert(t("Log out?"), t("Signing out removes your account details from this device."), [
      { text: t("Cancel"), style: "cancel" },
      { text: t("Log out"), style: "destructive", onPress: () => signOut.mutate() },
    ]);

  return (
    <Screen onRefresh={() => payments.refetch()}>
      <Stack gap={20}>
        <View style={{ gap: 4 }}>
          <Text variant="eyebrow">{t("My account")}</Text>
          <Text variant="h1">{t("Hello, {name}", { name: user.name })}</Text>
        </View>

        {payments.data && payments.data.length > 0 ? (
          <Group title={t("Action needed")}>
            {payments.data.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </Group>
        ) : null}

        <Group title={t("My account")}>
          <ListRow
            icon="calendar-outline"
            title={t("Appointments")}
            onPress={() => navigation.navigate("Appointments")}
          />
          <Divider />
          <ListRow icon="receipt-outline" title={t("Orders")} onPress={() => navigation.navigate("Orders")} />
          <Divider />
          <ListRow icon="card-outline" title={t("Payments")} onPress={() => navigation.navigate("Payments")} />
          <Divider />
          <ListRow icon="videocam-outline" title={t("My classes")} onPress={() => navigation.navigate("MyClasses")} />
          <Divider />
          <ListRow icon="school-outline" title={t("My courses")} onPress={() => navigation.navigate("MyCourses")} />
        </Group>

        <Group title={t("Settings")}>
          <ListRow
            icon="person-outline"
            title={t("Profile")}
            detail={user.email}
            onPress={() => navigation.navigate("Profile")}
          />
          <Divider />
          <ListRow
            icon="settings-outline"
            title={t("Settings")}
            detail={t("Language and password")}
            onPress={() => navigation.navigate("Settings")}
          />
        </Group>

        <MoreLinks />

        <Button variant="danger" fullWidth icon="log-out-outline" loading={signOut.isPending} onPress={confirmSignOut}>
          {t("Log out")}
        </Button>
      </Stack>
    </Screen>
  );
}
