import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCart, useT } from "@sdw/controllers";
import { Icon, Text } from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";
import { theme } from "../../../theme";

/** Header button that opens the cart and shows how many items it holds. */
export function CartButton() {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  const { count } = useCart();
  const label =
    count === 0
      ? t("Cart, empty")
      : count === 1
        ? t("Cart, {count} item", { count })
        : t("Cart, {count} items", { count });
  return (
    <Pressable
      onPress={() => navigation.navigate("Cart")}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={styles.button}
    >
      <Icon name="cart-outline" size={24} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: 4 },
  badge: {
    position: "absolute",
    top: 2,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: theme.color.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: theme.color.onPrimary, fontSize: 11, lineHeight: 14, fontWeight: "700" },
});
