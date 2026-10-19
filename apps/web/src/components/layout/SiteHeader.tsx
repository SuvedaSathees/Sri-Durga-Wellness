import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useCart, useSession, useSite, useT } from "@sdw/controllers";
import { ButtonLink, Icon } from "../ui";
import { LanguageToggle } from "./LanguageToggle";
import { MAIN_NAV } from "./navigation";
import styles from "./SiteHeader.module.css";

function Brand() {
  const t = useT();
  const site = useSite();
  const name = site.data?.clinicName ?? "Sri Durga Wellness";
  return (
    <Link to="/" className={styles.brand} aria-label={t("{name} — home", { name })}>
      <span className={styles.mark} aria-hidden="true">
        <Icon name="leaf" size={18} />
      </span>
      <span className={styles.brandName}>{name}</span>
    </Link>
  );
}

export function SiteHeader() {
  const t = useT();
  const { user } = useSession();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const location = useLocation();

  // Close the menu after navigating.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    const el = drawer.current;
    if (!el) return;
    if (menuOpen && !el.open) el.showModal();
    if (!menuOpen && el.open) el.close();
  }, [menuOpen]);

  const cartLabel =
    count === 0
      ? t("Cart, empty")
      : count === 1
        ? t("Cart, {count} item", { count })
        : t("Cart, {count} items", { count });

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Brand />

        <nav className={styles.desktopNav} aria-label={t("Main")}>
          <ul>
            {/* The logo links home, so the bar skips "Home" to leave room for the rest. */}
            {MAIN_NAV.filter((item) => item.to !== "/").map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={"end" in item}
                  className={({ isActive }) => (isActive ? styles.active : undefined)}
                >
                  {t(item.label)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <LanguageToggle className={styles.barLanguage} />
          <Link
            to={user ? "/account" : "/login"}
            className={`${styles.iconLink} ${styles.accountLink}`}
            aria-label={user ? t("My account ({name})", { name: user.name }) : t("Log in")}
          >
            <Icon name="user" size={22} />
          </Link>
          <Link to="/cart" className={styles.iconLink} aria-label={cartLabel}>
            <Icon name="cart" size={22} />
            {count > 0 ? (
              <span className={styles.count} aria-hidden="true">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
          <ButtonLink to="/book" size="sm" className={styles.book}>
            {t("Book Appointment")}
          </ButtonLink>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMenuOpen(true)}
            aria-label={t("Open menu")}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            <Icon name="menu" size={24} />
          </button>
        </div>
      </div>

      <dialog ref={drawer} className={styles.drawer} onClose={() => setMenuOpen(false)} aria-label={t("Menu")}>
        <div className={styles.drawerTop}>
          <Brand />
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMenuOpen(false)}
            aria-label={t("Close menu")}
          >
            <Icon name="close" size={24} />
          </button>
        </div>
        <div className={styles.drawerLanguage}>
          <span>{t("Language")}</span>
          <LanguageToggle />
        </div>
        <nav aria-label={t("Mobile")}>
          <ul className={styles.drawerNav}>
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={"end" in item}
                  className={({ isActive }) => (isActive ? styles.active : undefined)}
                >
                  {t(item.label)}
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink to={user ? "/account" : "/login"}>{user ? t("My account") : t("Log in / Register")}</NavLink>
            </li>
          </ul>
        </nav>
        <div className={styles.drawerFooter}>
          <ButtonLink to="/book" fullWidth icon="calendar">
            {t("Book Appointment")}
          </ButtonLink>
        </div>
      </dialog>
    </header>
  );
}
