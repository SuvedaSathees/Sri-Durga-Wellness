/** Product detail: price, stock, quantity and add-to-cart. Stock limits come from the API. */
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useCart, useFormat, useProduct, useT } from "@sdw/controllers";
import { discountPercent, STOCK_STATUS } from "@sdw/core";
import {
  Badge,
  Breadcrumbs,
  Button,
  ButtonLink,
  Icon,
  Markdown,
  MediaImage,
  LoadingState,
  Notice,
  QuantityStepper,
  QueryState,
  useToast,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "./Shop.module.css";

export function ProductScreen() {
  const { slug = "" } = useParams();
  const t = useT();
  const f = useFormat();
  const product = useProduct(slug);
  const { lines, add } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  useDocumentTitle(product.data?.name ?? t("Shop"));

  useEffect(() => setQty(1), [slug]);

  return (
    <QueryState query={product} loading={<LoadingState />}>
      {(p) => {
        const inCart = lines.find((l) => l.productId === p.id)?.quantity ?? 0;
        const room = Math.max(0, p.maxQuantity - inCart);
        const off = discountPercent(p.price, p.mrp);
        const stock = STOCK_STATUS[p.stockStatus];
        const image = p.images[0] ?? p.image;
        return (
          <>
            <div className="container" style={{ paddingTop: "1.5rem" }}>
              <PageHeaderCrumbs name={p.name} category={p.category?.name} categorySlug={p.category?.slug} />
            </div>
            <section className="section" style={{ paddingTop: "1rem" }}>
              <div className={`container ${styles.product}`}>
                <div className={styles.gallery}>
                  <MediaImage
                    image={image}
                    fallback="/images/placeholders/product-default.webp"
                    ratio="1 / 1"
                    priority
                  />
                </div>
                <div className={styles.info}>
                  {p.category ? <span className={styles.kicker}>{p.category.name}</span> : null}
                  <h1>{p.name}</h1>
                  {p.size ? <p className="muted">{p.size}</p> : null}
                  <div className={styles.priceRow}>
                    <span className={styles.price}>{f.price(p.price)}</span>
                    {p.mrp && off ? (
                      <>
                        <s className="muted">
                          <span className="visually-hidden">{t("MRP")} </span>
                          {f.price(p.mrp)}
                        </s>
                        <Badge tone="success">{t("{percent}% off", { percent: off })}</Badge>
                      </>
                    ) : null}
                  </div>
                  <p className="lead">{p.shortDescription}</p>
                  <div>
                    <Badge tone={stock.tone}>{t(stock.label)}</Badge>
                  </div>

                  {p.stockStatus === "OUT_OF_STOCK" ? (
                    <Notice tone="neutral">
                      {t("This product is out of stock at the moment. Please check back soon.")}
                    </Notice>
                  ) : room === 0 ? (
                    <Notice
                      tone="info"
                      action={
                        <ButtonLink to="/cart" variant="secondary" size="sm">
                          {t("View cart")}
                        </ButtonLink>
                      }
                    >
                      {t("You already have the most we can supply right now in your cart.")}
                    </Notice>
                  ) : (
                    <div className={styles.buy}>
                      <QuantityStepper
                        value={Math.min(qty, room)}
                        max={room}
                        onChange={(n) => setQty(Math.max(1, Math.min(n, room)))}
                        label={t("Quantity")}
                      />
                      <Button
                        icon="cart"
                        size="lg"
                        onClick={() => {
                          add(p.id, Math.min(qty, room), p.maxQuantity);
                          toast(t("Added to cart: {name}", { name: p.name }));
                          setQty(1);
                        }}
                      >
                        {t("Add to cart")}
                      </Button>
                    </div>
                  )}
                  {inCart > 0 ? (
                    <p className="muted">
                      {t("In your cart: {count}", { count: inCart })}{" "}
                      <ButtonLink to="/cart" variant="ghost" size="sm" iconAfter="arrowRight">
                        {t("View cart")}
                      </ButtonLink>
                    </p>
                  ) : null}
                  <ul className={styles.ticks}>
                    <li>
                      <Icon name="mapPin" size={16} /> {t("Free pickup at the clinic")}
                    </li>
                    <li>
                      <Icon name="leaf" size={16} /> {t("Home delivery available at checkout")}
                    </li>
                  </ul>

                  <div className={styles.details}>
                    <div>
                      <h2>{t("About this product")}</h2>
                      <Markdown text={p.description} />
                    </div>
                    {p.benefits.length ? (
                      <div>
                        <h2>{t("Highlights")}</h2>
                        <ul className={styles.ticks}>
                          {p.benefits.map((b) => (
                            <li key={b}>
                              <Icon name="check" size={16} /> {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {p.ingredients ? (
                      <div>
                        <h2>{t("Ingredients")}</h2>
                        <p>{p.ingredients}</p>
                      </div>
                    ) : null}
                    {p.usage ? (
                      <div>
                        <h2>{t("How to use")}</h2>
                        <p>{p.usage}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          </>
        );
      }}
    </QueryState>
  );
}

function PageHeaderCrumbs({
  name,
  category,
  categorySlug,
}: {
  name: string;
  category?: string;
  categorySlug?: string;
}) {
  const t = useT();
  const crumbs = [
    { label: t("Shop"), to: "/shop" },
    ...(category && categorySlug ? [{ label: category, to: `/shop?category=${categorySlug}` }] : []),
    { label: name },
  ];
  return <Breadcrumbs items={crumbs} />;
}
