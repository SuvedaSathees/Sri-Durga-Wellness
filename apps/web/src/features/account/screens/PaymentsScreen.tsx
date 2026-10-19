import { useMyPayments, useT } from "@sdw/controllers";
import { EmptyState, LoadingState, Notice, QueryState } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AccountPanel } from "../components/AccountPanel";
import { PaymentItem } from "../components/Items";
import styles from "../components/Account.module.css";

export function PaymentsScreen() {
  const t = useT();
  useDocumentTitle(t("Payments"));
  const payments = useMyPayments(false);
  return (
    <AccountPanel title={t("Payments")}>
      <Notice tone="info">
        {t(
          "Every UPI payment is checked by our team before it is marked as verified — usually within one working day.",
        )}
      </Notice>
      <QueryState
        query={payments}
        loading={<LoadingState />}
        empty={
          <EmptyState icon="upi" title={t("No payments yet")}>
            {t("Payments for orders, classes and courses will appear here.")}
          </EmptyState>
        }
      >
        {(list) => (
          <ul className={styles.list}>
            {list.map((p) => (
              <PaymentItem key={p.id} payment={p} />
            ))}
          </ul>
        )}
      </QueryState>
    </AccountPanel>
  );
}
