import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useT } from "@sdw/controllers";
import { theme } from "../../theme";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "light";

const COLORS: Record<Variant, { bg: string; fg: string; border: string; pressed: string }> = {
  primary: {
    bg: theme.color.primary,
    fg: theme.color.onPrimary,
    border: theme.color.primary,
    pressed: theme.color.primaryPressed,
  },
  secondary: {
    bg: theme.color.surface,
    fg: theme.color.primary,
    border: theme.color.inputBorder,
    pressed: theme.color.surfaceMuted,
  },
  ghost: { bg: "transparent", fg: theme.color.primary, border: "transparent", pressed: theme.color.accentSoft },
  danger: {
    bg: theme.color.surface,
    fg: theme.color.danger,
    border: theme.color.danger,
    pressed: theme.color.dangerBg,
  },
  light: { bg: theme.color.bg, fg: theme.color.primary, border: theme.color.bg, pressed: theme.color.surface },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  icon,
  iconAfter,
  loading,
  disabled,
  fullWidth,
  size = "md",
  accessibilityLabel,
  accessibilityHint,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  iconAfter?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "md" | "sm";
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  const c = COLORS[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === "string" ? children : undefined)}
      accessibilityHint={loading ? t("Please wait…") : accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      hitSlop={size === "sm" ? 6 : 0}
      style={({ pressed }) => [
        styles.base,
        size === "sm" ? styles.sm : null,
        { backgroundColor: pressed ? c.pressed : c.bg, borderColor: c.border },
        fullWidth ? styles.full : null,
        inactive ? styles.disabled : null,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={c.fg} size="small" />
        ) : icon ? (
          <Icon name={icon} size={18} color={c.fg} />
        ) : null}
        <Text
          variant="label"
          style={[styles.label, { color: c.fg }, size === "sm" ? styles.smLabel : null]}
          numberOfLines={2}
        >
          {children}
        </Text>
        {iconAfter && !loading ? <Icon name={iconAfter} size={18} color={c.fg} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: 22,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  sm: { minHeight: theme.touchTarget, paddingHorizontal: 16 },
  full: { alignSelf: "stretch" },
  disabled: { opacity: 0.55 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  label: { textAlign: "center", flexShrink: 1 },
  smLabel: { fontSize: 14 },
});
