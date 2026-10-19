/** Booking hooks: availability, the booking flow, and the two enquiry forms. */
import { useReducer } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  isApiError,
  todayKey,
  type AvailabilityQuery,
  type ConsultationRequestInput,
  type ContactMessageInput,
  type ID,
  type PatientDetailsInput,
} from "@sdw/core";
import { useApi, useApp } from "../provider";
import { qk } from "../query-keys";
import {
  bookingReducer,
  initialBookingState,
  reachableSteps,
  type BookingAction,
  type BookingState,
} from "./booking-flow";

export * from "./booking-flow";

/** How far ahead customers can book, in days. */
export const BOOKING_WINDOW_DAYS = 28;

/** Free slots for a service + practitioner over the booking window. */
export function useAvailability(serviceId: ID | null, doctorId: ID | null, days = BOOKING_WINDOW_DAYS) {
  const api = useApi();
  const { locale } = useApp();
  const query: AvailabilityQuery = { serviceId: serviceId ?? "", doctorId: doctorId ?? "", from: todayKey(), days };
  return useQuery({
    queryKey: qk.availability(locale, query),
    queryFn: ({ signal }) => api.booking.availability(query, signal),
    enabled: !!serviceId && !!doctorId,
    staleTime: 30_000,
  });
}

export function useBookingFlow(prefill: Partial<PatientDetailsInput> = {}) {
  const [state, dispatch] = useReducer(bookingReducer, prefill, initialBookingState);
  return { state, dispatch: dispatch as (a: BookingAction) => void, reachable: reachableSteps(state) };
}

/** Confirms the booking. On SLOT_TAKEN the flow returns to time selection with fresh availability. */
export function useBookAppointment(state: BookingState, dispatch: (a: BookingAction) => void) {
  const api = useApi();
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => {
      if (!state.serviceId || !state.doctorId || !state.slot) throw new Error("Booking is incomplete");
      return api.booking.book(
        {
          serviceId: state.serviceId,
          doctorId: state.doctorId,
          startsAt: state.slot.startsAt,
          patientName: state.details.patientName,
          patientPhone: state.details.patientPhone,
          patientEmail: state.details.patientEmail,
          reason: state.details.reason,
          consent: true,
        },
        state.idempotencyKey,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["availability"] });
      void qc.invalidateQueries({ queryKey: [...qk.me, "appointments"] });
    },
    onError: (error) => {
      if (isApiError(error) && error.code === "SLOT_TAKEN") {
        dispatch({ type: "slotTaken" });
        void qc.invalidateQueries({ queryKey: ["availability"] });
      }
    },
  });
  return mutation;
}

export function useConsultationRequest() {
  const api = useApi();
  return useMutation({ mutationFn: (body: ConsultationRequestInput) => api.booking.requestConsultation(body) });
}

export function useContactMessage() {
  const api = useApi();
  return useMutation({ mutationFn: (body: ContactMessageInput) => api.booking.sendMessage(body) });
}

/** First date with free slots, for opening the date picker on something bookable. */
export function firstOpenDate(days: Array<{ date: string; slots: unknown[] }> | undefined): string | null {
  return days?.find((d) => d.slots.length > 0)?.date ?? null;
}
