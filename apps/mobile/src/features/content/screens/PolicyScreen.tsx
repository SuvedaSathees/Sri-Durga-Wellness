import { useEffect } from "react";
import { useFormat, useLocale, usePolicy, useT } from "@sdw/controllers";
import { ErrorView, LoadingView, Markdown, Notice, Screen, Text } from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";

export function PolicyScreen({ route, navigation }: RootScreenProps<"Policy">) {
  const t = useT();
  const f = useFormat();
  const [locale] = useLocale();
  const policy = usePolicy(route.params.slug);

  useEffect(() => {
    navigation.setOptions({ title: policy.data?.title ?? t("Policies") });
  }, [navigation, policy.data?.title, t]);

  if (policy.isPending) return <LoadingView />;
  if (policy.isError || !policy.data) return <ErrorView error={policy.error} onRetry={() => void policy.refetch()} />;
  const p = policy.data;
  return (
    <Screen onRefresh={() => policy.refetch()}>
      <Text variant="h1">{p.title}</Text>
      <Text variant="caption">{t("Last updated {date}", { date: f.longDate(p.updatedAt) })}</Text>
      {locale === "ta" && p.bodyLocale === "en" ? (
        <Notice tone="info">
          {t(
            "This page is currently available in English only. The Tamil version will be added once the clinic has approved it.",
          )}
        </Notice>
      ) : null}
      <Markdown text={p.body} />
    </Screen>
  );
}
