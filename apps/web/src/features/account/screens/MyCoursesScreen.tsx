import { useMyCourses, useT } from "@sdw/controllers";
import { ButtonLink, EmptyState, LoadingState, QueryState } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AccountPanel } from "../components/AccountPanel";
import { CourseProgress } from "../components/Items";
import styles from "../components/Account.module.css";

export function MyCoursesScreen() {
  const t = useT();
  useDocumentTitle(t("Courses"));
  const courses = useMyCourses();
  return (
    <AccountPanel
      title={t("Your courses")}
      action={
        <ButtonLink to="/courses" size="sm" variant="secondary">
          {t("Browse courses")}
        </ButtonLink>
      }
    >
      <QueryState
        query={courses}
        loading={<LoadingState />}
        empty={
          <EmptyState
            icon="book"
            title={t("No courses yet")}
            action={<ButtonLink to="/courses">{t("Browse courses")}</ButtonLink>}
          >
            {t("Courses you enrol in appear here, with your progress.")}
          </EmptyState>
        }
      >
        {(list) => (
          <ul className={styles.list}>
            {list.map((c) => (
              <CourseProgress key={c.enrolment.id} item={c} />
            ))}
          </ul>
        )}
      </QueryState>
    </AccountPanel>
  );
}
