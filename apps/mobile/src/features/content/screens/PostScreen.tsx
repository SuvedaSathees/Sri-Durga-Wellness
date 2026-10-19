import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useFormat, usePost, useT } from "@sdw/controllers";
import { Badge, ErrorView, LoadingView, Markdown, MediaImage, Screen, Text } from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";

export function PostScreen({ route, navigation }: RootScreenProps<"Post">) {
  const t = useT();
  const f = useFormat();
  const post = usePost(route.params.slug);

  useEffect(() => {
    navigation.setOptions({ title: post.data?.title ?? t("Journal") });
  }, [navigation, post.data?.title, t]);

  if (post.isPending) return <LoadingView />;
  if (post.isError || !post.data) return <ErrorView error={post.error} onRetry={() => void post.refetch()} />;
  const p = post.data;
  return (
    <Screen onRefresh={() => post.refetch()}>
      {p.cover ? <MediaImage image={p.cover} ratio={16 / 9} /> : null}
      <Text variant="caption">{f.longDate(p.publishedAt)}</Text>
      <Text variant="h1">{p.title}</Text>
      <View style={styles.tags}>
        {p.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </View>
      <Markdown text={p.content} />
    </Screen>
  );
}

const styles = StyleSheet.create({ tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 } });
