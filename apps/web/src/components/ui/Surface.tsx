/** Layout surfaces: cards, page headers with breadcrumbs, pagination, step indicators, images. */
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { useT } from "@sdw/controllers";
import type { ImageRef } from "@sdw/core";
import { Icon } from "./Icon";
import styles from "./Surface.module.css";

export function Card({
  children,
  className,
  as: Tag = "div",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "li";
  padded?: boolean;
}) {
  return <Tag className={[styles.card, padded ? styles.padded : "", className ?? ""].join(" ")}>{children}</Tag>;
}

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useT();
  return (
    <nav aria-label={t("Breadcrumb")} className={styles.crumbs}>
      <ol>
        <li>
          <Link to="/">{t("Home")}</Link>
        </li>
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`}>
            <Icon name="chevronRight" size={14} />
            {c.to && i < items.length - 1 ? (
              <Link to={c.to}>{c.label}</Link>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Top of an inner page: breadcrumbs, eyebrow, the page's single <h1>, intro and actions. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  crumbs,
  actions,
  align = "start",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  align?: "start" | "center";
}) {
  return (
    <header className={styles.pageHeader}>
      <div className={`container ${align === "center" ? styles.centered : ""}`}>
        {crumbs ? <Breadcrumbs items={crumbs} /> : null}
        <div className={styles.pageHeaderText}>
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h1>{title}</h1>
          {intro ? <div className="lead">{intro}</div> : null}
          {actions ? <div className="cluster">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.sectionHeading}>
      <div className={styles.sectionHeadingText}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {intro ? <p className="lead">{intro}</p> : null}
      </div>
      {action ? <div className={styles.sectionAction}>{action}</div> : null}
    </div>
  );
}

/** Previous / next page links. `hrefFor(page)` builds each link so pages are shareable. */
export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const t = useT();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label={t("Pagination")} className={styles.pagination}>
      {page > 1 ? (
        <Link to={hrefFor(page - 1)} className={styles.pageLink} rel="prev">
          <Icon name="chevronLeft" size={18} /> {t("Previous")}
        </Link>
      ) : (
        <span />
      )}
      <span className="muted">{t("Page {page} of {total}", { page, total: pages })}</span>
      {page < pages ? (
        <Link to={hrefFor(page + 1)} className={styles.pageLink} rel="next">
          {t("Next")} <Icon name="chevronRight" size={18} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/** Step indicator for multi-step flows. Completed steps can be clickable. */
export function Steps<K extends string>({
  steps,
  current,
  reachable,
  onSelect,
  label,
}: {
  steps: Array<{ key: K; label: string }>;
  current: K;
  reachable: K[];
  onSelect?: (key: K) => void;
  label: string;
}) {
  const index = steps.findIndex((s) => s.key === current);
  return (
    <nav aria-label={label} className={styles.steps}>
      <ol>
        {steps.map((s, i) => {
          const state = i < index ? "done" : i === index ? "current" : "todo";
          const canGo = onSelect && reachable.includes(s.key) && s.key !== current;
          const content = (
            <>
              <span className={styles.stepDot} aria-hidden="true">
                {state === "done" ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <span className={styles.stepLabel}>{s.label}</span>
            </>
          );
          return (
            <li key={s.key} className={styles[`step_${state}`]} aria-current={state === "current" ? "step" : undefined}>
              {canGo ? (
                <button type="button" className={styles.stepButton} onClick={() => onSelect(s.key)}>
                  {content}
                </button>
              ) : (
                <span className={styles.stepButton}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Image from the API with a calm placeholder while loading or when missing. */
export function MediaImage({
  image,
  fallback,
  ratio = "4 / 3",
  sizes,
  priority,
  className,
}: {
  image: ImageRef | null | undefined;
  fallback?: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = !failed ? (image?.url ?? fallback) : fallback;
  return (
    <div className={[styles.media, className ?? ""].join(" ")} style={{ aspectRatio: ratio }}>
      {src ? (
        <img
          src={src}
          alt={image?.alt ?? ""}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          sizes={sizes}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}

/** − 1 + control. */
export function QuantityStepper({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const t = useT();
  return (
    <div className={styles.qty} role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={t("Decrease quantity")}
      >
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={t("Increase quantity")}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}

/** Label / value rows. */
export function Facts({ items }: { items: Array<{ label: ReactNode; value: ReactNode } | null | false> }) {
  return (
    <dl className={styles.facts}>
      {items.filter(Boolean).map((item, i) => {
        const f = item as { label: ReactNode; value: ReactNode };
        return (
          <div key={i}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
