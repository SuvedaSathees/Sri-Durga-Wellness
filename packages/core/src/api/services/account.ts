import type {
  Appointment,
  CancelAppointmentRequest,
  ClassRegistration,
  MyCourse,
  Order,
  OrderSummary,
  PageQuery,
  Paginated,
  Payment,
  RenewRegistrationResponse,
} from "../../models";
import type { ApiClient } from "../client";
import { endpoints } from "../endpoints";

/** The signed-in customer's own records. */
export function createAccountService(api: ApiClient) {
  return {
    appointments: (query: { scope?: "upcoming" | "past" } & PageQuery = {}, signal?: AbortSignal) =>
      api.request<Paginated<Appointment>>(endpoints.account.appointments, { query, signal }),
    appointment: (appointmentId: string, signal?: AbortSignal) =>
      api.request<Appointment>(endpoints.account.appointment, { params: { appointmentId }, signal }),
    cancelAppointment: (appointmentId: string, body: CancelAppointmentRequest) =>
      api.request<Appointment>(endpoints.account.cancelAppointment, { params: { appointmentId }, body }),
    orders: (query: PageQuery = {}, signal?: AbortSignal) =>
      api.request<Paginated<OrderSummary>>(endpoints.account.orders, { query, signal }),
    order: (reference: string, signal?: AbortSignal) =>
      api.request<Order>(endpoints.account.order, { params: { reference }, signal }),
    payments: (query: { open?: boolean } = {}, signal?: AbortSignal) =>
      api.request<Payment[]>(endpoints.account.payments, { query, signal }),
    registrations: (signal?: AbortSignal) =>
      api.request<ClassRegistration[]>(endpoints.account.registrations, { signal }),
    registration: (registrationId: string, signal?: AbortSignal) =>
      api.request<ClassRegistration>(endpoints.account.registration, { params: { registrationId }, signal }),
    /** Start paying for another month of a monthly class. */
    renewRegistration: (registrationId: string, idempotencyKey: string) =>
      api.request<RenewRegistrationResponse>(endpoints.account.renewRegistration, {
        params: { registrationId },
        body: {},
        idempotencyKey,
      }),
    courses: (signal?: AbortSignal) => api.request<MyCourse[]>(endpoints.account.courses, { signal }),
  };
}

export type AccountService = ReturnType<typeof createAccountService>;
