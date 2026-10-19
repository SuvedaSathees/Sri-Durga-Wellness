/** Badges, notices and the four data states (loading, error, empty, data). */
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { UseQueryResult } from "@tanstack/react-query";
import { useT } from "@sdw/controllers";
import { errorMessage, isApiError, type Tone } from "@sdw/core";
import { theme } from "../../theme";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

const TONES: Record<Tone, { bg: string; fg: string; icon: IconName }> = {
  neutral: { bg: theme.color.bgAlt, fg: theme.color.textMuted, icon: "information-circle-outline" },
  info: { bg: theme.color.infoBg, fg: theme.color.info, icon: "information-circle-outline" },
  success: { bg: theme.color.successBg, fg: theme.color.success, icon: "checkmark-circle" },
  warning: { bg: theme.color.warningBg, fg: theme.color.warning, icon: "alert-circle-outline" },
  danger: { bg: theme.color.dangerBg, fg: theme.color.danger, icon: "alert-circle-outline" },
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const c = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text variant="caption" style={{ color: c.fg, fontWeight: "700" }}>
        {children}
      </Text>
    </View>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const c = TONES[tone];
  return (
    <View
      style={[styles.notice, { backgroundColor: c.bg }]}
      accessibilityRole={tone === "danger" ? "alert" : "summary"}
      accessibilityLiveRegion="polite"
    >
      <Icon name={c.icon} size={20} color={c.fg} />
      <View style={styles.noticeBody}>
        {title ? <Text style={{ color: c.fg, fontWeight: "700" }}>{title}</Text> : null}
        {typeof children === "string" ? <Text style={{ color: c.fg }}>{children}</Text> : children}
        {action}
      </View>
    </View>
  );
}

export function FormError({ message }: { message: string | null | undefined }) {
  const t = useT();
  return message ? <Notice tone="danger">{t(message)}</Notice> : null;
}

export function LoadingView({ label }: { label?: string }) {
  const t = useT();
  return (
    <View style={styles.center} accessible accessibilityLabel={label ?? t("Loading…")} accessibilityRole="progressbar">
      <ActivityIndicator color={theme.color.primary} size="large" />
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useT();
  const notFound = isApiError(error) && error.status === 404;
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Icon name="alert-circle-outline" size={28} />
      </View>
      <Text variant="h3" style={styles.centerText}>
        {notFound ? t("We couldn't find that page") : t("Something went wrong")}
      </Text>
      <Text variant="small" style={styles.centerText}>
        {t(errorMessage(error))}
      </Text>
      {onRetry && !notFound ? (
        <Button variant="secondary" icon="refresh" onPress={onRetry}>
          {t("Try again")}
        </Button>
      ) : null}
    </View>
  );
}

export function EmptyView({
  icon = "leaf-outline",
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Icon name={icon} size={28} />
      </View>
      <Text variant="h3" style={styles.centerText}>
        {title}
      </Text>
      {body ? (
        <Text variant="small" style={styles.centerText}>
          {body}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

/** Picks loading / error / empty / data for a React Query result. */
export function QueryView<T>({
  query,
  empty,
  isEmpty = (d) => Array.isArray(d) && d.length === 0,
  loading,
  children,
}: {
  query: Pick<UseQueryResult<T>, "data" | "isPending" | "isError" | "error" | "refetch">;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  loading?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <>{loading ?? <LoadingView />}</>;
  if (query.isError || query.data === undefined)
    return <ErrorView error={query.error} onRetry={() => void query.refetch()} />;
  if (empty !== undefined && isEmpty(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.radius.pill },
  notice: { flexDirection: "row", gap: 10, padding: 14, borderRadius: theme.radius.md },
  noticeBody: { flex: 1, gap: 6 },
  center: { padding: 48, alignItems: "center", justifyContent: "center" },
  state: { alignItems: "center", gap: 12, paddingVertical: 40, paddingHorizontal: 16 },
  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.color.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: { textAlign: "center" },
});
