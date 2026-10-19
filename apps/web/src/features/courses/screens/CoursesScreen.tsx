/** Recorded courses, optionally filtered by category (?category=Breathwork — shareable). */
import { Link, useSearchParams } from "react-router";
import { useCourses, useT } from "@sdw/controllers";
import { CourseCard } from "../../../components/cards/Cards";
import { EmptyState, LoadingCards, PageHeader, QueryState } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "../../classes/components/learning.module.css";

export function CoursesScreen() {
  const t = useT();
  const [params] = useSearchParams();
  const category = params.get("category") ?? undefined;
  const all = useCourses();
  const courses = useCourses(category);
  useDocumentTitle(t("Courses"));
  const categories = [...new Set((all.data ?? []).map((c) => c.category).filter((c): c is string => !!c))];

  return (
    <>
      <PageHeader
        eyebrow={t("Recorded courses")}
        title={t("Learn at your own pace")}
        intro={t(
          "Short video lessons you can return to whenever you need. Every course shows its access period, and the first lesson is free to preview.",
        )}
        crumbs={[{ label: t("Courses") }]}
      />
      <section className="section">
        <div className="container">
          {categories.length > 1 ? (
            <nav aria-label={t("Course categories")} className={styles.filters}>
              <Link
                to="/courses"
                className={`${styles.chip} ${!category ? styles.chipOn : ""}`}
                aria-current={!category ? "page" : undefined}
              >
                {t("All courses")}
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  to={`/courses?category=${encodeURIComponent(c)}`}
                  className={`${styles.chip} ${category === c ? styles.chipOn : ""}`}
                  aria-current={category === c ? "page" : undefined}
                >
                  {c}
                </Link>
              ))}
            </nav>
          ) : null}
          <QueryState
            query={courses}
            loading={<LoadingCards count={3} />}
            empty={
              <EmptyState title={t("No courses here yet")}>
                {t("New courses will appear here as soon as they are published.")}
              </EmptyState>
            }
          >
            {(list) => (
              <div className="grid-cards">
                {list.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            )}
          </QueryState>
        </div>
      </section>
    </>
  );
}
