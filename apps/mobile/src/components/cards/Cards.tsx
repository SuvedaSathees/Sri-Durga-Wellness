/** Catalogue cards shared by the home screen and the list screens. Each card is one button. */
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFormat, useT } from "@sdw/controllers";
import {
  accessPeriod,
  BATCH_CLOSED_LABEL,
  discountPercent,
  LEVEL_LABEL,
  SERVICE_MODE_LABEL,
  STOCK_STATUS,
  type CourseSummary,
  type LiveClassSummary,
  type ProductSummary,
  type Service,
} from "@sdw/core";
import type { RootNavigation } from "../../navigation/types";
import { theme } from "../../theme";
import { Badge, Card, Icon, MediaImage, SERVICE_ICONS, Text } from "../ui";

export function ServiceCard({ service, width }: { service: Service; width?: number }) {
  const t = useT();
  const f = useFormat();
  const navigation = useNavigation<RootNavigation>();
  const meta = [
    f.duration(service.durationMinutes),
    t(SERVICE_MODE_LABEL[service.mode]),
    service.price !== null ? f.price(service.price) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Card
      onPress={() => navigation.navigate("ServiceDetail", { slug: service.slug })}
      accessibilityLabel={`${service.name}. ${meta}`}
      style={width ? { width } : null}
    >
      <View style={styles.gap}>
        <View style={styles.icon}>
          <Icon name={SERVICE_ICONS[service.icon ?? ""] ?? "leaf-outline"} size={22} />
        </View>
        <Text variant="h3">{service.name}</Text>
        <Text variant="small" numberOfLines={3}>
          {service.summary}
        </Text>
        <Text variant="caption">{meta}</Text>
      </View>
    </Card>
  );
}

export function ClassCard({ item, width }: { item: LiveClassSummary; width?: number }) {
  const t = useT();
  const f = useFormat();
  const navigation = useNavigation<RootNavigation>();
  const batch = item.nextBatch;
  const when = batch ? t("Starts {date}", { date: f.date(batch.startsAt) }) : t("New dates coming soon");
  const closed = batch && !batch.isOpen ? t(BATCH_CLOSED_LABEL[batch.closedReason ?? "CLOSED"]) : null;
  return (
    <Card
      padded={false}
      onPress={() => navigation.navigate("ClassDetail", { slug: item.slug })}
      accessibilityLabel={`${item.title}. ${f.classFee(item.fee, item.feeType)}. ${when}`}
      style={width ? { width } : null}
    >
      <MediaImage image={item.image} fallback="class-default.webp" ratio={16 / 9} radius={0} />
      <View style={[styles.body, styles.gap]}>
        <View style={styles.badges}>
          <Badge>{t(LEVEL_LABEL[item.level])}</Badge>
          <Badge tone={item.fee === 0 ? "success" : "neutral"}>{f.classFee(item.fee, item.feeType)}</Badge>
        </View>
        <Text variant="h3">{item.title}</Text>
        <Text variant="small" numberOfLines={2}>
          {item.summary}
        </Text>
        <Text variant="caption">{closed ? `${when} · ${closed}` : when}</Text>
      </View>
    </Card>
  );
}

export function ProductCard({ product, width }: { product: ProductSummary; width?: number }) {
  const t = useT();
  const f = useFormat();
  const navigation = useNavigation<RootNavigation>();
  const off = discountPercent(product.price, product.mrp);
  const stock = STOCK_STATUS[product.stockStatus];
  return (
    <Card
      padded={false}
      onPress={() => navigation.navigate("Product", { slug: product.slug })}
      accessibilityLabel={`${product.name}. ${f.price(product.price)}. ${t(stock.label)}`}
      style={width ? { width } : { flex: 1 }}
    >
      <MediaImage image={product.image} fallback="product-default.webp" ratio={1} radius={0} />
      <View style={[styles.body, { gap: 4 }]}>
        <Text variant="label" numberOfLines={2}>
          {product.name}
        </Text>
        {product.size ? <Text variant="caption">{product.size}</Text> : null}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{f.price(product.price)}</Text>
          {product.mrp && off ? (
            <Text variant="caption" style={styles.mrp}>
              {f.price(product.mrp)}
            </Text>
          ) : null}
        </View>
        {product.stockStatus !== "IN_STOCK" ? (
          <Badge tone={stock.tone}>{t(stock.label)}</Badge>
        ) : off ? (
          <Badge tone="success">{t("{percent}% off", { percent: off })}</Badge>
        ) : null}
      </View>
    </Card>
  );
}

export function CourseCard({ course, width }: { course: CourseSummary; width?: number }) {
  const t = useT();
  const f = useFormat();
  const navigation = useNavigation<RootNavigation>();
  const lessons = course.lessonCount === 1 ? t("1 lesson") : t("{count} lessons", { count: course.lessonCount });
  const period = accessPeriod(course.accessDays);
  const access = t(period.label, period.vars);
  return (
    <Card
      padded={false}
      onPress={() => navigation.navigate("CourseDetail", { slug: course.slug })}
      accessibilityLabel={`${course.title}. ${lessons}. ${access}. ${f.fee(course.price)}`}
      style={width ? { width } : null}
    >
      <MediaImage image={course.cover} fallback="course-default.webp" ratio={16 / 9} radius={0} />
      <View style={[styles.body, styles.gap]}>
        {course.category ? <Badge>{course.category}</Badge> : null}
        <Text variant="h3">{course.title}</Text>
        <Text variant="small" numberOfLines={2}>
          {course.summary}
        </Text>
        <Text variant="caption">
          {lessons} · {access} · {f.fee(course.price)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 8 },
  body: { padding: 14 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.color.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  price: { fontWeight: "700" },
  mrp: { textDecorationLine: "line-through" },
});
