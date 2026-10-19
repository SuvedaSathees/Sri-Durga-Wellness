/**
 * Small line-icon set drawn for this site (24×24, 1.75 stroke). Decorative by default; pass `label`
 * when the icon is the only content of a control.
 */
import type { SVGProps } from "react";

const PATHS = {
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  cart: "M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L21 8H6.2M10 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7.5 8c.9-3.5 4-5.5 7.5-5.5s6.6 2 7.5 5.5",
  calendar:
    "M7 3v3M17 3v3M4 8.5h16M5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v4.5l3 2",
  check: "M5 12.5l4.2 4.2L19 7",
  checkCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.3l2.8 2.8L16.3 9.4",
  chevronRight: "M9.5 6l6 6-6 6",
  chevronLeft: "M14.5 6l-6 6 6 6",
  chevronDown: "M6 9.5l6 6 6-6",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  phone: "M5 4h3.2l1.6 4-2 1.3a11 11 0 0 0 5 5l1.3-2 4 1.6V17a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 3 6.2 2 2 0 0 1 5 4z",
  mail: "M4 6h16v12H4zM4.5 6.5l7.5 6 7.5-6",
  chat: "M20 11.5a8 8 0 0 1-11.6 7.2L4 20l1.3-4.2A8 8 0 1 1 20 11.5z",
  mapPin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  leaf: "M5 19c0-8 5-13.5 14-14-.3 9-5.5 14-13 14H5zm0 0c3-4 6-6.5 9.5-8.5",
  play: "M8 5.5v13l10.5-6.5L8 5.5z",
  pause: "M8 5v14M16 5v14",
  lock: "M6.5 11h11a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11zM8 11V8a4 4 0 0 1 8 0v3",
  video:
    "M3.5 7h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 2 15.5v-7A1.5 1.5 0 0 1 3.5 7zM16 10.5l5-3v9l-5-3",
  book: "M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 2l-4-4",
  minus: "M6 12h12",
  plus: "M12 6v12M6 12h12",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-10v5.5M12 7.8v.2",
  alert: "M12 4l9 16H3l9-16zm0 6v4.5M12 17.3v.2",
  external: "M14 5h5v5M19 5l-8 8M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10",
  copy: "M9 9h10v11H9zM5 15V4h10",
  globe:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.5 9h17M3.5 15h17M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
  heart: "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z",
  breath: "M4 9h9a3 3 0 1 0-3-3M4 15h13a3 3 0 1 1-3 3M4 12h6",
  activity: "M3 12h4l3-7 4 14 3-7h4",
  nutrition: "M12 7c-1-2.5-3-3.5-5-3 .2 2.2 2 3.8 5 3zm0 0c-4 0-7 3-7 7s3 6.5 7 6.5 7-2.5 7-6.5-3-7-7-7z",
  stethoscope: "M6 3v6a4 4 0 0 0 8 0V3M10 13v2a5 5 0 0 0 10 0v-2M20 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  care: "M12 20s-6.5-4-6.5-9a3.6 3.6 0 0 1 6.5-2.2A3.6 3.6 0 0 1 18.5 11c0 5-6.5 9-6.5 9zM3 21h18",
  upi: "M4 7h16v10H4zM8 11h3M8 14h6M16.5 10.5l1.5 1.5-1.5 1.5",
} as const;

export type IconName = keyof typeof PATHS;

export function isIconName(value: string | null | undefined): value is IconName {
  return !!value && value in PATHS;
}

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & { name: IconName; size?: number; label?: string };

export function Icon({ name, size = 20, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
