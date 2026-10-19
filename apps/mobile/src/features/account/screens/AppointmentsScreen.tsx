import { useState } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMyAppointments, useT } from "@sdw/controllers";
import { AuthGate, Button, ChoiceGroup, EmptyView, QueryView, Screen, Stack } from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";
import { Group } from "../components/Group";
import { AppointmentRow } from "../components/Rows";

function Content() {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const appointments = useMyAppointments(tab);
  return (
    <Screen onRefresh={() => appointments.refetch()}>
      <Stack>
        <ChoiceGroup<"upcoming" | "past">
          label={t("Show")}
          value={tab}
          onChange={setTab}
          options={[
            { value: "upcoming", label: t("Upcoming") },
            { value: "past", label: t("Past & cancelled") },
          ]}
        />
        <QueryView
          query={appointments}
          isEmpty={(p) => p.items.length === 0}
          empty={
            <EmptyView
              icon="calendar-outline"
              title={t("No appointments yet")}
              body={t("Appointments you book while signed in will appear here.")}
              action={<Button onPress={() => navigation.navigate("Booking")}>{t("Book an appointment")}</Button>}
            />
          }
        >
          {(page) => (
            <Group>
              {page.items.map((a) => (
                <AppointmentRow key={a.id} appointment={a} />
              ))}
            </Group>
          )}
        </QueryView>
        <View>
          <Button variant="secondary" icon="calendar-outline" onPress={() => navigation.navigate("Booking")}>
            {t("Book another")}
          </Button>
        </View>
      </Stack>
    </Screen>
  );
}

export function AppointmentsScreen() {
  return (
    <AuthGate>
      <Content />
    </AuthGate>
  );
}
