import { Text as RNText, type TextProps } from "react-native";
import { useLocale } from "@sdw/controllers";
import { textStyle, type TextVariant } from "../../theme";

/** Text with the shared type scale. Headings are exposed to screen readers as headers. */
export function Text({ variant = "body", style, ...rest }: TextProps & { variant?: TextVariant }) {
  const [locale] = useLocale();
  const isHeading = variant === "display" || variant === "h1" || variant === "h2" || variant === "h3";
  return (
    <RNText
      accessibilityRole={isHeading ? "header" : undefined}
      style={[textStyle(variant, locale === "ta"), style]}
      maxFontSizeMultiplier={1.8}
      {...rest}
    />
  );
}
