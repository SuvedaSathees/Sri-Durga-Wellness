/** Policy pages. Text comes from the API; Tamil shows a notice while only the English version is approved. */
import { Link, useParams } from "react-router";
import { useFormat, useLocale, usePolicy, useT } from "@sdw/controllers";
import type { PolicyPage } from "@sdw/core";
import { ErrorState, LoadingState, Markdown, Notice, PageHeader } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "../components/content.module.css";
import { NotFoundScreen } from "./NotFoundScreen";

const POLICIES: Array<{ slug: PolicyPage["slug"]; label: string }> = [
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-of-use", label: "Terms of Use" },
  { slug: "refund-and-cancellation-policy", label: "Refund & Cancellation" },
  { slug: "medical-disclaimer", label: "Medical Disclaimer" },
];

function isPolicySlug(slug: string): slug is PolicyPage["slug"] {
  return POLICIES.some((p) => p.slug === slug);
}

function Policy({ slug }: { slug: PolicyPage["slug"] }) {
  const t = useT();
  const f = useFormat();
  const [locale] = useLocale();
  const policy = usePolicy(slug);
  useDocumentTitle(policy.data?.title ?? t("Policies"));

  if (policy.isPending) return <LoadingState />;
  if (policy.isError || !policy.data) {
    return (
      <div className="container section">
        <ErrorState error={policy.error} onRetry={() => void policy.refetch()} />
      </div>
    );
  }
  const p = policy.data;
  return (
    <>
      <PageHeader
        eyebrow={t("Policies")}
        title={p.title}
        intro={t("Last updated {date}", { date: f.longDate(p.updatedAt) })}
        crumbs={[{ label: p.title }]}
      />
      <section className="section">
        <div className="container container-narrow stack">
          {locale === "ta" && p.bodyLocale === "en" ? (
            <Notice tone="info">
              {t(
                "This page is currently available in English only. The Tamil version will be added once the clinic has approved it.",
              )}
            </Notice>
          ) : null}
          <div lang={p.bodyLocale === "en" ? "en-IN" : "ta-IN"}>
            <Markdown text={p.body} />
          </div>
          <nav aria-label={t("Other policies")}>
            <ul className={styles.policyLinks}>
              {POLICIES.filter((x) => x.slug !== slug).map((x) => (
                <li key={x.slug}>
                  <Link to={`/policies/${x.slug}`}>{t(x.label)}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </>
  );
}

export function PolicyScreen() {
  const { slug = "" } = useParams();
  if (!isPolicySlug(slug)) return <NotFoundScreen />;
  return <Policy slug={slug} />;
}
