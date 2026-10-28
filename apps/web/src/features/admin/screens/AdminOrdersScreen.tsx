import { Link, useSearchParams } from "react-router";
import { useAdminOrders, useFormat, useT } from "@sdw/controllers";
import { FULFILMENT_LABEL, ORDER_STATUS, PAYMENT_STATUS, type OrderStatus } from "@sdw/core";
import { Badge, EmptyState, LoadingState, Pagination, QueryState, SelectField } from "../../../components/ui";
import { AccountPanel } from "../../account/components/AccountPanel";
import accountStyles from "../../account/components/Account.module.css";
import styles from "../components/Admin.module.css";

const FILTERS: Array<{ value: OrderStatus | ""; label: string }> = [
  { value: "", label: "All orders" },
  { value: "CONFIRMED", label: "Paid — ready to pack" },
  { value: "PROCESSING", label: "Being prepared" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "READY_FOR_PICKUP", label: "Ready for pickup" },
  { value: "PAYMENT_SUBMITTED", label: "Verifying payment" },
  { value: "PENDING_PAYMENT", label: "Payment pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];

export function AdminOrdersScreen() {
  const t = useT();
  const f = useFormat();
  const [params, setParams] = useSearchParams();
  const status = (FILTERS.find((x) => x.value === params.get("status"))?.value ?? "") as OrderStatus | "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const orders = useAdminOrders({ ...(status ? { status } : {}), page, pageSize: 20 });

  return (
    <AccountPanel title={t("Orders")}>
      <div className={styles.toolbar}>
        <div className={styles.filter}>
          <SelectField
            label={t("Show")}
            required
            value={status}
            onChange={(v) => setParams(v ? { status: v } : {}, { replace: true })}
            options={FILTERS.map((x) => ({ value: x.value, label: t(x.label) }))}
          />
        </div>
      </div>
      <QueryState
        query={orders}
        loading={<LoadingState />}
        isEmpty={(d) => d.items.length === 0}
        empty={
          <EmptyState icon="cart" title={t("No orders here")}>
            {status ? t("Try another filter.") : t("Orders from the shop will appear here.")}
          </EmptyState>
        }
      >
        {(data) => (
          <>
            <ul className={accountStyles.list}>
              {data.items.map((o) => {
                const meta = ORDER_STATUS[o.status];
                const pay = o.paymentStatus ? PAYMENT_STATUS[o.paymentStatus] : null;
                return (
                  <li key={o.id} className={accountStyles.item}>
                    <div className={accountStyles.itemMain}>
                      <Link to={`/admin/orders/${encodeURIComponent(o.reference)}`} className={accountStyles.itemTitle}>
                        {t("Order {reference}", { reference: o.reference })}
                      </Link>
                      <span className={accountStyles.itemMeta}>
                        {o.customerName} · {t(FULFILMENT_LABEL[o.fulfilment])}
                      </span>
                      <span className={accountStyles.itemMeta}>
                        {f.dateTime(o.createdAt)} ·{" "}
                        {o.itemCount === 1
                          ? t("{count} item", { count: o.itemCount })
                          : t("{count} items", { count: o.itemCount })}{" "}
                        · <strong>{f.price(o.total)}</strong>
                      </span>
                    </div>
                    <div className={accountStyles.itemSide}>
                      <Badge tone={meta.tone}>{t(meta.label)}</Badge>
                      {pay && o.status !== "CANCELLED" && o.status !== "EXPIRED" ? (
                        <span className={accountStyles.itemMeta}>
                          {t("Payment: {status}", { status: t(pay.label) })}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              hrefFor={(p) =>
                `/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), page: String(p) })}`
              }
            />
          </>
        )}
      </QueryState>
    </AccountPanel>
  );
}
