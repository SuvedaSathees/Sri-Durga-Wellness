import { Link, useNavigate, useParams } from "react-router";
import { useAdminProduct, useCategories, useForm, useSaveProduct, useT } from "@sdw/controllers";
import { productFormSchema, rupeesText, type AdminProduct } from "@sdw/core";
import {
  Button,
  CheckboxField,
  FormError,
  LoadingState,
  QueryState,
  SelectField,
  TextField,
  useToast,
} from "../../../components/ui";
import { AccountPanel } from "../../account/components/AccountPanel";
import { BilingualField, bilingualValue, VisibilityBadges } from "../components/AdminUi";
import styles from "../components/Admin.module.css";

function ProductForm({ initial }: { initial: AdminProduct | null }) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const categories = useCategories();
  const save = useSaveProduct(initial?.id);
  const form = useForm(productFormSchema, {
    name: bilingualValue(initial?.name),
    categoryId: initial?.categoryId ?? "",
    size: initial?.size ?? "",
    price: rupeesText(initial?.price ?? null),
    mrp: rupeesText(initial?.mrp ?? null),
    stock: String(initial?.stock ?? 0),
    isFeatured: initial?.isFeatured ?? false,
    isPublished: initial?.isPublished ?? true,
    shortDescription: bilingualValue(initial?.shortDescription),
    description: bilingualValue(initial?.description),
  });
  const v = form.values;
  const submit = form.handleSubmit(async (body) => {
    const saved = await save.mutateAsync(body);
    toast(initial ? t("Changes saved") : t("Product added"));
    if (!initial) navigate(`/admin/products/${saved.id}`, { replace: true });
  });

  return (
    <AccountPanel
      title={initial ? t("Product details") : t("New product")}
      action={initial ? <VisibilityBadges isPublished={initial.isPublished} isSample={initial.isSample} /> : null}
    >
      <p>
        <Link to="/admin/products">← {t("All products")}</Link>
        {initial?.isPublished ? (
          <>
            {" · "}
            <Link to={`/shop/${initial.slug}`}>{t("See it on the website")}</Link>
          </>
        ) : null}
      </p>
      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <FormError message={form.formError} />
        <BilingualField
          label={t("Product name")}
          value={v.name}
          onChange={(lang, x) => form.setField(`name.${lang}`, x)}
          errorEn={form.errorFor("name.en")}
          errorTa={form.errorFor("name.ta")}
        />
        <div className={styles.formGrid}>
          <SelectField
            label={t("Category")}
            value={v.categoryId ?? ""}
            onChange={(x) => form.setField("categoryId", x)}
            options={[
              { value: "", label: t("No category") },
              ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.name })),
            ]}
            error={form.errorFor("categoryId")}
          />
          <TextField
            label={t("Size")}
            hint={t("For example: 100 g or 200 ml")}
            value={v.size ?? ""}
            onChange={(x) => form.setField("size", x)}
            error={form.errorFor("size")}
          />
        </div>
        <div className={styles.formGrid}>
          <TextField
            label={t("Price (₹)")}
            required
            inputMode="decimal"
            value={v.price}
            onChange={(x) => form.setField("price", x)}
            error={form.errorFor("price")}
          />
          <TextField
            label={t("MRP (₹)")}
            hint={t("Shown crossed out when higher than the price.")}
            inputMode="decimal"
            value={v.mrp ?? ""}
            onChange={(x) => form.setField("mrp", x)}
            error={form.errorFor("mrp")}
          />
          <TextField
            label={t("Stock")}
            hint={t("How many you have to sell now.")}
            required
            inputMode="numeric"
            value={String(v.stock)}
            onChange={(x) => form.setField("stock", x)}
            error={form.errorFor("stock")}
          />
        </div>
        <BilingualField
          label={t("Short description")}
          hint={t("One line shown on the shop page.")}
          multiline
          rows={2}
          value={v.shortDescription}
          onChange={(lang, x) => form.setField(`shortDescription.${lang}`, x)}
          errorEn={form.errorFor("shortDescription.en")}
          errorTa={form.errorFor("shortDescription.ta")}
        />
        <BilingualField
          label={t("Description")}
          hint={t("Shown on the product page. You can use **bold** and lists starting with -.")}
          multiline
          rows={6}
          required={false}
          value={v.description}
          onChange={(lang, x) => form.setField(`description.${lang}`, x)}
          errorEn={form.errorFor("description.en")}
          errorTa={form.errorFor("description.ta")}
        />
        <CheckboxField
          label={t("Feature this product at the top of the shop")}
          checked={!!v.isFeatured}
          onChange={(x) => form.setField("isFeatured", x)}
        />
        <CheckboxField
          label={t("Show this product in the shop")}
          hint={t("Hidden products can't be ordered; past orders are not affected.")}
          checked={!!v.isPublished}
          onChange={(x) => form.setField("isPublished", x)}
        />
        <div className={styles.formActions}>
          <Button type="submit" loading={form.submitting}>
            {initial ? t("Save changes") : t("Add product")}
          </Button>
        </div>
      </form>
    </AccountPanel>
  );
}

export function AdminProductScreen() {
  const { id } = useParams();
  const product = useAdminProduct(id ?? "");
  if (!id) return <ProductForm initial={null} />;
  return (
    <QueryState query={product} loading={<LoadingState />}>
      {(p) => <ProductForm key={p.id} initial={p} />}
    </QueryState>
  );
}
