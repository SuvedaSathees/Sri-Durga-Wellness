/**
 * Checking UPI payments. A person finds each UPI reference in the clinic's bank statement before
 * verifying it; the website never marks anything paid by itself, and screenshots are never proof.
 */
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useForm, useFormat, useAdminPayments, useRejectPayment, useT, useVerifyPayment } from "@sdw/controllers";
import {
  errorMessage,
  PAYMENT_PURPOSE_LABEL,
  PAYMENT_STATUS,
  rejectPaymentSchema,
  type AdminPayment,
  type PaymentStatus,
} from "@sdw/core";
import {
  Badge,
  Button,
  CheckboxField,
  Dialog,
  EmptyState,
  FormError,
  LoadingState,
  Notice,
  QueryState,
  TextArea,
  useToast,
} from "../../../components/ui";
import { AccountPanel } from "../../account/components/AccountPanel";
import accountStyles from "../../account/components/Account.module.css";
import styles from "../components/Admin.module.css";

const TABS: Array<{ status: PaymentStatus | "ALL"; label: string }> = [
  { status: "SUBMITTED", label: "To check" },
  { status: "VERIFIED", label: "Verified" },
  { status: "REJECTED", label: "Not verified" },
  { status: "ALL", label: "All payments" },
];

function VerifyDialog({ payment, onClose }: { payment: AdminPayment; onClose: () => void }) {
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const verify = useVerifyPayment();
  const [found, setFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!found) return setError("Confirm you found this payment in the bank statement");
    try {
      await verify.mutateAsync(payment.id);
      toast(t("Payment verified"));
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("Verify this payment?")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Not now")}
          </Button>
          <Button onClick={() => void confirm()} loading={verify.isPending} icon="checkCircle">
            {t("Verify payment")}
          </Button>
        </>
      }
    >
      <p>
        {t("Open the clinic's bank statement and look for {amount} with this UPI reference:", {
          amount: f.price(payment.amount),
        })}
      </p>
      <p>
        <span className={`${styles.mono} ${styles.utr}`}>{payment.utr}</span>
      </p>
      <p className="muted">
        {t("Paid by {name} for {what}.", {
          name: payment.payerName ?? payment.customer.name,
          what: payment.description,
        })}
      </p>
      <CheckboxField
        label={t("I found this payment in the clinic's bank statement")}
        checked={found}
        onChange={(v) => {
          setFound(v);
          setError(null);
        }}
      />
      <FormError message={error} />
    </Dialog>
  );
}

function RejectDialog({ payment, onClose }: { payment: AdminPayment; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const reject = useRejectPayment();
  const form = useForm(rejectPaymentSchema, { reason: "" });
  const submit = form.handleSubmit(async (body) => {
    await reject.mutateAsync({ paymentId: payment.id, body });
    toast(t("The customer has been asked to check their payment"));
    onClose();
  });
  return (
    <Dialog
      open
      onClose={onClose}
      title={t("Payment not found?")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Not now")}
          </Button>
          <Button variant="danger" onClick={() => void submit()} loading={form.submitting}>
            {t("Mark as not verified")}
          </Button>
        </>
      }
    >
      <p>
        {t(
          "The customer will see your reason and can send the correct UPI reference again. Their order or seat stays reserved for another 24 hours.",
        )}
      </p>
      <FormError message={form.formError} />
      <TextArea
        label={t("Reason for the customer")}
        required
        rows={3}
        hint={t("For example: We couldn't find this reference. Please check the 12-digit number in your UPI app.")}
        value={form.values.reason}
        onChange={(v) => form.setField("reason", v)}
        error={form.errorFor("reason")}
      />
    </Dialog>
  );
}

function PaymentRow({
  payment: p,
  onVerify,
  onReject,
}: {
  payment: AdminPayment;
  onVerify: () => void;
  onReject: () => void;
}) {
  const t = useT();
  const f = useFormat();
  const status = PAYMENT_STATUS[p.status];
  const orderLink = p.purpose === "ORDER" ? `/admin/orders/${encodeURIComponent(p.reference)}` : null;
  return (
    <li className={accountStyles.item}>
      <div className={accountStyles.itemMain}>
        {orderLink ? (
          <Link to={orderLink} className={accountStyles.itemTitle}>
            {p.description}
          </Link>
        ) : (
          <span className={accountStyles.itemTitle}>{p.description}</span>
        )}
        <span className={accountStyles.itemMeta}>
          {t(PAYMENT_PURPOSE_LABEL[p.purpose])} · <strong>{f.price(p.amount)}</strong>
        </span>
        <span className={accountStyles.itemMeta}>
          {p.customer.name}
          {p.customer.phone ? ` · ${p.customer.phone}` : ""}
        </span>
        {p.utr ? (
          <span className={accountStyles.itemMeta}>
            {t("UPI reference")}: <span className={`${styles.mono} ${styles.utr}`}>{p.utr}</span>
            {p.payerName ? ` · ${t("Paid by {name}", { name: p.payerName })}` : null}
          </span>
        ) : null}
        {p.submittedAt ? (
          <span className={accountStyles.itemMeta}>{t("Sent {date}", { date: f.dateTime(p.submittedAt) })}</span>
        ) : null}
        {p.status === "REJECTED" && p.rejectionReason ? (
          <span className={accountStyles.itemMeta}>{t("Reason: {reason}", { reason: p.rejectionReason })}</span>
        ) : null}
      </div>
      <div className={accountStyles.itemSide}>
        <Badge tone={status.tone}>{t(status.label)}</Badge>
        {p.status === "SUBMITTED" ? (
          <div className={styles.rowActions}>
            <Button size="sm" onClick={onVerify} icon="checkCircle">
              {t("Verify")}
            </Button>
            <Button size="sm" variant="secondary" onClick={onReject}>
              {t("Not found")}
            </Button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function AdminPaymentsScreen() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((x) => x.status === params.get("status")) ?? TABS[0]!;
  const payments = useAdminPayments(tab.status === "ALL" ? undefined : tab.status);
  const [verifying, setVerifying] = useState<AdminPayment | null>(null);
  const [rejecting, setRejecting] = useState<AdminPayment | null>(null);

  return (
    <AccountPanel title={t("Payments")}>
      <Notice tone="info">
        {t(
          "Check each UPI reference against the clinic's bank statement before you verify it. Never verify from a screenshot alone.",
        )}
      </Notice>
      <div className={accountStyles.tabs} role="tablist" aria-label={t("Payments")}>
        {TABS.map((x) => (
          <button
            key={x.status}
            type="button"
            role="tab"
            aria-selected={x.status === tab.status}
            className={`${accountStyles.tab} ${x.status === tab.status ? accountStyles.tabActive : ""}`}
            onClick={() => setParams(x.status === "SUBMITTED" ? {} : { status: x.status }, { replace: true })}
          >
            {t(x.label)}
          </button>
        ))}
      </div>
      <QueryState
        query={payments}
        loading={<LoadingState />}
        empty={
          <EmptyState
            icon="checkCircle"
            title={tab.status === "SUBMITTED" ? t("All caught up") : t("No payments here")}
          >
            {tab.status === "SUBMITTED" ? t("No UPI payments are waiting to be checked.") : null}
          </EmptyState>
        }
      >
        {(list) => (
          <ul className={accountStyles.list}>
            {list.map((p) => (
              <PaymentRow key={p.id} payment={p} onVerify={() => setVerifying(p)} onReject={() => setRejecting(p)} />
            ))}
          </ul>
        )}
      </QueryState>
      {verifying ? <VerifyDialog payment={verifying} onClose={() => setVerifying(null)} /> : null}
      {rejecting ? <RejectDialog payment={rejecting} onClose={() => setRejecting(null)} /> : null}
    </AccountPanel>
  );
}
