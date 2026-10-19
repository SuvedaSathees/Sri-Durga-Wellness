/** Services tab: every service, the practitioners, and the free consultation. */
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useDoctors, useServiceList, useT } from "@sdw/controllers";
import { ServiceCard } from "../../../components/cards/Cards";
import {
  Badge,
  Button,
  Card,
  EmptyView,
  MediaImage,
  QueryView,
  Screen,
  SectionHeader,
  Text,
} from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";

export function ServicesScreen() {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  const services = useServiceList();
  const doctors = useDoctors();

  return (
    <Screen onRefresh={() => Promise.all([services.refetch(), doctors.refetch()])}>
      <View style={styles.intro}>
        <Text variant="h1">{t("Ways we can help")}</Text>
        <Text variant="lead">
          {t("Every plan begins with a conversation. Choose a service to learn more, or book a time that suits you.")}
        </Text>
        <Button icon="calendar-outline" onPress={() => navigation.navigate("Booking")}>
          {t("Book an Appointment")}
        </Button>
      </View>

      <QueryView
        query={services}
        empty={
          <EmptyView
            title={t("Services will be listed here soon")}
            body={t("Please contact the clinic to ask about appointments.")}
          />
        }
      >
        {(list) => (
          <View style={styles.list}>
            {list.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </View>
        )}
      </QueryView>

      <View style={styles.section}>
        <SectionHeader eyebrow={t("Our practitioners")} title={t("Meet the people who will care for you")} />
        <QueryView query={doctors} empty={null}>
          {(list) => (
            <View style={styles.list}>
              {list.map((d) => (
                <Card key={d.id}>
                  <View style={styles.doctor}>
                    <View style={styles.avatar}>
                      <MediaImage
                        image={d.photo ? { ...d.photo, alt: "" } : null}
                        fallback="doctor.webp"
                        ratio={1}
                        radius={32}
                      />
                    </View>
                    <View style={styles.doctorText}>
                      <Text variant="h3">{d.name}</Text>
                      <Text variant="label" style={styles.role}>
                        {d.specialisation}
                      </Text>
                      {d.isSample ? <Badge tone="warning">{t("Sample profile")}</Badge> : null}
                      <Text variant="small">{d.shortBio}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </QueryView>
      </View>

      <Card>
        <View style={styles.cta}>
          <Text variant="h3">{t("Not sure where to start?")}</Text>
          <Text variant="small">{t("Request a free consultation and we'll help you choose the right service.")}</Text>
          <Button variant="secondary" onPress={() => navigation.navigate("Consultation")}>
            {t("Request a free consultation")}
          </Button>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 12 },
  list: { gap: 12 },
  section: { marginTop: 8 },
  doctor: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  avatar: { width: 64 },
  doctorText: { flex: 1, gap: 4 },
  role: { color: "#5c6a50" },
  cta: { gap: 10 },
});
