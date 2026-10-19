import { useSearchParams } from "react-router";
import { useMyOrders, useT } from "@sdw/controllers";
import { ButtonLink, EmptyState, LoadingState, Pagination, QueryState } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AccountPanel } from "../components/AccountPanel";
import { OrderItem } from "../components/Items";
import styles from "../components/Account.module.css";

export function OrdersScreen() {
  const t = useT();
  useDocumentTitle(t("Orders"));
  const [params] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const orders = useMyOrders({ page, pageSize: 10 });
  return (
    <AccountPanel title={t("Your orders")}>
      <QueryState
        query={orders}
        loading={<LoadingState />}
        isEmpty={(p) => p.items.length === 0}
        empty={
          <EmptyState
            icon="cart"
            title={t("No orders yet")}
            action={<ButtonLink to="/shop">{t("Visit the shop")}</ButtonLink>}
          >
            {t("Your shop orders and their status will appear here.")}
          </EmptyState>
        }
      >
        {(p) => (
          <>
            <ul className={styles.list}>
              {p.items.map((o) => (
                <OrderItem key={o.id} order={o} />
              ))}
            </ul>
            <Pagination
              page={p.page}
              pageSize={p.pageSize}
              total={p.total}
              hrefFor={(n) => `/account/orders?page=${n}`}
            />
          </>
        )}
      </QueryState>
    </AccountPanel>
  );
}
