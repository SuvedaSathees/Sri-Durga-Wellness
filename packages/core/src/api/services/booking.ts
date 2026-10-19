import type {
  Appointment,
  Availability,
  AvailabilityQuery,
  ConsultationRequestInput,
  ContactMessageInput,
  CreateAppointmentRequest,
  ReferenceResponse,
} from "../../models";
import type { ApiClient } from "../client";
import { endpoints } from "../endpoints";

/** Appointment booking and the two enquiry forms. Guests can use all of these. */
export function createBookingService(api: ApiClient) {
  return {
    availability: (query: AvailabilityQuery, signal?: AbortSignal) =>
      api.request<Availability>(endpoints.booking.availability, { query, signal }),
    book: (body: CreateAppointmentRequest, idempotencyKey: string) =>
      api.request<Appointment>(endpoints.booking.create, { body, idempotencyKey }),
    requestConsultation: (body: ConsultationRequestInput) =>
      api.request<ReferenceResponse>(endpoints.booking.consultation, { body }),
    sendMessage: (body: ContactMessageInput) => api.request<ReferenceResponse>(endpoints.booking.contact, { body }),
  };
}

export type BookingService = ReturnType<typeof createBookingService>;
