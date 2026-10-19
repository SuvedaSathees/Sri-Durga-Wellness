/** UPI payment status and UTR submission. The app never marks a payment as paid. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { VERIFICATION_POLL_MS, type SubmitPaymentRequest } from "@sdw/core";
import { useApi, useApp } from "./provider";
import { qk } from "./query-keys";

/** A payment, re-checked every 30 s while the clinic is verifying it. */
export function usePayment(paymentId: string | null | undefined) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.payment(locale, paymentId ?? ""),
    queryFn: ({ signal }) => api.payments.get(paymentId!, signal),
    enabled: !!paymentId,
    refetchInterval: (q) => (q.state.data?.status === "SUBMITTED" ? VERIFICATION_POLL_MS : false),
  });
}

export function useSubmitUtr(paymentId: string) {
  const api = useApi();
  const qc = useQueryClient();
  const { locale } = useApp();
  return useMutation({
    mutationFn: (body: SubmitPaymentRequest) => api.payments.submit(paymentId, body),
    onSuccess: (payment) => {
      qc.setQueryData(qk.payment(locale, paymentId), payment);
      // Orders, registrations and enrolments change status too.
      void qc.invalidateQueries({ queryKey: qk.me, predicate: (q) => q.queryKey[1] !== "payment" });
    },
  });
}
