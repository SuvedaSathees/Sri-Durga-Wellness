/**
 * Native theme built from the shared design tokens, so both apps share one palette and scale.
 * Headings use the platform's own serif (Georgia on iOS, Noto Serif on Android) and body text the
 * system font, which keeps the app feeling native and supports Tamil out of the box.
 */
import { Platform, type TextStyle, type ViewStyle } from "react-native";
import { tokens } from "@sdw/tokens";

const { color, fontSize, lineHeight, space, radius, shadow } = tokens;

export const serif = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

export type TextVariant = "display" | "h1" | "h2" | "h3" | "lead" | "body" | "small" | "label" | "eyebrow" | "caption";

/** Tamil script needs extra line height; `scale` is applied per locale by <Text>. */
export function textStyle(variant: TextVariant, tamil: boolean): TextStyle {
  const lh = (size: number, base: number) => Math.round(size * (tamil ? Math.max(base, lineHeight.tamil) : base));
  const heading = (size: number): TextStyle => ({
    fontFamily: serif,
    fontSize: tamil ? Math.round(size * 0.84) : size,
    lineHeight: lh(tamil ? Math.round(size * 0.84) : size, tamil ? lineHeight.tamilHeading : 1.18),
    color: color.heading,
    fontWeight: Platform.OS === "ios" ? "500" : "400",
  });
  switch (variant) {
    case "display":
      return heading(38);
    case "h1":
      return heading(32);
    case "h2":
      return heading(26);
    case "h3":
      return heading(21);
    case "lead":
      return { fontSize: fontSize.lg, lineHeight: lh(fontSize.lg, lineHeight.normal), color: color.textMuted };
    case "body":
      return { fontSize: 16, lineHeight: lh(16, lineHeight.normal), color: color.text };
    case "small":
      return { fontSize: 14, lineHeight: lh(14, 1.5), color: color.textMuted };
    case "label":
      return { fontSize: 15, lineHeight: lh(15, 1.4), color: color.text, fontWeight: "600" };
    case "eyebrow":
      return {
        fontSize: 12,
        lineHeight: lh(12, 1.4),
        color: color.eyebrow,
        fontWeight: "700",
        letterSpacing: tamil ? 0 : 1.4,
        textTransform: tamil ? "none" : "uppercase",
      };
    case "caption":
      return { fontSize: 12, lineHeight: lh(12, 1.4), color: color.textMuted };
  }
}

export function elevation(level: keyof typeof shadow): ViewStyle {
  const s = shadow[level].native;
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#283a30",
      shadowOpacity: s.opacity,
      shadowRadius: s.radius,
      shadowOffset: { width: 0, height: s.offsetY },
    },
    default: { elevation: s.elevation },
  });
}

export const theme = { color, space, radius, touchTarget: tokens.layout.touchTarget, elevation, textStyle };
export type Theme = typeof theme;
