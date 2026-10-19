import { NavLink, Outlet, useNavigate } from "react-router";
import { useSession, useSignOut, useT } from "@sdw/controllers";
import { Button, Icon, type IconName } from "../../../components/ui";
import styles from "../components/Account.module.css";

export function AccountLayout() {
  const t = useT();
  const { user } = useSession();
  const signOut = useSignOut();
  const isStaff =
    user?.role === "front_desk" ||
    user?.role === "owner" ||
    user?.email?.includes("frontdesk") ||
    user?.email?.includes("owner");

  const nav: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
    ...(isStaff ? [{ to: "/staff", label: t("Staff Dashboard"), icon: "stethoscope" as IconName }] : []),
    { to: "/account", label: t("Overview"), icon: "leaf", end: true },
    { to: "/account/appointments", label: t("Appointments"), icon: "calendar" },
    { to: "/account/orders", label: t("Orders"), icon: "cart" },
    { to: "/account/payments", label: t("Payments"), icon: "upi" },
    { to: "/account/classes", label: t("Live classes"), icon: "video" },
    { to: "/account/courses", label: t("Courses"), icon: "book" },
    { to: "/account/profile", label: t("Profile"), icon: "user" },
    { to: "/account/settings", label: t("Settings"), icon: "globe" },
  ];

  // Leave the private area first, so the sign-in guard doesn't send the visitor to the login page.
  const logOut = () => {
    navigate("/", { replace: true });
    signOut.mutate();
  };

  return (
    <>
      <header className={styles.header}>
        <div className="container">
          <span className="eyebrow">{t("My account")}</span>
          <h1 className={styles.hello}>{t("Hello, {name}", { name: user?.name ?? "" })}</h1>
        </div>
      </header>
      <div className={`container ${styles.layout}`}>
        <aside className={styles.aside}>
          <nav aria-label={t("My account")}>
            <ul className={styles.nav}>
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ""}`}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <Button variant="ghost" size="sm" onClick={logOut} loading={signOut.isPending} className={styles.logout}>
            {t("Log out")}
          </Button>
        </aside>
        <div className={styles.main}>
          <Outlet />
        </div>
      </div>
    </>
  );
}
