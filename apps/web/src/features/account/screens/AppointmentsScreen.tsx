import { Link, useSearchParams } from "react-router";
import { useMyAppointments, useT } from "@sdw/controllers";
import { ButtonLink, EmptyState, LoadingState, QueryState } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AccountPanel } from "../components/AccountPanel";
import { AppointmentItem } from "../components/Items";
import styles from "../components/Account.module.css";

export function AppointmentsScreen() {
  const t = useT();
  useDocumentTitle(t("Appointments"));
  const [params] = useSearchParams();
  const tab = params.get("tab") === "past" ? "past" : "upcoming";
  const appointments = useMyAppointments(tab);

  return (
    <AccountPanel
      title={t("Appointments")}
      action={
        <ButtonLink to="/book" size="sm" icon="calendar">
          {t("Book another")}
        </ButtonLink>
      }
    >
      <nav className={styles.tabs} aria-label={t("Appointments")}>
        <Link
          to="/account/appointments"
          className={`${styles.tab} ${tab === "upcoming" ? styles.tabActive : ""}`}
          aria-current={tab === "upcoming" ? "page" : undefined}
        >
          {t("Upcoming")}
        </Link>
        <Link
          to="/account/appointments?tab=past"
          className={`${styles.tab} ${tab === "past" ? styles.tabActive : ""}`}
          aria-current={tab === "past" ? "page" : undefined}
        >
          {t("Past & cancelled")}
        </Link>
      </nav>
      <QueryState
        query={appointments}
        loading={<LoadingState />}
        isEmpty={(page) => page.items.length === 0}
        empty={
          <EmptyState
            icon="calendar"
            title={t("No appointments yet")}
            action={<ButtonLink to="/book">{t("Book an appointment")}</ButtonLink>}
          >
            {t("Appointments you book while signed in will appear here.")}
          </EmptyState>
        }
      >
        {(page) => (
          <ul className={styles.list}>
            {page.items.map((a) => (
              <AppointmentItem key={a.id} appointment={a} />
            ))}
          </ul>
        )}
      </QueryState>
    </AccountPanel>
  );
}
