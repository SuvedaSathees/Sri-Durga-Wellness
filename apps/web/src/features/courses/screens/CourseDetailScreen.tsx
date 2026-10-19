/**
 * One recorded course: outcomes, instructor, access period, price and the lesson outline.
 * Which lessons are open is decided by the API (`isLocked`) — never by the app.
 */
import { Link, useNavigate, useParams } from "react-router";
import { useCourse, useEnrol, useFormat, useSession, useSite, useT } from "@sdw/controllers";
import { accessPeriod, ENROLMENT_STATUS, errorMessage, LEVEL_LABEL, type Course } from "@sdw/core";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Facts,
  Icon,
  LoadingState,
  Markdown,
  MediaImage,
  Notice,
  PageHeader,
  QueryState,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "../../classes/components/learning.module.css";

function EnrolPanel({ course }: { course: Course }) {
  const t = useT();
  const f = useFormat();
  const navigate = useNavigate();
  const { status } = useSession();
  const site = useSite().data;
  const enrol = useEnrol(course.slug);
  const e = course.enrolment;
  const firstOpen =
    course.lessons.find((l) => !l.isLocked && !l.isCompleted) ?? course.lessons.find((l) => !l.isLocked);
  const period = accessPeriod(course.accessDays);
  const access = t(period.label, period.vars);

  let action;
  if (e && e.status === "ACTIVE") {
    action = firstOpen ? (
      <ButtonLink to={`/learn/${course.slug}/${firstOpen.id}`} fullWidth icon="play">
        {course.lessons.some((l) => l.isCompleted) ? t("Continue learning") : t("Start the course")}
      </ButtonLink>
    ) : null;
  } else if (e && (e.status === "PENDING_PAYMENT" || e.status === "PAYMENT_SUBMITTED")) {
    action = e.payment ? (
      <ButtonLink
        to={`/pay/${e.payment.id}`}
        fullWidth
        variant={e.status === "PENDING_PAYMENT" ? "primary" : "secondary"}
      >
        {e.status === "PENDING_PAYMENT" ? t("Complete payment") : t("View payment status")}
      </ButtonLink>
    ) : null;
  } else if (status === "signedOut") {
    action = (
      <ButtonLink to={`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`} fullWidth icon="user">
        {t("Sign in to enrol")}
      </ButtonLink>
    );
  } else if (course.price > 0 && site?.features.upiPayments === false) {
    action = (
      <>
        <Button fullWidth disabled>
          {t("Enrol")}
        </Button>
        <p className="muted">{t("Online payment isn't available yet. Please contact the clinic.")}</p>
      </>
    );
  } else {
    action = (
      <Button
        fullWidth
        loading={enrol.isPending}
        disabled={status === "loading"}
        onClick={() =>
          enrol.mutate(undefined, {
            onSuccess: ({ enrolment }) => {
              if (enrolment.payment && enrolment.status === "PENDING_PAYMENT") navigate(`/pay/${enrolment.payment.id}`);
            },
          })
        }
      >
        {course.price === 0 ? t("Enrol for free") : t("Enrol for {amount}", { amount: f.price(course.price) })}
      </Button>
    );
  }

  return (
    <Card>
      <div className="stack">
        <span className={styles.priceTag}>{f.fee(course.price)}</span>
        {e ? (
          <div className="cluster">
            <Badge tone={ENROLMENT_STATUS[e.status].tone}>{t(ENROLMENT_STATUS[e.status].label)}</Badge>
            {e.status === "ACTIVE" && e.accessExpiresAt ? (
              <span className="muted">{t("Access until {date}", { date: f.shortDate(e.accessExpiresAt) })}</span>
            ) : null}
          </div>
        ) : null}
        <Facts
          items={[
            {
              label: t("Lessons"),
              value: course.lessonCount === 1 ? t("1 lesson") : t("{count} lessons", { count: course.lessonCount }),
            },
            { label: t("Access"), value: access },
            { label: t("Level"), value: t(LEVEL_LABEL[course.level]) },
            course.language ? { label: t("Language"), value: course.language } : null,
          ]}
        />
        {action}
        {e?.status === "PAYMENT_SUBMITTED" ? (
          <p className="muted">{t("Lessons unlock as soon as the clinic has verified your payment.")}</p>
        ) : null}
        {enrol.isError ? <Notice tone="danger">{t(errorMessage(enrol.error))}</Notice> : null}
      </div>
    </Card>
  );
}

function Outline({ course }: { course: Course }) {
  const t = useT();
  const f = useFormat();
  return (
    <ol className={styles.lessons} aria-label={t("Lessons")}>
      {course.lessons.map((l) => {
        const state = l.isCompleted
          ? t("Completed")
          : l.isLocked
            ? t("Locked")
            : l.isFreePreview
              ? t("Free preview")
              : t("Open");
        const content = (
          <>
            <span className={styles.lessonIcon} aria-hidden="true">
              <Icon name={l.isCompleted ? "check" : l.isLocked ? "lock" : "play"} size={16} />
            </span>
            <span className={styles.lessonText}>
              <span>
                {l.position}. {l.title}
              </span>
              <span className={styles.lessonMeta}>
                {l.durationMinutes ? <span>{f.duration(l.durationMinutes)}</span> : null}
                <span>{state}</span>
              </span>
            </span>
            {l.isLocked ? null : <Icon name="chevronRight" size={18} />}
          </>
        );
        const cls = `${styles.lesson} ${l.isLocked ? styles.lessonLocked : ""} ${l.isCompleted ? styles.lessonDone : ""}`;
        return (
          <li key={l.id} className={cls}>
            {l.isLocked ? (
              <span className={styles.lessonRow}>{content}</span>
            ) : (
              <Link to={`/learn/${course.slug}/${l.id}`} className={styles.lessonRow}>
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function CourseDetail({ course }: { course: Course }) {
  const t = useT();
  useDocumentTitle(course.title);
  return (
    <>
      <PageHeader
        eyebrow={course.category ?? t("Recorded courses")}
        title={course.title}
        intro={course.summary}
        crumbs={[{ label: t("Courses"), to: "/courses" }, { label: course.title }]}
      />
      <section className="section">
        <div className={`container ${styles.layout}`}>
          <div className={styles.main}>
            <MediaImage
              image={course.cover}
              fallback="/images/placeholders/course-default.webp"
              ratio="16 / 9"
              className={styles.player}
              priority
            />
            <Markdown text={course.description} />
            {course.outcomes.length ? (
              <div className={styles.block}>
                <h2>{t("What you'll learn")}</h2>
                <ul className={styles.ticks}>
                  {course.outcomes.map((o) => (
                    <li key={o}>
                      <Icon name="check" size={16} />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className={styles.block}>
              <h2>{t("Lessons")}</h2>
              <Outline course={course} />
            </div>
            {course.instructor ? (
              <div className={styles.block}>
                <h2>{t("Your instructor")}</h2>
                <p>
                  <strong>{course.instructor.name}</strong>
                </p>
                {course.instructor.bio ? <p className="muted">{course.instructor.bio}</p> : null}
              </div>
            ) : null}
          </div>
          <aside className={styles.aside} aria-label={t("Enrolment")}>
            <EnrolPanel course={course} />
          </aside>
        </div>
      </section>
    </>
  );
}

export function CourseDetailScreen() {
  const { slug = "" } = useParams();
  const q = useCourse(slug);
  return (
    <QueryState query={q} loading={<LoadingState />}>
      {(course) => <CourseDetail course={course} />}
    </QueryState>
  );
}
