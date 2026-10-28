import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useCart, useIsOwner, useSession, useSite, useT } from "@sdw/controllers";
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
  const isOwner = useIsOwner();
  const { count } = useCart();
  // The clinic owner's person icon and main button lead to the Admin area (the role comes from the
  // server; the server also checks it on every /admin call).
  const accountHref = isOwner ? "/admin" : user ? "/account" : "/login";
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

  const isHome = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cartLabel =
    count === 0
      ? t("Cart, empty")
      : count === 1
        ? t("Cart, {count} item", { count })
        : t("Cart, {count} items", { count });

  return (
    <header
      className={[
        styles.header,
        isHome ? styles.headerHome : styles.headerInner,
        scrolled ? styles.headerScrolled : styles.headerTop,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={`container ${styles.bar}`}>
        <Brand />

        <nav className={styles.desktopNav} aria-label={t("Main")}>
          <ul>
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
          </ul>
        </nav>

        <div className={styles.actions}>
          <LanguageToggle className={styles.barLanguage} />
          <Link
            to={accountHref}
            className={`${styles.iconLink} ${styles.accountLink}`}
            aria-label={
              isOwner ? t("Admin area") : user ? t("My account ({name})", { name: user.name }) : t("Log in")
            }
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
          {isOwner ? (
            <ButtonLink to="/admin" size="sm" className={styles.book}>
              {t("Admin area")}
            </ButtonLink>
          ) : (
            <ButtonLink to="/book" size="sm" className={styles.book}>
              {t("Book Appointment")}
            </ButtonLink>
          )}
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
              <NavLink to={accountHref}>
                {isOwner ? t("Admin area") : user ? t("My account") : t("Log in / Register")}
              </NavLink>
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
