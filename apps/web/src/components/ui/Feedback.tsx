/**
 * Status and feedback pieces: notices, badges, loading / error / empty states and a query helper
 * that picks the right one, so every data view handles all four states the same way.
 */
import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useT } from "@sdw/controllers";
import { errorMessage, isApiError, type Tone } from "@sdw/core";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import styles from "./Feedback.module.css";

const TONE_ICON: Record<Tone, IconName> = {
  neutral: "info",
  info: "info",
  success: "checkCircle",
  warning: "alert",
  danger: "alert",
};

/** Inline message. Errors use role="alert" so they are announced when they appear. */
export function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={TONE_ICON[tone]} size={20} className={styles.noticeIcon} />
      <div className={styles.noticeBody}>
        {title ? <p className={styles.noticeTitle}>{title}</p> : null}
        {children ? <div>{children}</div> : null}
        {action ? <div className={styles.noticeAction}>{action}</div> : null}
      </div>
    </div>
  );
}

/** Form-level error summary (message is an English key from the form controller). */
export function FormError({ message }: { message: string | null | undefined }) {
  const t = useT();
  if (!message) return null;
  return <Notice tone="danger">{t(message)}</Notice>;
}

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{children}</span>;
}

export function Spinner({ label }: { label?: string }) {
  const t = useT();
  return (
    <span className={styles.spinnerWrap} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <span className="visually-hidden">{label ?? t("Loading…")}</span>
    </span>
  );
}

export function Skeleton({
  height = 16,
  width = "100%",
  radius = 8,
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
}) {
  return <span className={styles.skeleton} style={{ height, width, borderRadius: radius }} aria-hidden="true" />;
}

/** Placeholder cards while a list loads. */
export function LoadingCards({ count = 3 }: { count?: number }) {
  const t = useT();
  return (
    <div className="grid-cards" aria-busy="true">
      <span className="visually-hidden" role="status">
        {t("Loading…")}
      </span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <Skeleton height={160} radius={12} />
          <Skeleton height={22} width="70%" />
          <Skeleton height={14} />
          <Skeleton height={14} width="85%" />
        </div>
      ))}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div className={styles.center}>
      <Spinner label={label} />
    </div>
  );
}

export function ErrorState({ error, onRetry, title }: { error: unknown; onRetry?: () => void; title?: string }) {
  const t = useT();
  const notFound = isApiError(error) && error.status === 404;
  return (
    <div className={styles.state} role="alert">
      <span className={styles.stateIcon}>
        <Icon name="alert" size={26} />
      </span>
      <h2 className={styles.stateTitle}>
        {title ?? (notFound ? t("We couldn't find that page") : t("Something went wrong"))}
      </h2>
      <p className="muted">{t(errorMessage(error))}</p>
      {onRetry && !notFound ? (
        <Button variant="secondary" onClick={onRetry}>
          {t("Try again")}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon = "leaf",
  title,
  children,
  action,
}: {
  icon?: IconName;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.state}>
      <span className={styles.stateIcon}>
        <Icon name={icon} size={26} />
      </span>
      <h2 className={styles.stateTitle}>{title}</h2>
      {children ? <div className="muted">{children}</div> : null}
      {action}
    </div>
  );
}

/**
 * Renders loading, error, empty or data for a React Query result.
 * `isEmpty` decides when data counts as empty (default: empty array).
 */
export function QueryState<T>({
  query,
  loading,
  empty,
  isEmpty = (d) => Array.isArray(d) && d.length === 0,
  children,
}: {
  query: Pick<UseQueryResult<T>, "data" | "isPending" | "isError" | "error" | "refetch">;
  loading?: ReactNode;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <>{loading ?? <LoadingState />}</>;
  if (query.isError || query.data === undefined)
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (empty && isEmpty(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}
