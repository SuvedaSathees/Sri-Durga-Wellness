/** Tappable rows for the account lists. */
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFormat, useT } from "@sdw/controllers";
import {
  APPOINTMENT_STATUS,
  ENROLMENT_STATUS,
  ORDER_STATUS,
  PAYMENT_PURPOSE_LABEL,
  PAYMENT_STATUS,
  percent,
  REGISTRATION_STATUS,
  type Appointment,
  type ClassRegistration,
  type MyCourse,
  type OrderSummary,
  type Payment,
} from "@sdw/core";
import { Badge, Icon, Text } from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";
import { theme } from "../../../theme";

function Row({
  title,
  lines,
  badge,
  onPress,
  label,
}: {
  title: string;
  lines: string[];
  badge: ReactNode;
  onPress?: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={styles.main}>
        <Text variant="label">{title}</Text>
        {lines.filter(Boolean).map((l, i) => (
          <Text key={i} variant="small">
            {l}
          </Text>
        ))}
        {badge}
      </View>
      {onPress ? <Icon name="chevron-forward" size={18} color={theme.color.textMuted} /> : null}
    </Pressable>
  );
}

export function AppointmentRow({ appointment: a }: { appointment: Appointment }) {
  const t = useT();
  const f = useFormat();
  const navigation = useNavigation<RootNavigation>();
  const s = APPOINTMENT_STATUS[a.status];
  const when = `${f.date(a.startsAt)} · ${f.time(a.startsAt)}`;
  return (
    <Row
      title={a.service.name}
      lines={[when, t("with {name}", { name: a.doctor.name })]}
      badge={<Badge tone={s.tone}>{t(s.label)}</Badge>}
      onPress={() => navigation.navigate("Appointment", { id: a.id })}
      label={`${a.service.name}, ${when}, ${t(s.label)}`}
    />
  );
}

export function PaymentRow({ payment: p }: { payment: Payment }) {
  const t = useT();
  const f = useFormat();
  const navigation = useNavigation<RootNavigation>();
  const s = PAYMENT_STATUS[p.status];
  const payable = (p.status === "AWAITING_PAYMENT" || p.status === "REJECTED") && p.upi !== null;
  return (
    <Row
      title={p.description}
      lines={[
        `${t(PAYMENT_PURPOSE_LABEL[p.purpose])} · ${f.price(p.amount)}`,
        p.status === "REJECTED" && p.rejectionReason ? t("Reason: {reason}", { reason: p.rejectionReason }) : "",
        payable ? (p.status === "REJECTED" ? t("Review and resubmit") : t("Pay now")) : "",
      ]}
      badge={<Badge tone={s.tone}>{t(s.label)}</Badge>}
      onPress={() => navigation.navigate("Payment", { paymentId: p.id })}
      label={`${p.description}, ${f.price(p.amount)}, ${t(s.label)}`}
    />
  );
}

export function OrderRow({ order: o }: { order: OrderSummary }) {
  const t = useT();
  const f = useFormat();
  const navigation = useNavigation<RootNavigation>();
  const s = ORDER_STATUS[o.status];
  const title = t("Order {reference}", { reference: o.reference });
  return (
    <Row
      title={title}
      lines={[`${t("Placed {date}", { date: f.date(o.createdAt) })} · ${f.price(o.total)}`]}
      badge={<Badge tone={s.tone}>{t(s.label)}</Badge>}
      onPress={() => navigation.navigate("Order", { reference: o.reference })}
      label={`${title}, ${f.price(o.total)}, ${t(s.label)}`}
    />
  );
}

export function RegistrationRow({ registration: r }: { registration: ClassRegistration }) {
  const t = useT();
  const f = useFormat();
  const navigation = useNavigation<RootNavigation>();
  const s = REGISTRATION_STATUS[r.status];
  const paid = r.monthly?.paidUntil
    ? new Date(r.monthly.paidUntil).getTime() > Date.now()
      ? t("Paid until {date}", { date: f.shortDate(r.monthly.paidUntil) })
      : t("Next month not paid yet")
    : null;
  return (
    <Row
      title={r.class.title}
      lines={[
        [r.batch.name, t("Starts {date}", { date: f.dateTime(r.batch.startsAt) })].filter(Boolean).join(" · "),
        ...(paid ? [paid] : []),
      ]}
      badge={<Badge tone={s.tone}>{t(s.label)}</Badge>}
      onPress={() => navigation.navigate("MyClass", { id: r.id })}
      label={`${r.class.title}, ${t(s.label)}`}
    />
  );
}

export function CourseRow({ item }: { item: MyCourse }) {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  const s = ENROLMENT_STATUS[item.enrolment.status];
  const done = percent(item.completedLessons, item.course.lessonCount);
  const progress = t("{done} of {total} lessons completed", {
    done: item.completedLessons,
    total: item.course.lessonCount,
  });
  const open = () => {
    if (item.enrolment.status === "ACTIVE" && item.nextLessonId)
      navigation.navigate("Lesson", { slug: item.course.slug, lessonId: item.nextLessonId });
    else if (item.enrolment.status === "PENDING_PAYMENT" && item.enrolment.payment)
      navigation.navigate("Payment", { paymentId: item.enrolment.payment.id });
    else navigation.navigate("CourseDetail", { slug: item.course.slug });
  };
  return (
    <Row
      title={item.course.title}
      lines={[progress]}
      badge={
        <View style={{ gap: 8 }}>
          <View style={styles.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: done }}>
            <View style={[styles.fill, { width: `${done}%` }]} />
          </View>
          <Badge tone={s.tone}>{t(s.label)}</Badge>
        </View>
      }
      onPress={open}
      label={`${item.course.title}, ${progress}, ${t(s.label)}`}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.color.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.borderStrong,
  },
  pressed: { backgroundColor: theme.color.surfaceMuted },
  main: { flex: 1, gap: 4 },
  bar: { height: 6, borderRadius: 3, backgroundColor: theme.color.bgAlt, overflow: "hidden" },
  fill: { height: 6, backgroundColor: theme.color.primary },
});
