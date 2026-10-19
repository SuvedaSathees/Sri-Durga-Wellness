import { StyleSheet, View } from "react-native";
import { Icon, Text } from "../../../components/ui";
import { theme } from "../../../theme";

/** A checklist ("What's included", "What you'll learn"). */
export function Ticks({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <Text variant="h3">{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <Icon name="checkmark-circle" size={18} color={theme.color.success} />
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  text: { flex: 1 },
});
