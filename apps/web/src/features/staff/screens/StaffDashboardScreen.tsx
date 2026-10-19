import { useState } from "react";
import { formatPrice } from "@sdw/core";
import { useDemoControls, useSession, useT } from "@sdw/controllers";
import { Button, Icon, useToast } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "./StaffDashboard.module.css";

type Tab = "payments" | "registrations" | "appointments" | "orders";

export function StaffDashboardScreen() {
  const t = useT();
  useDocumentTitle(t("Staff Dashboard"));
  const { user } = useSession();
  const demo = useDemoControls();
  const toast = useToast();
  const [, setRevision] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("payments");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "SUBMITTED" | "VERIFIED" | "REJECTED">("SUBMITTED");

  const refresh = () => setRevision((r) => r + 1);

  const overview = demo?.staffOverview ? demo.staffOverview() : null;
  const payments = overview?.payments ?? [];
  const appointments = overview?.appointments ?? [];
  const registrations = overview?.registrations ?? [];
  const orders = overview?.orders ?? [];

  const pendingPayments = payments.filter((p) => p.status === "SUBMITTED");
  const filteredPayments =
    paymentFilter === "ALL" ? payments : payments.filter((p) => p.status === paymentFilter);

  const handleVerify = (paymentId: string) => {
    if (!demo) return;
    demo.verifyPayment(paymentId);
    toast(t("Payment verified successfully."));
    refresh();
  };

  const handleReject = (paymentId: string) => {
    if (!demo) return;
    demo.rejectPayment(paymentId, "Payment reference could not be verified by clinic staff.");
    toast(t("Payment rejected."));
    refresh();
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <span className="eyebrow">{t("Front Desk & Clinic Operations")}</span>
            <h1>{t("Staff Dashboard")}</h1>
            <p className={styles.subtitle}>
              {t("Review registrations, verify payments and manage clinic schedule.")}
            </p>
          </div>
          <div className={styles.staffIdentity}>
            <span className={styles.roleDot} aria-hidden="true" />
            <span className={styles.roleName}>{user?.name ?? t("Staff")}</span>
            <span>({user?.email ?? "frontdesk@sridurgawellness.com"})</span>
          </div>
        </header>

        {/* Quick Stats Grid */}
        <div className={styles.statsGrid}>
          <div
            className={[styles.statCard, pendingPayments.length > 0 ? styles.statCardAlert : ""].filter(Boolean).join(" ")}
          >
            <div>
              <div className={styles.statValue}>{pendingPayments.length}</div>
              <p className={styles.statLabel}>{t("Pending Verification")}</p>
            </div>
            <div className={styles.statIcon}>
              <Icon name="upi" size={24} />
            </div>
          </div>

          <div className={styles.statCard}>
            <div>
              <div className={styles.statValue}>{appointments.length}</div>
              <p className={styles.statLabel}>{t("Total Appointments")}</p>
            </div>
            <div className={styles.statIcon}>
              <Icon name="calendar" size={24} />
            </div>
          </div>

          <div className={styles.statCard}>
            <div>
              <div className={styles.statValue}>{registrations.length}</div>
              <p className={styles.statLabel}>{t("Active Registrations")}</p>
            </div>
            <div className={styles.statIcon}>
              <Icon name="video" size={24} />
            </div>
          </div>

          <div className={styles.statCard}>
            <div>
              <div className={styles.statValue}>{orders.length}</div>
              <p className={styles.statLabel}>{t("Total Orders")}</p>
            </div>
            <div className={styles.statIcon}>
              <Icon name="cart" size={24} />
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <nav className={styles.tabsNav} aria-label={t("Staff Dashboard")}>
          <button
            type="button"
            className={[styles.tabBtn, activeTab === "payments" ? styles.tabBtnActive : ""].filter(Boolean).join(" ")}
            onClick={() => setActiveTab("payments")}
          >
            <Icon name="upi" size={18} />
            <span>{t("Payments")}</span>
            {pendingPayments.length > 0 ? (
              <span className={[styles.badgePill, styles.badgeAlert].join(" ")}>{pendingPayments.length}</span>
            ) : null}
          </button>

          <button
            type="button"
            className={[styles.tabBtn, activeTab === "registrations" ? styles.tabBtnActive : ""].filter(Boolean).join(" ")}
            onClick={() => setActiveTab("registrations")}
          >
            <Icon name="video" size={18} />
            <span>{t("Registrations")}</span>
            <span className={styles.badgePill}>{registrations.length}</span>
          </button>

          <button
            type="button"
            className={[styles.tabBtn, activeTab === "appointments" ? styles.tabBtnActive : ""].filter(Boolean).join(" ")}
            onClick={() => setActiveTab("appointments")}
          >
            <Icon name="calendar" size={18} />
            <span>{t("Appointments")}</span>
            <span className={styles.badgePill}>{appointments.length}</span>
          </button>

          <button
            type="button"
            className={[styles.tabBtn, activeTab === "orders" ? styles.tabBtnActive : ""].filter(Boolean).join(" ")}
            onClick={() => setActiveTab("orders")}
          >
            <Icon name="cart" size={18} />
            <span>{t("Orders")}</span>
            <span className={styles.badgePill}>{orders.length}</span>
          </button>
        </nav>

        {/* Section View */}
        <section className={styles.sectionCard}>
          {/* PAYMENTS TAB */}
          {activeTab === "payments" ? (
            <div>
              <div className={styles.toolbar}>
                <div className={styles.filterGroup}>
                  <button
                    type="button"
                    className={[styles.filterBtn, paymentFilter === "SUBMITTED" ? styles.filterBtnActive : ""].filter(Boolean).join(" ")}
                    onClick={() => setPaymentFilter("SUBMITTED")}
                  >
                    {t("Pending Verification")} ({pendingPayments.length})
                  </button>
                  <button
                    type="button"
                    className={[styles.filterBtn, paymentFilter === "ALL" ? styles.filterBtnActive : ""].filter(Boolean).join(" ")}
                    onClick={() => setPaymentFilter("ALL")}
                  >
                    {t("All Payments")} ({payments.length})
                  </button>
                  <button
                    type="button"
                    className={[styles.filterBtn, paymentFilter === "VERIFIED" ? styles.filterBtnActive : ""].filter(Boolean).join(" ")}
                    onClick={() => setPaymentFilter("VERIFIED")}
                  >
                    {t("Verified")}
                  </button>
                  <button
                    type="button"
                    className={[styles.filterBtn, paymentFilter === "REJECTED" ? styles.filterBtnActive : ""].filter(Boolean).join(" ")}
                    onClick={() => setPaymentFilter("REJECTED")}
                  >
                    {t("Rejected")}
                  </button>
                </div>

                {demo ? (
                  <Button size="sm" variant="secondary" onClick={() => (demo.reset(), refresh())}>
                    {t("Reset demo data")}
                  </Button>
                ) : null}
              </div>

              {filteredPayments.length === 0 ? (
                <div className={styles.emptyState}>
                  <Icon name="checkCircle" size={40} />
                  <p>{t("No pending payments")}</p>
                  <span>{t("All clinic activity is up to date.")}</span>
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{t("Reference")}</th>
                        <th>{t("Customer")}</th>
                        <th>UTR / Reference</th>
                        <th>{t("Amount")}</th>
                        <th>Status</th>
                        <th>{t("Action")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((p) => {
                        const isPending = p.status === "SUBMITTED";
                        const isVerified = p.status === "VERIFIED";
                        return (
                          <tr key={p.id}>
                            <td>
                              <span className={styles.paymentRef}>{p.reference}</span>
                              <small style={{ color: "var(--color-text-muted)" }}>{p.purpose}</small>
                            </td>
                            <td>
                              <strong>{p.payerName ?? "Customer"}</strong>
                            </td>
                            <td>
                              <span className={styles.utrCode}>{p.utr ?? p.reference}</span>
                            </td>
                            <td>
                              <span className={styles.amount}>{formatPrice(p.amount)}</span>
                            </td>
                            <td>
                              <span
                                className={[
                                  styles.statusBadge,
                                  isPending ? styles.statusWaiting : isVerified ? styles.statusVerified : styles.statusRejected,
                                ].join(" ")}
                              >
                                {isPending ? t("Pending Verification") : isVerified ? t("Verified") : t("Rejected")}
                              </span>
                            </td>
                            <td>
                              {isPending ? (
                                <div className={styles.actionsCell}>
                                  <button
                                    type="button"
                                    className={styles.verifyBtn}
                                    onClick={() => handleVerify(p.id)}
                                  >
                                    <Icon name="check" size={16} />
                                    {t("Verify")}
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.rejectBtn}
                                    onClick={() => handleReject(p.id)}
                                  >
                                    {t("Reject")}
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {/* REGISTRATIONS TAB */}
          {activeTab === "registrations" ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("Reference")}</th>
                    <th>{t("Patient")}</th>
                    <th>{t("Class / Course")}</th>
                    <th>{t("Amount")}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.reference}</strong>
                      </td>
                      <td>
                        <div>{r.patientName}</div>
                        <small style={{ color: "var(--color-text-muted)" }}>{r.patientEmail}</small>
                      </td>
                      <td>
                        <div>{r.className}</div>
                        <small style={{ color: "var(--color-text-muted)" }}>{r.batchTitle}</small>
                      </td>
                      <td>
                        <span className={styles.amount}>{formatPrice(r.amount)}</span>
                      </td>
                      <td>
                        <span className={[styles.statusBadge, styles.statusVerified].join(" ")}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* APPOINTMENTS TAB */}
          {activeTab === "appointments" ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("Reference")}</th>
                    <th>{t("Patient")}</th>
                    <th>Service & Doctor</th>
                    <th>{t("Date & Time")}</th>
                    <th>{t("Method")}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.reference}</strong>
                      </td>
                      <td>
                        <div>{a.patientName}</div>
                        <small style={{ color: "var(--color-text-muted)" }}>{a.patientPhone}</small>
                      </td>
                      <td>
                        <div>{a.serviceName}</div>
                        <small style={{ color: "var(--color-text-muted)" }}>{a.practitionerName}</small>
                      </td>
                      <td>
                        <div>{new Date(a.start).toLocaleDateString()}</div>
                        <small style={{ color: "var(--color-text-muted)" }}>
                          {new Date(a.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </td>
                      <td>
                        <small>{a.consultationMethod ?? "IN_PERSON"}</small>
                      </td>
                      <td>
                        <span className={[styles.statusBadge, styles.statusVerified].join(" ")}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* ORDERS TAB */}
          {activeTab === "orders" ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("Reference")}</th>
                    <th>{t("Customer")}</th>
                    <th>{t("Items")}</th>
                    <th>{t("Amount")}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                        {t("All clinic activity is up to date.")}
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <strong>{o.reference}</strong>
                        </td>
                        <td>
                          <div>{o.patientName}</div>
                          <small style={{ color: "var(--color-text-muted)" }}>{o.patientEmail}</small>
                        </td>
                        <td>{o.itemsSummary}</td>
                        <td>
                          <span className={styles.amount}>{formatPrice(o.amount)}</span>
                        </td>
                        <td>
                          <span className={[styles.statusBadge, styles.statusVerified].join(" ")}>{o.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
