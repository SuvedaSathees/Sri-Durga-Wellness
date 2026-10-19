/** One service: description, facts, practitioners, and a sticky "Book" button. */
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useFormat, useService, useT } from "@sdw/controllers";
import { SERVICE_MODE_LABEL } from "@sdw/core";
import {
  Button,
  Card,
  ErrorView,
  Facts,
  Icon,
  ListRow,
  LoadingView,
  Markdown,
  Notice,
  Screen,
  SERVICE_ICONS,
  Text,
} from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";
import { theme } from "../../../theme";

export function ServiceDetailScreen({ route, navigation }: RootScreenProps<"ServiceDetail">) {
  const { slug } = route.params;
  const t = useT();
  const f = useFormat();
  const query = useService(slug);
  const service = query.data;

  useEffect(() => {
    if (service) navigation.setOptions({ title: service.name });
  }, [navigation, service]);

  if (query.isPending) return <LoadingView />;
  if (query.isError || !service)
    return (
      <Screen>
        <ErrorView error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );

  const bookable = service.isBookable && service.doctors.some((d) => d.acceptsAppointments);

  return (
    <Screen
      onRefresh={() => query.refetch()}
      footer={
        bookable ? (
          <Button
            fullWidth
            icon="calendar-outline"
            onPress={() => navigation.navigate("Booking", { serviceSlug: service.slug })}
          >
            {t("Book this service")}
          </Button>
        ) : undefined
      }
    >
      <View style={styles.head}>
        <View style={styles.icon}>
          <Icon name={SERVICE_ICONS[service.icon ?? ""] ?? "leaf-outline"} size={26} />
        </View>
        <Text variant="eyebrow">{t(SERVICE_MODE_LABEL[service.mode])}</Text>
        <Text variant="h1">{service.name}</Text>
        <Text variant="lead">{service.summary}</Text>
      </View>

      <Card>
        <Facts
          items={[
            { label: t("Duration"), value: f.duration(service.durationMinutes) },
            { label: t("Format"), value: t(SERVICE_MODE_LABEL[service.mode]) },
            service.price !== null && { label: t("Fee"), value: f.price(service.price) },
          ]}
        />
      </Card>
      {!bookable ? (
        <Notice
          tone="info"
          action={
            <Button variant="secondary" size="sm" onPress={() => navigation.navigate("Contact")}>
              {t("Contact the clinic")}
            </Button>
          }
        >
          {t("Online booking isn't available for this service. Please contact the clinic to arrange a visit.")}
        </Notice>
      ) : null}
      {service.price !== null ? (
        <Text variant="small">{t("Fees are paid at the clinic unless stated otherwise.")}</Text>
      ) : null}

      <Markdown text={service.description} />

      {service.doctors.length > 0 ? (
        <View style={styles.doctors}>
          <Text variant="h2">{t("Practitioners")}</Text>
          <Card padded={false}>
            {service.doctors.map((d, i) => (
              <View key={d.id} style={i > 0 ? styles.divider : null}>
                <ListRow
                  icon="person-outline"
                  title={d.name}
                  detail={d.specialisation}
                  accessibilityLabel={
                    bookable && d.acceptsAppointments ? t("Book with {name}", { name: d.name }) : undefined
                  }
                  onPress={
                    bookable && d.acceptsAppointments
                      ? () => navigation.navigate("Booking", { serviceSlug: service.slug, doctorSlug: d.slug })
                      : undefined
                  }
                />
              </View>
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 10 },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.color.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  doctors: { gap: 12 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.color.borderStrong },
});
