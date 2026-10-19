/**
 * Home tab: calm hero with the clinic's words, quick actions, then horizontally scrolling
 * previews (services, classes, shop, courses) and FAQs. Pull down to refresh.
 */
import { useState, type ReactNode } from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useClasses,
  useConfig,
  useContentBlocks,
  useCourses,
  useFaqs,
  useProducts,
  useServiceList,
  useSite,
  useT,
} from "@sdw/controllers";
import { ClassCard, CourseCard, ProductCard, ServiceCard } from "../../../components/cards/Cards";
import {
  Icon,
  LanguageToggle,
  Markdown,
  Notice,
  QueryView,
  Screen,
  SectionHeader,
  Text,
  type IconName,
} from "../../../components/ui";
import { readPreviewUi } from "../../../config/env";
import type { RootNavigation } from "../../../navigation/types";
import { HERO_IMAGE } from "../../../platform/images";
import { theme } from "../../../theme";

const CARD_WIDTH = 260;

function Rail({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + 12}
    >
      {children}
    </ScrollView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.quick, pressed ? { backgroundColor: theme.color.accentSoft } : null]}
    >
      <View style={styles.quickIcon}>
        <Icon name={icon} size={22} />
      </View>
      <Text variant="caption" style={styles.quickLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faq}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.faqHead}
      >
        <Text variant="label" style={{ flex: 1 }}>
          {question}
        </Text>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={18} />
      </Pressable>
      {open ? <Markdown text={answer} /> : null}
    </View>
  );
}

export function HomeScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootNavigation>();
  const site = useSite();
  const config = useConfig();
  const blocks = useContentBlocks("home.");
  const services = useServiceList();
  const classes = useClasses();
  const products = useProducts({ sort: "featured", pageSize: 6 });
  const courses = useCourses();
  const faqs = useFaqs();

  const refreshAll = () =>
    Promise.all([
      site.refetch(),
      blocks.refetch(),
      services.refetch(),
      classes.refetch(),
      products.refetch(),
      courses.refetch(),
      faqs.refetch(),
    ]);

  return (
    <Screen padded={false} onRefresh={refreshAll}>
      <ImageBackground
        source={HERO_IMAGE}
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
        imageStyle={styles.heroImage}
        accessibilityIgnoresInvertColors
      >
        <View style={styles.heroShade} />
        <View style={styles.heroTop}>
          <Text style={styles.brand}>{site.data?.clinicName ?? "Sri Durga Wellness"}</Text>
          <LanguageToggle />
        </View>
        <View style={styles.heroCopy}>
          <Text variant="display" style={styles.heroTitle}>
            {blocks.text("home.hero.title")}
          </Text>
          {blocks.text("home.hero.subtitle") ? (
            <Text style={styles.heroSubtitle}>{blocks.text("home.hero.subtitle")}</Text>
          ) : null}
        </View>
      </ImageBackground>

      <View style={styles.content}>
        {site.data?.isSampleContent && (config.apiMode === "live" || readPreviewUi()) ? (
          <Notice tone="warning">
            {t("Preview · sample content — to be replaced with clinic-approved details before launch")}
          </Notice>
        ) : null}

        <View style={styles.quickRow}>
          <QuickAction icon="calendar-outline" label={t("Book")} onPress={() => navigation.navigate("Booking")} />
          <QuickAction
            icon="chatbubble-ellipses-outline"
            label={t("Free consultation")}
            onPress={() => navigation.navigate("Consultation")}
          />
          <QuickAction
            icon="videocam-outline"
            label={t("Online Classes")}
            onPress={() => navigation.navigate("Tabs", { screen: "LearnTab" })}
          />
          <QuickAction
            icon="basket-outline"
            label={t("Shop")}
            onPress={() => navigation.navigate("Tabs", { screen: "ShopTab" })}
          />
        </View>

        <View>
          <SectionHeader
            eyebrow={t("Our services")}
            title={t("Care shaped around you")}
            action={{ label: t("View all"), onPress: () => navigation.navigate("Tabs", { screen: "ServicesTab" }) }}
          />
          <QueryView query={services} empty={null}>
            {(list) => (
              <Rail>
                {list.map((s) => (
                  <ServiceCard key={s.id} service={s} width={CARD_WIDTH} />
                ))}
              </Rail>
            )}
          </QueryView>
        </View>

        <View>
          <SectionHeader
            eyebrow={t("Live online classes")}
            title={t("Practise together, from wherever you are")}
            action={{ label: t("View all"), onPress: () => navigation.navigate("Tabs", { screen: "LearnTab" }) }}
          />
          <QueryView
            query={classes}
            isEmpty={(l) => !l.some((c) => c.nextBatch)}
            empty={<Text variant="small">{t("Upcoming batches will appear here as soon as they are scheduled.")}</Text>}
          >
            {(list) => (
              <Rail>
                {list
                  .filter((c) => c.nextBatch)
                  .map((c) => (
                    <ClassCard key={c.id} item={c} width={CARD_WIDTH} />
                  ))}
              </Rail>
            )}
          </QueryView>
        </View>

        <View>
          <SectionHeader
            eyebrow={t("Wellness shop")}
            title={t("Thoughtfully chosen essentials")}
            action={{ label: t("View all"), onPress: () => navigation.navigate("Tabs", { screen: "ShopTab" }) }}
          />
          <QueryView query={products} isEmpty={(p) => p.items.length === 0} empty={null}>
            {(page) => (
              <Rail>
                {page.items.map((p) => (
                  <ProductCard key={p.id} product={p} width={180} />
                ))}
              </Rail>
            )}
          </QueryView>
        </View>

        <View>
          <SectionHeader
            eyebrow={t("Recorded courses")}
            title={t("Learn at your own pace")}
            action={{ label: t("View all"), onPress: () => navigation.navigate("Tabs", { screen: "LearnTab" }) }}
          />
          <QueryView query={courses} empty={null}>
            {(list) => (
              <Rail>
                {list.map((c) => (
                  <CourseCard key={c.id} course={c} width={CARD_WIDTH} />
                ))}
              </Rail>
            )}
          </QueryView>
        </View>

        <View>
          <SectionHeader eyebrow={t("FAQ")} title={t("Questions, answered")} />
          <QueryView query={faqs} empty={null}>
            {(list) => (
              <View style={styles.faqs}>
                {list.map((f) => (
                  <Faq key={f.id} question={f.question} answer={f.answer} />
                ))}
              </View>
            )}
          </QueryView>
        </View>

        <View style={styles.cta}>
          <Text variant="h2" style={styles.ctaText}>
            {blocks.text("home.cta.title")}
          </Text>
          <Text style={[styles.ctaText, { opacity: 0.9 }]}>{blocks.text("home.cta.body")}</Text>
          <Pressable onPress={() => navigation.navigate("Booking")} accessibilityRole="button" style={styles.ctaButton}>
            <Icon name="calendar-outline" size={18} />
            <Text variant="label" style={{ color: theme.color.primary }}>
              {t("Book an Appointment")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 420,
    paddingHorizontal: 20,
    paddingBottom: 28,
    justifyContent: "space-between",
    backgroundColor: "#1f2c24",
  },
  heroImage: { resizeMode: "cover" },
  heroShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(22, 32, 26, 0.55)" },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  brand: { color: "#fbfaf5", fontWeight: "700", fontSize: 17, flexShrink: 1 },
  heroCopy: { gap: 12, marginTop: 40 },
  heroTitle: { color: "#fbfaf5" },
  heroSubtitle: { color: "#e6ebe1", fontSize: 16, lineHeight: 24 },
  content: { padding: 16, gap: 28 },
  quickRow: { flexDirection: "row", gap: 8 },
  quick: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.color.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { textAlign: "center", color: theme.color.text, fontWeight: "600" },
  rail: { gap: 12, paddingRight: 16 },
  faqs: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.color.borderStrong },
  faq: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.borderStrong,
    paddingVertical: 4,
    gap: 8,
    paddingBottom: 8,
  },
  faqHead: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52 },
  cta: { backgroundColor: theme.color.primary, borderRadius: theme.radius.xl, padding: 22, gap: 12 },
  ctaText: { color: theme.color.onPrimary },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: theme.color.bg,
    paddingHorizontal: 18,
    minHeight: 48,
    borderRadius: theme.radius.pill,
  },
});
