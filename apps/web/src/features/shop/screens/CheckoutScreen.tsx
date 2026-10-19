/**
 * Checkout (signed-in only): pickup or delivery, contact details and address, then the order is
 * placed and the customer goes to the UPI payment page. Totals come from the server quote.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useCart, useCartQuote, useForm, useFormat, usePlaceOrder, useSession, useSite, useT } from "@sdw/controllers";
import { checkoutSchema, INDIAN_STATES, isApiError, type CheckoutInput, type FulfilmentMethod } from "@sdw/core";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  FormError,
  LoadingState,
  Notice,
  PageHeader,
  RadioGroup,
  SelectField,
  TextArea,
  TextField,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "./Shop.module.css";

export function CheckoutScreen() {
  const t = useT();
  const f = useFormat();
  const navigate = useNavigate();
  const { user } = useSession();
  const site = useSite();
  const { lines } = useCart();
  const place = usePlaceOrder();
  const placed = useRef(false);
  useDocumentTitle(t("Checkout"));

  const pickupBranches = useMemo(() => site.data?.branches.filter((b) => b.isPickupPoint) ?? [], [site.data]);
  const canPickup = !!site.data?.features.clinicPickup && pickupBranches.length > 0;
  const canDeliver = !!site.data?.features.homeDelivery;

  const form = useForm(checkoutSchema, {
    fulfilment: "PICKUP",
    pickupBranchId: "",
    contact: { name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" },
    address: { line1: "", line2: "", landmark: "", city: "", state: "", pincode: "" },
    notes: "",
  } as CheckoutInput);
  const values = form.values as {
    fulfilment: FulfilmentMethod;
    pickupBranchId: string;
    contact: { name: string; email: string; phone: string };
    address: { line1: string; line2: string; landmark: string; city: string; state: string; pincode: string };
    notes: string;
  };
  const [fulfilmentTouched, setFulfilmentTouched] = useState(false);
  const fulfilment: FulfilmentMethod = fulfilmentTouched
    ? values.fulfilment
    : canPickup
      ? "PICKUP"
      : canDeliver
        ? "DELIVERY"
        : "PICKUP";
  const branchId = values.pickupBranchId || (pickupBranches.length === 1 ? pickupBranches[0]!.id : "");
  const quote = useCartQuote(fulfilment);
  const { setField } = form;

  // Keep the form in step with the defaults derived from what the clinic offers.
  useEffect(() => {
    if (values.fulfilment !== fulfilment) setField("fulfilment", fulfilment);
  }, [fulfilment, values.fulfilment, setField]);
  useEffect(() => {
    if (values.pickupBranchId !== branchId) setField("pickupBranchId", branchId);
  }, [branchId, values.pickupBranchId, setField]);

  const header = (
    <PageHeader title={t("Checkout")} crumbs={[{ label: t("Your cart"), to: "/cart" }, { label: t("Checkout") }]} />
  );

  if (site.isPending || (lines.length > 0 && quote.isPending) || placed.current || place.isSuccess)
    return (
      <>
        {header}
        <LoadingState />
      </>
    );

  if (lines.length === 0) {
    return (
      <>
        {header}
        <div className="container section">
          <EmptyState
            icon="cart"
            title={t("Your cart is empty")}
            action={<ButtonLink to="/shop">{t("Visit the shop")}</ButtonLink>}
          >
            {t("Browse the shop and add something you'd like.")}
          </EmptyState>
        </div>
      </>
    );
  }

  const paymentsOn = !!site.data?.features.upiPayments;
  const problems = quote.data?.problems.length ?? 0;
  const outOfStock = isApiError(place.error) && place.error.code === "OUT_OF_STOCK";

  const submit = () =>
    form.handleSubmit(async (data) => {
      const result = await place.mutateAsync(
        data.fulfilment === "PICKUP"
          ? { fulfilment: "PICKUP", pickupBranchId: data.pickupBranchId, contact: data.contact, notes: data.notes }
          : { fulfilment: "DELIVERY", address: data.address, contact: data.contact, notes: data.notes },
      );
      placed.current = true;
      navigate(`/pay/${encodeURIComponent(result.payment.id)}`, { replace: true });
    })();

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

  return (
    <>
      {header}
      <section className="section">
        <form
          className={`container ${styles.layout}`}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="stack">
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
                  <ButtonLink to="/cart" variant="secondary" size="sm">
                    {t("Review my cart")}
                  </ButtonLink>
                }
              >
                {t("Some items are no longer available in that quantity. Please review your cart.")}
              </Notice>
            ) : (
              <FormError message={form.formError} />
            )}

            <Card className={styles.formSection}>
              <h2>{t("How would you like to receive your order?")}</h2>
              {options.length === 0 ? (
                <Notice tone="warning">
                  {t("Pickup and delivery aren't available right now. Please contact the clinic.")}
                </Notice>
              ) : (
                <RadioGroup
                  legend={t("Pickup or delivery")}
                  name="fulfilment"
                  value={fulfilment}
                  onChange={(v) => {
                    setFulfilmentTouched(true);
                    form.setField("fulfilment", v);
                  }}
                  options={options}
                  error={form.errorFor("fulfilment")}
                />
              )}
              {fulfilment === "PICKUP" && pickupBranches.length > 1 ? (
                <RadioGroup
                  legend={t("Pickup branch")}
                  name="pickupBranchId"
                  value={branchId}
                  onChange={(v) => form.setField("pickupBranchId", v)}
                  options={pickupBranches.map((b) => ({
                    value: b.id,
                    label: b.name,
                    description: [b.addressLine, b.city].filter(Boolean).join(", "),
                  }))}
                  error={form.errorFor("pickupBranchId")}
                />
              ) : fulfilment === "PICKUP" && pickupBranches[0] ? (
                <p className="muted">
                  {t("Pickup from {branch}, {address}", {
                    branch: pickupBranches[0].name,
                    address: [pickupBranches[0].addressLine, pickupBranches[0].city].filter(Boolean).join(", "),
                  })}
                </p>
              ) : null}
            </Card>

            <Card className={styles.formSection}>
              <h2>{t("Your details")}</h2>
              <div className={styles.formGrid}>
                <TextField
                  label={t("Full name")}
                  required
                  autoComplete="name"
                  value={values.contact.name}
                  onChange={(v) => form.setField("contact.name", v)}
                  error={form.errorFor("contact.name")}
                />
                <TextField
                  label={t("Email")}
                  required
                  type="email"
                  autoComplete="email"
                  value={values.contact.email}
                  onChange={(v) => form.setField("contact.email", v)}
                  error={form.errorFor("contact.email")}
                />
                <TextField
                  label={t("Mobile number")}
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={values.contact.phone}
                  onChange={(v) => form.setField("contact.phone", v)}
                  error={form.errorFor("contact.phone")}
                />
              </div>
            </Card>

            {fulfilment === "DELIVERY" ? (
              <Card className={styles.formSection}>
                <h2>{t("Delivery address")}</h2>
                {site.data?.shop.deliversAllIndia ? (
                  <p className="muted">{t("We deliver to every PIN code in India.")}</p>
                ) : null}
                <div className={styles.formGrid}>
                  <TextField
                    label={t("Address line 1")}
                    required
                    autoComplete="address-line1"
                    value={values.address.line1}
                    onChange={(v) => form.setField("address.line1", v)}
                    error={form.errorFor("address.line1")}
                  />
                  <TextField
                    label={t("Address line 2")}
                    autoComplete="address-line2"
                    value={values.address.line2}
                    onChange={(v) => form.setField("address.line2", v)}
                    error={form.errorFor("address.line2")}
                  />
                  <TextField
                    label={t("Landmark")}
                    value={values.address.landmark}
                    onChange={(v) => form.setField("address.landmark", v)}
                    error={form.errorFor("address.landmark")}
                  />
                  <TextField
                    label={t("City")}
                    required
                    autoComplete="address-level2"
                    value={values.address.city}
                    onChange={(v) => form.setField("address.city", v)}
                    error={form.errorFor("address.city")}
                  />
                  <SelectField
                    label={t("State / union territory")}
                    required
                    autoComplete="address-level1"
                    placeholder={t("Choose your state")}
                    value={values.address.state}
                    onChange={(v) => form.setField("address.state", v)}
                    options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                    error={form.errorFor("address.state")}
                  />
                  <TextField
                    label={t("PIN code")}
                    required
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    value={values.address.pincode}
                    onChange={(v) => form.setField("address.pincode", v.replace(/\D/g, ""))}
                    error={form.errorFor("address.pincode")}
                  />
                </div>
              </Card>
            ) : null}

            <Card className={styles.formSection}>
              <TextArea
                label={t("Notes for the clinic")}
                rows={3}
                value={values.notes}
                onChange={(v) => form.setField("notes", v)}
                error={form.errorFor("notes")}
              />
            </Card>
          </div>

          <Card className={styles.summary}>
            <h2>{t("Order summary")}</h2>
            {quote.data ? (
              <>
                <ul className={styles.miniLines}>
                  {quote.data.lines.map((l) => (
                    <li key={l.product.id}>
                      <span>
                        {l.product.name} × {l.quantity}
                      </span>
                      <span>{f.price(l.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                <dl className={styles.totals}>
                  <div>
                    <dt>{t("Subtotal")}</dt>
                    <dd>{f.price(quote.data.subtotal)}</dd>
                  </div>
                  <div>
                    <dt>{t("Delivery")}</dt>
                    <dd>{quote.data.deliveryFee === 0 ? t("Free") : f.price(quote.data.deliveryFee)}</dd>
                  </div>
                  <div className={styles.grand}>
                    <dt>{t("Total")}</dt>
                    <dd>{f.price(quote.data.total)}</dd>
                  </div>
                </dl>
              </>
            ) : null}
            {problems > 0 ? (
              <Notice tone="warning" action={<Link to="/cart">{t("Review my cart")}</Link>}>
                {t("Update your cart before checking out.")}
              </Notice>
            ) : null}
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={form.submitting}
              disabled={!paymentsOn || problems > 0 || options.length === 0}
            >
              {t("Place order and pay")}
            </Button>
            <p className="muted">
              {t(
                "You'll pay by UPI on the next page. Your order is confirmed once the clinic has verified your payment.",
              )}
            </p>
          </Card>
        </form>
      </section>
    </>
  );
}
