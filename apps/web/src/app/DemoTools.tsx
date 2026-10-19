/**
 * Demo tools — only rendered when the app runs against the mock backend. They stand in for the
 * clinic team (who verify payments in their own system), so every step of the flows can be tried.
 * Not part of a live build's behaviour: in live mode `runtime.demo` is null and this never renders.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDemoControls, useLocale, useRegister, useSession, useT } from "@sdw/controllers";
import { idempotencyKey } from "@sdw/core";
import { formatPrice } from "@sdw/core";
import { Button, Icon } from "../components/ui";
import styles from "./DemoTools.module.css";

export function DemoTools({ routing = "browser" }: { routing?: "browser" | "hash" }) {
  const demo = useDemoControls();
  const qc = useQueryClient();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const [upi, setUpi] = useState(true);
  const { user } = useSession();
  const register = useRegister();
  const [locale] = useLocale();
  if (!demo) return null;

  // A throwaway account in the mock backend, so flows that need sign-in can be tried quickly.
  // The password is random and never shown or stored anywhere but the mock's memory.
  const signInAsSample = () =>
    register.mutate({
      name: "Sample Customer",
      email: `sample.${Date.now()}@example.com`,
      phone: "9876543210",
      password: idempotencyKey(),
      locale,
      acceptTerms: true,
    });

  const refresh = () => {
    force((n) => n + 1);
    void qc.invalidateQueries();
  };
  const base = routing === "hash" ? "#" : "";
  const pending = demo.pendingPayments();
  const resetToken = demo.lastResetToken();

  return (
    <div className={styles.wrap} data-demo-tools>
      {open ? (
        <section className={styles.panel} aria-label={t("Demo tools")}>
          <div className={styles.head}>
            <h2>{t("Demo tools")}</h2>
            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label={t("Close")}>
              <Icon name="close" size={18} />
            </button>
          </div>
          <p className={styles.note}>
            {t(
              "This preview uses sample data. These buttons act as the clinic team, who verify payments in their own system.",
            )}
          </p>

          {!user ? (
            <Button size="sm" variant="secondary" loading={register.isPending} onClick={signInAsSample}>
              {t("Sign in as a new sample customer")}
            </Button>
          ) : null}

          <h3>{t("Payments waiting for verification")}</h3>
          {pending.length === 0 ? (
            <p className={styles.note}>{t("None yet. Submit a UPI reference on a payment page first.")}</p>
          ) : (
            <ul className={styles.list}>
              {pending.map((p) => (
                <li key={p.id}>
                  <span>
                    <strong>{p.reference}</strong> · {formatPrice(p.amount)}
                  </span>
                  <span className={styles.row}>
                    <Button size="sm" onClick={() => (demo.verifyPayment(p.id), refresh())}>
                      {t("Verify")}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => (
                        demo.rejectPayment(p.id, "We couldn't find this payment. Please check the UPI reference."),
                        refresh()
                      )}
                    >
                      {t("Reject")}
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h3>{t("Clinic settings")}</h3>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={upi}
              onChange={(e) => (setUpi(e.target.checked), demo.setUpiEnabled(e.target.checked), refresh())}
            />
            {t("UPI payments configured")}
          </label>
          {resetToken ? (
            <p>
              <a href={`${base}/reset-password?token=${encodeURIComponent(resetToken)}`}>
                {t("Open the latest password-reset link")}
              </a>
            </p>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => (demo.reset(), qc.clear(), window.location.assign(`${base}/`))}
          >
            {t("Reset demo data")}
          </Button>
        </section>
      ) : null}
      <button
        type="button"
        className={styles.fab}
        onClick={() => (setOpen((o) => !o), force((n) => n + 1))}
        aria-expanded={open}
      >
        <span className={styles.dot} aria-hidden="true" />
        {t("Demo")}
      </button>
    </div>
  );
}
