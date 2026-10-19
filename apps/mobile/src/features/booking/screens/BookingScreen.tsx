/**
 * Booking flow (same shared reducer as the website): service → practitioner → date & time →
 * details → review → confirmation. Android's back button and the iOS back gesture step back
 * through the flow instead of leaving it.
 */
import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { usePreventRemove } from "@react-navigation/native";
import {
  BOOKING_STEP_LABEL,
  BOOKING_STEPS,
  firstOpenDate,
  useAvailability,
  useBookAppointment,
  useBookingFlow,
  useForm,
  useFormat,
  useService,
  useServiceList,
  useSession,
  useSite,
  useT,
  type BookingAction,
  type BookingState,
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
  type ServiceDetail,
} from "@sdw/core";
import {
  Button,
  Card,
  Checkbox,
  EmptyView,
  ErrorView,
  Facts,
  FormError,
  Icon,
  ListRow,
  LoadingView,
  Notice,
  QueryView,
  Screen,
  Stack,
  Text,
  TextField,
} from "../../../components/ui";
import type { RootNavigation, RootScreenProps } from "../../../navigation/types";
import { openWebPage } from "../../../platform/links";
import { theme } from "../../../theme";

type Dispatch = (a: BookingAction) => void;

function Rows({ children }: { children: ReactNode[] }) {
  return (
    <Card padded={false}>
      {children.map((child, i) => (
        <View key={i} style={i > 0 ? styles.divider : null}>
          {child}
        </View>
      ))}
    </Card>
  );
}

function ServiceStep({ state, dispatch }: { state: BookingState; dispatch: Dispatch }) {
  const t = useT();
  const f = useFormat();
  const services = useServiceList();
  return (
    <Stack>
      <Text variant="h2">{t("Choose a service")}</Text>
      <QueryView
        query={services}
        isEmpty={(l) => !l.some((s) => s.isBookable)}
        empty={
          <EmptyView
            title={t("Online booking will open soon")}
            body={t("Please call or message us to arrange an appointment.")}
          />
        }
      >
        {(list) => (
          <Rows>
            {list
              .filter((s) => s.isBookable)
              .map((s) => (
                <ListRow
                  key={s.id}
                  title={s.name}
                  detail={[
                    f.duration(s.durationMinutes),
                    t(SERVICE_MODE_LABEL[s.mode]),
                    s.price !== null ? f.price(s.price) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  onPress={() => dispatch({ type: "chooseService", serviceId: s.id })}
                  right={state.serviceId === s.id ? <Icon name="checkmark-circle" size={22} /> : undefined}
                />
              ))}
          </Rows>
        )}
      </QueryView>
    </Stack>
  );
}

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
  useEffect(() => {
    if (doctors.length === 1 && autoSkipped.current !== service.id) {
      autoSkipped.current = service.id;
      dispatch({ type: "chooseDoctor", doctorId: doctors[0]!.id });
    }
  }, [doctors, service.id, dispatch, autoSkipped]);
  return (
    <Stack>
      <Text variant="h2">{t("Choose a practitioner")}</Text>
      <Text variant="small">{t("Practitioners who offer {service}.", { service: service.name })}</Text>
      {doctors.length === 0 ? (
        <EmptyView
          title={t("Online booking will open soon")}
          body={t("Please call or message us to arrange an appointment.")}
        />
      ) : (
        <Rows>
          {doctors.map((d) => (
            <ListRow
              key={d.id}
              icon="person-outline"
              title={d.name}
              detail={d.specialisation}
              onPress={() => dispatch({ type: "chooseDoctor", doctorId: d.id })}
              right={state.doctorId === d.id ? <Icon name="checkmark-circle" size={22} /> : undefined}
            />
          ))}
        </Rows>
      )}
    </Stack>
  );
}

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
    <Stack>
      <Text variant="h2">{t("Choose a date and time")}</Text>
      <Text variant="small">
        {t("{service} with {doctor} · {duration}. Times are shown in India Standard Time.", {
          service: service.name,
          doctor: doctor?.name ?? "",
          duration: f.duration(service.durationMinutes),
        })}
      </Text>
      {slotTaken ? (
        <Notice tone="warning">
          {t("Sorry — that time has just been taken or is no longer available. Please choose another time.")}
        </Notice>
      ) : null}
      <QueryView
        query={availability}
        loading={<LoadingView label={t("Loading available times")} />}
        isEmpty={(a) => !a.days.some((d) => d.slots.length > 0)}
        empty={
          <EmptyView title={t("No free times right now")} body={t("There are no free times in the booking window.")} />
        }
      >
        {(a) => (
          <Stack>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dates}>
              {a.days.map((d) => {
                const chip = f.dayChip(d.date);
                const selected = state.date === d.date;
                const count = d.slots.length;
                const label =
                  count === 0
                    ? t("{date}, no times available", { date: f.dateKey(d.date, "long") })
                    : count === 1
                      ? t("{date}, {count} time available", { date: f.dateKey(d.date, "long"), count })
                      : t("{date}, {count} times available", { date: f.dateKey(d.date, "long"), count });
                return (
                  <Pressable
                    key={d.date}
                    onPress={() => dispatch({ type: "chooseDate", date: d.date })}
                    disabled={count === 0}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected, disabled: count === 0 }}
                    style={[styles.date, selected ? styles.dateOn : null, count === 0 ? styles.dateOff : null]}
                  >
                    <Text variant="caption" style={selected ? styles.onPrimary : null}>
                      {chip.weekday}
                    </Text>
                    <Text style={[styles.dateDay, selected ? styles.onPrimary : null]}>{chip.day}</Text>
                    <Text variant="caption" style={selected ? styles.onPrimary : null}>
                      {chip.month}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {day ? (
              <Stack gap={14}>
                <Text variant="h3">{f.dateKey(day.date, "long")}</Text>
                {day.slots.length === 0 ? (
                  <Text variant="small">{t("No times left on this day. Please choose another date.")}</Text>
                ) : (
                  groupSlots(day.slots).map((g) => (
                    <View key={g.period} style={{ gap: 8 }}>
                      <Text variant="eyebrow">{t(PERIOD_LABEL[g.period])}</Text>
                      <View style={styles.slots}>
                        {g.slots.map((s) => {
                          const selected = state.slot?.startsAt === s.startsAt;
                          return (
                            <Pressable
                              key={s.startsAt}
                              onPress={() => dispatch({ type: "chooseSlot", slot: s })}
                              accessibilityRole="button"
                              accessibilityState={{ selected }}
                              style={({ pressed }) => [
                                styles.slot,
                                selected ? styles.slotOn : null,
                                pressed && !selected ? styles.slotPressed : null,
                              ]}
                            >
                              <Text variant="label" style={selected ? styles.onPrimary : null}>
                                {f.time(s.startsAt)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))
                )}
              </Stack>
            ) : null}
          </Stack>
        )}
      </QueryView>
    </Stack>
  );
}

function DetailsStep({ state, dispatch }: { state: BookingState; dispatch: Dispatch }) {
  const t = useT();
  const { user } = useSession();
  const form = useForm(patientDetailsSchema, {
    ...state.details,
    patientName: state.details.patientName || user?.name || "",
    patientEmail: state.details.patientEmail || user?.email || "",
    patientPhone: state.details.patientPhone || user?.phone || "",
  });
  const v = form.values;
  const submit = form.handleSubmit((data) => dispatch({ type: "setDetails", details: data as PatientDetailsInput }));
  return (
    <Stack>
      <Text variant="h2">{t("Your details")}</Text>
      <Text variant="small">{t("We'll use these to confirm your booking and contact you if anything changes.")}</Text>
      <FormError message={form.formError} />
      <TextField
        label={t("Full name")}
        required
        autoComplete="name"
        textContentType="name"
        value={v.patientName}
        onChangeText={(x) => form.setField("patientName", x)}
        error={form.errorFor("patientName")}
      />
      <TextField
        label={t("Mobile number")}
        required
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        value={v.patientPhone}
        onChangeText={(x) => form.setField("patientPhone", x)}
        error={form.errorFor("patientPhone")}
      />
      <TextField
        label={t("Email")}
        required
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={v.patientEmail}
        onChangeText={(x) => form.setField("patientEmail", x)}
        error={form.errorFor("patientEmail")}
      />
      <TextField
        label={t("Reason for visit")}
        hint={t("A few words are enough. Please don't include detailed medical records.")}
        required
        multiline
        value={v.reason}
        onChangeText={(x) => form.setField("reason", x)}
        error={form.errorFor("reason")}
      />
      <Checkbox
        label={t(
          "I agree to the clinic storing these details to manage my appointment, as described in the Privacy Policy.",
        )}
        checked={v.consent === true}
        onChange={(x) => form.setField("consent", x)}
        error={form.errorFor("consent")}
      />
      <Button fullWidth iconAfter="arrow-forward" onPress={() => void submit()}>
        {t("Review booking")}
      </Button>
    </Stack>
  );
}

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
    <Stack>
      <Text variant="h2">{t("Review and confirm")}</Text>
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
      <View style={styles.row}>
        <Button
          variant="ghost"
          size="sm"
          icon="create-outline"
          onPress={() => dispatch({ type: "goTo", step: "details" })}
        >
          {t("Edit details")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon="calendar-outline"
          onPress={() => dispatch({ type: "goTo", step: "time" })}
        >
          {t("Change time")}
        </Button>
      </View>
      {error ? <Notice tone="danger">{t(errorMessage(error))}</Notice> : null}
      {service.price !== null ? (
        <Text variant="small">{t("Fees are paid at the clinic unless stated otherwise.")}</Text>
      ) : null}
      <Button
        fullWidth
        icon="checkmark"
        loading={book.isPending}
        onPress={() => book.mutate(undefined, { onSuccess: onBooked })}
      >
        {book.isPending ? t("Booking…") : t("Confirm booking")}
      </Button>
    </Stack>
  );
}

function Confirmation({
  appointment,
  navigation,
  onAgain,
}: {
  appointment: Appointment;
  navigation: RootNavigation;
  onAgain: () => void;
}) {
  const t = useT();
  const f = useFormat();
  const { user } = useSession();
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
    <Stack>
      <View style={styles.doneHead} accessible accessibilityLiveRegion="polite">
        <View style={styles.doneIcon}>
          <Icon name="checkmark-circle" size={40} color={theme.color.success} />
        </View>
        <Text variant="h1" style={styles.center}>
          {t("Your appointment is booked")}
        </Text>
        <Text style={styles.center}>
          {t("We've sent a confirmation to {email}. Please keep your booking reference handy.", {
            email: appointment.patientEmail,
          })}
        </Text>
      </View>
      <Card>
        <Facts
          items={[
            { label: t("Booking reference"), value: appointment.reference },
            { label: t("Service"), value: appointment.service.name },
            { label: t("Practitioner"), value: appointment.doctor.name },
            { label: t("Date"), value: f.longDate(appointment.startsAt) },
            { label: t("Time"), value: f.time(appointment.startsAt) },
            { label: t("Where"), value: where },
          ]}
        />
      </Card>
      {appointment.cancelBefore ? (
        <Text variant="small">
          {t("You can cancel online until {date}.", { date: f.dateTime(appointment.cancelBefore) })}
        </Text>
      ) : null}
      <Button fullWidth icon="calendar-outline" variant="secondary" onPress={() => void openWebPage(calendar)}>
        {t("Add to Google Calendar")}
      </Button>
      {user ? (
        <Button
          fullWidth
          variant="secondary"
          onPress={() => navigation.navigate("Appointment", { id: appointment.id })}
        >
          {t("View my appointments")}
        </Button>
      ) : null}
      <Button fullWidth variant="ghost" onPress={onAgain}>
        {t("Book another appointment")}
      </Button>
      <Button fullWidth onPress={() => navigation.navigate("Tabs", { screen: "HomeTab" })}>
        {t("Done")}
      </Button>
    </Stack>
  );
}

export function BookingScreen({ route, navigation }: RootScreenProps<"Booking">) {
  const t = useT();
  const serviceSlug = route.params?.serviceSlug;
  const doctorSlug = route.params?.doctorSlug;
  const site = useSite();
  const services = useServiceList();
  const { state, dispatch } = useBookingFlow();
  const [booked, setBooked] = useState<Appointment | null>(null);
  const [slotTaken, setSlotTaken] = useState(false);
  const autoSkipped = useRef<string | null>(null);
  const selected = services.data?.find((s) => s.id === state.serviceId) ?? null;
  const detail = useService(selected?.slug ?? null);

  // Preselect from route params (slugs only), once.
  const appliedService = useRef(false);
  useEffect(() => {
    if (appliedService.current || !serviceSlug || !services.data) return;
    appliedService.current = true;
    const s = services.data.find((x) => x.slug === serviceSlug && x.isBookable);
    if (s) dispatch({ type: "chooseService", serviceId: s.id });
  }, [serviceSlug, services.data, dispatch]);

  const appliedDoctor = useRef(false);
  useEffect(() => {
    if (appliedDoctor.current || !doctorSlug || !detail.data || state.step !== "doctor") return;
    const d = detail.data.doctors.find((x) => x.slug === doctorSlug && x.acceptsAppointments);
    if (d) {
      appliedDoctor.current = true;
      autoSkipped.current = detail.data.id;
      dispatch({ type: "chooseDoctor", doctorId: d.id });
    }
  }, [doctorSlug, detail.data, state.step, dispatch]);

  const lastStep = useRef(state.step);
  useEffect(() => {
    if (lastStep.current === "review" && state.step === "time" && !state.slot) setSlotTaken(true);
    if (state.slot) setSlotTaken(false);
    lastStep.current = state.step;
  }, [state.step, state.slot]);

  const index = BOOKING_STEPS.indexOf(state.step);
  const previous = () => {
    const prev = BOOKING_STEPS[index - 1];
    if (!prev) return;
    const skipDoctor =
      prev === "doctor" && autoSkipped.current === state.serviceId && (detail.data?.doctors.length ?? 0) <= 1;
    dispatch({ type: "goTo", step: skipDoctor ? "service" : prev });
  };

  // Back button / swipe steps back through the flow before leaving the screen.
  usePreventRemove(!booked && index > 0, () => previous());

  const restart = () => {
    setBooked(null);
    autoSkipped.current = null;
    dispatch({ type: "reset" });
  };

  if (site.data && !site.data.features.onlineBooking) {
    return (
      <Screen>
        <EmptyView
          title={t("Online booking will open soon")}
          body={t("Please call or message us to arrange an appointment.")}
          action={<Button onPress={() => navigation.navigate("Contact")}>{t("Contact the clinic")}</Button>}
        />
      </Screen>
    );
  }

  let body: ReactNode;
  if (booked) body = <Confirmation appointment={booked} navigation={navigation} onAgain={restart} />;
  else if (state.step !== "service" && detail.isPending) body = <LoadingView />;
  else if (state.step !== "service" && (detail.isError || !detail.data))
    body = <ErrorView error={detail.error} onRetry={() => void detail.refetch()} />;
  else if (state.step === "service") body = <ServiceStep state={state} dispatch={dispatch} />;
  else if (state.step === "doctor")
    body = <DoctorStep service={detail.data!} state={state} dispatch={dispatch} autoSkipped={autoSkipped} />;
  else if (state.step === "time")
    body = <TimeStep service={detail.data!} state={state} dispatch={dispatch} slotTaken={slotTaken} />;
  else if (state.step === "details") body = <DetailsStep state={state} dispatch={dispatch} />;
  else body = <ReviewStep service={detail.data!} state={state} dispatch={dispatch} onBooked={setBooked} />;

  return (
    <Screen keyboard={state.step === "details"} onRefresh={state.step === "time" ? () => detail.refetch() : undefined}>
      {!booked ? (
        <View
          style={styles.progress}
          accessible
          accessibilityLabel={t("Step {current} of {total}: {step}", {
            current: index + 1,
            total: BOOKING_STEPS.length,
            step: t(BOOKING_STEP_LABEL[state.step]),
          })}
        >
          <Text variant="eyebrow">
            {t("Step {current} of {total}", { current: index + 1, total: BOOKING_STEPS.length })}
          </Text>
          <View style={styles.bar}>
            {BOOKING_STEPS.map((s, i) => (
              <View key={s} style={[styles.barPart, i <= index ? styles.barOn : null]} />
            ))}
          </View>
        </View>
      ) : null}
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.color.borderStrong },
  progress: { gap: 8 },
  bar: { flexDirection: "row", gap: 4 },
  barPart: { flex: 1, height: 4, borderRadius: 2, backgroundColor: theme.color.border },
  barOn: { backgroundColor: theme.color.primary },
  dates: { gap: 8, paddingVertical: 2 },
  date: {
    width: 64,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    backgroundColor: theme.color.surface,
    alignItems: "center",
    gap: 2,
  },
  dateOn: { backgroundColor: theme.color.primary, borderColor: theme.color.primary },
  dateOff: { opacity: 0.4, backgroundColor: theme.color.bgAlt },
  dateDay: { fontSize: 20, fontWeight: "700", color: theme.color.text },
  onPrimary: { color: theme.color.onPrimary },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: {
    minWidth: 96,
    minHeight: theme.touchTarget,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    backgroundColor: theme.color.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  slotOn: { backgroundColor: theme.color.primary, borderColor: theme.color.primary },
  slotPressed: { backgroundColor: theme.color.accentSoft },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  doneHead: { alignItems: "center", gap: 10, paddingVertical: 8 },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.color.successBg,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
});
