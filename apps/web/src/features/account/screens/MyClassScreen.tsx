import { Link, useNavigate, useParams } from "react-router";
import { useFormat, useMyRegistration, useRenewRegistration, useT } from "@sdw/controllers";
import { errorMessage, REGISTRATION_STATUS, type ClassRegistration } from "@sdw/core";
import {
  Badge,
  Button,
  ButtonAnchor,
  ButtonLink,
  Facts,
  LoadingState,
  Notice,
  QueryState,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AccountPanel } from "../components/AccountPanel";
import styles from "../components/Account.module.css";

/** Monthly classes: the paid month, and paying for the next one (renewal is a new UPI payment). */
function MonthlyPlan({ registration }: { registration: ClassRegistration }) {
  const t = useT();
  const f = useFormat();
  const navigate = useNavigate();
  const renew = useRenewRegistration();
  const m = registration.monthly;
  if (!m || registration.status !== "CONFIRMED") return null;
  const lapsed = !m.paidUntil || new Date(m.paidUntil).getTime() <= Date.now();
  const renewal = m.renewal;
  const renewalPayable =
    renewal && (renewal.payment.status === "AWAITING_PAYMENT" || renewal.payment.status === "REJECTED");

  return (
    <div className="stack">
      {m.paidUntil ? (
        lapsed ? (
          <Notice tone="warning" title={t("Your paid month has ended")}>
            {t("It ended on {date}. Pay for the next month to get the joining link back.", {
              date: f.longDate(m.paidUntil),
            })}
          </Notice>
        ) : (
          <Notice tone="success" title={t("Paid until {date}", { date: f.longDate(m.paidUntil) })}>
            {t("Pay for the next month before this date to keep your place.")}
          </Notice>
        )
      ) : null}

      {renewal ? (
        renewalPayable ? (
          <Notice
            tone={renewal.payment.status === "REJECTED" ? "danger" : "info"}
            title={
              renewal.payment.status === "REJECTED"
                ? t("We couldn't verify your payment")
                : t("Next month: {start} – {end}", {
                    start: f.shortDate(renewal.periodStart),
                    end: f.shortDate(renewal.periodEnd),
                  })
            }
            action={
              <ButtonLink to={`/pay/${renewal.payment.id}`} size="sm">
                {renewal.payment.status === "REJECTED"
                  ? t("Review and resubmit")
                  : t("Pay {amount}", { amount: f.price(renewal.payment.amount) })}
              </ButtonLink>
            }
          >
            {t("Complete the UPI payment to continue next month.")}
          </Notice>
        ) : renewal.payment.status === "SUBMITTED" ? (
          <Notice tone="info">
            {t("We're verifying your payment for next month. The clinic checks UPI payments once a day.")}
          </Notice>
        ) : null
      ) : m.canRenew ? (
        <div className="stack">
          <div>
            <Button
              icon="calendar"
              loading={renew.isPending}
              onClick={() =>
                renew.mutate(registration.id, { onSuccess: (data) => navigate(`/pay/${data.payment.id}`) })
              }
            >
              {t("Pay for next month ({amount})", { amount: f.price(m.monthlyFee) })}
            </Button>
          </div>
          {renew.isError ? <Notice tone="danger">{t(errorMessage(renew.error))}</Notice> : null}
        </div>
      ) : null}
    </div>
  );
}

export function MyClassScreen() {
  const t = useT();
  const f = useFormat();
  const { id = "" } = useParams();
  const registration = useMyRegistration(id);
  useDocumentTitle(registration.data?.class.title ?? t("Class registration"));

  return (
    <QueryState query={registration} loading={<LoadingState />}>
      {(r) => {
        const status = REGISTRATION_STATUS[r.status];
        const payable =
          r.payment &&
          (r.payment.status === "AWAITING_PAYMENT" || r.payment.status === "REJECTED") &&
          r.payment.upi !== null;
        return (
          <AccountPanel title={r.class.title} action={<Badge tone={status.tone}>{t(status.label)}</Badge>}>
            <p>
              <Link to="/account/classes">← {t("Live class registrations")}</Link>
            </p>
            {status.description ? <p className="muted">{t(status.description)}</p> : null}

            {/* The joining link exists only in the API response for this customer's confirmed seat. */}
            {r.meeting ? (
              <div className={styles.join}>
                <strong>{t("You're in! Join on Google Meet")}</strong>
                <span>
                  {t("The room opens at {time}. Please don't share this link — it's for registered students only.", {
                    time: f.dateTime(r.meeting.opensAt),
                  })}
                </span>
                <div>
                  <ButtonAnchor href={r.meeting.url} variant="primary" icon="video">
                    {t("Join class")}
                  </ButtonAnchor>
                </div>
              </div>
            ) : r.status === "PAYMENT_SUBMITTED" ? (
              <Notice tone="info">
                {t("We're verifying your payment. The joining link will appear here once it's confirmed.")}
              </Notice>
            ) : null}

            <MonthlyPlan registration={r} />

            {payable ? (
              <Notice
                tone={r.payment!.status === "REJECTED" ? "danger" : "warning"}
                title={r.payment!.status === "REJECTED" ? t("We couldn't verify your payment") : t("Payment pending")}
                action={
                  <ButtonLink to={`/pay/${r.payment!.id}`} size="sm">
                    {r.payment!.status === "REJECTED" ? t("Review and resubmit") : t("Pay now")}
                  </ButtonLink>
                }
              >
                {r.holdExpiresAt
                  ? t("Your seat is held until {date}.", { date: f.dateTime(r.holdExpiresAt) })
                  : t("Please complete your payment.")}
              </Notice>
            ) : null}

            <Facts
              items={[
                { label: t("Reference"), value: r.reference },
                r.batch.name ? { label: t("Batch"), value: r.batch.name } : false,
                { label: t("Starts"), value: f.dateTime(r.batch.startsAt) },
                r.batch.scheduleNote ? { label: t("Schedule"), value: r.batch.scheduleNote } : false,
                {
                  label: t("Sessions"),
                  value: r.monthly
                    ? t("{count} a month", { count: r.batch.sessionsCount })
                    : String(r.batch.sessionsCount),
                },
                r.monthly
                  ? { label: t("Monthly fee"), value: f.classFee(r.monthly.monthlyFee, "MONTHLY") }
                  : { label: t("Fee"), value: f.fee(r.amount) },
              ]}
            />
            <div>
              <ButtonLink to={`/classes/${r.class.slug}`} variant="secondary">
                {t("About this class")}
              </ButtonLink>
            </div>
          </AccountPanel>
        );
      }}
    </QueryState>
  );
}
