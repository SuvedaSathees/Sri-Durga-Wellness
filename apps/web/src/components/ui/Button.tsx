import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { useT } from "@sdw/controllers";
import { Icon, type IconName } from "./Icon";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "light" | "danger";
export type ButtonSize = "md" | "sm" | "lg";

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconAfter?: IconName;
  fullWidth?: boolean;
  children: ReactNode;
};

function classes(variant: ButtonVariant, size: ButtonSize, fullWidth?: boolean, extra?: string) {
  return [styles.button, styles[variant], styles[size], fullWidth ? styles.full : "", extra ?? ""]
    .filter(Boolean)
    .join(" ");
}

function Content({
  icon,
  iconAfter,
  children,
  loading,
}: Pick<Common, "icon" | "iconAfter" | "children"> & { loading?: boolean }) {
  return (
    <>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon ? <Icon name={icon} size={18} /> : null}
      <span className={styles.label}>{children}</span>
      {iconAfter && !loading ? <Icon name={iconAfter} size={18} /> : null}
    </>
  );
}

/**
 * A real <button>. While `loading`, it stays focusable but is disabled for clicks and announces
 * "Please wait…" to screen readers.
 */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconAfter,
  fullWidth,
  loading,
  disabled,
  className,
  type = "button",
  children,
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  const t = useT();
  return (
    <button
      type={type}
      className={classes(variant, size, fullWidth, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <Content icon={icon} iconAfter={iconAfter} loading={loading}>
        {children}
      </Content>
      {loading ? <span className="visually-hidden"> {t("Please wait…")}</span> : null}
    </button>
  );
}

/** Navigation that looks like a button (React Router link). */
export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  iconAfter,
  fullWidth,
  className,
  children,
  ...rest
}: Common & LinkProps) {
  return (
    <Link className={classes(variant, size, fullWidth, className)} {...rest}>
      <Content icon={icon} iconAfter={iconAfter}>
        {children}
      </Content>
    </Link>
  );
}

/** External link (tel:, https://wa.me, maps) styled as a button; web links open in a new tab. */
export function ButtonAnchor({
  variant = "secondary",
  size = "md",
  icon,
  iconAfter,
  fullWidth,
  className,
  children,
  href,
  ...rest
}: Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const t = useT();
  const external = /^https?:/i.test(href);
  return (
    <a
      className={classes(variant, size, fullWidth, className)}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      <Content icon={icon} iconAfter={iconAfter}>
        {children}
      </Content>
      {external ? <span className="visually-hidden"> {t("(opens in a new tab)")}</span> : null}
    </a>
  );
}
