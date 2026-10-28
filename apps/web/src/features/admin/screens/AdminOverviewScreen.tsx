import { Link } from "react-router";
import { useAdminOverview, useAdminPayments, useFormat, useT } from "@sdw/controllers";
import { PAYMENT_PURPOSE_LABEL } from "@sdw/core";
import { ButtonLink, EmptyState, LoadingState, QueryState } from "../../../components/ui";
import { AccountPanel } from "../../account/components/AccountPanel";
import accountStyles from "../../account/components/Account.module.css";
import { StatTile } from "../components/AdminUi";
import styles from "../components/Admin.module.css";

export function AdminOverviewScreen() {
  const t = useT();
  const f = useFormat();
  const overview = useAdminOverview();
  const toCheck = useAdminPayments("SUBMITTED");

  return (
    <>
      <QueryState query={overview} loading={<LoadingState />}>
        {(o) => (
          <div className={styles.stats}>
            <StatTile
              to="/admin/payments"
              value={o.paymentsToCheck}
              label={t("Payments to check")}
              hint={t("UPI references customers have sent")}
              attention={o.paymentsToCheck > 0}
            />
            <StatTile
              to="/admin/orders?status=CONFIRMED"
              value={o.ordersToPrepare}
              label={t("Orders to prepare")}
              hint={t("Paid orders to pack, ship or hand over")}
              attention={o.ordersToPrepare > 0}
            />
            <StatTile
              to="/admin/classes"
              value={o.upcomingBatches}
              label={t("Upcoming batches")}
              hint={t("Live class batches not started yet")}
            />
            <StatTile
              to="/admin/products"
              value={o.lowStockProducts}
              label={t("Low on stock")}
              hint={t("Products with 5 or fewer left")}
              attention={o.lowStockProducts > 0}
            />
          </div>
        )}
      </QueryState>

      <AccountPanel
        title={t("Payments to check")}
        action={
          <ButtonLink to="/admin/payments" variant="secondary" size="sm">
            {t("Open payments")}
          </ButtonLink>
        }
      >
        <QueryState
          query={toCheck}
          loading={<LoadingState />}
          empty={
            <EmptyState icon="checkCircle" title={t("All caught up")}>
              {t("No UPI payments are waiting to be checked.")}
            </EmptyState>
          }
        >
          {(list) => (
            <ul className={accountStyles.list}>
              {list.slice(0, 5).map((p) => (
                <li key={p.id} className={accountStyles.item}>
                  <div className={accountStyles.itemMain}>
                    <span className={accountStyles.itemTitle}>{p.description}</span>
                    <span className={accountStyles.itemMeta}>
                      {p.customer.name} · {t(PAYMENT_PURPOSE_LABEL[p.purpose])} · {f.price(p.amount)}
                    </span>
                    {p.submittedAt ? (
                      <span className={accountStyles.itemMeta}>
                        {t("Sent {date}", { date: f.dateTime(p.submittedAt) })}
                      </span>
                    ) : null}
                  </div>
                  <div className={accountStyles.itemSide}>
                    <Link to="/admin/payments">{t("Check")}</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </QueryState>
      </AccountPanel>

      <AccountPanel title={t("Add something new")}>
        <div className={accountStyles.quick}>
          <Link to="/admin/classes/new" className={accountStyles.quickLink}>
            {t("New live class")}
          </Link>
          <Link to="/admin/products/new" className={accountStyles.quickLink}>
            {t("New product")}
          </Link>
          <Link to="/admin/courses/new" className={accountStyles.quickLink}>
            {t("New course")}
          </Link>
        </div>
      </AccountPanel>
    </>
  );
}
