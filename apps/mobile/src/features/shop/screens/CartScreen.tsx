/** Cart with server-priced lines, quantity controls and a sticky checkout bar. */
import { Pressable, StyleSheet, View } from "react-native";
import { useCart, useCartQuote, useFormat, useSession, useSite, useT } from "@sdw/controllers";
import {
  Button,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  MediaImage,
  Notice,
  QuantityStepper,
  Screen,
  Text,
} from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";
import { theme } from "../../../theme";

export function CartScreen({ navigation }: RootScreenProps<"Cart">) {
  const t = useT();
  const f = useFormat();
  const { lines, setQuantity, remove, applyProblems } = useCart();
  const quote = useCartQuote("PICKUP");
  const site = useSite().data;
  const { status } = useSession();

  if (lines.length === 0) {
    return (
      <Screen>
        <EmptyView
          icon="cart-outline"
          title={t("Your cart is empty")}
          body={t("Browse the shop and add something you'd like.")}
          action={
            <Button onPress={() => navigation.navigate("Tabs", { screen: "ShopTab" })}>{t("Visit the shop")}</Button>
          }
        />
      </Screen>
    );
  }
  if (quote.isPending) return <LoadingView />;
  if (quote.isError || !quote.data) return <ErrorView error={quote.error} onRetry={() => void quote.refetch()} />;

  const q = quote.data;
  const blocked = q.problems.length > 0;
  const footer = (
    <View style={{ gap: 8 }}>
      <View style={styles.totalRow}>
        <Text variant="label">{t("Subtotal")}</Text>
        <Text variant="label">{f.price(q.subtotal)}</Text>
      </View>
      <Button
        fullWidth
        iconAfter="arrow-forward"
        disabled={blocked}
        accessibilityHint={blocked ? t("Update your cart before checking out.") : undefined}
        onPress={() => navigation.navigate(status === "signedIn" ? "Checkout" : "Login")}
      >
        {t("Checkout")}
      </Button>
    </View>
  );

  return (
    <Screen onRefresh={() => quote.refetch()} footer={footer}>
      {blocked ? (
        <Notice
          tone="warning"
          title={t("Some items have changed")}
          action={
            <Button size="sm" variant="secondary" onPress={() => applyProblems(q.problems)}>
              {t("Update my cart")}
            </Button>
          }
        >
          {t("We can't supply everything in your cart right now. Update your cart to continue with what's available.")}
        </Notice>
      ) : null}
      {q.lines.map((line) => (
        <Card key={line.product.id}>
          <View style={styles.line}>
            <Pressable
              style={styles.thumb}
              onPress={() => navigation.navigate("Product", { slug: line.product.slug })}
              accessibilityRole="link"
              accessibilityLabel={line.product.name}
            >
              <MediaImage
                image={line.product.image}
                fallback="product-default.webp"
                ratio={1}
                radius={theme.radius.md}
              />
            </Pressable>
            <View style={styles.body}>
              <View style={styles.top}>
                <Text variant="label" style={{ flex: 1 }}>
                  {line.product.name}
                </Text>
                <Text variant="label">{f.price(line.lineTotal)}</Text>
              </View>
              <Text variant="caption">
                {[line.product.size, t("{price} each", { price: f.price(line.unitPrice) })].filter(Boolean).join(" · ")}
              </Text>
              <View style={styles.actions}>
                <QuantityStepper
                  value={line.quantity}
                  max={Math.max(line.quantity, line.product.maxQuantity)}
                  onChange={(n) => setQuantity(line.product.id, Math.max(1, n), line.product.maxQuantity)}
                  label={t("Quantity of {name}", { name: line.product.name })}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => remove(line.product.id)}
                  accessibilityLabel={t("Remove {name}", { name: line.product.name })}
                >
                  {t("Remove")}
                </Button>
              </View>
            </View>
          </View>
        </Card>
      ))}
      <Text variant="small">
        {site?.shop.freeDeliveryFrom
          ? t("Clinic pickup is free. Home delivery is {fee}, free on orders of {threshold} or more.", {
              fee: f.price(site.shop.deliveryFee),
              threshold: f.price(site.shop.freeDeliveryFrom),
            })
          : t("Delivery charges, if any, are shown at checkout.")}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: "row", gap: 12 },
  thumb: { width: 76 },
  body: { flex: 1, gap: 6 },
  top: { flexDirection: "row", gap: 8 },
  actions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
});
