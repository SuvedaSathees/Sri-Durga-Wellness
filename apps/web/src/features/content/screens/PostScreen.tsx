import { Link, useParams } from "react-router";
import { useFormat, usePost, usePosts, useT } from "@sdw/controllers";
import {
  Badge,
  ErrorState,
  Icon,
  LoadingState,
  Markdown,
  MediaImage,
  PageHeader,
  SectionHeading,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { PostCard } from "../components/PostCard";
import styles from "../components/content.module.css";

function Related({ slug }: { slug: string }) {
  const t = useT();
  const posts = usePosts({ pageSize: 4 });
  const others = posts.data?.items.filter((p) => p.slug !== slug).slice(0, 3) ?? [];
  if (others.length === 0) return null;
  return (
    <section className="section section-alt" aria-labelledby="more-title">
      <div className="container">
        <SectionHeading title={<span id="more-title">{t("More from the journal")}</span>} />
        <div className="grid-cards">
          {others.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function PostScreen() {
  const t = useT();
  const f = useFormat();
  const { slug = "" } = useParams();
  const post = usePost(slug);
  useDocumentTitle(post.data?.title ?? t("Journal"));

  if (post.isPending) return <LoadingState />;
  if (post.isError || !post.data) {
    return (
      <div className="container section">
        <ErrorState error={post.error} onRetry={() => void post.refetch()} />
      </div>
    );
  }
  const p = post.data;
  return (
    <>
      <PageHeader
        eyebrow={t("Journal")}
        title={p.title}
        intro={p.excerpt}
        crumbs={[{ label: t("Journal"), to: "/blog" }, { label: p.title }]}
        actions={
          <>
            <span className="muted">
              <time dateTime={p.publishedAt}>{f.longDate(p.publishedAt)}</time>
            </span>
            {p.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </>
        }
      />
      <section className="section">
        <article className={`container container-narrow ${styles.article}`}>
          {p.cover ? (
            <div className={styles.cover}>
              <MediaImage image={p.cover} ratio="16 / 9" priority />
            </div>
          ) : null}
          <Markdown text={p.content} />
          <Link to="/blog" className={styles.backLink}>
            <Icon name="chevronLeft" size={18} /> {t("Back to the journal")}
          </Link>
        </article>
      </section>
      <Related slug={p.slug} />
    </>
  );
}
