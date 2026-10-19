/**
 * Accessible form fields. Each field links its label, hint and error to the input
 * (aria-describedby, aria-invalid), so screen readers announce them together.
 *
 * Labels and hints are passed already translated. `error` is the English message key from the
 * form controller / API and is translated here.
 */
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { useT } from "@sdw/controllers";
import styles from "./Field.module.css";

type FieldFrame = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Visually hide the label (it stays available to screen readers). */
  hideLabel?: boolean;
};

function useFieldIds(id?: string) {
  const auto = useId();
  const base = id ?? `f${auto.replace(/:/g, "")}`;
  return { input: base, hint: `${base}-hint`, error: `${base}-error` };
}

function Frame({
  ids,
  label,
  hint,
  error,
  required,
  hideLabel,
  children,
}: FieldFrame & { ids: ReturnType<typeof useFieldIds>; children: ReactNode }) {
  const t = useT();
  return (
    <div className={styles.field}>
      <label htmlFor={ids.input} className={hideLabel ? "visually-hidden" : styles.label}>
        {label}
        {required ? null : <span className={styles.optional}> ({t("optional")})</span>}
      </label>
      {hint ? (
        <p id={ids.hint} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={ids.error} className={styles.error}>
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (ids: ReturnType<typeof useFieldIds>, hint: unknown, error: unknown) =>
  [hint ? ids.hint : "", error ? ids.error : ""].filter(Boolean).join(" ") || undefined;

type TextFieldProps = FieldFrame &
  Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
    value: string;
    onChange: (value: string) => void;
  };

export function TextField({
  label,
  hint,
  error,
  required,
  hideLabel,
  id,
  value,
  onChange,
  className,
  ...input
}: TextFieldProps) {
  const ids = useFieldIds(id);
  return (
    <Frame ids={ids} label={label} hint={hint} error={error} required={required} hideLabel={hideLabel}>
      <input
        id={ids.input}
        className={[styles.input, error ? styles.invalid : "", className ?? ""].join(" ")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, hint, error)}
        required={required}
        {...input}
      />
    </Frame>
  );
}

type TextAreaProps = FieldFrame &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
    value: string;
    onChange: (value: string) => void;
  };

export function TextArea({
  label,
  hint,
  error,
  required,
  hideLabel,
  id,
  value,
  onChange,
  rows = 4,
  ...rest
}: TextAreaProps) {
  const ids = useFieldIds(id);
  return (
    <Frame ids={ids} label={label} hint={hint} error={error} required={required} hideLabel={hideLabel}>
      <textarea
        id={ids.input}
        className={[styles.input, styles.textarea, error ? styles.invalid : ""].join(" ")}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, hint, error)}
        required={required}
        {...rest}
      />
    </Frame>
  );
}

type SelectProps = FieldFrame &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> & {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
  };

export function SelectField({
  label,
  hint,
  error,
  required,
  hideLabel,
  id,
  value,
  onChange,
  options,
  placeholder,
  ...rest
}: SelectProps) {
  const ids = useFieldIds(id);
  return (
    <Frame ids={ids} label={label} hint={hint} error={error} required={required} hideLabel={hideLabel}>
      <select
        id={ids.input}
        className={[styles.input, styles.select, error ? styles.invalid : ""].join(" ")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, hint, error)}
        required={required}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Frame>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  error,
  hint,
  id,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  hint?: ReactNode;
  id?: string;
}) {
  const t = useT();
  const ids = useFieldIds(id);
  return (
    <div className={styles.field}>
      <div className={styles.check}>
        <input
          id={ids.input}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, hint, error)}
        />
        <label htmlFor={ids.input}>{label}</label>
      </div>
      {hint ? (
        <p id={ids.hint} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={ids.error} className={styles.error}>
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}

/** Radio buttons in a fieldset; options can carry a description line. */
export function RadioGroup<V extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  error,
  layout = "stack",
}: {
  legend: ReactNode;
  name: string;
  value: V | "";
  onChange: (value: V) => void;
  options: Array<{ value: V; label: ReactNode; description?: ReactNode; disabled?: boolean }>;
  error?: string;
  layout?: "stack" | "row";
}) {
  const t = useT();
  const ids = useFieldIds(name);
  return (
    <fieldset className={styles.fieldset} aria-describedby={error ? ids.error : undefined}>
      <legend className={styles.label}>{legend}</legend>
      <div className={layout === "row" ? styles.radioRow : styles.radioStack}>
        {options.map((o) => (
          <label
            key={o.value}
            className={[
              styles.radio,
              value === o.value ? styles.radioOn : "",
              o.disabled ? styles.radioDisabled : "",
            ].join(" ")}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
            />
            <span>
              <span className={styles.radioLabel}>{o.label}</span>
              {o.description ? <span className={styles.radioDescription}>{o.description}</span> : null}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={ids.error} className={styles.error}>
          {t(error)}
        </p>
      ) : null}
    </fieldset>
  );
}
