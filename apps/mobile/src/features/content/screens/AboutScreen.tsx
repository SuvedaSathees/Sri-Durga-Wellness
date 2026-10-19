/** About the clinic and its practitioners (only what the API returns). */
import { Image, StyleSheet, View } from "react-native";
import { useContentBlocks, useDoctors, useT } from "@sdw/controllers";
import { Badge, Button, Card, Markdown, QueryView, Screen, SectionHeader, Text } from "../../../components/ui";
import { imageSource } from "../../../platform/images";
import type { RootScreenProps } from "../../../navigation/types";
import { theme } from "../../../theme";

export function AboutScreen({ navigation }: RootScreenProps<"About">) {
  const t = useT();
  const blocks = useContentBlocks("about.");
  const doctors = useDoctors();
  const clinic = imageSource("/images/placeholders/clinic.webp");

  return (
    <Screen onRefresh={() => Promise.all([blocks.refetch(), doctors.refetch()])}>
      <QueryView query={blocks} isEmpty={() => false}>
        {() => (
          <View style={styles.gap}>
            <Text variant="eyebrow">{t("About us")}</Text>
            <Text variant="h1">{t("A calm place to begin")}</Text>
            {blocks.text("about.intro") ? <Text variant="lead">{blocks.text("about.intro")}</Text> : null}
            {clinic ? (
              <Image
                source={clinic}
                style={styles.photo}
                accessibilityLabel={blocks.text("about.imageAlt") || undefined}
                resizeMode="cover"
              />
            ) : null}
            {blocks.text("about.story") ? (
              <View style={styles.gap}>
                <Text variant="h2">{t("Our story")}</Text>
                <Markdown text={blocks.text("about.story")} />
              </View>
            ) : null}
            {blocks.text("about.philosophy") ? (
              <View style={styles.gap}>
                <Text variant="h2">{t("Our philosophy")}</Text>
                <Markdown text={blocks.text("about.philosophy")} />
              </View>
            ) : null}
            {blocks.text("about.approach") ? (
              <View style={styles.gap}>
                <Text variant="h2">{t("How we work")}</Text>
                <Markdown text={blocks.text("about.approach")} />
              </View>
            ) : null}
          </View>
        )}
      </QueryView>

      <View style={styles.team}>
        <SectionHeader eyebrow={t("Our practitioners")} title={t("Meet the people who will care for you")} />
        <QueryView
          query={doctors}
          empty={<Text variant="small">{t("Practitioner profiles will be added soon.")}</Text>}
        >
          {(list) => (
            <View style={styles.gap}>
              {list.map((d) => {
                const photo = imageSource(d.photo?.url, "doctor.webp");
                return (
                  <Card key={d.id}>
                    <View style={styles.gap}>
                      <View style={styles.head}>
                        {photo ? <Image source={photo} style={styles.avatar} accessibilityIgnoresInvertColors /> : null}
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text variant="h3">{d.name}</Text>
                          <Text variant="small">{d.specialisation}</Text>
                        </View>
                      </View>
                      {d.isSample ? <Badge tone="warning">{t("Sample profile")}</Badge> : null}
                      <Text variant="small">{d.qualifications}</Text>
                      {d.experienceYears ? (
                        <Text variant="small">{t("{years}+ years of practice", { years: d.experienceYears })}</Text>
                      ) : null}
                      {d.languages ? (
                        <Text variant="small">{t("Speaks {languages}", { languages: d.languages })}</Text>
                      ) : null}
                      <Text>{d.shortBio}</Text>
                      {d.acceptsAppointments ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon="calendar-outline"
                          onPress={() => navigation.navigate("Booking", { doctorSlug: d.slug })}
                        >
                          {t("Book with {name}", { name: d.name })}
                        </Button>
                      ) : null}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </QueryView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 12 },
  team: { marginTop: 16 },
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: theme.radius.xl },
  head: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.color.accentSoft },
});
