/** Small building blocks shared by the Admin screens. */
import type { ReactNode } from "react";
import { Link } from "react-router";
import { useT } from "@sdw/controllers";
import { Badge, TextArea, TextField } from "../../../components/ui";
import styles from "./Admin.module.css";

type BilingualValue = { en?: string; ta?: string | null } | undefined;

/**
 * English text (the main version) and an optional Tamil version, side by side on wide screens.
 * Tamil visitors see the English text whenever the Tamil box is left empty.
 */
export function BilingualField({
  label,
  value,
  onChange,
  errorEn,
  errorTa,
  multiline = false,
  rows = 4,
  required = true,
  hint,
}: {
  label: string;
  value: BilingualValue;
  onChange: (lang: "en" | "ta", value: string) => void;
  errorEn?: string;
  errorTa?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  hint?: ReactNode;
}) {
  const t = useT();
  const taLabel = t("{label} in Tamil", { label });
  const taHint = t("Tamil visitors see the English text when this is empty.");
  return (
    <div className={styles.bilingual}>
      {multiline ? (
        <>
          <TextArea
            label={label}
            hint={hint}
            required={required}
            rows={rows}
            value={value?.en ?? ""}
            onChange={(v) => onChange("en", v)}
            error={errorEn}
          />
          <TextArea
            label={taLabel}
            hint={taHint}
            rows={rows}
            lang="ta"
            value={value?.ta ?? ""}
            onChange={(v) => onChange("ta", v)}
            error={errorTa}
          />
        </>
      ) : (
        <>
          <TextField
            label={label}
            hint={hint}
            required={required}
            value={value?.en ?? ""}
            onChange={(v) => onChange("en", v)}
            error={errorEn}
          />
          <TextField
            label={taLabel}
            hint={taHint}
            lang="ta"
            value={value?.ta ?? ""}
            onChange={(v) => onChange("ta", v)}
            error={errorTa}
          />
        </>
      )}
    </div>
  );
}

export function StatTile({
  to,
  value,
  label,
  hint,
  attention = false,
}: {
  to: string;
  value: number;
  label: string;
  hint: string;
  attention?: boolean;
}) {
  return (
    <Link to={to} className={`${styles.stat} ${attention ? styles.statAttention : ""}`}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statHint}>{hint}</span>
    </Link>
  );
}

/** "On the website" / "Hidden", plus "Sample" for development sample content. */
export function VisibilityBadges({ isPublished, isSample }: { isPublished: boolean; isSample: boolean }) {
  const t = useT();
  return (
    <span className={styles.badges}>
      {isPublished ? <Badge tone="success">{t("On the website")}</Badge> : <Badge>{t("Hidden")}</Badge>}
      {isSample ? <Badge tone="info">{t("Sample")}</Badge> : null}
    </span>
  );
}

/** Form-field value for a bilingual text: null Tamil becomes an empty box. */
export const bilingualValue = (text: { en: string; ta: string | null } | undefined) => ({
  en: text?.en ?? "",
  ta: text?.ta ?? "",
});
