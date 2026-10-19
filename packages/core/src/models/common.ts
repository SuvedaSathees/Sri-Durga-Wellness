/**
 * Shared primitives used by every request and response model.
 * The API contract (docs/API_CONTRACT.md) uses exactly these shapes.
 */

/** Opaque identifier issued by the backend. */
export type ID = string;

/** ISO-8601 timestamp in UTC, e.g. "2026-10-21T04:30:00.000Z". */
export type ISODateTime = string;

/** Calendar date in the clinic's time zone (Asia/Kolkata), "YYYY-MM-DD". */
export type DateKey = string;

/** Money as an integer number of paise (₹1 = 100 paise). Never a float. */
export type Paise = number;

export type Locale = "en" | "ta";

/** A picture returned by the API. `url` is absolute in the live API (the mock uses site-relative paths). */
export type ImageRef = {
  url: string;
  /** Empty string for decorative images. */
  alt: string;
};

/** Standard page of results for list endpoints. */
export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type PageQuery = { page?: number; pageSize?: number };

/** Every error response from the API has this body (see API_CONTRACT.md → Errors). */
export type ApiErrorBody = {
  error: {
    /** Stable, machine-readable code, e.g. "VALIDATION_FAILED", "SLOT_TAKEN". */
    code: string;
    /** Human-readable English message. Apps translate known codes and show this as a fallback. */
    message: string;
    /** Per-field messages for 422 responses; keys match request body fields (dot paths for nesting). */
    fieldErrors?: Record<string, string>;
    /** Correlation id for support. */
    requestId?: string;
  };
};

/** Short reference shown to customers, e.g. "APT-7KQ2M9". */
export type Reference = string;

export type ReferenceResponse = { reference: Reference };

/**
 * Records that come from development sample data carry `isSample: true`, so the apps can show a
 * "sample content" notice. The live backend must return `false` for clinic-approved content.
 */
export type SampleFlag = { isSample: boolean };
