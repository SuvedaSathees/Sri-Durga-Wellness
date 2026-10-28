/**
 * Admin area frame: side menu, sign-out and a guard. The guard only decides what to show — every
 * /admin request is also refused by the server for anyone who is not the clinic owner.
 */
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAdminOverview, useIsOwner, useSession, useSignOut, useT } from "@sdw/controllers";
import { Button, ButtonLink, EmptyState, Icon, type IconName } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import accountStyles from "../../account/components/Account.module.css";
import styles from "../components/Admin.module.css";

export function AdminLayout() {
  const t = useT();
  const { user } = useSession();
  const isOwner = useIsOwner();
  const overview = useAdminOverview();
  const signOut = useSignOut();
  const navigate = useNavigate();
  useDocumentTitle(t("Admin area"));

  if (!isOwner) {
    return (
      <div className="container section">
        <EmptyState
          icon="lock"
          title={t("The Admin area is for the clinic owner")}
          action={<ButtonLink to="/account">{t("Go to my account")}</ButtonLink>}
        >
          {t("You're signed in as a customer, so there's nothing to manage here.")}
        </EmptyState>
      </div>
    );
  }

  const toCheck = overview.data?.paymentsToCheck ?? 0;
  const nav: Array<{ to: string; label: string; icon: IconName; end?: boolean; count?: number }> = [
    { to: "/admin", label: t("Overview"), icon: "activity", end: true },
    { to: "/admin/payments", label: t("Payments"), icon: "upi", count: toCheck },
    { to: "/admin/orders", label: t("Orders"), icon: "cart" },
    { to: "/admin/classes", label: t("Live classes"), icon: "video" },
    { to: "/admin/products", label: t("Products"), icon: "leaf" },
    { to: "/admin/courses", label: t("Courses"), icon: "book" },
  ];

  const logOut = () => {
    navigate("/", { replace: true });
    signOut.mutate();
  };

  return (
    <>
      <header className={accountStyles.header}>
        <div className="container">
          <span className="eyebrow">{t("Admin area")}</span>
          <div className={styles.headerRow}>
            <h1 className={accountStyles.hello}>{t("Clinic dashboard")}</h1>
            <span className={styles.signedInAs}>{t("Signed in as {name}", { name: user?.email ?? "" })}</span>
          </div>
        </div>
      </header>
      <div className={`container ${accountStyles.layout}`}>
        <aside className={accountStyles.aside}>
          <nav aria-label={t("Admin area")}>
            <ul className={accountStyles.nav}>
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `${accountStyles.navLink} ${isActive ? accountStyles.navActive : ""}`}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                    {item.count ? (
                      <span className={styles.navCount} aria-label={t("{count} to check", { count: item.count })}>
                        {item.count}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.asideFooter}>
            <Link to="/">{t("View the website")}</Link>
            <Button variant="ghost" size="sm" onClick={logOut} loading={signOut.isPending}>
              {t("Log out")}
            </Button>
          </div>
        </aside>
        <div className={accountStyles.main}>
          <Outlet />
        </div>
      </div>
    </>
  );
}
