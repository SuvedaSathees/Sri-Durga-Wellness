/**
 * One live class: what it is, what's included and every upcoming batch with its own register button.
 * Meeting links are never shown here — they appear only in the customer's account once confirmed.
 */
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useFormat, useLiveClass, useRegisterForBatch, useSession, useSite, useT } from "@sdw/controllers";
import {
  BATCH_CLOSED_LABEL,
  CLASS_FEE_TYPE_LABEL,
  errorMessage,
  LEVEL_LABEL,
  REGISTRATION_STATUS,
  type ClassBatch,
  type ClassRegistration,
  type LiveClass,
} from "@sdw/core";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Facts,
  Icon,
  LoadingState,
  Markdown,
  Notice,
  PageHeader,
  QueryState,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "../components/learning.module.css";

function Ticks({ items }: { items: string[] }) {
  return (
    <ul className={styles.ticks}>
      {items.map((item) => (
        <li key={item}>
          <Icon name="check" size={16} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BatchItem({
  item,
  batch,
  onRegistered,
}: {
  item: LiveClass;
  batch: ClassBatch;
  onRegistered: (registration: ClassRegistration) => void;
}) {
  const t = useT();
  const f = useFormat();
  const { status } = useSession();
  const site = useSite().data;
  const register = useRegisterForBatch();
  const mine = item.myRegistrations.find((r) => r.batchId === batch.id);
  const paymentsOff = item.fee > 0 && site?.features.upiPayments === false;
  const pendingHere = register.isPending && register.variables === batch.id;
  const errorHere = register.isError && register.variables === batch.id;

  let action;
  if (mine) {
    const meta = REGISTRATION_STATUS[mine.status];
    action = (
      <>
        <Badge tone={meta.tone}>{t(meta.label)}</Badge>
        <ButtonLink to={`/account/classes/${mine.registrationId}`} variant="secondary" size="sm" iconAfter="arrowRight">
          {t("View your registration")}
        </ButtonLink>
      </>
    );
  } else if (!batch.isOpen) {
    action = <Badge tone="neutral">{t(BATCH_CLOSED_LABEL[batch.closedReason ?? "CLOSED"])}</Badge>;
  } else if (status === "signedOut") {
    action = (
      <ButtonLink to={`/login?next=${encodeURIComponent(`/classes/${item.slug}`)}`} variant="secondary" icon="user">
        {t("Sign in to register")}
      </ButtonLink>
    );
  } else if (paymentsOff) {
    action = (
      <>
        <Button disabled>{t("Register")}</Button>
        <span className="muted">{t("Online payment isn't available yet. Please contact the clinic.")}</span>
      </>
    );
  } else {
    action = (
      <Button
        loading={pendingHere}
        disabled={status === "loading"}
        onClick={() => register.mutate(batch.id, { onSuccess: (data) => onRegistered(data.registration) })}
      >
        {batch.price === 0
          ? t("Register for free")
          : item.feeType === "MONTHLY"
            ? t("Register and pay {amount} for the first month", { amount: f.price(batch.price) })
            : t("Register and pay {amount}", { amount: f.price(batch.price) })}
      </Button>
    );
  }

  return (
    <li>
      <Card className={styles.batch} as="article">
        <div className={styles.batchHead}>
          <div>
            <h3 className={styles.batchTitle}>{batch.name ?? t("Batch")}</h3>
            {batch.scheduleNote ? <p className="muted">{batch.scheduleNote}</p> : null}
          </div>
          {batch.isOpen && batch.seatsLeft !== null ? (
            <Badge tone={batch.seatsLeft <= 3 ? "warning" : "success"}>
              {batch.seatsLeft === 1 ? t("1 seat left") : t("{count} seats left", { count: batch.seatsLeft })}
            </Badge>
          ) : null}
        </div>
        <div className={styles.batchMeta}>
          <span>
            <Icon name="calendar" size={16} /> {t("Starts {date}", { date: f.longDate(batch.startsAt) })}
          </span>
          <span>
            <Icon name="clock" size={16} /> {f.time(batch.startsAt)} · {f.duration(batch.durationMinutes)}
          </span>
          <span>
            <Icon name="video" size={16} />{" "}
            {item.feeType === "MONTHLY"
              ? t("{count} live sessions a month", { count: batch.sessionsCount })
              : batch.sessionsCount === 1
                ? t("1 live session")
                : t("{count} live sessions", { count: batch.sessionsCount })}
          </span>
          {item.fee > 0 && item.feeType === "PER_SESSION" && batch.sessionsCount > 1 ? (
            <span>
              {t("{count} sessions × {fee} = {total}", {
                count: batch.sessionsCount,
                fee: f.price(item.fee),
                total: f.price(batch.price),
              })}
            </span>
          ) : null}
        </div>
        <div className={styles.batchActions}>{action}</div>
        {errorHere ? <Notice tone="danger">{t(errorMessage(register.error))}</Notice> : null}
      </Card>
    </li>
  );
}

function ClassDetail({ item }: { item: LiveClass }) {
  const t = useT();
  const f = useFormat();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState<ClassRegistration | null>(null);
  useDocumentTitle(item.title);

  const onRegistered = (registration: ClassRegistration) => {
    if (registration.payment) navigate(`/pay/${registration.payment.id}`);
    else setConfirmed(registration);
  };

  return (
    <>
      <PageHeader
        eyebrow={t(LEVEL_LABEL[item.level])}
        title={item.title}
        intro={item.summary}
        crumbs={[{ label: t("Online Classes"), to: "/classes" }, { label: item.title }]}
      />
      <section className="section">
        <div className={`container ${styles.layout}`}>
          <div className={styles.main}>
            {confirmed ? (
              <Notice
                tone="success"
                title={t("You're registered")}
                action={
                  <ButtonLink to={`/account/classes/${confirmed.id}`} size="sm" variant="secondary">
                    {t("View your registration")}
                  </ButtonLink>
                }
              >
                {t(
                  "Your seat is confirmed. The private joining link will appear in My account → Classes before the class starts.",
                )}
              </Notice>
            ) : null}
            <Markdown text={item.description} />
            <div className={styles.block}>
              <h2>{t("Who it's for")}</h2>
              <p>{item.audience}</p>
            </div>
            {item.feeIncludes.length ? (
              <div className={styles.block}>
                <h2>{t("What's included")}</h2>
                <Ticks items={item.feeIncludes} />
              </div>
            ) : null}
            {item.materials.length ? (
              <div className={styles.block}>
                <h2>{t("What you'll need")}</h2>
                <Ticks items={item.materials} />
              </div>
            ) : null}
            <div className={styles.block}>
              <h2 id="batches">{t("Upcoming batches")}</h2>
              {item.batches.length === 0 ? (
                <p className="muted">{t("Upcoming batches will appear here as soon as they are scheduled.")}</p>
              ) : (
                <ul className={styles.batches} aria-labelledby="batches">
                  {item.batches.map((b) => (
                    <BatchItem key={b.id} item={item} batch={b} onRegistered={onRegistered} />
                  ))}
                </ul>
              )}
            </div>
          </div>
          <aside className={styles.aside} aria-label={t("Class details")}>
            <Card>
              <div className="stack">
                <span className={styles.priceTag}>{f.classFee(item.fee, item.feeType)}</span>
                <Facts
                  items={[
                    item.fee > 0 ? { label: t("How you pay"), value: t(CLASS_FEE_TYPE_LABEL[item.feeType]) } : null,
                    { label: t("Level"), value: t(LEVEL_LABEL[item.level]) },
                    { label: t("Language"), value: item.language },
                    item.instructorName ? { label: t("Instructor"), value: item.instructorName } : null,
                    { label: t("Format"), value: t("Live on Google Meet") },
                    { label: t("Session length"), value: t("Under 60 minutes") },
                  ]}
                />
                <Button
                  fullWidth
                  icon="calendar"
                  onClick={() =>
                    document.getElementById("batches")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  {t("See batches")}
                </Button>
              </div>
            </Card>
            {item.feeType === "MONTHLY" && item.fee > 0 ? (
              <p className="muted">
                {t(
                  "Monthly classes are paid one month at a time. Before each month ends, pay for the next month from My account → Classes to keep your place.",
                )}
              </p>
            ) : null}
            <p className="muted">
              {t(
                "Joining links are private. They are shown only to registered students, in their account, once the seat is confirmed.",
              )}{" "}
              <Link to="/policies/refund-and-cancellation-policy">{t("Refund & Cancellation")}</Link>
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}

export function ClassDetailScreen() {
  const { slug = "" } = useParams();
  const q = useLiveClass(slug);
  return (
    <QueryState query={q} loading={<LoadingState />}>
      {(item) => <ClassDetail item={item} />}
    </QueryState>
  );
}
