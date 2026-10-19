/** One live class with its batches. Meeting links are never shown here — only in My classes once confirmed. */
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFormat, useLiveClass, useRegisterForBatch, useSession, useSite, useT } from "@sdw/controllers";
import {
  BATCH_CLOSED_LABEL,
  CLASS_FEE_TYPE_LABEL,
  errorMessage,
  LEVEL_LABEL,
  REGISTRATION_STATUS,
  type ClassBatch,
  type ClassRegistration,
  type LiveClass,
} from "@sdw/core";
import {
  Badge,
  Button,
  Card,
  Facts,
  Icon,
  Markdown,
  MediaImage,
  Notice,
  QueryView,
  Screen,
  Text,
} from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";
import { theme } from "../../../theme";
import { Ticks } from "../components/Ticks";

type Nav = RootScreenProps<"ClassDetail">["navigation"];

function Batch({
  item,
  batch,
  navigation,
  onConfirmed,
}: {
  item: LiveClass;
  batch: ClassBatch;
  navigation: Nav;
  onConfirmed: (r: ClassRegistration) => void;
}) {
  const t = useT();
  const f = useFormat();
  const { status } = useSession();
  const site = useSite().data;
  const register = useRegisterForBatch();
  const mine = item.myRegistrations.find((r) => r.batchId === batch.id);
  const paymentsOff = item.fee > 0 && site?.features.upiPayments === false;
  const sessions =
    item.feeType === "MONTHLY"
      ? t("{count} live sessions a month", { count: batch.sessionsCount })
      : batch.sessionsCount === 1
        ? t("1 live session")
        : t("{count} live sessions", { count: batch.sessionsCount });

  let action;
  if (mine) {
    const meta = REGISTRATION_STATUS[mine.status];
    action = (
      <View style={styles.row}>
        <Badge tone={meta.tone}>{t(meta.label)}</Badge>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => navigation.navigate("MyClass", { id: mine.registrationId })}
        >
          {t("View your registration")}
        </Button>
      </View>
    );
  } else if (!batch.isOpen) {
    action = <Badge>{t(BATCH_CLOSED_LABEL[batch.closedReason ?? "CLOSED"])}</Badge>;
  } else if (status === "signedOut") {
    action = (
      <Button variant="secondary" icon="person-outline" onPress={() => navigation.navigate("Login")}>
        {t("Sign in to register")}
      </Button>
    );
  } else if (paymentsOff) {
    action = (
      <View style={{ gap: 6 }}>
        <Button disabled>{t("Register")}</Button>
        <Text variant="small">{t("Online payment isn't available yet. Please contact the clinic.")}</Text>
      </View>
    );
  } else {
    action = (
      <Button
        fullWidth
        loading={register.isPending}
        disabled={status === "loading"}
        onPress={() =>
          register.mutate(batch.id, {
            onSuccess: ({ registration }) => {
              if (registration.payment) navigation.navigate("Payment", { paymentId: registration.payment.id });
              else onConfirmed(registration);
            },
          })
        }
      >
        {batch.price === 0
          ? t("Register for free")
          : item.feeType === "MONTHLY"
            ? t("Register and pay {amount} for the first month", { amount: f.price(batch.price) })
            : t("Register and pay {amount}", { amount: f.price(batch.price) })}
      </Button>
    );
  }

  return (
    <Card>
      <View style={{ gap: 10 }}>
        <View style={styles.between}>
          <Text variant="h3" style={{ flex: 1 }}>
            {batch.name ?? t("Batch")}
          </Text>
          {batch.isOpen && batch.seatsLeft !== null ? (
            <Badge tone={batch.seatsLeft <= 3 ? "warning" : "success"}>
              {batch.seatsLeft === 1 ? t("1 seat left") : t("{count} seats left", { count: batch.seatsLeft })}
            </Badge>
          ) : null}
        </View>
        {batch.scheduleNote ? <Text variant="small">{batch.scheduleNote}</Text> : null}
        <View style={styles.meta}>
          <Icon name="calendar-outline" size={16} />
          <Text variant="small" style={styles.metaText}>
            {t("Starts {date}", { date: f.longDate(batch.startsAt) })}
          </Text>
        </View>
        <View style={styles.meta}>
          <Icon name="time-outline" size={16} />
          <Text variant="small" style={styles.metaText}>
            {f.time(batch.startsAt)} · {f.duration(batch.durationMinutes)} · {sessions}
          </Text>
        </View>
        {item.fee > 0 && item.feeType === "PER_SESSION" && batch.sessionsCount > 1 ? (
          <Text variant="small">
            {t("{count} sessions × {fee} = {total}", {
              count: batch.sessionsCount,
              fee: f.price(item.fee),
              total: f.price(batch.price),
            })}
          </Text>
        ) : null}
        {action}
        {register.isError ? <Notice tone="danger">{t(errorMessage(register.error))}</Notice> : null}
      </View>
    </Card>
  );
}

export function ClassDetailScreen({ route, navigation }: RootScreenProps<"ClassDetail">) {
  const t = useT();
  const f = useFormat();
  const q = useLiveClass(route.params.slug);
  const [confirmed, setConfirmed] = useState<ClassRegistration | null>(null);

  useEffect(() => {
    if (q.data) navigation.setOptions({ title: q.data.title });
  }, [q.data, navigation]);

  return (
    <Screen onRefresh={() => q.refetch()}>
      <QueryView query={q}>
        {(item) => (
          <View style={{ gap: 20 }}>
            <MediaImage image={item.image} fallback="class-default.webp" ratio={16 / 9} />
            <View style={{ gap: 8 }}>
              <View style={styles.row}>
                <Badge>{t(LEVEL_LABEL[item.level])}</Badge>
                <Badge tone={item.fee === 0 ? "success" : "neutral"}>{f.classFee(item.fee, item.feeType)}</Badge>
              </View>
              <Text variant="h1">{item.title}</Text>
              <Text variant="lead">{item.summary}</Text>
            </View>
            {confirmed ? (
              <Notice
                tone="success"
                title={t("You're registered")}
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => navigation.navigate("MyClass", { id: confirmed.id })}
                  >
                    {t("View your registration")}
                  </Button>
                }
              >
                {t(
                  "Your seat is confirmed. The private joining link will appear in My account → Classes before the class starts.",
                )}
              </Notice>
            ) : null}
            <Card>
              <Facts
                items={[
                  item.fee > 0 ? { label: t("How you pay"), value: t(CLASS_FEE_TYPE_LABEL[item.feeType]) } : null,
                  { label: t("Language"), value: item.language },
                  item.instructorName ? { label: t("Instructor"), value: item.instructorName } : null,
                  { label: t("Format"), value: t("Live on Google Meet") },
                  { label: t("Session length"), value: t("Under 60 minutes") },
                ]}
              />
            </Card>
            <Markdown text={item.description} />
            <View style={{ gap: 6 }}>
              <Text variant="h3">{t("Who it's for")}</Text>
              <Text>{item.audience}</Text>
            </View>
            <Ticks title={t("What's included")} items={item.feeIncludes} />
            <Ticks title={t("What you'll need")} items={item.materials} />
            <View style={{ gap: 12 }}>
              <Text variant="h2">{t("Upcoming batches")}</Text>
              {item.batches.length === 0 ? (
                <Text variant="small">{t("Upcoming batches will appear here as soon as they are scheduled.")}</Text>
              ) : null}
              {item.batches.map((b) => (
                <Batch key={b.id} item={item} batch={b} navigation={navigation} onConfirmed={setConfirmed} />
              ))}
            </View>
            {item.feeType === "MONTHLY" && item.fee > 0 ? (
              <Text variant="small">
                {t(
                  "Monthly classes are paid one month at a time. Before each month ends, pay for the next month from My account → Classes to keep your place.",
                )}
              </Text>
            ) : null}
            <Text variant="small">
              {t(
                "Joining links are private. They are shown only to registered students, in their account, once the seat is confirmed.",
              )}
            </Text>
          </View>
        )}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  between: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { flex: 1, color: theme.color.text },
});
