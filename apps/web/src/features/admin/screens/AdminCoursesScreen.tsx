import { Link } from "react-router";
import { useAdminCourses, useFormat, useT } from "@sdw/controllers";
import { accessPeriod } from "@sdw/core";
import { ButtonLink, EmptyState, LoadingState, QueryState } from "../../../components/ui";
import { AccountPanel } from "../../account/components/AccountPanel";
import accountStyles from "../../account/components/Account.module.css";
import { VisibilityBadges } from "../components/AdminUi";

export function AdminCoursesScreen() {
  const t = useT();
  const f = useFormat();
  const courses = useAdminCourses();
  return (
    <AccountPanel
      title={t("Recorded courses")}
      action={
        <ButtonLink to="/admin/courses/new" size="sm" icon="plus">
          {t("Add a course")}
        </ButtonLink>
      }
    >
      <QueryState
        query={courses}
        loading={<LoadingState />}
        empty={<EmptyState icon="book" title={t("No courses yet")} />}
      >
        {(list) => (
          <ul className={accountStyles.list}>
            {list.map((c) => {
              const access = accessPeriod(c.accessDays);
              return (
                <li key={c.id} className={accountStyles.item}>
                  <div className={accountStyles.itemMain}>
                    <Link to={`/admin/courses/${c.id}`} className={accountStyles.itemTitle}>
                      {c.title}
                    </Link>
                    <span className={accountStyles.itemMeta}>
                      {f.fee(c.price)} · {t(access.label, access.vars)}
                    </span>
                    <span className={accountStyles.itemMeta}>
                      {t("{count} lessons", { count: c.lessonCount })} ·{" "}
                      {t("{count} active students", { count: c.activeStudents })}
                    </span>
                  </div>
                  <div className={accountStyles.itemSide}>
                    <VisibilityBadges isPublished={c.isPublished} isSample={c.isSample} />
                    <Link to={`/admin/courses/${c.id}`} className={accountStyles.itemMeta}>
                      {t("Edit")}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </QueryState>
    </AccountPanel>
  );
}
