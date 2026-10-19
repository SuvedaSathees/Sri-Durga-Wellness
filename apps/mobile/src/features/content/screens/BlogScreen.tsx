/** Journal list. "Load more" grows the page so the list stays one scroll. */
import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useFormat, useLocale, usePosts, useT } from "@sdw/controllers";
import {
  Badge,
  Button,
  Card,
  EmptyView,
  ErrorView,
  LoadingView,
  MediaImage,
  Notice,
  Text,
} from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";
import { theme } from "../../../theme";

const PAGE = 9;

export function BlogScreen({ navigation }: RootScreenProps<"Blog">) {
  const t = useT();
  const f = useFormat();
  const [locale] = useLocale();
  const [pages, setPages] = useState(1);
  const posts = usePosts({ pageSize: PAGE * pages });
  const [refreshing, setRefreshing] = useState(false);

  if (posts.isPending) return <LoadingView />;
  if (posts.isError || !posts.data) return <ErrorView error={posts.error} onRetry={() => void posts.refetch()} />;
  const { items, total } = posts.data;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(p) => p.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={theme.color.primary}
          onRefresh={() => {
            setRefreshing(true);
            void posts.refetch().finally(() => setRefreshing(false));
          }}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <Text variant="h1">{t("Notes for everyday well-being")}</Text>
          <Text variant="lead">{t("Practical ideas for calmer days, and guides to visiting the clinic.")}</Text>
          {locale === "ta" ? <Notice tone="info">{t("Journal articles are currently in English.")}</Notice> : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyView icon="book-outline" title={t("No articles yet")} body={t("New articles will appear here soon.")} />
      }
      renderItem={({ item }) => (
        <Card
          padded={false}
          onPress={() => navigation.navigate("Post", { slug: item.slug })}
          accessibilityLabel={`${item.title}. ${f.shortDate(item.publishedAt)}`}
        >
          <MediaImage image={item.cover} fallback="blog-default.webp" ratio={16 / 9} radius={0} />
          <View style={styles.body}>
            <Text variant="caption">{f.shortDate(item.publishedAt)}</Text>
            <Text variant="h3">{item.title}</Text>
            <Text variant="small" numberOfLines={3}>
              {item.excerpt}
            </Text>
            <View style={styles.tags}>
              {item.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </View>
          </View>
        </Card>
      )}
      ListFooterComponent={
        items.length < total ? (
          <Button variant="secondary" fullWidth loading={posts.isFetching} onPress={() => setPages((n) => n + 1)}>
            {t("Load more")}
          </Button>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  body: { padding: 14, gap: 8 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
