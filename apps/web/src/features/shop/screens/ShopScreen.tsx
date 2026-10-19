/** Shop: categories and sort live in the URL (?category=&sort=&page=) so every view is shareable. */
import { Link, useSearchParams } from "react-router";
import { useCategories, useProducts, useSite, useT } from "@sdw/controllers";
import type { ProductSort } from "@sdw/core";
import { ProductCard } from "../../../components/cards/Cards";
import {
  EmptyState,
  LoadingCards,
  PageHeader,
  Pagination,
  QueryState,
  SelectField,
  ButtonLink,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "./Shop.module.css";

const SORTS: ProductSort[] = ["featured", "price-asc", "price-desc", "name"];
const SORT_LABEL: Record<ProductSort, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name",
  newest: "Newest",
};
const PAGE_SIZE = 12;

export function ShopScreen() {
  const t = useT();
  const site = useSite();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "";
  const sortParam = params.get("sort") as ProductSort | null;
  const sort: ProductSort = sortParam && SORTS.includes(sortParam) ? sortParam : "featured";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const categories = useCategories();
  const products = useProducts({ category: category || undefined, sort, page, pageSize: PAGE_SIZE });
  useDocumentTitle(t("Shop"));

  const href = (next: { category?: string; sort?: string; page?: number }) => {
    const q = new URLSearchParams();
    const c = next.category ?? category;
    const s = next.sort ?? sort;
    const p = next.page ?? 1;
    if (c) q.set("category", c);
    if (s !== "featured") q.set("sort", s);
    if (p > 1) q.set("page", String(p));
    const str = q.toString();
    return `/shop${str ? `?${str}` : ""}`;
  };

  return (
    <>
      <PageHeader
        eyebrow={t("Wellness shop")}
        title={t("Thoughtfully chosen essentials")}
        intro={
          site.data?.shop.deliversAllIndia
            ? t("Products selected by our team, delivered anywhere in India or ready for clinic pickup.")
            : t("Products selected by our team, available for clinic pickup or home delivery.")
        }
        crumbs={[{ label: t("Shop") }]}
      />
      <section className="section">
        <div className="container stack">
          <div className={styles.toolbar}>
            <nav aria-label={t("Product categories")} className={styles.chips}>
              <Link to={href({ category: "" })} className={styles.chip} aria-current={!category ? "page" : undefined}>
                {t("All products")}
              </Link>
              {categories.data?.map((c) => (
                <Link
                  key={c.id}
                  to={href({ category: c.slug })}
                  className={styles.chip}
                  aria-current={category === c.slug ? "page" : undefined}
                >
                  {c.name}
                </Link>
              ))}
            </nav>
            <div className={styles.sort}>
              <SelectField
                label={t("Sort by")}
                required
                value={sort}
                onChange={(v) => {
                  const q = new URLSearchParams(params);
                  if (v === "featured") q.delete("sort");
                  else q.set("sort", v);
                  q.delete("page");
                  setParams(q);
                }}
                options={SORTS.map((s) => ({ value: s, label: t(SORT_LABEL[s]) }))}
              />
            </div>
          </div>

          <QueryState
            query={products}
            loading={<LoadingCards count={6} />}
            isEmpty={(p) => p.items.length === 0}
            empty={
              <EmptyState
                icon="leaf"
                title={t("No products here yet")}
                action={
                  <ButtonLink to="/shop" variant="secondary">
                    {t("See all products")}
                  </ButtonLink>
                }
              >
                {t("Try another category, or check back soon.")}
              </EmptyState>
            }
          >
            {(result) => (
              <>
                <p className="muted" aria-live="polite">
                  {result.total === 1 ? t("1 product") : t("{count} products", { count: result.total })}
                </p>
                <div className={styles.grid}>
                  {result.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                <Pagination
                  page={result.page}
                  pageSize={result.pageSize}
                  total={result.total}
                  hrefFor={(p) => href({ page: p })}
                />
              </>
            )}
          </QueryState>
        </div>
      </section>
    </>
  );
}
