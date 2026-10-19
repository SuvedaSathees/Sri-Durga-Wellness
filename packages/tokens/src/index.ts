/**
 * Sri Durga Wellness design tokens — the single source for colour, type, spacing, shape and motion.
 *
 * Web: `toCssVariables()` is written to apps/web/src/styles/tokens.css (`npm run tokens:css`).
 * Mobile: apps/mobile/src/theme reads these values directly.
 *
 * Sizes are in pixels (web converts to rem where it matters). Text colours are checked for
 * WCAG AA contrast against the backgrounds they sit on (packages/tokens/tests).
 */

export const palette = {
  ivory: "#faf8f2",
  cream: "#f2ede2",
  sage: "#a7b5a0",
  sageTint: "#e7ece3",
  sageWash: "#f0f3ec",
  forest: "#344a3d",
  forestDeep: "#283a30",
  forestSoft: "#4a6354",
  olive: "#78866b",
  beige: "#e6dccb",
  beigeLine: "#e9e1d3",
  beigeStrong: "#d8ccb7",
  charcoal: "#343a34",
  white: "#ffffff",
} as const;

export const color = {
  bg: palette.ivory,
  bgAlt: palette.cream,
  surface: palette.white,
  surfaceMuted: palette.sageWash,
  text: palette.charcoal,
  textMuted: "#5e665d",
  heading: palette.forest,
  eyebrow: "#5c6a50",
  primary: palette.forest,
  primaryPressed: palette.forestDeep,
  onPrimary: palette.ivory,
  accent: palette.olive,
  accentSoft: palette.sageTint,
  border: palette.beigeLine,
  borderStrong: palette.beigeStrong,
  /** Form-control outlines need 3:1 against the page (WCAG 1.4.11). */
  inputBorder: "#8c8676",
  focus: palette.forest,
  overlay: "rgba(40, 58, 48, 0.55)",
  success: "#3e6b4b",
  successBg: "#e4ede3",
  warning: "#7e5f22",
  warningBg: "#f5ecd8",
  danger: "#9b3b30",
  dangerBg: "#f6e4df",
  info: "#3d5a6c",
  infoBg: "#e2ebef",
} as const;

export type ColorToken = keyof typeof color;

/** Text/background pairs that must meet WCAG AA (4.5:1). Checked by the token tests. */
export const contrastPairs: ReadonlyArray<readonly [ColorToken, ColorToken]> = [
  ["text", "bg"],
  ["text", "bgAlt"],
  ["text", "surface"],
  ["textMuted", "bg"],
  ["textMuted", "bgAlt"],
  ["textMuted", "surface"],
  ["heading", "bg"],
  ["heading", "bgAlt"],
  ["eyebrow", "bg"],
  ["eyebrow", "surface"],
  ["onPrimary", "primary"],
  ["onPrimary", "primaryPressed"],
  ["primary", "surface"],
  ["success", "successBg"],
  ["warning", "warningBg"],
  ["danger", "dangerBg"],
  ["info", "infoBg"],
  ["danger", "surface"],
];

export const font = {
  /** Headings. Web loads Cormorant Garamond; mobile loads it with expo-font. Tamil falls back to Noto Serif Tamil. */
  serif: {
    web: '"Cormorant Garamond", "Noto Serif Tamil", Georgia, "Times New Roman", serif',
    native: { regular: "CormorantGaramond_500Medium", bold: "CormorantGaramond_600SemiBold" },
  },
  /** Body and UI. Web loads DM Sans; mobile uses the platform font (San Francisco / Roboto) for a native feel. */
  sans: {
    web: '"DM Sans", "Noto Sans Tamil", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    native: { regular: undefined, bold: undefined },
  },
} as const;

export const fontSize = {
  xs: 13,
  sm: 15,
  base: 17,
  lg: 19,
  xl: 22,
  h3: 26,
  h2: 34,
  h1: 42,
  display: 54,
} as const;

export const fontWeight = { regular: "400", medium: "500", semibold: "600", bold: "700" } as const;

export const lineHeight = {
  tight: 1.12,
  snug: 1.3,
  normal: 1.6,
  /** Tamil letters are taller; body text needs more room. */
  tamil: 1.8,
  tamilHeading: 1.34,
} as const;

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
  9: 96,
} as const;

export type SpaceToken = keyof typeof space;

export const radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 } as const;

export const shadow = {
  sm: { web: "0 2px 10px -4px rgba(52, 58, 52, 0.12)", native: { opacity: 0.08, radius: 6, offsetY: 2, elevation: 1 } },
  md: {
    web: "0 10px 30px -14px rgba(52, 58, 52, 0.2)",
    native: { opacity: 0.12, radius: 14, offsetY: 6, elevation: 3 },
  },
  lg: {
    web: "0 24px 60px -28px rgba(40, 58, 48, 0.34)",
    native: { opacity: 0.18, radius: 24, offsetY: 12, elevation: 6 },
  },
} as const;

export const motion = {
  fast: 160,
  base: 260,
  slow: 700,
  easing: [0.22, 0.61, 0.36, 1] as const,
} as const;

export const breakpoint = { sm: 480, md: 768, lg: 1024, xl: 1280 } as const;

export const layout = {
  container: 1200,
  narrow: 760,
  navHeight: 72,
  /** Minimum touch target (WCAG 2.5.8 / platform guidelines). */
  touchTarget: 44,
} as const;

export const tokens = {
  palette,
  color,
  font,
  fontSize,
  fontWeight,
  lineHeight,
  space,
  radius,
  shadow,
  motion,
  breakpoint,
  layout,
};

// ── helpers ─────────────────────────────────────────────────

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const rem = (px: number) => `${+(px / 16).toFixed(4)}rem`;

/** CSS custom properties for the web app (written to apps/web/src/styles/tokens.css). */
export function toCssVariables(): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(color)) lines.push(`  --color-${kebab(k)}: ${v};`);
  lines.push(`  --font-serif: ${font.serif.web};`);
  lines.push(`  --font-sans: ${font.sans.web};`);
  for (const [k, v] of Object.entries(fontSize)) lines.push(`  --text-${k}: ${rem(v)};`);
  for (const [k, v] of Object.entries(lineHeight)) lines.push(`  --leading-${kebab(k)}: ${v};`);
  for (const [k, v] of Object.entries(space)) lines.push(`  --space-${k}: ${rem(v)};`);
  for (const [k, v] of Object.entries(radius)) lines.push(`  --radius-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(shadow)) lines.push(`  --shadow-${k}: ${v.web};`);
  lines.push(`  --duration-fast: ${motion.fast}ms;`);
  lines.push(`  --duration-base: ${motion.base}ms;`);
  lines.push(`  --duration-slow: ${motion.slow}ms;`);
  lines.push(`  --easing: cubic-bezier(${motion.easing.join(", ")});`);
  lines.push(`  --container: ${layout.container}px;`);
  lines.push(`  --container-narrow: ${layout.narrow}px;`);
  lines.push(`  --nav-height: ${layout.navHeight}px;`);
  lines.push(`  --touch-target: ${layout.touchTarget}px;`);
  return [
    "/* Generated from @sdw/tokens by `npm run tokens:css`. Do not edit by hand. */",
    ":root {",
    ...lines,
    "}",
    "",
  ].join("\n");
}

/** WCAG relative-luminance contrast ratio between two #rrggbb colours. */
export function contrastRatio(foreground: string, background: string): number {
  const lum = (hex: string) => {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) throw new Error(`Expected #rrggbb, got ${hex}`);
    const n = parseInt(m[1]!, 16);
    const channel = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  };
  const [a, b] = [lum(foreground), lum(background)].sort((x, y) => y - x) as [number, number];
  return (a + 0.05) / (b + 0.05);
}
