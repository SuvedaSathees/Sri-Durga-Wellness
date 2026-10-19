import { Link } from "react-router";
import { useMyAppointments, useMyCourses, useMyOrders, useMyPayments, useT } from "@sdw/controllers";
import { Icon, LoadingState, QueryState, type IconName } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AccountPanel } from "../components/AccountPanel";
import { AppointmentItem, CourseProgress, OrderItem, PaymentItem } from "../components/Items";
import styles from "../components/Account.module.css";

export function OverviewScreen() {
  const t = useT();
  useDocumentTitle(t("My account"));
  const appointments = useMyAppointments("upcoming");
  const payments = useMyPayments(true);
  const courses = useMyCourses();
  const orders = useMyOrders({ pageSize: 3 });
  const quick: Array<{ to: string; label: string; icon: IconName }> = [
    { to: "/book", label: t("Book an appointment"), icon: "calendar" },
    { to: "/classes", label: t("Browse live classes"), icon: "video" },
    { to: "/courses", label: t("Browse courses"), icon: "book" },
    { to: "/shop", label: t("Visit the shop"), icon: "cart" },
  ];

  return (
    <>
      {payments.data && payments.data.length > 0 ? (
        <AccountPanel title={t("Action needed")} action={<Link to="/account/payments">{t("All payments")}</Link>}>
          <ul className={styles.list}>
            {payments.data.map((p) => (
              <PaymentItem key={p.id} payment={p} />
            ))}
          </ul>
        </AccountPanel>
      ) : null}

      <AccountPanel
        title={t("Upcoming appointments")}
        action={<Link to="/account/appointments">{t("All appointments")}</Link>}
      >
        <QueryState
          query={appointments}
          loading={<LoadingState />}
          isEmpty={(page) => page.items.length === 0}
          empty={
            <p className="muted">
              {t("No upcoming appointments.")} <Link to="/book">{t("Book one now")}</Link>
            </p>
          }
        >
          {(page) => (
            <ul className={styles.list}>
              {page.items.slice(0, 3).map((a) => (
                <AppointmentItem key={a.id} appointment={a} />
              ))}
            </ul>
          )}
        </QueryState>
      </AccountPanel>

      <div className={styles.grid}>
        <AccountPanel title={t("Recent orders")} action={<Link to="/account/orders">{t("All orders")}</Link>}>
          <QueryState
            query={orders}
            loading={<LoadingState />}
            isEmpty={(p) => p.items.length === 0}
            empty={<p className="muted">{t("You haven't placed any orders yet.")}</p>}
          >
            {(page) => (
              <ul className={styles.list}>
                {page.items.map((o) => (
                  <OrderItem key={o.id} order={o} />
                ))}
              </ul>
            )}
          </QueryState>
        </AccountPanel>

        <AccountPanel title={t("Your courses")} action={<Link to="/account/courses">{t("View all")}</Link>}>
          <QueryState
            query={courses}
            loading={<LoadingState />}
            empty={<p className="muted">{t("You haven't enrolled in a course yet.")}</p>}
          >
            {(list) => (
              <ul className={styles.list}>
                {list.slice(0, 3).map((c) => (
                  <CourseProgress key={c.enrolment.id} item={c} />
                ))}
              </ul>
            )}
          </QueryState>
        </AccountPanel>
      </div>

      <AccountPanel title={t("Quick links")}>
        <div className={styles.quick}>
          {quick.map((q) => (
            <Link key={q.to} to={q.to} className={styles.quickLink}>
              <Icon name={q.icon} size={20} />
              <span>{q.label}</span>
            </Link>
          ))}
        </div>
      </AccountPanel>
    </>
  );
}
