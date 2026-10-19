/**
 * Shop tab: category and sort chips, two-column product grid that loads more as you scroll,
 * pull to refresh, and a cart button in the header.
 */
import { useLayoutEffect, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCategories, useProducts, useSite, useT } from "@sdw/controllers";
import type { ProductSort } from "@sdw/core";
import { ProductCard } from "../../../components/cards/Cards";
import { EmptyView, ErrorView, LoadingView, Text } from "../../../components/ui";
import { theme } from "../../../theme";
import { CartButton } from "../components/CartButton";
import { Chip } from "../components/Chip";

const PAGE = 12;
const SORTS: Array<{ value: ProductSort; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name" },
];

export function ShopScreen() {
  const t = useT();
  const navigation = useNavigation();
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<ProductSort>("featured");
  const [pages, setPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const categories = useCategories();
  const site = useSite();
  const products = useProducts({ category: category || undefined, sort, page: 1, pageSize: PAGE * pages });

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <CartButton /> });
  }, [navigation]);

  const choose = (next: { category?: string; sort?: ProductSort }) => {
    if (next.category !== undefined) setCategory(next.category);
    if (next.sort) setSort(next.sort);
    setPages(1);
  };

  const header = (
    <View style={styles.header}>
      <Text variant="lead">
        {site.data?.shop.deliversAllIndia
          ? t("Products selected by our team, delivered anywhere in India or ready for clinic pickup.")
          : t("Products selected by our team, available for clinic pickup or home delivery.")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        accessibilityRole="radiogroup"
        accessibilityLabel={t("Product categories")}
      >
        <Chip label={t("All products")} selected={!category} onPress={() => choose({ category: "" })} />
        {categories.data?.map((c) => (
          <Chip key={c.id} label={c.name} selected={category === c.slug} onPress={() => choose({ category: c.slug })} />
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        accessibilityRole="radiogroup"
        accessibilityLabel={t("Sort by")}
      >
        {SORTS.map((s) => (
          <Chip
            key={s.value}
            label={t(s.label)}
            selected={sort === s.value}
            onPress={() => choose({ sort: s.value })}
          />
        ))}
      </ScrollView>
      {products.data ? (
        <Text variant="small">
          {products.data.total === 1 ? t("1 product") : t("{count} products", { count: products.data.total })}
        </Text>
      ) : null}
    </View>
  );

  const items = products.data?.items ?? [];
  const hasMore = !!products.data && items.length < products.data.total;

  return (
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <View style={styles.cell}>
          <ProductCard product={item} />
        </View>
      )}
      ListEmptyComponent={
        products.isPending ? (
          <LoadingView />
        ) : products.isError ? (
          <ErrorView error={products.error} onRetry={() => void products.refetch()} />
        ) : (
          <EmptyView title={t("No products here yet")} body={t("Try another category, or check back soon.")} />
        )
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (hasMore && !products.isFetching) setPages((p) => p + 1);
      }}
      ListFooterComponent={hasMore ? <LoadingView /> : null}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void Promise.all([products.refetch(), categories.refetch()]).finally(() => setRefreshing(false));
          }}
          tintColor={theme.color.primary}
          colors={[theme.color.primary]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  header: { gap: 14, marginBottom: 4 },
  chips: { gap: 8, paddingRight: 16 },
  row: { gap: 12 },
  cell: { flex: 1, maxWidth: "50%" },
});
