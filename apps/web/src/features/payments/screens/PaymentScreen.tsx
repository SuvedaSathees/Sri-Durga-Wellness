/**
 * UPI payment for an order, class seat or course. The customer pays in their own UPI app, then
 * enters the transaction reference (UTR). The clinic team verifies it — this page never marks a
 * payment as paid by itself; it only shows the status the API returns (checked every 30 seconds).
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toString as qrToSvg } from "qrcode";
import { useConfig, useForm, useFormat, usePayment, useSession, useSite, useSubmitUtr, useT } from "@sdw/controllers";
import {
  buildUpiUri,
  canSubmitUtr,
  paymentStage,
  PAYMENT_PURPOSE_LABEL,
  PAYMENT_STATUS,
  utrSubmissionSchema,
  type Payment,
} from "@sdw/core";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  FormError,
  Icon,
  Notice,
  PageHeader,
  QueryState,
  TextField,
  LoadingState,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "./Payment.module.css";

function accountLink(payment: Payment): { to: string; label: string } {
  if (payment.purpose === "ORDER")
    return { to: `/account/orders/${encodeURIComponent(payment.reference)}`, label: "View my order" };
  if (payment.purpose === "CLASS" || payment.purpose === "CLASS_RENEWAL")
    return { to: "/account/classes", label: "View my classes" };
  return { to: "/account/courses", label: "View my courses" };
}

function UpiQr({ uri, label }: { uri: string; label: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    qrToSvg(uri, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: { dark: "#2b332c", light: "#ffffff" },
    })
      .then((svg) => alive && setSrc(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [uri]);
  return (
    <div className={styles.qr}>
      {src ? (
        <img src={src} alt={label} width={240} height={240} />
      ) : (
        <span className={styles.qrPlaceholder} aria-hidden="true" />
      )}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={copied ? "check" : "copy"}
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          })
          .catch(() => setCopied(false));
      }}
      aria-label={label}
    >
      {copied ? t("Copied") : t("Copy")}
    </Button>
  );
}

function PayStep({ payment }: { payment: Payment }) {
  const t = useT();
  const f = useFormat();
  const { user } = useSession();
  const config = useConfig();
  const submit = useSubmitUtr(payment.id);
  const form = useForm(utrSubmissionSchema, { utr: "", payerName: user?.name ?? "" });
  const upi = payment.upi;

  if (!upi || !canSubmitUtr(payment)) {
    return (
      <Notice tone="warning" title={t("Online payment isn't available yet")}>
        {t("Please contact the clinic to complete this payment.")}
      </Notice>
    );
  }
  const uri = buildUpiUri(upi, payment.amount);

  return (
    <div className="stack">
      {config.apiMode === "mock" ? (
        <Notice tone="warning" title={t("Demo payment")}>
          {t(
            "This is sample data. The UPI ID below is not a real account and can't receive money — please don't send a real payment. Enter any 12-digit number as the reference.",
          )}
        </Notice>
      ) : null}
      {payment.status === "REJECTED" ? (
        <Notice tone="danger" title={t("We couldn't verify your payment")}>
          {payment.rejectionReason ? <p>{payment.rejectionReason}</p> : null}
          <p>{t("Please check the UPI reference and submit it again, or contact the clinic.")}</p>
        </Notice>
      ) : null}

      <Card className={styles.steps}>
        <div className={styles.step}>
          <span className={styles.stepNo} aria-hidden="true">
            1
          </span>
          <div className="stack">
            <h2 className={styles.stepTitle}>{t("Pay {amount} by UPI", { amount: f.price(payment.amount) })}</h2>
            <div className={styles.payGrid}>
              <UpiQr
                uri={uri}
                label={t("UPI QR code for {amount} to {payee}", {
                  amount: f.price(payment.amount),
                  payee: upi.payeeName,
                })}
              />
              <div className="stack">
                <p>{t("Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, BHIM or your bank's app).")}</p>
                <dl className={styles.payee}>
                  <div>
                    <dt>{t("UPI ID")}</dt>
                    <dd>
                      <code>{upi.payeeVpa}</code> <CopyButton text={upi.payeeVpa} label={t("Copy UPI ID")} />
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Pay to")}</dt>
                    <dd>{upi.payeeName}</dd>
                  </div>
                  <div>
                    <dt>{t("Amount")}</dt>
                    <dd>{f.price(payment.amount)}</dd>
                  </div>
                  <div>
                    <dt>{t("Note / remarks")}</dt>
                    <dd>
                      <code>{upi.note}</code>
                    </dd>
                  </div>
                </dl>
                <div>
                  <a className={styles.upiLink} href={uri}>
                    <Icon name="upi" size={18} /> {t("Pay with a UPI app")}
                  </a>
                  <p className="muted">{t("This opens your UPI app when you're on a phone.")}</p>
                </div>
                {payment.dueAt ? (
                  <p className="muted">
                    {t("Please pay by {time}, or the items or seat are released.", { time: f.dateTime(payment.dueAt) })}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.step}>
          <span className={styles.stepNo} aria-hidden="true">
            2
          </span>
          <form
            className="stack"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit((data) => submit.mutateAsync(data))();
            }}
          >
            <h2 className={styles.stepTitle}>{t("Tell us your UPI reference")}</h2>
            <p className="muted">
              {t(
                "After paying, your UPI app shows a 12-digit transaction reference (UTR). Enter it here so our team can find and verify your payment.",
              )}
            </p>
            <FormError message={form.formError} />
            <div className={styles.utrGrid}>
              <TextField
                label={t("UPI transaction reference (UTR)")}
                required
                inputMode="numeric"
                autoComplete="off"
                value={form.values.utr}
                onChange={(v) => form.setField("utr", v)}
                error={form.errorFor("utr")}
                hint={t("Usually 12 digits, for example 412345678901")}
              />
              <TextField
                label={t("Name on the paying account")}
                required
                autoComplete="name"
                value={form.values.payerName}
                onChange={(v) => form.setField("payerName", v)}
                error={form.errorFor("payerName")}
              />
            </div>
            <div>
              <Button type="submit" loading={form.submitting}>
                {t("Submit for verification")}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

export function PaymentScreen() {
  const { paymentId = "" } = useParams();
  const t = useT();
  const f = useFormat();
  const payment = usePayment(paymentId);
  const checksPerDay = useSite().data?.payments.checksPerDay ?? 1;
  useDocumentTitle(t("Payment"));

  return (
    <>
      <PageHeader
        eyebrow={payment.data ? t(PAYMENT_PURPOSE_LABEL[payment.data.purpose]) : undefined}
        title={t("Payment")}
        intro={payment.data ? payment.data.description : undefined}
        crumbs={[
          { label: t("My account"), to: "/account" },
          { label: t("Payments"), to: "/account/payments" },
          { label: payment.data?.reference ?? t("Payment") },
        ]}
      />
      <section className="section">
        <div className="container container-narrow">
          <QueryState query={payment} loading={<LoadingState />}>
            {(p) => {
              const stage = paymentStage(p);
              const status = PAYMENT_STATUS[p.status];
              const link = accountLink(p);
              return (
                <div className="stack">
                  <div className={styles.statusRow}>
                    <span>
                      {t("Reference")}: <strong>{p.reference}</strong>
                    </span>
                    <Badge tone={status.tone}>{t(status.label)}</Badge>
                  </div>
                  {stage === "pay" || stage === "retry" ? <PayStep payment={p} /> : null}
                  {stage === "waiting" ? (
                    <Card className={styles.outcome}>
                      <span className={styles.outcomeIcon} aria-hidden="true">
                        <Icon name="clock" size={28} />
                      </span>
                      <h2>{t("We're checking your payment")}</h2>
                      <p>
                        {t(
                          "Thank you. Our team will match UPI reference ending {last4} with the clinic's account. This page updates by itself.",
                          { last4: p.utrLast4 ?? "····" },
                        )}
                      </p>
                      <p>
                        {checksPerDay === 1
                          ? t("The clinic checks UPI payments once a day, so confirmation can take up to a day.")
                          : t("The clinic checks UPI payments {count} times a day.", { count: checksPerDay })}
                      </p>
                      <p className="muted">
                        {t("Your booking or order is confirmed only after the clinic has verified the payment.")}
                      </p>
                      <ButtonLink to={link.to} variant="secondary">
                        {t(link.label)}
                      </ButtonLink>
                    </Card>
                  ) : null}
                  {stage === "verified" ? (
                    <Card className={styles.outcome}>
                      <span className={`${styles.outcomeIcon} ${styles.ok}`} aria-hidden="true">
                        <Icon name="checkCircle" size={28} />
                      </span>
                      <h2>{t("Payment verified")}</h2>
                      <p>
                        {p.verifiedAt
                          ? t("The clinic verified your payment on {date}.", { date: f.dateTime(p.verifiedAt) })
                          : t("The clinic has verified your payment.")}
                      </p>
                      <ButtonLink to={link.to}>{t(link.label)}</ButtonLink>
                    </Card>
                  ) : null}
                  {stage === "closed" ? (
                    <Notice tone="neutral" title={t("This payment is closed")}>
                      {t("It was cancelled or the time to pay ran out. Nothing more is needed from you.")}
                    </Notice>
                  ) : null}
                </div>
              );
            }}
          </QueryState>
        </div>
      </section>
    </>
  );
}
