/**
 * Appointment booking: service → practitioner → date & time → details → review → confirmation.
 * The flow state lives in the shared booking reducer (@sdw/controllers); this screen only renders it.
 * The URL may carry ?service=<slug>&doctor=<slug> to preselect — never personal details.
 */
import { createContext, useContext, useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import {
  BOOKING_STEP_LABEL,
  BOOKING_STEPS,
  firstOpenDate,
  useAvailability,
  useBookAppointment,
  useBookingFlow,
  useDoctor,
  useForm,
  useFormat,
  useService,
  useServiceList,
  useSession,
  useSite,
  useT,
  type BookingAction,
  type BookingState,
  type BookingStep,
} from "@sdw/controllers";
import {
  errorMessage,
  googleCalendarLink,
  groupSlots,
  isApiError,
  patientDetailsSchema,
  PERIOD_LABEL,
  SERVICE_MODE_LABEL,
  type Appointment,
  type PatientDetailsInput,
  type Service,
  type ServiceDetail,
} from "@sdw/core";
import {
  Button,
  ButtonAnchor,
  ButtonLink,
  Card,
  CheckboxField,
  EmptyState,
  ErrorState,
  Facts,
  FormError,
  Icon,
  LoadingState,
  Notice,
  PageHeader,
  QueryState,
  Steps,
  TextArea,
  TextField,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "./Booking.module.css";

type Dispatch = (a: BookingAction) => void;

/** True once the customer has moved between steps (not on first page load). */
const StepChanged = createContext(false);

/** Moves keyboard and screen-reader focus to the new step's heading after a step change. */
function StepHeading({ children, id }: { children: string; id: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const changed = useContext(StepChanged);
  useEffect(() => {
    if (changed) ref.current?.focus({ preventScroll: false });
  }, [changed]);
  return (
    <h2 ref={ref} id={id} tabIndex={-1} className={styles.stepTitle}>
      {children}
    </h2>
  );
}

function OptionButton({
  selected,
  onClick,
  title,
  meta,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${styles.option} ${selected ? styles.optionOn : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className={styles.optionText}>
        <span className={styles.optionTitle}>{title}</span>
        {meta ? <span className={styles.optionMeta}>{meta}</span> : null}
        {children}
      </span>
      <Icon name="chevronRight" size={18} />
    </button>
  );
}

// ── Step 1: service ─────────────────────────────────────────

function ServiceStep({
  state,
  dispatch,
  onlyServiceIds,
}: {
  state: BookingState;
  dispatch: Dispatch;
  onlyServiceIds: string[] | null;
}) {
  const t = useT();
  const f = useFormat();
  const services = useServiceList();
  return (
    <div className={styles.step}>
      <StepHeading id="step-title">{t("Choose a service")}</StepHeading>
      <QueryState
        query={services}
        isEmpty={(list) => !list.some((s) => s.isBookable)}
        empty={
          <EmptyState title={t("Online booking will open soon")}>
            {t("Please call or message us to arrange an appointment.")}
          </EmptyState>
        }
      >
        {(list) => (
          <div className={styles.options} role="group" aria-labelledby="step-title">
            {list
              .filter((s) => s.isBookable && (!onlyServiceIds || onlyServiceIds.includes(s.id)))
              .map((s: Service) => (
                <OptionButton
                  key={s.id}
                  selected={state.serviceId === s.id}
                  onClick={() => dispatch({ type: "chooseService", serviceId: s.id })}
                  title={s.name}
                  meta={[
                    f.duration(s.durationMinutes),
                    t(SERVICE_MODE_LABEL[s.mode]),
                    s.price !== null ? f.price(s.price) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  <span className={styles.optionSummary}>{s.summary}</span>
                </OptionButton>
              ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}

/** "Book with {doctor}" links without a service: offer only that practitioner's services. */
function DoctorServiceStep({
  doctorSlug,
  state,
  dispatch,
}: {
  doctorSlug: string;
  state: BookingState;
  dispatch: Dispatch;
}) {
  const doctor = useDoctor(doctorSlug);
  if (doctor.isPending) return <LoadingState />;
  return <ServiceStep state={state} dispatch={dispatch} onlyServiceIds={doctor.data?.serviceIds ?? null} />;
}

// ── Step 2: practitioner ────────────────────────────────────

function DoctorStep({
  service,
  state,
  dispatch,
  autoSkipped,
}: {
  service: ServiceDetail;
  state: BookingState;
  dispatch: Dispatch;
  autoSkipped: MutableRefObject<string | null>;
}) {
  const t = useT();
  const doctors = service.doctors.filter((d) => d.acceptsAppointments);

  // With only one practitioner there is nothing to choose — move on (once; going back still works).
  useEffect(() => {
    if (doctors.length === 1 && autoSkipped.current !== service.id) {
      autoSkipped.current = service.id;
      dispatch({ type: "chooseDoctor", doctorId: doctors[0]!.id });
    }
  }, [doctors, service.id, dispatch, autoSkipped]);

  return (
    <div className={styles.step}>
      <StepHeading id="step-title">{t("Choose a practitioner")}</StepHeading>
      <p className="muted">{t("Practitioners who offer {service}.", { service: service.name })}</p>
      {doctors.length === 0 ? (
        <EmptyState title={t("Online booking will open soon")}>
          {t("Please call or message us to arrange an appointment.")}
        </EmptyState>
      ) : (
        <div className={styles.options} role="group" aria-labelledby="step-title">
          {doctors.map((d) => (
            <OptionButton
              key={d.id}
              selected={state.doctorId === d.id}
              onClick={() => dispatch({ type: "chooseDoctor", doctorId: d.id })}
              title={d.name}
              meta={d.specialisation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 3: date and time ───────────────────────────────────

function TimeStep({
  service,
  state,
  dispatch,
  slotTaken,
}: {
  service: ServiceDetail;
  state: BookingState;
  dispatch: Dispatch;
  slotTaken: boolean;
}) {
  const t = useT();
  const f = useFormat();
  const availability = useAvailability(state.serviceId, state.doctorId);
  const doctor = service.doctors.find((d) => d.id === state.doctorId);
  const days = availability.data?.days;

  useEffect(() => {
    if (!state.date && days) {
      const first = firstOpenDate(days);
      if (first) dispatch({ type: "chooseDate", date: first });
    }
  }, [days, state.date, dispatch]);

  const day = days?.find((d) => d.date === state.date);

  return (
    <div className={styles.step}>
      <StepHeading id="step-title">{t("Choose a date and time")}</StepHeading>
      <p className="muted">
        {t("{service} with {doctor} · {duration}. Times are shown in India Standard Time.", {
          service: service.name,
          doctor: doctor?.name ?? "",
          duration: f.duration(service.durationMinutes),
        })}
      </p>
      {slotTaken ? (
        <Notice tone="warning">
          {t("Sorry — that time has just been taken or is no longer available. Please choose another time.")}
        </Notice>
      ) : null}
      <QueryState
        query={availability}
        loading={<LoadingState label={t("Loading available times")} />}
        isEmpty={(a) => !a.days.some((d) => d.slots.length > 0)}
        empty={
          <EmptyState title={t("No free times right now")}>
            {t("There are no free times in the booking window.")} <Link to="/contact">{t("Contact the clinic")}</Link>
          </EmptyState>
        }
      >
        {(a) => (
          <>
            <div className={styles.dates} role="group" aria-label={t("Date")}>
              {a.days.map((d) => {
                const chip = f.dayChip(d.date);
                const count = d.slots.length;
                const label =
                  count === 0
                    ? t("{date}, no times available", { date: f.dateKey(d.date, "long") })
                    : count === 1
                      ? t("{date}, {count} time available", { date: f.dateKey(d.date, "long"), count })
                      : t("{date}, {count} times available", { date: f.dateKey(d.date, "long"), count });
                return (
                  <button
                    key={d.date}
                    type="button"
                    className={`${styles.date} ${state.date === d.date ? styles.dateOn : ""}`}
                    aria-pressed={state.date === d.date}
                    aria-label={label}
                    disabled={count === 0}
                    onClick={() => dispatch({ type: "chooseDate", date: d.date })}
                  >
                    <span className={styles.dateWeekday}>{chip.weekday}</span>
                    <span className={styles.dateDay}>{chip.day}</span>
                    <span className={styles.dateMonth}>{chip.month}</span>
                  </button>
                );
              })}
            </div>
            {day ? (
              <div className={styles.slots} aria-live="polite">
                <h3 className={styles.slotDay}>{f.dateKey(day.date, "long")}</h3>
                {day.slots.length === 0 ? (
                  <p className="muted">{t("No times left on this day. Please choose another date.")}</p>
                ) : (
                  groupSlots(day.slots).map((g) => (
                    <div key={g.period} className={styles.period}>
                      <h4 className={styles.periodTitle}>{t(PERIOD_LABEL[g.period])}</h4>
                      <div className={styles.slotGrid} role="group" aria-label={t(PERIOD_LABEL[g.period])}>
                        {g.slots.map((s) => (
                          <button
                            key={s.startsAt}
                            type="button"
                            className={`${styles.slot} ${state.slot?.startsAt === s.startsAt ? styles.slotOn : ""}`}
                            aria-pressed={state.slot?.startsAt === s.startsAt}
                            onClick={() => dispatch({ type: "chooseSlot", slot: s })}
                          >
                            {f.time(s.startsAt)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </>
        )}
      </QueryState>
    </div>
  );
}

// ── Step 4: details ─────────────────────────────────────────

function DetailsStep({ state, dispatch }: { state: BookingState; dispatch: Dispatch }) {
  const t = useT();
  const { user } = useSession();
  const form = useForm(patientDetailsSchema, {
    ...state.details,
    patientName: state.details.patientName || user?.name || "",
    patientEmail: state.details.patientEmail || user?.email || "",
    patientPhone: state.details.patientPhone || user?.phone || "",
  });
  const submit = form.handleSubmit((data) => dispatch({ type: "setDetails", details: data as PatientDetailsInput }));
  const v = form.values;
  return (
    <div className={styles.step}>
      <StepHeading id="step-title">{t("Your details")}</StepHeading>
      <p className="muted">{t("We'll use these to confirm your booking and contact you if anything changes.")}</p>
      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <FormError message={form.formError} />
        <div className={styles.formRow}>
          <TextField
            label={t("Full name")}
            required
            autoComplete="name"
            value={v.patientName}
            onChange={(x) => form.setField("patientName", x)}
            error={form.errorFor("patientName")}
          />
          <TextField
            label={t("Mobile number")}
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={v.patientPhone}
            onChange={(x) => form.setField("patientPhone", x)}
            error={form.errorFor("patientPhone")}
          />
        </div>
        <TextField
          label={t("Email")}
          required
          type="email"
          autoComplete="email"
          value={v.patientEmail}
          onChange={(x) => form.setField("patientEmail", x)}
          error={form.errorFor("patientEmail")}
        />
        <TextArea
          label={t("Reason for visit")}
          hint={t("A few words are enough. Please don't include detailed medical records.")}
          required
          rows={3}
          value={v.reason}
          onChange={(x) => form.setField("reason", x)}
          error={form.errorFor("reason")}
        />
        <CheckboxField
          label={
            <>
              {t("I agree to the clinic storing these details to manage my appointment, as described in the")}{" "}
              <Link to="/policies/privacy-policy">{t("Privacy Policy")}</Link>.
            </>
          }
          checked={v.consent === true}
          onChange={(x) => form.setField("consent", x)}
          error={form.errorFor("consent")}
        />
        <div className={styles.actions}>
          <Button type="submit" iconAfter="arrowRight">
            {t("Review booking")}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Step 5: review ──────────────────────────────────────────

function ReviewStep({
  service,
  state,
  dispatch,
  onBooked,
}: {
  service: ServiceDetail;
  state: BookingState;
  dispatch: Dispatch;
  onBooked: (a: Appointment) => void;
}) {
  const t = useT();
  const f = useFormat();
  const site = useSite().data;
  const book = useBookAppointment(state, dispatch);
  const doctor = service.doctors.find((d) => d.id === state.doctorId);
  const branch = site?.branches.find((b) => b.id === state.slot?.branchId);
  const error = book.error && !(isApiError(book.error) && book.error.code === "SLOT_TAKEN") ? book.error : null;

  return (
    <div className={styles.step}>
      <StepHeading id="step-title">{t("Review and confirm")}</StepHeading>
      <Card>
        <Facts
          items={[
            { label: t("Service"), value: service.name },
            { label: t("Practitioner"), value: doctor?.name ?? "" },
            state.slot && { label: t("Date"), value: f.longDate(state.slot.startsAt) },
            state.slot && {
              label: t("Time"),
              value: `${f.time(state.slot.startsAt)} · ${f.duration(service.durationMinutes)}`,
            },
            {
              label: t("Where"),
              value: branch ? `${branch.name}, ${branch.addressLine}, ${branch.city}` : t("Online"),
            },
            service.price !== null && { label: t("Fee"), value: f.price(service.price) },
            { label: t("Name"), value: state.details.patientName },
            { label: t("Mobile number"), value: state.details.patientPhone },
            { label: t("Email"), value: state.details.patientEmail },
          ]}
        />
      </Card>
      <div className="cluster">
        <Button
          variant="ghost"
          size="sm"
          icon="chevronLeft"
          onClick={() => dispatch({ type: "goTo", step: "details" })}
        >
          {t("Edit details")}
        </Button>
        <Button variant="ghost" size="sm" icon="calendar" onClick={() => dispatch({ type: "goTo", step: "time" })}>
          {t("Change time")}
        </Button>
      </div>
      {error ? <Notice tone="danger">{t(errorMessage(error))}</Notice> : null}
      {service.price !== null ? (
        <p className="muted">{t("Fees are paid at the clinic unless stated otherwise.")}</p>
      ) : null}
      <div className={styles.actions}>
        <Button
          size="lg"
          icon="check"
          loading={book.isPending}
          onClick={() => book.mutate(undefined, { onSuccess: onBooked })}
        >
          {book.isPending ? t("Booking…") : t("Confirm booking")}
        </Button>
      </div>
    </div>
  );
}

// ── Confirmation ────────────────────────────────────────────

function Confirmation({ appointment, onAgain }: { appointment: Appointment; onAgain: () => void }) {
  const t = useT();
  const f = useFormat();
  const { user } = useSession();
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const where = appointment.branch
    ? `${appointment.branch.name}, ${appointment.branch.addressLine}, ${appointment.branch.city}`
    : t("Online");
  const calendar = googleCalendarLink({
    title: `${appointment.service.name} — ${appointment.doctor.name}`,
    start: appointment.startsAt,
    end: appointment.endsAt,
    details: t("Booking reference {reference}", { reference: appointment.reference }),
    location: appointment.branch ? where : undefined,
  });
  return (
    <div className={styles.done}>
      <span className={styles.doneIcon} aria-hidden="true">
        <Icon name="checkCircle" size={34} />
      </span>
      <h2 ref={ref} tabIndex={-1}>
        {t("Your appointment is booked")}
      </h2>
      <p className="lead">
        {t("We've sent a confirmation to {email}. Please keep your booking reference handy.", {
          email: appointment.patientEmail,
        })}
      </p>
      <Card className={styles.doneCard}>
        <Facts
          items={[
            {
              label: t("Booking reference"),
              value: <strong data-testid="booking-reference">{appointment.reference}</strong>,
            },
            { label: t("Service"), value: appointment.service.name },
            { label: t("Practitioner"), value: appointment.doctor.name },
            { label: t("Date"), value: f.longDate(appointment.startsAt) },
            { label: t("Time"), value: f.time(appointment.startsAt) },
            { label: t("Where"), value: where },
          ]}
        />
      </Card>
      {appointment.cancelBefore ? (
        <p className="muted">
          {t("You can cancel online until {date}.", { date: f.dateTime(appointment.cancelBefore) })}
        </p>
      ) : null}
      <div className={styles.doneActions}>
        <ButtonAnchor href={calendar} icon="calendar">
          {t("Add to Google Calendar")}
        </ButtonAnchor>
        {user ? (
          <ButtonLink to={`/account/appointments/${encodeURIComponent(appointment.id)}`} variant="secondary">
            {t("View my appointments")}
          </ButtonLink>
        ) : null}
        <Button variant="ghost" onClick={onAgain}>
          {t("Book another appointment")}
        </Button>
      </div>
    </div>
  );
}

// ── Screen ──────────────────────────────────────────────────

export function BookingScreen() {
  const t = useT();
  const [params] = useSearchParams();
  const serviceSlugParam = params.get("service");
  const doctorSlugParam = params.get("doctor");
  const site = useSite();
  const services = useServiceList();
  const { state, dispatch, reachable } = useBookingFlow();
  const [booked, setBooked] = useState<Appointment | null>(null);
  const [slotTaken, setSlotTaken] = useState(false);
  const autoSkipped = useRef<string | null>(null);
  useDocumentTitle(t("Book an appointment"));

  const selectedService = services.data?.find((s) => s.id === state.serviceId) ?? null;
  const serviceDetail = useService(selectedService?.slug ?? null);

  // Preselect from the URL (once): ?service=<slug>
  const appliedService = useRef(false);
  useEffect(() => {
    if (appliedService.current || !serviceSlugParam || !services.data) return;
    appliedService.current = true;
    const s = services.data.find((x) => x.slug === serviceSlugParam && x.isBookable);
    if (s) dispatch({ type: "chooseService", serviceId: s.id });
  }, [serviceSlugParam, services.data, dispatch]);

  // …and ?doctor=<slug>, as soon as the chosen service's practitioners are known.
  const appliedDoctor = useRef(false);
  useEffect(() => {
    if (appliedDoctor.current || !doctorSlugParam || !serviceDetail.data || state.step !== "doctor") return;
    const d = serviceDetail.data.doctors.find((x) => x.slug === doctorSlugParam && x.acceptsAppointments);
    if (d) {
      appliedDoctor.current = true;
      autoSkipped.current = serviceDetail.data.id;
      dispatch({ type: "chooseDoctor", doctorId: d.id });
    }
  }, [doctorSlugParam, serviceDetail.data, state.step, dispatch]);

  // Remember that the last attempt lost its slot, until another time is chosen.
  const lastStep = useRef<BookingStep>(state.step);
  const [stepChanged, setStepChanged] = useState(false);
  useEffect(() => {
    if (lastStep.current !== state.step) setStepChanged(true);
    if (lastStep.current === "review" && state.step === "time" && !state.slot) setSlotTaken(true);
    if (state.slot) setSlotTaken(false);
    lastStep.current = state.step;
  }, [state.step, state.slot]);

  const restart = () => {
    setBooked(null);
    autoSkipped.current = null;
    dispatch({ type: "reset" });
  };

  const header = (
    <PageHeader
      eyebrow={t("Appointments")}
      title={t("Book an appointment")}
      intro={t("A few simple steps. Times shown are live from our practitioners' schedules.")}
      crumbs={[{ label: t("Book an appointment") }]}
    />
  );

  if (site.data && !site.data.features.onlineBooking) {
    return (
      <>
        {header}
        <div className="container section">
          <EmptyState
            title={t("Online booking will open soon")}
            action={<ButtonLink to="/contact">{t("Contact the clinic")}</ButtonLink>}
          >
            {t("Please call or message us to arrange an appointment.")}
          </EmptyState>
        </div>
      </>
    );
  }

  const needsService = state.step !== "service";
  let body: ReactNode;
  if (booked) body = <Confirmation appointment={booked} onAgain={restart} />;
  else if (needsService && serviceDetail.isPending) body = <LoadingState />;
  else if (needsService && (serviceDetail.isError || !serviceDetail.data))
    body = <ErrorState error={serviceDetail.error} onRetry={() => void serviceDetail.refetch()} />;
  else if (state.step === "service")
    body = doctorSlugParam ? (
      <DoctorServiceStep doctorSlug={doctorSlugParam} state={state} dispatch={dispatch} />
    ) : (
      <ServiceStep state={state} dispatch={dispatch} onlyServiceIds={null} />
    );
  else if (state.step === "doctor")
    body = <DoctorStep service={serviceDetail.data!} state={state} dispatch={dispatch} autoSkipped={autoSkipped} />;
  else if (state.step === "time")
    body = <TimeStep service={serviceDetail.data!} state={state} dispatch={dispatch} slotTaken={slotTaken} />;
  else if (state.step === "details") body = <DetailsStep state={state} dispatch={dispatch} />;
  else body = <ReviewStep service={serviceDetail.data!} state={state} dispatch={dispatch} onBooked={setBooked} />;

  return (
    <>
      {header}
      <section className="section">
        <div className={`container ${styles.wrap}`}>
          <Card className={styles.panel}>
            {!booked ? (
              <Steps
                label={t("Booking steps")}
                steps={BOOKING_STEPS.map((k) => ({ key: k, label: t(BOOKING_STEP_LABEL[k]) }))}
                current={state.step}
                reachable={reachable}
                onSelect={(step) => dispatch({ type: "goTo", step })}
              />
            ) : null}
            <StepChanged.Provider value={stepChanged}>{body}</StepChanged.Provider>
            {!booked && state.step !== "service" ? (
              <div className={styles.back}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="chevronLeft"
                  onClick={() => {
                    const i = BOOKING_STEPS.indexOf(state.step);
                    // Skip the practitioner step on the way back when it was chosen automatically.
                    const prev =
                      BOOKING_STEPS[i - 1] === "doctor" &&
                      autoSkipped.current === state.serviceId &&
                      (serviceDetail.data?.doctors.length ?? 0) <= 1
                        ? "service"
                        : BOOKING_STEPS[i - 1]!;
                    dispatch({ type: "goTo", step: prev });
                  }}
                >
                  {t("Back")}
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </section>
    </>
  );
}
