import { useNavigation } from "@react-navigation/native";
import { useMyRegistrations, useT } from "@sdw/controllers";
import { AuthGate, Button, EmptyView, QueryView, Screen } from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";
import { Group } from "../components/Group";
import { RegistrationRow } from "../components/Rows";

function Content() {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  const registrations = useMyRegistrations();
  return (
    <Screen onRefresh={() => registrations.refetch()}>
      <QueryView
        query={registrations}
        empty={
          <EmptyView
            icon="videocam-outline"
            title={t("No class registrations yet")}
            body={t("When you register for a live class, its status and private joining link appear here.")}
            action={
              <Button onPress={() => navigation.navigate("Tabs", { screen: "LearnTab" })}>
                {t("Browse live classes")}
              </Button>
            }
          />
        }
      >
        {(list) => (
          <Group>
            {list.map((r) => (
              <RegistrationRow key={r.id} registration={r} />
            ))}
          </Group>
        )}
      </QueryView>
    </Screen>
  );
}

export function MyClassesScreen() {
  return (
    <AuthGate>
      <Content />
    </AuthGate>
  );
}
