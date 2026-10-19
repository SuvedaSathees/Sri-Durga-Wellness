/**
 * The appointment booking flow as a pure reducer: service → practitioner → date & time → details
 * → review. Both apps drive the same state machine; only the screens differ.
 */
import { idempotencyKey, type DateKey, type ID, type PatientDetailsInput, type Slot } from "@sdw/core";

export const BOOKING_STEPS = ["service", "doctor", "time", "details", "review"] as const;
export type BookingStep = (typeof BOOKING_STEPS)[number];

export const BOOKING_STEP_LABEL: Record<BookingStep, string> = {
  service: "Service",
  doctor: "Practitioner",
  time: "Date & time",
  details: "Your details",
  review: "Review",
};

export type BookingState = {
  step: BookingStep;
  serviceId: ID | null;
  doctorId: ID | null;
  date: DateKey | null;
  slot: Slot | null;
  details: PatientDetailsInput;
  /** One key per booking attempt, so a retried request can't book twice. */
  idempotencyKey: string;
};

export type BookingAction =
  | { type: "chooseService"; serviceId: ID; onlyDoctorId?: ID | null }
  | { type: "chooseDoctor"; doctorId: ID }
  | { type: "chooseDate"; date: DateKey }
  | { type: "chooseSlot"; slot: Slot }
  | { type: "setDetails"; details: PatientDetailsInput }
  | { type: "goTo"; step: BookingStep }
  /** The slot was taken by someone else while the customer was deciding. */
  | { type: "slotTaken" }
  | { type: "reset"; details?: Partial<PatientDetailsInput> };

export const emptyDetails = (prefill: Partial<PatientDetailsInput> = {}): PatientDetailsInput => ({
  patientName: "",
  patientPhone: "",
  patientEmail: "",
  reason: "",
  consent: false as unknown as true,
  ...prefill,
});

export function initialBookingState(prefill: Partial<PatientDetailsInput> = {}): BookingState {
  return {
    step: "service",
    serviceId: null,
    doctorId: null,
    date: null,
    slot: null,
    details: emptyDetails(prefill),
    idempotencyKey: idempotencyKey(),
  };
}

/** Steps the customer may jump back to (anything already completed). */
export function reachableSteps(state: BookingState): BookingStep[] {
  const done: Record<BookingStep, boolean> = {
    service: true,
    doctor: !!state.serviceId,
    time: !!state.serviceId && !!state.doctorId,
    details: !!state.slot,
    review: !!state.slot && state.step === "review",
  };
  return BOOKING_STEPS.filter((s) => done[s]);
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "chooseService": {
      const changed = action.serviceId !== state.serviceId;
      const doctorId = action.onlyDoctorId ?? (changed ? null : state.doctorId);
      return {
        ...state,
        serviceId: action.serviceId,
        doctorId,
        date: changed ? null : state.date,
        slot: changed ? null : state.slot,
        step: doctorId ? "time" : "doctor",
      };
    }
    case "chooseDoctor": {
      const changed = action.doctorId !== state.doctorId;
      return {
        ...state,
        doctorId: action.doctorId,
        date: changed ? null : state.date,
        slot: changed ? null : state.slot,
        step: "time",
      };
    }
    case "chooseDate":
      return { ...state, date: action.date, slot: state.date === action.date ? state.slot : null };
    case "chooseSlot":
      return { ...state, slot: action.slot, step: "details" };
    case "setDetails":
      return { ...state, details: action.details, step: "review" };
    case "goTo":
      return reachableSteps(state).includes(action.step) ? { ...state, step: action.step } : state;
    case "slotTaken":
      return { ...state, slot: null, step: "time", idempotencyKey: idempotencyKey() };
    case "reset":
      return initialBookingState(action.details);
  }
}
