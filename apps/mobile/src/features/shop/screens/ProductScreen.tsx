/** Product detail with a sticky "Add to cart" bar. Stock limits come from the API. */
import { useEffect, useLayoutEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useCart, useFormat, useProduct, useT } from "@sdw/controllers";
import { discountPercent, STOCK_STATUS } from "@sdw/core";
import {
  Badge,
  Button,
  ErrorView,
  Icon,
  LoadingView,
  Markdown,
  MediaImage,
  Notice,
  QuantityStepper,
  Screen,
  Stack,
  Text,
} from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";
import { theme } from "../../../theme";
import { CartButton } from "../components/CartButton";

export function ProductScreen({ route, navigation }: RootScreenProps<"Product">) {
  const { slug } = route.params;
  const t = useT();
  const f = useFormat();
  const product = useProduct(slug);
  const { lines, add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: product.data?.name ?? t("Shop"), headerRight: () => <CartButton /> });
  }, [navigation, product.data?.name, t]);
  useEffect(() => setQty(1), [slug]);

  if (product.isPending) return <LoadingView />;
  if (product.isError || !product.data)
    return <ErrorView error={product.error} onRetry={() => void product.refetch()} />;

  const p = product.data;
  const inCart = lines.find((l) => l.productId === p.id)?.quantity ?? 0;
  const room = Math.max(0, p.maxQuantity - inCart);
  const off = discountPercent(p.price, p.mrp);
  const stock = STOCK_STATUS[p.stockStatus];

  const footer =
    p.stockStatus === "OUT_OF_STOCK" ? (
      <Button fullWidth disabled>
        {t("Out of stock")}
      </Button>
    ) : room === 0 ? (
      <Button fullWidth variant="secondary" icon="cart-outline" onPress={() => navigation.navigate("Cart")}>
        {t("View cart")}
      </Button>
    ) : (
      <View style={styles.footer}>
        <QuantityStepper
          value={Math.min(qty, room)}
          max={room}
          onChange={(n) => setQty(Math.max(1, Math.min(n, room)))}
          label={t("Quantity")}
        />
        <Button
          icon="cart-outline"
          style={styles.add}
          onPress={() => {
            add(p.id, Math.min(qty, room), p.maxQuantity);
            setAdded(t("Added to cart: {name}", { name: p.name }));
            setQty(1);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
          }}
        >
          {t("Add to cart")}
        </Button>
      </View>
    );

  return (
    <Screen onRefresh={() => product.refetch()} footer={footer}>
      <MediaImage image={p.images[0] ?? p.image} fallback="product-default.webp" ratio={1} />
      <Stack gap={10}>
        {p.category ? <Text variant="eyebrow">{p.category.name}</Text> : null}
        <Text variant="h1">{p.name}</Text>
        {p.size ? <Text variant="small">{p.size}</Text> : null}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{f.price(p.price)}</Text>
          {p.mrp && off ? (
            <>
              <Text variant="small" style={styles.mrp} accessibilityLabel={`${t("MRP")} ${f.price(p.mrp)}`}>
                {f.price(p.mrp)}
              </Text>
              <Badge tone="success">{t("{percent}% off", { percent: off })}</Badge>
            </>
          ) : null}
        </View>
        <Badge tone={stock.tone}>{t(stock.label)}</Badge>
      </Stack>
      {added ? (
        <Notice
          tone="success"
          action={
            <Button size="sm" variant="secondary" onPress={() => navigation.navigate("Cart")}>
              {t("View cart")}
            </Button>
          }
        >
          {added}
        </Notice>
      ) : inCart > 0 ? (
        <Text variant="small">{t("In your cart: {count}", { count: inCart })}</Text>
      ) : null}
      <Text variant="lead">{p.shortDescription}</Text>
      <View style={styles.perks}>
        <View style={styles.perk}>
          <Icon name="location-outline" size={18} />
          <Text variant="small">{t("Free pickup at the clinic")}</Text>
        </View>
        <View style={styles.perk}>
          <Icon name="leaf-outline" size={18} />
          <Text variant="small">{t("Home delivery available at checkout")}</Text>
        </View>
      </View>
      <Stack gap={8}>
        <Text variant="h3">{t("About this product")}</Text>
        <Markdown text={p.description} />
      </Stack>
      {p.benefits.length ? (
        <Stack gap={8}>
          <Text variant="h3">{t("Highlights")}</Text>
          {p.benefits.map((b) => (
            <View key={b} style={styles.perk}>
              <Icon name="checkmark" size={18} color={theme.color.success} />
              <Text style={{ flex: 1 }}>{b}</Text>
            </View>
          ))}
        </Stack>
      ) : null}
      {p.ingredients ? (
        <Stack gap={6}>
          <Text variant="h3">{t("Ingredients")}</Text>
          <Text>{p.ingredients}</Text>
        </Stack>
      ) : null}
      {p.usage ? (
        <Stack gap={6}>
          <Text variant="h3">{t("How to use")}</Text>
          <Text>{p.usage}</Text>
        </Stack>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  priceRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  price: { fontSize: 26, fontWeight: "700", color: theme.color.text },
  mrp: { textDecorationLine: "line-through" },
  footer: { flexDirection: "row", alignItems: "center", gap: 12 },
  add: { flex: 1, alignSelf: "stretch" },
  perks: { gap: 8 },
  perk: { flexDirection: "row", alignItems: "center", gap: 8 },
});
