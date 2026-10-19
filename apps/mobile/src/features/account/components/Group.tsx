import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../../../components/ui";
import { theme } from "../../../theme";

/** Inset grouped list, like the platform's settings screens. */
export function Group({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  return (
    <View style={{ gap: 8 }}>
      {title ? (
        <Text variant="eyebrow" style={{ marginLeft: 4 }}>
          {title}
        </Text>
      ) : null}
      <View style={styles.group}>{children}</View>
      {footer ? (
        <Text variant="caption" style={{ marginHorizontal: 4 }}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    backgroundColor: theme.color.surface,
  },
});
