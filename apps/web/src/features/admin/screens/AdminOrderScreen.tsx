import { useState } from "react";
import { Link, useParams } from "react-router";
import { useAdminOrder, useForm, useFormat, useT, useUpdateOrderStatus } from "@sdw/controllers";
import {
  FULFILMENT_LABEL,
  ORDER_ACTION_LABEL,
  ORDER_STATUS,
  orderStatusSchema,
  PAYMENT_STATUS,
  type AdminOrder,
  type OrderStatus,
} from "@sdw/core";
import {
  Badge,
  Button,
  Dialog,
  Facts,
  FormError,
  LoadingState,
  Notice,
  QueryState,
  TextArea,
  TextField,
  useToast,
} from "../../../components/ui";
import { AccountPanel } from "../../account/components/AccountPanel";
import accountStyles from "../../account/components/Account.module.css";
import styles from "../components/Admin.module.css";

function StatusDialog({ order, status, onClose }: { order: AdminOrder; status: OrderStatus; onClose: () => void }) {
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const update = useUpdateOrderStatus(order.reference);
  const form = useForm(orderStatusSchema, { status, note: "", trackingInfo: "" });
  const cancelling = status === "CANCELLED";
  const paid = order.payment?.status === "VERIFIED";
  const submit = form.handleSubmit(async (body) => {
    await update.mutateAsync(body);
    toast(t("Order updated"));
    onClose();
  });
  return (
    <Dialog
      open
      onClose={onClose}
      title={t(ORDER_ACTION_LABEL[status] ?? "Update order")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Not now")}
          </Button>
          <Button variant={cancelling ? "danger" : "primary"} onClick={() => void submit()} loading={form.submitting}>
            {t(ORDER_ACTION_LABEL[status] ?? "Update order")}
          </Button>
        </>
      }
    >
      {cancelling ? (
        <Notice tone="warning">
          {paid
            ? t(
                "This order is paid. The website doesn't send refunds — please refund {amount} to the customer from the clinic's bank account.",
                { amount: f.price(order.total) },
              )
            : t("The items go back into stock and the customer can't pay for this order any more.")}
        </Notice>
      ) : null}
      <FormError message={form.formError} />
      {status === "SHIPPED" ? (
        <TextField
          label={t("Courier and tracking number")}
          hint={t("The customer sees this on their order.")}
          value={form.values.trackingInfo ?? ""}
          onChange={(v) => form.setField("trackingInfo", v)}
          error={form.errorFor("trackingInfo")}
        />
      ) : null}
      <TextArea
        label={cancelling ? t("Reason for the customer") : t("Note for the customer")}
        rows={3}
        value={form.values.note ?? ""}
        onChange={(v) => form.setField("note", v)}
        error={form.errorFor("note")}
      />
    </Dialog>
  );
}

export function AdminOrderScreen() {
  const t = useT();
  const f = useFormat();
  const { reference = "" } = useParams();
  const order = useAdminOrder(reference);
  const [action, setAction] = useState<OrderStatus | null>(null);

  return (
    <QueryState query={order} loading={<LoadingState />}>
      {(o) => {
        const meta = ORDER_STATUS[o.status];
        const pay = o.payment ? PAYMENT_STATUS[o.payment.status] : null;
        return (
          <>
            <AccountPanel
              title={t("Order {reference}", { reference: o.reference })}
              action={<Badge tone={meta.tone}>{t(meta.label)}</Badge>}
            >
              <p>
                <Link to="/admin/orders">← {t("All orders")}</Link>
              </p>
              {o.status === "PAYMENT_SUBMITTED" ? (
                <Notice tone="info" action={<Link to="/admin/payments">{t("Check the payment")}</Link>}>
                  {t("The customer has sent their UPI reference. Verify the payment before packing this order.")}
                </Notice>
              ) : null}
              {o.nextStatuses.length > 0 ? (
                <div className={styles.formActions}>
                  {o.nextStatuses.map((s) => (
                    <Button key={s} variant={s === "CANCELLED" ? "secondary" : "primary"} onClick={() => setAction(s)}>
                      {t(ORDER_ACTION_LABEL[s] ?? "Update order")}
                    </Button>
                  ))}
                </div>
              ) : null}
              <Facts
                items={[
                  { label: t("Placed"), value: f.dateTime(o.createdAt) },
                  { label: t("Customer"), value: o.contact.name },
                  { label: t("Mobile number"), value: o.contact.phone },
                  { label: t("Email"), value: o.contact.email },
                  { label: t("Delivery"), value: t(FULFILMENT_LABEL[o.fulfilment]) },
                  o.address
                    ? {
                        label: t("Address"),
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
                  o.pickupBranch ? { label: t("Pickup branch"), value: o.pickupBranch.name } : false,
                  pay ? { label: t("Payment"), value: t(pay.label) } : false,
                  o.trackingInfo ? { label: t("Tracking"), value: o.trackingInfo } : false,
                  o.notes ? { label: t("Customer's note"), value: o.notes } : false,
                ]}
              />
            </AccountPanel>

            <AccountPanel title={t("Items")}>
              <ul className={accountStyles.list}>
                {o.items.map((i) => (
                  <li key={i.productId} className={accountStyles.item}>
                    <div className={accountStyles.itemMain}>
                      <span className={accountStyles.itemTitle}>{i.name}</span>
                      <span className={accountStyles.itemMeta}>
                        {[i.size, `${f.price(i.unitPrice)} × ${i.quantity}`].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <div className={accountStyles.itemSide}>
                      <strong>{f.price(i.lineTotal)}</strong>
                    </div>
                  </li>
                ))}
              </ul>
              <Facts
                items={[
                  { label: t("Subtotal"), value: f.price(o.subtotal) },
                  { label: t("Delivery"), value: o.deliveryFee === 0 ? t("Free") : f.price(o.deliveryFee) },
                  { label: t("Total"), value: <strong>{f.price(o.total)}</strong> },
                ]}
              />
            </AccountPanel>

            <AccountPanel title={t("Order progress")}>
              <ol className={styles.timeline}>
                {o.events.map((e, i) => (
                  <li key={i}>
                    <div>
                      <strong>{t(ORDER_STATUS[e.status].label)}</strong> · {f.dateTime(e.at)}
                      {e.note ? <div className="muted">{t(e.note)}</div> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </AccountPanel>

            {action ? <StatusDialog order={o} status={action} onClose={() => setAction(null)} /> : null}
          </>
        );
      }}
    </QueryState>
  );
}
