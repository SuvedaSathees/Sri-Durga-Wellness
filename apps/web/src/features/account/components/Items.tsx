/** List rows shared by the account screens. */
import { Link } from "react-router";
import { useFormat, useT } from "@sdw/controllers";
import {
  APPOINTMENT_STATUS,
  ENROLMENT_STATUS,
  ORDER_STATUS,
  PAYMENT_PURPOSE_LABEL,
  PAYMENT_STATUS,
  percent,
  REGISTRATION_STATUS,
  type Appointment,
  type ClassRegistration,
  type MyCourse,
  type OrderSummary,
  type Payment,
} from "@sdw/core";
import { Badge, ButtonLink } from "../../../components/ui";
import styles from "./Account.module.css";

export function AppointmentItem({ appointment: a }: { appointment: Appointment }) {
  const t = useT();
  const f = useFormat();
  const status = APPOINTMENT_STATUS[a.status];
  return (
    <li className={styles.item}>
      <div className={styles.itemMain}>
        <Link to={`/account/appointments/${a.id}`} className={styles.itemTitle}>
          {a.service.name}
        </Link>
        <span className={styles.itemMeta}>
          {f.date(a.startsAt)} · {f.time(a.startsAt)}
        </span>
        <span className={styles.itemMeta}>{t("with {name}", { name: a.doctor.name })}</span>
      </div>
      <div className={styles.itemSide}>
        <Badge tone={status.tone}>{t(status.label)}</Badge>
        <span className={styles.itemMeta}>{a.reference}</span>
      </div>
    </li>
  );
}

/** Payments are only ever shown as the API reports them; "Pay now" goes to the UPI payment page. */
export function PaymentItem({ payment: p }: { payment: Payment }) {
  const t = useT();
  const f = useFormat();
  const status = PAYMENT_STATUS[p.status];
  const payable = (p.status === "AWAITING_PAYMENT" || p.status === "REJECTED") && p.upi !== null;
  return (
    <li className={styles.item}>
      <div className={styles.itemMain}>
        <span className={styles.itemTitle}>{p.description}</span>
        <span className={styles.itemMeta}>
          {t(PAYMENT_PURPOSE_LABEL[p.purpose])} · {f.price(p.amount)}
        </span>
        {p.status === "REJECTED" && p.rejectionReason ? (
          <span className={styles.itemMeta}>{t("Reason: {reason}", { reason: p.rejectionReason })}</span>
        ) : null}
        {payable && p.dueAt ? (
          <span className={styles.itemMeta}>
            {t("Please complete payment by {date}.", { date: f.dateTime(p.dueAt) })}
          </span>
        ) : null}
      </div>
      <div className={styles.itemSide}>
        <Badge tone={status.tone}>{t(status.label)}</Badge>
        {payable ? (
          <ButtonLink to={`/pay/${p.id}`} size="sm">
            {p.status === "REJECTED" ? t("Review and resubmit") : t("Pay now")}
          </ButtonLink>
        ) : (
          <Link to={`/pay/${p.id}`} className={styles.itemMeta}>
            {t("View")}
          </Link>
        )}
      </div>
    </li>
  );
}

export function OrderItem({ order: o }: { order: OrderSummary }) {
  const t = useT();
  const f = useFormat();
  const status = ORDER_STATUS[o.status];
  return (
    <li className={styles.item}>
      <div className={styles.itemMain}>
        <Link to={`/account/orders/${o.reference}`} className={styles.itemTitle}>
          {t("Order {reference}", { reference: o.reference })}
        </Link>
        <span className={styles.itemMeta}>
          {t("Placed {date}", { date: f.date(o.createdAt) })} ·{" "}
          {o.itemCount === 1 ? t("{count} item", { count: 1 }) : t("{count} items", { count: o.itemCount })}
        </span>
      </div>
      <div className={styles.itemSide}>
        <Badge tone={status.tone}>{t(status.label)}</Badge>
        <strong>{f.price(o.total)}</strong>
      </div>
    </li>
  );
}

export function RegistrationItem({ registration: r }: { registration: ClassRegistration }) {
  const t = useT();
  const f = useFormat();
  const status = REGISTRATION_STATUS[r.status];
  return (
    <li className={styles.item}>
      <div className={styles.itemMain}>
        <Link to={`/account/classes/${r.id}`} className={styles.itemTitle}>
          {r.class.title}
        </Link>
        <span className={styles.itemMeta}>
          {[r.batch.name, t("Starts {date}", { date: f.dateTime(r.batch.startsAt) })].filter(Boolean).join(" · ")}
        </span>
        {r.monthly?.paidUntil ? (
          <span className={styles.itemMeta}>
            {new Date(r.monthly.paidUntil).getTime() > Date.now()
              ? t("Paid until {date}", { date: f.shortDate(r.monthly.paidUntil) })
              : t("Next month not paid yet")}
          </span>
        ) : null}
      </div>
      <div className={styles.itemSide}>
        <Badge tone={status.tone}>{t(status.label)}</Badge>
        <span className={styles.itemMeta}>{r.reference}</span>
      </div>
    </li>
  );
}

export function CourseProgress({ item }: { item: MyCourse }) {
  const t = useT();
  const done = percent(item.completedLessons, item.course.lessonCount);
  const status = ENROLMENT_STATUS[item.enrolment.status];
  const active = item.enrolment.status === "ACTIVE";
  return (
    <li className={styles.item}>
      <div className={styles.itemMain}>
        <Link to={`/courses/${item.course.slug}`} className={styles.itemTitle}>
          {item.course.title}
        </Link>
        <span className={styles.itemMeta}>
          {t("{done} of {total} lessons completed", { done: item.completedLessons, total: item.course.lessonCount })}
        </span>
        <div
          className={styles.progress}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={done}
          aria-label={t("Course progress")}
        >
          <span style={{ width: `${done}%` }} />
        </div>
      </div>
      <div className={styles.itemSide}>
        <Badge tone={status.tone}>{t(status.label)}</Badge>
        {active && item.nextLessonId ? (
          <ButtonLink to={`/learn/${item.course.slug}/${item.nextLessonId}`} size="sm">
            {item.completedLessons > 0 ? t("Continue") : t("Start course")}
          </ButtonLink>
        ) : item.enrolment.payment && item.enrolment.status === "PENDING_PAYMENT" ? (
          <ButtonLink to={`/pay/${item.enrolment.payment.id}`} size="sm">
            {t("Pay now")}
          </ButtonLink>
        ) : null}
      </div>
    </li>
  );
}
