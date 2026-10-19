/**
 * Lesson player. The API returns lesson content only when the viewer may open it; otherwise it
 * answers 403 and this screen shows a locked state with no lesson content at all.
 */
import { Link, useParams } from "react-router";
import { useCourse, useLesson, useSession, useSetLessonComplete, useT } from "@sdw/controllers";
import { errorMessage, isApiError, type Lesson } from "@sdw/core";
import {
  Button,
  ButtonLink,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  Markdown,
  Notice,
  PageHeader,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "../../classes/components/learning.module.css";

function Player({ lesson }: { lesson: Lesson }) {
  const t = useT();
  const url = lesson.video && /^https:\/\//i.test(lesson.video.embedUrl) ? lesson.video.embedUrl : null;
  return (
    <div className={styles.player}>
      {url ? (
        <iframe
          src={url}
          title={t("Video: {title}", { title: lesson.title })}
          allow="fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          loading="lazy"
        />
      ) : (
        <div className={styles.playerEmpty}>
          <Icon name="video" size={32} />
          <p>{t("The video for this lesson will be added soon.")}</p>
        </div>
      )}
    </div>
  );
}

function LessonBody({ slug, lesson }: { slug: string; lesson: Lesson }) {
  const t = useT();
  const { status } = useSession();
  const complete = useSetLessonComplete();
  return (
    <div className="stack">
      <Player lesson={lesson} />
      {lesson.summary ? <p className="lead">{lesson.summary}</p> : null}
      {lesson.notes ? <Markdown text={lesson.notes} /> : null}
      {status === "signedIn" ? (
        <div className="cluster">
          <Button
            variant={lesson.isCompleted ? "secondary" : "primary"}
            icon={lesson.isCompleted ? "checkCircle" : "check"}
            loading={complete.isPending}
            aria-pressed={lesson.isCompleted}
            onClick={() => complete.mutate({ lessonId: lesson.id, completed: !lesson.isCompleted })}
          >
            {lesson.isCompleted ? t("Completed — mark as not done") : t("Mark as complete")}
          </Button>
        </div>
      ) : null}
      {complete.isError ? <Notice tone="danger">{t(errorMessage(complete.error))}</Notice> : null}
      <nav className={styles.lessonNav} aria-label={t("Lessons")}>
        {lesson.previousLessonId ? (
          <ButtonLink to={`/learn/${slug}/${lesson.previousLessonId}`} variant="secondary" icon="chevronLeft">
            {t("Previous lesson")}
          </ButtonLink>
        ) : (
          <span />
        )}
        {lesson.nextLessonId ? (
          <ButtonLink to={`/learn/${slug}/${lesson.nextLessonId}`} iconAfter="chevronRight">
            {t("Next lesson")}
          </ButtonLink>
        ) : (
          <ButtonLink to={`/courses/${slug}`} variant="secondary">
            {t("Back to the course")}
          </ButtonLink>
        )}
      </nav>
    </div>
  );
}

export function LessonScreen() {
  const t = useT();
  const { slug = "", lessonId = "" } = useParams();
  const course = useCourse(slug);
  const lesson = useLesson(slug, lessonId);
  const outlineTitle = course.data?.lessons.find((l) => l.id === lessonId)?.title;
  useDocumentTitle(lesson.data?.title ?? outlineTitle ?? t("Lesson"));

  const locked =
    lesson.isError && isApiError(lesson.error) && (lesson.error.status === 403 || lesson.error.status === 401);

  return (
    <>
      <PageHeader
        eyebrow={course.data?.title ?? t("Lesson")}
        title={lesson.data?.title ?? outlineTitle ?? t("Lesson")}
        crumbs={[
          { label: t("Courses"), to: "/courses" },
          { label: course.data?.title ?? t("Course"), to: `/courses/${slug}` },
          { label: lesson.data?.title ?? outlineTitle ?? t("Lesson") },
        ]}
      />
      <section className="section">
        <div className="container container-narrow">
          {lesson.isPending ? (
            <LoadingState />
          ) : locked ? (
            <EmptyState
              icon="lock"
              title={t("This lesson is locked")}
              action={
                <ButtonLink to={`/courses/${slug}`} icon="book">
                  {t("View the course to enrol")}
                </ButtonLink>
              }
            >
              {t("Enrol in this course to watch this lesson.")}{" "}
              {t("Paid lessons open as soon as the clinic has verified your payment.")}
            </EmptyState>
          ) : lesson.isError || !lesson.data ? (
            <ErrorState error={lesson.error} onRetry={() => void lesson.refetch()} />
          ) : (
            <LessonBody slug={slug} lesson={lesson.data} />
          )}
          <p className="muted" style={{ marginTop: 24 }}>
            <Link to={`/courses/${slug}`}>{t("All lessons in this course")}</Link>
          </p>
        </div>
      </section>
    </>
  );
}
