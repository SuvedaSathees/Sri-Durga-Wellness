import type { Payment, SubmitPaymentRequest } from "../../models";
import type { ApiClient } from "../client";
import { endpoints } from "../endpoints";

/** UPI payments. Submitting a UTR only asks the clinic to verify — it never marks anything paid. */
export function createPaymentsService(api: ApiClient) {
  return {
    get: (paymentId: string, signal?: AbortSignal) =>
      api.request<Payment>(endpoints.payments.get, { params: { paymentId }, signal }),
    submit: (paymentId: string, body: SubmitPaymentRequest) =>
      api.request<Payment>(endpoints.payments.submit, { params: { paymentId }, body }),
  };
}

export type PaymentsService = ReturnType<typeof createPaymentsService>;
