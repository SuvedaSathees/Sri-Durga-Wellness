import { useEffect } from "react";
import { Alert } from "react-native";
import { useCancelAppointment, useFormat, useMyAppointment, useSite, useT } from "@sdw/controllers";
import { APPOINTMENT_STATUS, errorMessage, googleCalendarLink } from "@sdw/core";
import { AuthGate, Badge, Button, Card, Facts, Notice, QueryView, Screen, Stack, Text } from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";
import { openWebPage } from "../../../platform/links";

function Content({ id, setTitle }: { id: string; setTitle: (title: string) => void }) {
  const t = useT();
  const f = useFormat();
  const appointment = useMyAppointment(id);
  const cancel = useCancelAppointment(id);
  const site = useSite().data;

  useEffect(() => {
    if (appointment.data) setTitle(appointment.data.service.name);
  }, [appointment.data, setTitle]);

  const confirmCancel = () =>
    Alert.alert(t("Cancel this appointment?"), t("Letting us know helps us look after other patients."), [
      { text: t("Keep appointment"), style: "cancel" },
      {
        text: t("Yes, cancel it"),
        style: "destructive",
        onPress: () =>
          cancel.mutate({}, { onError: (e) => Alert.alert(t("Something went wrong"), t(errorMessage(e))) }),
      },
    ]);

  return (
    <Screen onRefresh={() => appointment.refetch()}>
      <QueryView query={appointment}>
        {(a) => {
          const s = APPOINTMENT_STATUS[a.status];
          const place = a.branch
            ? `${a.branch.name}, ${a.branch.addressLine}, ${a.branch.city}`
            : t("Online (video call)");
          return (
            <Stack>
              <Text variant="h2">{a.service.name}</Text>
              <Badge tone={s.tone}>{t(s.label)}</Badge>
              {cancel.isSuccess ? <Notice tone="success">{t("Your appointment has been cancelled.")}</Notice> : null}
              <Card>
                <Facts
                  items={[
                    { label: t("Reference"), value: a.reference },
                    { label: t("Date"), value: f.longDate(a.startsAt) },
                    { label: t("Time"), value: `${f.time(a.startsAt)} – ${f.time(a.endsAt)}` },
                    { label: t("Practitioner"), value: a.doctor.name },
                    { label: t("Where"), value: place },
                    { label: t("Reason for visit"), value: a.reason },
                  ]}
                />
              </Card>
              {a.status === "CONFIRMED" ? (
                <Button
                  variant="secondary"
                  icon="calendar-outline"
                  onPress={() =>
                    void openWebPage(
                      googleCalendarLink({
                        title: `${a.service.name} — ${site?.clinicName ?? ""}`,
                        start: a.startsAt,
                        end: a.endsAt,
                        location: a.branch ? place : undefined,
                      }),
                    )
                  }
                >
                  {t("Add to Google Calendar")}
                </Button>
              ) : null}
              {a.status === "CONFIRMED" && a.canCancel ? (
                <>
                  {a.cancelBefore ? (
                    <Text variant="small">
                      {t("You can cancel online until {date}.", { date: f.dateTime(a.cancelBefore) })}
                    </Text>
                  ) : null}
                  <Button variant="danger" loading={cancel.isPending} onPress={confirmCancel}>
                    {t("Cancel appointment")}
                  </Button>
                </>
              ) : a.status === "CONFIRMED" ? (
                <Notice tone="info">
                  {t("This appointment can no longer be cancelled online. Please contact the clinic.")}
                </Notice>
              ) : null}
            </Stack>
          );
        }}
      </QueryView>
    </Screen>
  );
}

export function AppointmentScreen({ route, navigation }: RootScreenProps<"Appointment">) {
  return (
    <AuthGate>
      <Content id={route.params.id} setTitle={(title) => navigation.setOptions({ title })} />
    </AuthGate>
  );
}
