import { Link, useParams } from "react-router";
import { useFormat, useMyOrder, useT } from "@sdw/controllers";
import { FULFILMENT_LABEL, ORDER_STATUS, PAYMENT_STATUS } from "@sdw/core";
import { Badge, ButtonLink, Facts, LoadingState, MediaImage, Notice, QueryState } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AccountPanel } from "../components/AccountPanel";
import styles from "../components/Account.module.css";

export function OrderScreen() {
  const t = useT();
  const f = useFormat();
  const { reference = "" } = useParams();
  const order = useMyOrder(reference);
  useDocumentTitle(t("Order {reference}", { reference }));

  return (
    <QueryState query={order} loading={<LoadingState />}>
      {(o) => {
        const status = ORDER_STATUS[o.status];
        const payment = o.payment;
        const payable =
          payment && (payment.status === "AWAITING_PAYMENT" || payment.status === "REJECTED") && payment.upi !== null;
        return (
          <>
            <AccountPanel
              title={t("Order {reference}", { reference: o.reference })}
              action={<Badge tone={status.tone}>{t(status.label)}</Badge>}
            >
              <p>
                <Link to="/account/orders">← {t("All orders")}</Link>
              </p>
              {status.description ? <p className="muted">{t(status.description)}</p> : null}
              {payable ? (
                <Notice
                  tone={payment.status === "REJECTED" ? "danger" : "warning"}
                  title={payment.status === "REJECTED" ? t("We couldn't verify your payment") : t("Payment pending")}
                  action={
                    <ButtonLink to={`/pay/${payment.id}`} size="sm">
                      {payment.status === "REJECTED" ? t("Review and resubmit") : t("Pay now")}
                    </ButtonLink>
                  }
                >
                  {payment.status === "REJECTED" && payment.rejectionReason
                    ? t("Reason: {reason}", { reason: payment.rejectionReason })
                    : o.paymentDueAt
                      ? t("Please complete payment by {date}.", { date: f.dateTime(o.paymentDueAt) })
                      : t("Please complete your payment.")}
                </Notice>
              ) : null}
              <Facts
                items={[
                  { label: t("Placed"), value: f.dateTime(o.createdAt) },
                  { label: t("Fulfilment"), value: t(FULFILMENT_LABEL[o.fulfilment]) },
                  o.pickupBranch
                    ? {
                        label: t("Pickup"),
                        value: `${o.pickupBranch.name}, ${o.pickupBranch.addressLine}, ${o.pickupBranch.city}`,
                      }
                    : false,
                  o.address
                    ? {
                        label: t("Delivery address"),
                        value: [
                          o.address.line1,
                          o.address.line2,
                          o.address.landmark,
                          o.address.city,
                          o.address.state,
                          o.address.pincode,
                        ]
                          .filter(Boolean)
                          .join(", "),
                      }
                    : false,
                  payment ? { label: t("Payment"), value: t(PAYMENT_STATUS[payment.status].label) } : false,
                  o.trackingInfo ? { label: t("Tracking"), value: o.trackingInfo } : false,
                  o.notes ? { label: t("Notes"), value: o.notes } : false,
                ]}
              />
            </AccountPanel>

            <AccountPanel title={t("Items in this order")}>
              <div className={styles.lines}>
                {o.items.map((item) => (
                  <div key={item.productId} className={styles.line}>
                    <div className={styles.thumb}>
                      <MediaImage
                        image={item.image}
                        fallback="/images/placeholders/product-default.webp"
                        ratio="1 / 1"
                      />
                    </div>
                    <div className={styles.itemMain}>
                      <span className={styles.itemTitle}>{item.name}</span>
                      <span className={styles.itemMeta}>
                        {[item.size, `${f.price(item.unitPrice)} × ${item.quantity}`].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <strong>{f.price(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
              <Facts
                items={[
                  { label: t("Subtotal"), value: f.price(o.subtotal) },
                  { label: t("Delivery"), value: o.deliveryFee ? f.price(o.deliveryFee) : t("Free") },
                  { label: t("Total"), value: f.price(o.total) },
                ]}
              />
            </AccountPanel>

            {o.events.length > 0 ? (
              <AccountPanel title={t("Progress")}>
                <ol className={styles.timeline}>
                  {[...o.events].reverse().map((e, i) => (
                    <li key={`${e.at}-${i}`}>
                      <span>
                        <strong>{t(ORDER_STATUS[e.status].label)}</strong>
                        <span className="muted"> · {f.dateTime(e.at)}</span>
                        {e.note ? <span className="muted"> · {t(e.note)}</span> : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </AccountPanel>
            ) : null}
          </>
        );
      }}
    </QueryState>
  );
}
