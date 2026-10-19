import { useMyRegistrations, useT } from "@sdw/controllers";
import { ButtonLink, EmptyState, LoadingState, QueryState } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AccountPanel } from "../components/AccountPanel";
import { RegistrationItem } from "../components/Items";
import styles from "../components/Account.module.css";

export function MyClassesScreen() {
  const t = useT();
  useDocumentTitle(t("Live classes"));
  const registrations = useMyRegistrations();
  return (
    <AccountPanel
      title={t("Live class registrations")}
      action={
        <ButtonLink to="/classes" size="sm" variant="secondary">
          {t("Find more classes")}
        </ButtonLink>
      }
    >
      <QueryState
        query={registrations}
        loading={<LoadingState />}
        empty={
          <EmptyState
            icon="video"
            title={t("No class registrations yet")}
            action={<ButtonLink to="/classes">{t("Browse live classes")}</ButtonLink>}
          >
            {t("When you register for a live class, its status and private joining link appear here.")}
          </EmptyState>
        }
      >
        {(list) => (
          <ul className={styles.list}>
            {list.map((r) => (
              <RegistrationItem key={r.id} registration={r} />
            ))}
          </ul>
        )}
      </QueryState>
    </AccountPanel>
  );
}
