/**
 * Scrollable screen body with pull-to-refresh, keyboard avoidance for forms and safe-area padding.
 * Headers come from the native stack, so screens only provide content.
 */
import { useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../theme";

export function Screen({
  children,
  onRefresh,
  padded = true,
  keyboard = false,
  contentStyle,
  footer,
}: {
  children: ReactNode;
  /** Pull-to-refresh handler (return the refetch promise). */
  onRefresh?: () => Promise<unknown>;
  padded?: boolean;
  /** Avoid the keyboard (screens with forms). */
  keyboard?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Sticky bottom bar (e.g. "Add to cart"). */
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = onRefresh
    ? async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    : undefined;

  const body = (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        padded ? styles.padded : null,
        { paddingBottom: (footer ? 16 : insets.bottom) + 32 },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        refresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.color.primary}
            colors={[theme.color.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );

  const content = (
    <View style={styles.flex}>
      {body}
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View> : null}
    </View>
  );

  return keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );
}

/** Vertical stack with consistent spacing. */
export function Stack({
  gap = 16,
  children,
  style,
}: {
  gap?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.color.bg },
  scroll: { flex: 1, backgroundColor: theme.color.bg },
  padded: { padding: 16, gap: 16 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: theme.color.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.borderStrong,
  },
});
