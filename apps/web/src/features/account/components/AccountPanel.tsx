import type { ReactNode } from "react";
import { Card } from "../../../components/ui";
import styles from "./Account.module.css";

/** A titled card inside the account area. The account page's <h1> is the greeting, so panels use <h2>. */
export function AccountPanel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card as="section">
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>{title}</h2>
          {action}
        </div>
        {children}
      </div>
    </Card>
  );
}
