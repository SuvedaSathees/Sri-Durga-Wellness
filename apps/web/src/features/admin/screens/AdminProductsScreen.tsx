import { Link } from "react-router";
import { useAdminProducts, useFormat, useT } from "@sdw/controllers";
import { Badge, ButtonLink, EmptyState, LoadingState, QueryState } from "../../../components/ui";
import { AccountPanel } from "../../account/components/AccountPanel";
import accountStyles from "../../account/components/Account.module.css";
import { VisibilityBadges } from "../components/AdminUi";

export function AdminProductsScreen() {
  const t = useT();
  const f = useFormat();
  const products = useAdminProducts();
  return (
    <AccountPanel
      title={t("Products")}
      action={
        <ButtonLink to="/admin/products/new" size="sm" icon="plus">
          {t("Add a product")}
        </ButtonLink>
      }
    >
      <QueryState
        query={products}
        loading={<LoadingState />}
        empty={<EmptyState icon="leaf" title={t("No products yet")} />}
      >
        {(list) => (
          <ul className={accountStyles.list}>
            {list.map((p) => (
              <li key={p.id} className={accountStyles.item}>
                <div className={accountStyles.itemMain}>
                  <Link to={`/admin/products/${p.id}`} className={accountStyles.itemTitle}>
                    {p.name}
                  </Link>
                  <span className={accountStyles.itemMeta}>
                    {[p.categoryName, p.size, f.price(p.price)].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <div className={accountStyles.itemSide}>
                  <VisibilityBadges isPublished={p.isPublished} isSample={p.isSample} />
                  {p.stock === 0 ? (
                    <Badge tone="danger">{t("Out of stock")}</Badge>
                  ) : p.stock <= 5 ? (
                    <Badge tone="warning">{t("{count} left", { count: p.stock })}</Badge>
                  ) : (
                    <span className={accountStyles.itemMeta}>{t("{count} in stock", { count: p.stock })}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </AccountPanel>
  );
}
