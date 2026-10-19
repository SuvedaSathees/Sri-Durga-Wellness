/** Cards, rows, section headings, images and small controls. */
import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useT } from "@sdw/controllers";
import type { ImageRef } from "@sdw/core";
import { imageSource, type PlaceholderName } from "../../platform/images";
import { theme } from "../../theme";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export function Card({
  children,
  onPress,
  accessibilityLabel,
  style,
  padded = true,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const base = [styles.card, padded ? styles.padded : null, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...base, pressed ? styles.pressed : null]}
    >
      {children}
    </Pressable>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1, gap: 4 }}>
        {eyebrow ? <Text variant="eyebrow">{eyebrow}</Text> : null}
        <Text variant="h2">{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={action.onPress} accessibilityRole="link" hitSlop={10} style={styles.sectionAction}>
          <Text variant="label" style={{ color: theme.color.primary }}>
            {action.label}
          </Text>
          <Icon name="chevron-forward" size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Settings-style row: icon, title, optional detail, chevron. */
export function ListRow({
  icon,
  title,
  detail,
  onPress,
  right,
  accessibilityLabel,
}: {
  icon?: IconName;
  title: string;
  detail?: string;
  onPress?: () => void;
  right?: ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      {icon ? (
        <View style={styles.rowIcon}>
          <Icon name={icon} size={20} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label">{title}</Text>
        {detail ? <Text variant="small">{detail}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-forward" size={18} color={theme.color.textMuted} /> : null)}
    </Pressable>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

/** Label / value pairs. */
export function Facts({ items }: { items: Array<{ label: string; value: string } | null | false> }) {
  return (
    <View style={{ gap: 10 }}>
      {items.filter(Boolean).map((item, i) => {
        const f = item as { label: string; value: string };
        return (
          <View key={i} style={styles.fact} accessible accessibilityLabel={`${f.label}: ${f.value}`}>
            <Text variant="small">{f.label}</Text>
            <Text style={styles.factValue}>{f.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function MediaImage({
  image,
  fallback,
  ratio = 4 / 3,
  radius = theme.radius.lg,
}: {
  image: ImageRef | null | undefined;
  fallback?: PlaceholderName;
  ratio?: number;
  radius?: number;
}) {
  const source = imageSource(image?.url, fallback ?? null);
  const decorative = !image?.alt;
  return (
    <View style={[styles.media, { aspectRatio: ratio, borderRadius: radius }]}>
      {source ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessible={!decorative}
          accessibilityLabel={image?.alt || undefined}
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const t = useT();
  return (
    <View style={styles.qty} accessibilityLabel={label}>
      <Pressable
        onPress={() => onChange(value - 1)}
        disabled={value <= 1}
        accessibilityRole="button"
        accessibilityLabel={t("Decrease quantity")}
        style={[styles.qtyButton, value <= 1 ? { opacity: 0.4 } : null]}
      >
        <Icon name="remove" size={18} />
      </Pressable>
      <Text variant="label" accessibilityLiveRegion="polite" style={styles.qtyValue}>
        {value}
      </Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        disabled={value >= max}
        accessibilityRole="button"
        accessibilityLabel={t("Increase quantity")}
        style={[styles.qtyButton, value >= max ? { opacity: 0.4 } : null]}
      >
        <Icon name="add" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    overflow: "hidden",
    ...theme.elevation("sm"),
  },
  padded: { padding: 18 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 14 },
  sectionAction: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: theme.touchTarget },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: theme.color.surface,
  },
  rowPressed: { backgroundColor: theme.color.surfaceMuted },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.color.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.color.borderStrong },
  fact: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  factValue: { flexShrink: 1, textAlign: "right", fontWeight: "600" },
  media: { width: "100%", overflow: "hidden", backgroundColor: theme.color.accentSoft },
  qty: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.color.inputBorder,
    borderRadius: theme.radius.pill,
    alignSelf: "flex-start",
    backgroundColor: theme.color.surface,
  },
  qtyButton: { width: theme.touchTarget, height: theme.touchTarget, alignItems: "center", justifyContent: "center" },
  qtyValue: { minWidth: 28, textAlign: "center" },
});
