/** Checkout (signed-in only): pickup or delivery, contact and address, then on to UPI payment. */
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCart, useCartQuote, useForm, useFormat, usePlaceOrder, useSession, useSite, useT } from "@sdw/controllers";
import { checkoutSchema, INDIAN_STATES, isApiError, type CheckoutInput, type FulfilmentMethod } from "@sdw/core";
import {
  AuthGate,
  Button,
  Card,
  ChoiceGroup,
  SelectField,
  EmptyView,
  FormError,
  LoadingView,
  Notice,
  Screen,
  Stack,
  Text,
  TextField,
} from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";

type Values = {
  fulfilment: FulfilmentMethod;
  pickupBranchId: string;
  contact: { name: string; email: string; phone: string };
  address: { line1: string; line2: string; landmark: string; city: string; state: string; pincode: string };
  notes: string;
};

function CheckoutForm() {
  const t = useT();
  const f = useFormat();
  const navigation = useNavigation<RootNavigation>();
  const { user } = useSession();
  const site = useSite();
  const { lines } = useCart();
  const place = usePlaceOrder();

  const branches = useMemo(() => site.data?.branches.filter((b) => b.isPickupPoint) ?? [], [site.data]);
  const canPickup = !!site.data?.features.clinicPickup && branches.length > 0;
  const canDeliver = !!site.data?.features.homeDelivery;

  const form = useForm(checkoutSchema, {
    fulfilment: "PICKUP",
    pickupBranchId: "",
    contact: { name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" },
    address: { line1: "", line2: "", landmark: "", city: "", state: "", pincode: "" },
    notes: "",
  } as CheckoutInput);
  const v = form.values as Values;
  const [touched, setTouched] = useState(false);
  const fulfilment: FulfilmentMethod = touched ? v.fulfilment : canPickup ? "PICKUP" : "DELIVERY";
  const branchId = v.pickupBranchId || (branches.length === 1 ? branches[0]!.id : "");
  const quote = useCartQuote(fulfilment);
  const { setField } = form;

  useEffect(() => {
    if (v.fulfilment !== fulfilment) setField("fulfilment", fulfilment);
  }, [fulfilment, v.fulfilment, setField]);
  useEffect(() => {
    if (v.pickupBranchId !== branchId) setField("pickupBranchId", branchId);
  }, [branchId, v.pickupBranchId, setField]);

  if (site.isPending || place.isSuccess) return <LoadingView />;
  if (lines.length === 0)
    return (
      <EmptyView
        icon="cart-outline"
        title={t("Your cart is empty")}
        action={
          <Button onPress={() => navigation.navigate("Tabs", { screen: "ShopTab" })}>{t("Visit the shop")}</Button>
        }
      />
    );

  const paymentsOn = !!site.data?.features.upiPayments;
  const problems = quote.data?.problems.length ?? 0;
  const outOfStock = isApiError(place.error) && place.error.code === "OUT_OF_STOCK";
  const options = [
    ...(canPickup
      ? [{ value: "PICKUP" as const, label: t("Clinic pickup"), description: t("Collect from the clinic — free") }]
      : []),
    ...(canDeliver
      ? [
          {
            value: "DELIVERY" as const,
            label: site.data?.shop.deliversAllIndia ? t("Home delivery anywhere in India") : t("Home delivery"),
            description:
              site.data?.shop.freeDeliveryFrom != null
                ? t("{fee}, free on orders of {threshold} or more", {
                    fee: f.price(site.data.shop.deliveryFee),
                    threshold: f.price(site.data.shop.freeDeliveryFrom),
                  })
                : f.price(site.data?.shop.deliveryFee ?? 0),
          },
        ]
      : []),
  ];

  const submit = form.handleSubmit(async (data) => {
    const result = await place.mutateAsync(
      data.fulfilment === "PICKUP"
        ? { fulfilment: "PICKUP", pickupBranchId: data.pickupBranchId, contact: data.contact, notes: data.notes }
        : { fulfilment: "DELIVERY", address: data.address, contact: data.contact, notes: data.notes },
    );
    navigation.replace("Payment", { paymentId: result.payment.id });
  });

  const field = (path: string, value: string, label: string, props: Partial<ComponentProps<typeof TextField>> = {}) => (
    <TextField
      label={label}
      value={value}
      onChangeText={(x) => setField(path, x)}
      error={form.errorFor(path)}
      {...props}
    />
  );

  const footer = (
    <View style={{ gap: 8 }}>
      {quote.data ? (
        <View style={styles.row}>
          <Text variant="label">{t("Total")}</Text>
          <Text variant="label">{f.price(quote.data.total)}</Text>
        </View>
      ) : null}
      <Button
        fullWidth
        loading={form.submitting}
        disabled={!paymentsOn || problems > 0 || options.length === 0}
        onPress={() => void submit()}
      >
        {t("Place order and pay")}
      </Button>
    </View>
  );

  return (
    <Screen keyboard footer={footer}>
      {!paymentsOn ? (
        <Notice tone="warning" title={t("Online payment isn't available yet")}>
          {t(
            "The clinic hasn't set up UPI payments yet, so orders can't be placed online. Please contact the clinic to order.",
          )}
        </Notice>
      ) : null}
      {outOfStock ? (
        <Notice
          tone="warning"
          action={
            <Button size="sm" variant="secondary" onPress={() => navigation.navigate("Cart")}>
              {t("Review my cart")}
            </Button>
          }
        >
          {t("Some items are no longer available in that quantity. Please review your cart.")}
        </Notice>
      ) : (
        <FormError message={form.formError} />
      )}
      {problems > 0 ? <Notice tone="warning">{t("Update your cart before checking out.")}</Notice> : null}

      <Card>
        <Stack gap={14}>
          <Text variant="h3">{t("How would you like to receive your order?")}</Text>
          {options.length === 0 ? (
            <Notice tone="warning">
              {t("Pickup and delivery aren't available right now. Please contact the clinic.")}
            </Notice>
          ) : (
            <ChoiceGroup
              label={t("Pickup or delivery")}
              value={fulfilment}
              onChange={(x) => {
                setTouched(true);
                setField("fulfilment", x);
              }}
              options={options}
              error={form.errorFor("fulfilment")}
            />
          )}
          {fulfilment === "PICKUP" && branches.length > 1 ? (
            <ChoiceGroup
              label={t("Pickup branch")}
              value={branchId}
              onChange={(x) => setField("pickupBranchId", x)}
              options={branches.map((b) => ({
                value: b.id,
                label: b.name,
                description: [b.addressLine, b.city].filter(Boolean).join(", "),
              }))}
              error={form.errorFor("pickupBranchId")}
            />
          ) : fulfilment === "PICKUP" && branches[0] ? (
            <Text variant="small">
              {t("Pickup from {branch}, {address}", {
                branch: branches[0].name,
                address: [branches[0].addressLine, branches[0].city].filter(Boolean).join(", "),
              })}
            </Text>
          ) : null}
        </Stack>
      </Card>

      <Card>
        <Stack gap={14}>
          <Text variant="h3">{t("Your details")}</Text>
          {field("contact.name", v.contact.name, t("Full name"), {
            required: true,
            autoComplete: "name",
            textContentType: "name",
          })}
          {field("contact.email", v.contact.email, t("Email"), {
            required: true,
            keyboardType: "email-address",
            autoCapitalize: "none",
            autoComplete: "email",
            textContentType: "emailAddress",
          })}
          {field("contact.phone", v.contact.phone, t("Mobile number"), {
            required: true,
            keyboardType: "phone-pad",
            autoComplete: "tel",
            textContentType: "telephoneNumber",
          })}
        </Stack>
      </Card>

      {fulfilment === "DELIVERY" ? (
        <Card>
          <Stack gap={14}>
            <Text variant="h3">{t("Delivery address")}</Text>
            {site.data?.shop.deliversAllIndia ? (
              <Text variant="small">{t("We deliver to every PIN code in India.")}</Text>
            ) : null}
            {field("address.line1", v.address.line1, t("Address line 1"), {
              required: true,
              autoComplete: "street-address",
              textContentType: "streetAddressLine1",
            })}
            {field("address.line2", v.address.line2, t("Address line 2"), { textContentType: "streetAddressLine2" })}
            {field("address.landmark", v.address.landmark, t("Landmark"))}
            {field("address.city", v.address.city, t("City"), { required: true, textContentType: "addressCity" })}
            <SelectField
              label={t("State / union territory")}
              required
              placeholder={t("Choose your state")}
              value={v.address.state}
              onChange={(x) => setField("address.state", x)}
              options={INDIAN_STATES.map((st) => ({ value: st, label: st }))}
              error={form.errorFor("address.state")}
            />
            <TextField
              label={t("PIN code")}
              required
              keyboardType="number-pad"
              maxLength={6}
              textContentType="postalCode"
              value={v.address.pincode}
              onChangeText={(x) => setField("address.pincode", x.replace(/\D/g, ""))}
              error={form.errorFor("address.pincode")}
            />
          </Stack>
        </Card>
      ) : null}

      <Card>{field("notes", v.notes, t("Notes for the clinic"), { multiline: true })}</Card>

      {quote.data ? (
        <Card>
          <Stack gap={8}>
            <Text variant="h3">{t("Order summary")}</Text>
            {quote.data.lines.map((l) => (
              <View key={l.product.id} style={styles.row}>
                <Text variant="small" style={{ flex: 1 }}>
                  {l.product.name} × {l.quantity}
                </Text>
                <Text variant="small">{f.price(l.lineTotal)}</Text>
              </View>
            ))}
            <View style={styles.row}>
              <Text variant="small">{t("Subtotal")}</Text>
              <Text variant="small">{f.price(quote.data.subtotal)}</Text>
            </View>
            <View style={styles.row}>
              <Text variant="small">{t("Delivery")}</Text>
              <Text variant="small">{quote.data.deliveryFee === 0 ? t("Free") : f.price(quote.data.deliveryFee)}</Text>
            </View>
          </Stack>
        </Card>
      ) : null}
      <Text variant="small">
        {t("You'll pay by UPI on the next page. Your order is confirmed once the clinic has verified your payment.")}
      </Text>
    </Screen>
  );
}

export function CheckoutScreen() {
  const t = useT();
  return (
    <AuthGate reason={t("Sign in to place your order and track it in your account.")}>
      <CheckoutForm />
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
});
