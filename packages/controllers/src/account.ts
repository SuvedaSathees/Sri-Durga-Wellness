/** The signed-in customer's own records. Every key starts with "me", so sign-out clears them all. */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { idempotencyKey, type CancelAppointmentRequest, type PageQuery } from "@sdw/core";
import { useApi, useApp } from "./provider";
import { qk } from "./query-keys";
import { useSession } from "./session";

function useSignedIn() {
  return useSession().status === "signedIn";
}

export function useMyAppointments(scope: "upcoming" | "past") {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.myAppointments(locale, scope),
    queryFn: ({ signal }) => api.account.appointments({ scope, pageSize: 50 }, signal),
    enabled: useSignedIn(),
  });
}

export function useMyAppointment(id: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.myAppointment(locale, id),
    queryFn: ({ signal }) => api.account.appointment(id, signal),
    enabled: useSignedIn(),
  });
}

export function useCancelAppointment(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  const { locale } = useApp();
  return useMutation({
    mutationFn: (body: CancelAppointmentRequest) => api.account.cancelAppointment(id, body),
    onSuccess: (appointment) => {
      qc.setQueryData(qk.myAppointment(locale, id), appointment);
      void qc.invalidateQueries({ queryKey: [...qk.me, "appointments"] });
      void qc.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useMyOrders(query: PageQuery = {}) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.myOrders(locale, query),
    queryFn: ({ signal }) => api.account.orders(query, signal),
    enabled: useSignedIn(),
    placeholderData: keepPreviousData,
  });
}

export function useMyOrder(reference: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.myOrder(locale, reference),
    queryFn: ({ signal }) => api.account.order(reference, signal),
    enabled: useSignedIn(),
    refetchInterval: (q) => (q.state.data?.status === "PAYMENT_SUBMITTED" ? 30_000 : false),
  });
}

export function useMyPayments(open = false) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.myPayments(locale, open),
    queryFn: ({ signal }) => api.account.payments({ open }, signal),
    enabled: useSignedIn(),
  });
}

export function useMyRegistrations() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.myRegistrations(locale),
    queryFn: ({ signal }) => api.account.registrations(signal),
    enabled: useSignedIn(),
  });
}

export function useMyRegistration(id: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.myRegistration(locale, id),
    queryFn: ({ signal }) => api.account.registration(id, signal),
    enabled: useSignedIn(),
    refetchInterval: (q) =>
      q.state.data?.status === "PAYMENT_SUBMITTED" || q.state.data?.monthly?.renewal?.payment.status === "SUBMITTED"
        ? 30_000
        : false,
  });
}

export function useMyCourses() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.myCourses(locale),
    queryFn: ({ signal }) => api.account.courses(signal),
    enabled: useSignedIn(),
  });
}

/** Start paying for the next month of a monthly class. Resolves with the payment to complete. */
export function useRenewRegistration() {
  const api = useApi();
  const qc = useQueryClient();
  const keys = useRef(new Map<string, string>());
  return useMutation({
    mutationFn: (registrationId: string) => {
      if (!keys.current.has(registrationId)) keys.current.set(registrationId, idempotencyKey());
      return api.account.renewRegistration(registrationId, keys.current.get(registrationId)!);
    },
    onSuccess: (_data, registrationId) => {
      keys.current.delete(registrationId);
      void qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}
