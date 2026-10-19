import { useEffect } from "react";
import { View } from "react-native";
import { useFormat, useMyOrder, useT } from "@sdw/controllers";
import { FULFILMENT_LABEL, ORDER_STATUS, PAYMENT_STATUS } from "@sdw/core";
import {
  AuthGate,
  Badge,
  Button,
  Card,
  Facts,
  MediaImage,
  Notice,
  QueryView,
  Screen,
  Stack,
  Text,
} from "../../../components/ui";
import type { RootScreenProps } from "../../../navigation/types";

function Content({ reference, navigation }: { reference: string; navigation: RootScreenProps<"Order">["navigation"] }) {
  const t = useT();
  const f = useFormat();
  const order = useMyOrder(reference);

  useEffect(() => {
    navigation.setOptions({ title: t("Order {reference}", { reference }) });
  }, [navigation, reference, t]);

  return (
    <Screen onRefresh={() => order.refetch()}>
      <QueryView query={order}>
        {(o) => {
          const s = ORDER_STATUS[o.status];
          const p = o.payment;
          const payable = p && (p.status === "AWAITING_PAYMENT" || p.status === "REJECTED") && p.upi !== null;
          return (
            <Stack>
              <Badge tone={s.tone}>{t(s.label)}</Badge>
              {s.description ? <Text variant="small">{t(s.description)}</Text> : null}
              {payable ? (
                <Notice
                  tone={p.status === "REJECTED" ? "danger" : "warning"}
                  title={p.status === "REJECTED" ? t("We couldn't verify your payment") : t("Payment pending")}
                  action={
                    <Button size="sm" onPress={() => navigation.navigate("Payment", { paymentId: p.id })}>
                      {p.status === "REJECTED" ? t("Review and resubmit") : t("Pay now")}
                    </Button>
                  }
                >
                  {p.status === "REJECTED" && p.rejectionReason
                    ? t("Reason: {reason}", { reason: p.rejectionReason })
                    : o.paymentDueAt
                      ? t("Please complete payment by {date}.", { date: f.dateTime(o.paymentDueAt) })
                      : t("Please complete your payment.")}
                </Notice>
              ) : null}
              <Card>
                <Facts
                  items={[
                    { label: t("Placed"), value: f.dateTime(o.createdAt) },
                    { label: t("Fulfilment"), value: t(FULFILMENT_LABEL[o.fulfilment]) },
                    o.pickupBranch
                      ? { label: t("Pickup"), value: `${o.pickupBranch.name}, ${o.pickupBranch.city}` }
                      : false,
                    o.address
                      ? {
                          label: t("Delivery address"),
                          value: [o.address.line1, o.address.line2, o.address.city, o.address.pincode]
                            .filter(Boolean)
                            .join(", "),
                        }
                      : false,
                    p ? { label: t("Payment"), value: t(PAYMENT_STATUS[p.status].label) } : false,
                    o.trackingInfo ? { label: t("Tracking"), value: o.trackingInfo } : false,
                  ]}
                />
              </Card>
              <Text variant="h3">{t("Items in this order")}</Text>
              <Card>
                <Stack gap={14}>
                  {o.items.map((item) => (
                    <View key={item.productId} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                      <View style={{ width: 56 }}>
                        <MediaImage image={item.image} fallback="product-default.webp" ratio={1} radius={10} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="label">{item.name}</Text>
                        <Text variant="small">
                          {[item.size, `${f.price(item.unitPrice)} × ${item.quantity}`].filter(Boolean).join(" · ")}
                        </Text>
                      </View>
                      <Text style={{ fontWeight: "700" }}>{f.price(item.lineTotal)}</Text>
                    </View>
                  ))}
                  <Facts
                    items={[
                      { label: t("Subtotal"), value: f.price(o.subtotal) },
                      { label: t("Delivery"), value: o.deliveryFee ? f.price(o.deliveryFee) : t("Free") },
                      { label: t("Total"), value: f.price(o.total) },
                    ]}
                  />
                </Stack>
              </Card>
              {o.events.length > 0 ? (
                <>
                  <Text variant="h3">{t("Progress")}</Text>
                  <Card>
                    <Stack gap={10}>
                      {[...o.events].reverse().map((e, i) => (
                        <Text key={`${e.at}-${i}`} variant="small">
                          {t(ORDER_STATUS[e.status].label)} · {f.dateTime(e.at)}
                          {e.note ? ` · ${t(e.note)}` : ""}
                        </Text>
                      ))}
                    </Stack>
                  </Card>
                </>
              ) : null}
            </Stack>
          );
        }}
      </QueryView>
    </Screen>
  );
}

export function OrderScreen({ route, navigation }: RootScreenProps<"Order">) {
  return (
    <AuthGate>
      <Content reference={route.params.reference} navigation={navigation} />
    </AuthGate>
  );
}
