/** Journal: articles from the clinic, filterable by tag, paginated in the URL (?page=, ?tag=). */
import { Link, useSearchParams } from "react-router";
import { useLocale, usePosts, useT } from "@sdw/controllers";
import { EmptyState, LoadingCards, Notice, PageHeader, Pagination, QueryState } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { PostCard } from "../components/PostCard";
import styles from "../components/content.module.css";

export function BlogScreen() {
  const t = useT();
  const [locale] = useLocale();
  const [params] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const tag = params.get("tag") ?? undefined;
  const posts = usePosts({ page, tag });
  // Topics come from the articles themselves (first page of all posts), so they always match the API.
  const all = usePosts({ pageSize: 48 });
  const TAGS = [...new Set([...(all.data?.items.flatMap((p) => p.tags) ?? []), ...(tag ? [tag] : [])])].sort();
  useDocumentTitle(t("Journal"));

  const href = (p: number, tg = tag) => {
    const q = new URLSearchParams();
    if (tg) q.set("tag", tg);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/blog?${s}` : "/blog";
  };

  return (
    <>
      <PageHeader
        eyebrow={t("Journal")}
        title={t("Notes for everyday well-being")}
        intro={t("Practical ideas for calmer days, and guides to visiting the clinic.")}
        crumbs={[{ label: t("Journal") }]}
      />
      <section className="section">
        <div className="container stack">
          {locale === "ta" ? <Notice tone="info">{t("Journal articles are currently in English.")}</Notice> : null}
          <nav aria-label={t("Filter by topic")} className={styles.filters}>
            <Link to={href(1, undefined)} className={styles.chip} aria-current={!tag ? "page" : undefined}>
              {t("All articles")}
            </Link>
            {TAGS.map((tg) => (
              <Link key={tg} to={href(1, tg)} className={styles.chip} aria-current={tag === tg ? "page" : undefined}>
                {tg}
              </Link>
            ))}
          </nav>
          <QueryState
            query={posts}
            loading={<LoadingCards count={3} />}
            isEmpty={(d) => d.items.length === 0}
            empty={
              <EmptyState icon="book" title={t("No articles yet")}>
                {t("New articles will appear here soon.")}
              </EmptyState>
            }
          >
            {(data) => (
              <>
                <div className="grid-cards">
                  {data.items.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
                <Pagination page={data.page} pageSize={data.pageSize} total={data.total} hrefFor={(p) => href(p)} />
              </>
            )}
          </QueryState>
        </div>
      </section>
    </>
  );
}
