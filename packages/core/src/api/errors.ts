/**
 * One error type for every failure the API layer can produce, so screens handle errors the same
 * way whether the cause was validation, auth, a conflict, the network or a bug on the server.
 */
import { AxiosError } from "axios";
import type { ApiErrorBody } from "../models/common";

export type ApiErrorKind = "http" | "network" | "timeout" | "cancelled" | "unknown";

/** Error codes the apps understand. The backend may add more; unknown codes fall back by status. */
export const ERROR_CODES = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "INVALID_CREDENTIALS",
  "FORBIDDEN",
  "NOT_FOUND",
  "EMAIL_TAKEN",
  "RESET_TOKEN_INVALID",
  "SLOT_TAKEN",
  "TOO_LATE_TO_CANCEL",
  "OUT_OF_STOCK",
  "PAYMENTS_NOT_CONFIGURED",
  "PAYMENT_NOT_PAYABLE",
  "DUPLICATE_UTR",
  "BATCH_CLOSED",
  "ALREADY_REGISTERED",
  "ALREADY_ENROLLED",
  "NOT_ENROLLED",
  "RATE_LIMITED",
  "SERVER_ERROR",
  "SERVICE_UNAVAILABLE",
] as const;

export type KnownErrorCode = (typeof ERROR_CODES)[number];

export class ApiError extends Error {
  override name = "ApiError";
  readonly kind: ApiErrorKind;
  /** HTTP status, or 0 when no response was received. */
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string>;
  readonly requestId: string | undefined;

  constructor(init: {
    kind: ApiErrorKind;
    status: number;
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
    requestId?: string;
  }) {
    super(init.message);
    this.kind = init.kind;
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors ?? {};
    this.requestId = init.requestId;
  }

  get isNetworkError(): boolean {
    return this.kind === "network" || this.kind === "timeout";
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get hasFieldErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object") return false;
  const err = (value as { error?: unknown }).error;
  return !!err && typeof err === "object" && typeof (err as { code?: unknown }).code === "string";
}

const codeForStatus = (status: number): string =>
  status === 400 || status === 422
    ? "VALIDATION_FAILED"
    : status === 401
      ? "UNAUTHENTICATED"
      : status === 403
        ? "FORBIDDEN"
        : status === 404
          ? "NOT_FOUND"
          : status === 429
            ? "RATE_LIMITED"
            : status === 503
              ? "SERVICE_UNAVAILABLE"
              : status >= 500
                ? "SERVER_ERROR"
                : "HTTP_ERROR";

/** Turn anything thrown during a request into an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError || (error && typeof error === "object" && (error as AxiosError).isAxiosError)) {
    const ax = error as AxiosError;
    if (ax.code === AxiosError.ERR_CANCELED || ax.name === "CanceledError") {
      return new ApiError({ kind: "cancelled", status: 0, code: "CANCELLED", message: "Request cancelled" });
    }
    if (ax.response) {
      const { status, data, headers } = ax.response;
      const requestId = (headers as Record<string, unknown> | undefined)?.["x-request-id"];
      if (isErrorBody(data)) {
        return new ApiError({
          kind: "http",
          status,
          code: data.error.code,
          message: data.error.message || ax.message,
          fieldErrors: data.error.fieldErrors,
          requestId: data.error.requestId ?? (typeof requestId === "string" ? requestId : undefined),
        });
      }
      return new ApiError({
        kind: "http",
        status,
        code: codeForStatus(status),
        message: `Request failed with status ${status}`,
        requestId: typeof requestId === "string" ? requestId : undefined,
      });
    }
    if (ax.code === AxiosError.ECONNABORTED || ax.code === AxiosError.ETIMEDOUT) {
      return new ApiError({ kind: "timeout", status: 0, code: "TIMEOUT", message: "The request timed out" });
    }
    return new ApiError({ kind: "network", status: 0, code: "NETWORK_ERROR", message: ax.message || "Network error" });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return new ApiError({ kind: "unknown", status: 0, code: "UNKNOWN", message });
}

/** Customer-facing message (an English i18n key) for an error. Screens pass it through t(). */
const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "You seem to be offline. Check your connection and try again.",
  TIMEOUT: "The server took too long to respond. Please try again.",
  VALIDATION_FAILED: "Please check the highlighted fields.",
  UNAUTHENTICATED: "Your session has ended. Please sign in again.",
  INVALID_CREDENTIALS: "That email and password don't match. Please try again.",
  FORBIDDEN: "You don't have permission to do this.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  EMAIL_TAKEN: "An account with this email already exists. Try signing in instead.",
  RESET_TOKEN_INVALID: "This reset link has expired or was already used. Please request a new one.",
  SLOT_TAKEN: "That time has just been booked by someone else. Please choose another time.",
  TOO_LATE_TO_CANCEL: "This appointment can no longer be cancelled online. Please contact the clinic.",
  OUT_OF_STOCK: "Some items are no longer available in that quantity. Please review your cart.",
  PAYMENTS_NOT_CONFIGURED: "Online payment isn't available yet. Please contact the clinic.",
  PAYMENT_NOT_PAYABLE: "This payment can't be updated any more.",
  DUPLICATE_UTR: "This UPI reference has already been used. Please check the number and try again.",
  BATCH_CLOSED: "Registration for this batch is closed.",
  ALREADY_REGISTERED: "You're already registered for this batch.",
  ALREADY_ENROLLED: "You're already enrolled in this course.",
  NOT_ENROLLED: "Enrol in this course to watch this lesson.",
  RATE_LIMITED: "Too many attempts. Please wait a few minutes and try again.",
  SERVER_ERROR: "Something went wrong on our side. Please try again.",
  SERVICE_UNAVAILABLE: "This service is temporarily unavailable. Please try again shortly.",
};

export function errorMessage(error: unknown): string {
  const e = toApiError(error);
  if (MESSAGES[e.code]) return MESSAGES[e.code]!;
  if (e.status >= 500) return MESSAGES.SERVER_ERROR!;
  return "Something went wrong. Please try again.";
}

/** Every customer-facing error message (used by the i18n coverage test). */
export const ERROR_MESSAGES: readonly string[] = [
  ...Object.values(MESSAGES),
  "Something went wrong. Please try again.",
];
