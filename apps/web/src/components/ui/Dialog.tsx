/**
 * Modal dialog built on the native <dialog> element: focus is moved inside and returned on close,
 * Escape closes it, and the rest of the page is inert while it is open.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { useT } from "@sdw/controllers";
import { Icon } from "./Icon";
import styles from "./Dialog.module.css";

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useT();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog ref={ref} className={styles.dialog} onClose={onClose} onCancel={onClose} aria-labelledby="dialog-title">
      <div className={styles.header}>
        <h2 id="dialog-title" className={styles.title}>
          {title}
        </h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label={t("Close")}>
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </dialog>
  );
}
