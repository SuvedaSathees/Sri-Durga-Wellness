import { Link } from "react-router";
import { useAdminClasses, useFormat, useT } from "@sdw/controllers";
import { ButtonLink, EmptyState, LoadingState, QueryState } from "../../../components/ui";
import { AccountPanel } from "../../account/components/AccountPanel";
import accountStyles from "../../account/components/Account.module.css";
import { VisibilityBadges } from "../components/AdminUi";

export function AdminClassesScreen() {
  const t = useT();
  const f = useFormat();
  const classes = useAdminClasses();
  return (
    <AccountPanel
      title={t("Live classes")}
      action={
        <ButtonLink to="/admin/classes/new" size="sm" icon="plus">
          {t("Add a class")}
        </ButtonLink>
      }
    >
      <QueryState
        query={classes}
        loading={<LoadingState />}
        empty={
          <EmptyState icon="video" title={t("No classes yet")}>
            {t("Add a class, then add batches with dates and the Google Meet link.")}
          </EmptyState>
        }
      >
        {(list) => (
          <ul className={accountStyles.list}>
            {list.map((c) => (
              <li key={c.id} className={accountStyles.item}>
                <div className={accountStyles.itemMain}>
                  <Link to={`/admin/classes/${c.id}`} className={accountStyles.itemTitle}>
                    {c.title}
                  </Link>
                  <span className={accountStyles.itemMeta}>
                    {f.classFee(c.fee, c.feeType)} ·{" "}
                    {c.nextBatchStartsAt
                      ? t("Next batch {date}", { date: f.dateTime(c.nextBatchStartsAt) })
                      : t("No upcoming batch")}
                  </span>
                  <span className={accountStyles.itemMeta}>
                    {t("{count} batches", { count: c.batchCount })} ·{" "}
                    {t("{count} confirmed students", { count: c.confirmedStudents })}
                  </span>
                </div>
                <div className={accountStyles.itemSide}>
                  <VisibilityBadges isPublished={c.isPublished} isSample={c.isSample} />
                  <Link to={`/admin/classes/${c.id}`} className={accountStyles.itemMeta}>
                    {t("Edit")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </AccountPanel>
  );
}
