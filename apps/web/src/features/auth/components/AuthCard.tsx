import type { FormEvent, ReactNode } from "react";
import styles from "./AuthCard.module.css";

/** Centred card used by sign-in, registration and password pages. */
export function AuthCard({
  eyebrow,
  title,
  intro,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className={`section ${styles.wrap}`}>
      <div className={`container ${styles.container}`}>
        <div className={styles.card}>
          <div className={styles.head}>
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h1 className={styles.title}>{title}</h1>
            {intro ? <p className="muted">{intro}</p> : null}
          </div>
          {children}
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </div>
      </div>
    </section>
  );
}

/** <form> that never submits natively — the form controller validates and calls the API. */
export function AuthForm({
  onSubmit,
  children,
  label,
}: {
  onSubmit: () => unknown;
  children: ReactNode;
  label: string;
}) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void onSubmit();
  };
  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-label={label}>
      {children}
    </form>
  );
}
