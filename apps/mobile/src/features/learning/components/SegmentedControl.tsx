/** Two or three equal segments (tab semantics), e.g. Classes | Courses. */
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../../../components/ui";
import { theme } from "../../../theme";

export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: K; label: string }>;
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected ? styles.selected : null]}
          >
            <Text
              variant="label"
              style={{ color: selected ? theme.color.onPrimary : theme.color.text, textAlign: "center" }}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    padding: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.borderStrong,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  selected: { backgroundColor: theme.color.primary },
});
