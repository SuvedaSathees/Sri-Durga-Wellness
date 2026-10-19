/**
 * Cart: the device holds only product ids and quantities; prices, stock and totals shown here
 * come from the server quote, so they can't be stale or tampered with.
 */
import { Link } from "react-router";
import { useCart, useCartQuote, useFormat, useSite, useT } from "@sdw/controllers";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MediaImage,
  Notice,
  PageHeader,
  QuantityStepper,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "./Shop.module.css";

export function CartScreen() {
  const t = useT();
  const f = useFormat();
  const { lines, setQuantity, remove, applyProblems } = useCart();
  const quote = useCartQuote("PICKUP");
  const site = useSite().data;
  useDocumentTitle(t("Your cart"));

  const header = (
    <PageHeader title={t("Your cart")} crumbs={[{ label: t("Shop"), to: "/shop" }, { label: t("Your cart") }]} />
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

  return (
    <>
      {header}
      <section className="section">
        <div className="container">
          {quote.isPending ? (
            <LoadingState />
          ) : quote.isError || !quote.data ? (
            <ErrorState error={quote.error} onRetry={() => void quote.refetch()} />
          ) : (
            <div className={styles.layout}>
              <div className="stack">
                {quote.data.problems.length > 0 ? (
                  <Notice
                    tone="warning"
                    title={t("Some items have changed")}
                    action={
                      <Button size="sm" variant="secondary" onClick={() => applyProblems(quote.data.problems)}>
                        {t("Update my cart")}
                      </Button>
                    }
                  >
                    {t(
                      "We can't supply everything in your cart right now. Update your cart to continue with what's available.",
                    )}
                  </Notice>
                ) : null}
                <ul className={styles.lines} aria-label={t("Items in your cart")}>
                  {quote.data.lines.map((line) => (
                    <li key={line.product.id}>
                      <Card>
                        <div className={styles.line}>
                          <div className={styles.lineThumb}>
                            <MediaImage
                              image={line.product.image}
                              fallback="/images/placeholders/product-default.webp"
                              ratio="1 / 1"
                            />
                          </div>
                          <div className={styles.lineBody}>
                            <div className={styles.lineTop}>
                              <span>
                                <Link to={`/shop/${line.product.slug}`} className={styles.lineName}>
                                  {line.product.name}
                                </Link>
                                {line.product.size ? <span className="muted"> · {line.product.size}</span> : null}
                              </span>
                              <strong className={styles.lineTotal}>{f.price(line.lineTotal)}</strong>
                            </div>
                            <span className="muted">{t("{price} each", { price: f.price(line.unitPrice) })}</span>
                            <div className={styles.lineActions}>
                              <QuantityStepper
                                value={line.quantity}
                                max={Math.max(line.quantity, line.product.maxQuantity)}
                                onChange={(n) => setQuantity(line.product.id, Math.max(1, n), line.product.maxQuantity)}
                                label={t("Quantity of {name}", { name: line.product.name })}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(line.product.id)}
                                aria-label={t("Remove {name}", { name: line.product.name })}
                              >
                                {t("Remove")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>

              <Card className={styles.summary}>
                <h2>{t("Order summary")}</h2>
                <dl className={styles.totals}>
                  <div>
                    <dt>{t("Subtotal")}</dt>
                    <dd>{f.price(quote.data.subtotal)}</dd>
                  </div>
                </dl>
                <p className="muted">
                  {site?.shop.freeDeliveryFrom
                    ? t("Clinic pickup is free. Home delivery is {fee}, free on orders of {threshold} or more.", {
                        fee: f.price(site.shop.deliveryFee),
                        threshold: f.price(site.shop.freeDeliveryFrom),
                      })
                    : t("Delivery charges, if any, are shown at checkout.")}
                </p>
                {quote.data.problems.length > 0 ? (
                  <Button fullWidth size="lg" disabled>
                    {t("Checkout")}
                  </Button>
                ) : (
                  <ButtonLink to="/checkout" fullWidth size="lg" iconAfter="arrowRight">
                    {t("Checkout")}
                  </ButtonLink>
                )}
                {quote.data.problems.length > 0 ? (
                  <p className="muted">{t("Update your cart before checking out.")}</p>
                ) : null}
                <ButtonLink to="/shop" variant="ghost" fullWidth>
                  {t("Continue shopping")}
                </ButtonLink>
              </Card>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
