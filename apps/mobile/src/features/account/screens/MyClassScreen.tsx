import { useEffect } from "react";
import { View } from "react-native";
import { useFormat, useMyRegistration, useRenewRegistration, useT } from "@sdw/controllers";
import { errorMessage, REGISTRATION_STATUS, type ClassRegistration } from "@sdw/core";
import { AuthGate, Badge, Button, Card, Facts, Notice, QueryView, Screen, Stack, Text } from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";
import { openWebPage } from "../../../platform/links";
import { theme } from "../../../theme";

type Nav = RootScreenProps<"MyClass">["navigation"];

/** Monthly classes: the paid month, and paying for the next one (renewal is a new UPI payment). */
function MonthlyPlan({ registration, navigation }: { registration: ClassRegistration; navigation: Nav }) {
  const t = useT();
  const f = useFormat();
  const renew = useRenewRegistration();
  const m = registration.monthly;
  if (!m || registration.status !== "CONFIRMED") return null;
  const lapsed = !m.paidUntil || new Date(m.paidUntil).getTime() <= Date.now();
  const renewal = m.renewal;
  const renewalPayable =
    renewal && (renewal.payment.status === "AWAITING_PAYMENT" || renewal.payment.status === "REJECTED");

  return (
    <View style={{ gap: 12 }}>
      {m.paidUntil ? (
        lapsed ? (
          <Notice tone="warning" title={t("Your paid month has ended")}>
            {t("It ended on {date}. Pay for the next month to get the joining link back.", {
              date: f.longDate(m.paidUntil),
            })}
          </Notice>
        ) : (
          <Notice tone="success" title={t("Paid until {date}", { date: f.longDate(m.paidUntil) })}>
            {t("Pay for the next month before this date to keep your place.")}
          </Notice>
        )
      ) : null}

      {renewal ? (
        renewalPayable ? (
          <Notice
            tone={renewal.payment.status === "REJECTED" ? "danger" : "info"}
            title={
              renewal.payment.status === "REJECTED"
                ? t("We couldn't verify your payment")
                : t("Next month: {start} – {end}", {
                    start: f.shortDate(renewal.periodStart),
                    end: f.shortDate(renewal.periodEnd),
                  })
            }
            action={
              <Button size="sm" onPress={() => navigation.navigate("Payment", { paymentId: renewal.payment.id })}>
                {renewal.payment.status === "REJECTED"
                  ? t("Review and resubmit")
                  : t("Pay {amount}", { amount: f.price(renewal.payment.amount) })}
              </Button>
            }
          >
            {t("Complete the UPI payment to continue next month.")}
          </Notice>
        ) : renewal.payment.status === "SUBMITTED" ? (
          <Notice tone="info">
            {t("We're verifying your payment for next month. The clinic checks UPI payments once a day.")}
          </Notice>
        ) : null
      ) : m.canRenew ? (
        <View style={{ gap: 8 }}>
          <Button
            icon="calendar-outline"
            loading={renew.isPending}
            onPress={() =>
              renew.mutate(registration.id, {
                onSuccess: (data) => navigation.navigate("Payment", { paymentId: data.payment.id }),
              })
            }
          >
            {t("Pay for next month ({amount})", { amount: f.price(m.monthlyFee) })}
          </Button>
          {renew.isError ? <Notice tone="danger">{t(errorMessage(renew.error))}</Notice> : null}
        </View>
      ) : null}
    </View>
  );
}

function Content({ id, navigation }: { id: string; navigation: RootScreenProps<"MyClass">["navigation"] }) {
  const t = useT();
  const f = useFormat();
  const registration = useMyRegistration(id);

  useEffect(() => {
    if (registration.data) navigation.setOptions({ title: registration.data.class.title });
  }, [navigation, registration.data]);

  return (
    <Screen onRefresh={() => registration.refetch()}>
      <QueryView query={registration}>
        {(r) => {
          const s = REGISTRATION_STATUS[r.status];
          const p = r.payment;
          const payable = p && (p.status === "AWAITING_PAYMENT" || p.status === "REJECTED") && p.upi !== null;
          return (
            <Stack>
              <Text variant="h2">{r.class.title}</Text>
              <Badge tone={s.tone}>{t(s.label)}</Badge>
              {s.description ? <Text variant="small">{t(s.description)}</Text> : null}

              {/* Only present for this customer's confirmed seat; opened in the in-app browser, never shared. */}
              {r.meeting ? (
                <View
                  style={{
                    backgroundColor: theme.color.successBg,
                    borderRadius: theme.radius.lg,
                    padding: 16,
                    gap: 10,
                  }}
                >
                  <Text variant="label" style={{ color: theme.color.success }}>
                    {t("You're in! Join on Google Meet")}
                  </Text>
                  <Text variant="small" style={{ color: theme.color.success }}>
                    {t("The room opens at {time}. Please don't share this link — it's for registered students only.", {
                      time: f.dateTime(r.meeting.opensAt),
                    })}
                  </Text>
                  <Button icon="videocam-outline" onPress={() => r.meeting && void openWebPage(r.meeting.url)}>
                    {t("Join class")}
                  </Button>
                </View>
              ) : r.status === "PAYMENT_SUBMITTED" ? (
                <Notice tone="info">
                  {t("We're verifying your payment. The joining link will appear here once it's confirmed.")}
                </Notice>
              ) : null}

              <MonthlyPlan registration={r} navigation={navigation} />

              {payable ? (
                <Notice
                  tone={p.status === "REJECTED" ? "danger" : "warning"}
                  title={p.status === "REJECTED" ? t("We couldn't verify your payment") : t("Payment pending")}
                  action={
                    <Button size="sm" onPress={() => navigation.navigate("Payment", { paymentId: p.id })}>
                      {p.status === "REJECTED" ? t("Review and resubmit") : t("Pay now")}
                    </Button>
                  }
                >
                  {r.holdExpiresAt
                    ? t("Your seat is held until {date}.", { date: f.dateTime(r.holdExpiresAt) })
                    : t("Please complete your payment.")}
                </Notice>
              ) : null}

              <Card>
                <Facts
                  items={[
                    { label: t("Reference"), value: r.reference },
                    r.batch.name ? { label: t("Batch"), value: r.batch.name } : false,
                    { label: t("Starts"), value: f.dateTime(r.batch.startsAt) },
                    r.batch.scheduleNote ? { label: t("Schedule"), value: r.batch.scheduleNote } : false,
                    {
                      label: t("Sessions"),
                      value: r.monthly
                        ? t("{count} a month", { count: r.batch.sessionsCount })
                        : String(r.batch.sessionsCount),
                    },
                    r.monthly
                      ? { label: t("Monthly fee"), value: f.classFee(r.monthly.monthlyFee, "MONTHLY") }
                      : { label: t("Fee"), value: f.fee(r.amount) },
                  ]}
                />
              </Card>
              <Button variant="secondary" onPress={() => navigation.navigate("ClassDetail", { slug: r.class.slug })}>
                {t("About this class")}
              </Button>
            </Stack>
          );
        }}
      </QueryView>
    </Screen>
  );
}

export function MyClassScreen({ route, navigation }: RootScreenProps<"MyClass">) {
  return (
    <AuthGate>
      <Content id={route.params.id} navigation={navigation} />
    </AuthGate>
  );
}
