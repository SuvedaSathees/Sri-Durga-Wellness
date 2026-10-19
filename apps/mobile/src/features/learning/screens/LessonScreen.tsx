/** Lesson player. Locked lessons (403 from the API) show no content at all. */
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useCourse, useLesson, useSession, useSetLessonComplete, useT } from "@sdw/controllers";
import { errorMessage, isApiError } from "@sdw/core";
import {
  Button,
  EmptyView,
  ErrorView,
  Icon,
  LoadingView,
  Markdown,
  Notice,
  Screen,
  Text,
} from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";
import { openWebPage } from "../../../platform/links";
import { theme } from "../../../theme";

export function LessonScreen({ route, navigation }: RootScreenProps<"Lesson">) {
  const t = useT();
  const { slug, lessonId } = route.params;
  const { status } = useSession();
  const course = useCourse(slug);
  const lesson = useLesson(slug, lessonId);
  const complete = useSetLessonComplete();
  const title = lesson.data?.title ?? course.data?.lessons.find((l) => l.id === lessonId)?.title;

  useEffect(() => {
    if (title) navigation.setOptions({ title });
  }, [title, navigation]);

  const locked =
    lesson.isError && isApiError(lesson.error) && (lesson.error.status === 403 || lesson.error.status === 401);

  if (lesson.isPending) return <LoadingView />;
  if (locked)
    return (
      <Screen>
        <EmptyView
          icon="lock-closed-outline"
          title={t("This lesson is locked")}
          body={`${t("Enrol in this course to watch this lesson.")} ${t("Paid lessons open as soon as the clinic has verified your payment.")}`}
          action={
            <Button icon="book-outline" onPress={() => navigation.navigate("CourseDetail", { slug })}>
              {t("View the course to enrol")}
            </Button>
          }
        />
      </Screen>
    );
  if (lesson.isError || !lesson.data)
    return (
      <Screen>
        <ErrorView error={lesson.error} onRetry={() => void lesson.refetch()} />
      </Screen>
    );

  const l = lesson.data;
  const videoUrl = l.video && /^https:\/\//i.test(l.video.embedUrl) ? l.video.embedUrl : null;

  return (
    <Screen onRefresh={() => lesson.refetch()}>
      {course.data ? <Text variant="eyebrow">{course.data.title}</Text> : null}
      <Text variant="h1">{l.title}</Text>
      <View style={styles.player}>
        <Icon name="videocam-outline" size={32} color={theme.color.onPrimary} />
        {videoUrl ? (
          <Button variant="light" icon="play-circle-outline" onPress={() => void openWebPage(videoUrl)}>
            {t("Play video")}
          </Button>
        ) : (
          <Text style={styles.playerText}>{t("The video for this lesson will be added soon.")}</Text>
        )}
      </View>
      {l.summary ? <Text variant="lead">{l.summary}</Text> : null}
      {l.notes ? <Markdown text={l.notes} /> : null}
      {status === "signedIn" ? (
        <Button
          variant={l.isCompleted ? "secondary" : "primary"}
          icon={l.isCompleted ? "checkmark-circle" : "checkmark"}
          loading={complete.isPending}
          onPress={() => complete.mutate({ lessonId: l.id, completed: !l.isCompleted })}
        >
          {l.isCompleted ? t("Completed — mark as not done") : t("Mark as complete")}
        </Button>
      ) : null}
      {complete.isError ? <Notice tone="danger">{t(errorMessage(complete.error))}</Notice> : null}
      <View style={styles.nav}>
        {l.previousLessonId ? (
          <Button
            variant="secondary"
            icon="chevron-back"
            onPress={() => navigation.replace("Lesson", { slug, lessonId: l.previousLessonId! })}
          >
            {t("Previous lesson")}
          </Button>
        ) : (
          <View />
        )}
        {l.nextLessonId ? (
          <Button
            iconAfter="chevron-forward"
            onPress={() => navigation.replace("Lesson", { slug, lessonId: l.nextLessonId! })}
          >
            {t("Next lesson")}
          </Button>
        ) : (
          <Button variant="secondary" onPress={() => navigation.navigate("CourseDetail", { slug })}>
            {t("Back to the course")}
          </Button>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  player: {
    aspectRatio: 16 / 9,
    borderRadius: theme.radius.lg,
    backgroundColor: "#1f2c24",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
  },
  playerText: { color: "#e3e9de", textAlign: "center" },
  nav: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginTop: 8 },
});
