/** One recorded course. Lesson lock state comes from the API; enrolment sits in a sticky footer. */
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useCourse, useEnrol, useFormat, useSession, useSite, useT } from "@sdw/controllers";
import { accessPeriod, ENROLMENT_STATUS, errorMessage, LEVEL_LABEL, type Course } from "@sdw/core";
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

type Nav = RootScreenProps<"CourseDetail">["navigation"];

function Footer({ course, navigation }: { course: Course; navigation: Nav }) {
  const t = useT();
  const f = useFormat();
  const { status } = useSession();
  const site = useSite().data;
  const enrol = useEnrol(course.slug);
  const e = course.enrolment;
  const next = course.lessons.find((l) => !l.isLocked && !l.isCompleted) ?? course.lessons.find((l) => !l.isLocked);

  let button;
  if (e?.status === "ACTIVE") {
    button = next ? (
      <Button
        fullWidth
        icon="play-circle-outline"
        onPress={() => navigation.navigate("Lesson", { slug: course.slug, lessonId: next.id })}
      >
        {course.lessons.some((l) => l.isCompleted) ? t("Continue learning") : t("Start the course")}
      </Button>
    ) : null;
  } else if (e && (e.status === "PENDING_PAYMENT" || e.status === "PAYMENT_SUBMITTED") && e.payment) {
    const paymentId = e.payment.id;
    button = (
      <Button
        fullWidth
        variant={e.status === "PENDING_PAYMENT" ? "primary" : "secondary"}
        onPress={() => navigation.navigate("Payment", { paymentId })}
      >
        {e.status === "PENDING_PAYMENT" ? t("Complete payment") : t("View payment status")}
      </Button>
    );
  } else if (status === "signedOut") {
    button = (
      <Button fullWidth icon="person-outline" onPress={() => navigation.navigate("Login")}>
        {t("Sign in to enrol")}
      </Button>
    );
  } else if (course.price > 0 && site?.features.upiPayments === false) {
    button = (
      <View style={{ gap: 6 }}>
        <Button fullWidth disabled>
          {t("Enrol")}
        </Button>
        <Text variant="small">{t("Online payment isn't available yet. Please contact the clinic.")}</Text>
      </View>
    );
  } else {
    button = (
      <Button
        fullWidth
        loading={enrol.isPending}
        disabled={status === "loading"}
        onPress={() =>
          enrol.mutate(undefined, {
            onSuccess: ({ enrolment }) => {
              if (enrolment.payment && enrolment.status === "PENDING_PAYMENT")
                navigation.navigate("Payment", { paymentId: enrolment.payment.id });
            },
          })
        }
      >
        {course.price === 0 ? t("Enrol for free") : t("Enrol for {amount}", { amount: f.price(course.price) })}
      </Button>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {enrol.isError ? <Notice tone="danger">{t(errorMessage(enrol.error))}</Notice> : null}
      {e?.status === "PAYMENT_SUBMITTED" ? (
        <Text variant="small">{t("Lessons unlock as soon as the clinic has verified your payment.")}</Text>
      ) : null}
      {button}
    </View>
  );
}

export function CourseDetailScreen({ route, navigation }: RootScreenProps<"CourseDetail">) {
  const t = useT();
  const f = useFormat();
  const q = useCourse(route.params.slug);

  useEffect(() => {
    if (q.data) navigation.setOptions({ title: q.data.title });
  }, [q.data, navigation]);

  return (
    <Screen
      onRefresh={() => q.refetch()}
      footer={q.data ? <Footer course={q.data} navigation={navigation} /> : undefined}
    >
      <QueryView query={q}>
        {(course) => (
          <View style={{ gap: 20 }}>
            <MediaImage image={course.cover} fallback="course-default.webp" ratio={16 / 9} />
            <View style={{ gap: 8 }}>
              <View style={styles.row}>
                {course.category ? <Badge>{course.category}</Badge> : null}
                {course.enrolment ? (
                  <Badge tone={ENROLMENT_STATUS[course.enrolment.status].tone}>
                    {t(ENROLMENT_STATUS[course.enrolment.status].label)}
                  </Badge>
                ) : null}
              </View>
              <Text variant="h1">{course.title}</Text>
              <Text variant="lead">{course.summary}</Text>
            </View>
            <Card>
              <Facts
                items={[
                  { label: t("Price"), value: f.fee(course.price) },
                  {
                    label: t("Lessons"),
                    value:
                      course.lessonCount === 1 ? t("1 lesson") : t("{count} lessons", { count: course.lessonCount }),
                  },
                  {
                    label: t("Access"),
                    value: t(accessPeriod(course.accessDays).label, accessPeriod(course.accessDays).vars),
                  },
                  { label: t("Level"), value: t(LEVEL_LABEL[course.level]) },
                  course.enrolment?.status === "ACTIVE" && course.enrolment.accessExpiresAt
                    ? {
                        label: t("Access"),
                        value: t("Access until {date}", { date: f.shortDate(course.enrolment.accessExpiresAt) }),
                      }
                    : null,
                ]}
              />
            </Card>
            <Markdown text={course.description} />
            <Ticks title={t("What you'll learn")} items={course.outcomes} />
            <View style={{ gap: 4 }}>
              <Text variant="h2">{t("Lessons")}</Text>
              {course.lessons.map((l) => {
                const state = l.isCompleted
                  ? t("Completed")
                  : l.isLocked
                    ? t("Locked")
                    : l.isFreePreview
                      ? t("Free preview")
                      : t("Open");
                const meta = [l.durationMinutes ? f.duration(l.durationMinutes) : null, state]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <Pressable
                    key={l.id}
                    disabled={l.isLocked}
                    onPress={() => navigation.navigate("Lesson", { slug: course.slug, lessonId: l.id })}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: l.isLocked }}
                    accessibilityLabel={`${l.position}. ${l.title}. ${meta}`}
                    style={({ pressed }) => [
                      styles.lesson,
                      pressed ? { backgroundColor: theme.color.surfaceMuted } : null,
                    ]}
                  >
                    <View style={[styles.lessonIcon, l.isLocked ? { backgroundColor: theme.color.bgAlt } : null]}>
                      <Icon
                        name={
                          l.isCompleted
                            ? "checkmark-circle"
                            : l.isLocked
                              ? "lock-closed-outline"
                              : "play-circle-outline"
                        }
                        size={18}
                        color={l.isLocked ? theme.color.textMuted : theme.color.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="label">
                        {l.position}. {l.title}
                      </Text>
                      <Text variant="caption">{meta}</Text>
                    </View>
                    {l.isLocked ? null : <Icon name="chevron-forward" size={18} color={theme.color.textMuted} />}
                  </Pressable>
                );
              })}
            </View>
            {course.instructor ? (
              <View style={{ gap: 6 }}>
                <Text variant="h3">{t("Your instructor")}</Text>
                <Text variant="label">{course.instructor.name}</Text>
                {course.instructor.bio ? <Text variant="small">{course.instructor.bio}</Text> : null}
              </View>
            ) : null}
          </View>
        )}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  lesson: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.borderStrong,
  },
  lessonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.color.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
