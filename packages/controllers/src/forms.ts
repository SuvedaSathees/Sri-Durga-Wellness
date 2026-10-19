/**
 * Form controller shared by both apps: values, client-side validation with the shared Zod schemas,
 * and server errors mapped back onto the same fields. Screens render inputs; this does the rest.
 */
import { useCallback, useRef, useState } from "react";
import { errorMessage, toApiError, validate, type FieldErrors } from "@sdw/core";
import type { z } from "zod";

/** Read "contact.name" from a nested object. */
export function getPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined),
      obj,
    );
}

/** Immutable set of "contact.name" in a nested object. */
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".") as [string, ...string[]];
  const current = (obj ?? {}) as Record<string, unknown>;
  return { ...current, [head]: rest.length ? setPath(current[head], rest.join("."), value) : value } as T;
}

export const CHECK_FIELDS_MESSAGE = "Please check the highlighted fields.";

/** What to show after a failed submit: field messages from the server plus one summary line. */
export function describeSubmitError(error: unknown): { fieldErrors: FieldErrors; message: string } {
  const e = toApiError(error);
  return { fieldErrors: e.fieldErrors, message: e.hasFieldErrors ? CHECK_FIELDS_MESSAGE : errorMessage(e) };
}

export type FormController<S extends z.ZodType> = {
  values: z.input<S>;
  errors: FieldErrors;
  /** Summary message for the whole form (English i18n key), or null. */
  formError: string | null;
  submitting: boolean;
  /** Set a field by dot path and clear its error. */
  setField: (path: string, value: unknown) => void;
  /** Error for a field (dot path), if any. */
  errorFor: (path: string) => string | undefined;
  /** Returns a submit handler: validates, then runs `onValid` with the parsed output. Resolves true on success. */
  handleSubmit: (onValid: (data: z.output<S>) => Promise<unknown> | unknown) => () => Promise<boolean>;
  reset: (values?: z.input<S>) => void;
  setValues: (values: z.input<S>) => void;
};

export function useForm<S extends z.ZodType>(schema: S, initialValues: z.input<S>): FormController<S> {
  const initial = useRef(initialValues);
  const [values, setValuesState] = useState<z.input<S>>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const setField = useCallback((path: string, value: unknown) => {
    setValuesState((v) => setPath(v, path, value));
    setErrors((e) => {
      if (!(path in e)) return e;
      const { [path]: _removed, ...rest } = e;
      return rest;
    });
  }, []);

  const handleSubmit = useCallback(
    (onValid: (data: z.output<S>) => Promise<unknown> | unknown) => async () => {
      const result = validate(schema, valuesRef.current);
      if (!result.success) {
        setErrors(result.fieldErrors);
        setFormError(CHECK_FIELDS_MESSAGE);
        return false;
      }
      setErrors({});
      setFormError(null);
      setSubmitting(true);
      try {
        await onValid(result.data);
        return true;
      } catch (error) {
        const { fieldErrors, message } = describeSubmitError(error);
        setErrors(fieldErrors);
        setFormError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [schema],
  );

  const reset = useCallback((next?: z.input<S>) => {
    setValuesState(next ?? initial.current);
    setErrors({});
    setFormError(null);
  }, []);

  return {
    values,
    errors,
    formError,
    submitting,
    setField,
    errorFor: (path) => errors[path],
    handleSubmit,
    reset,
    setValues: setValuesState,
  };
}
