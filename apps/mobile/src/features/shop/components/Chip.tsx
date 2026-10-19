import { Pressable, StyleSheet } from "react-native";
import { Text } from "../../../components/ui";
import { theme } from "../../../theme";

/** Filter chip with radio semantics (one selected per group). */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected ? styles.on : null, pressed && !selected ? styles.pressed : null]}
    >
      <Text variant="label" style={[styles.label, selected ? styles.labelOn : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
    backgroundColor: theme.color.surface,
    justifyContent: "center",
  },
  on: { backgroundColor: theme.color.primary, borderColor: theme.color.primary },
  pressed: { backgroundColor: theme.color.accentSoft },
  label: { fontSize: 14, color: theme.color.text },
  labelOn: { color: theme.color.onPrimary },
});
