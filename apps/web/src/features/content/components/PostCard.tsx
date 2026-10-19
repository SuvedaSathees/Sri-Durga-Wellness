import { Link } from "react-router";
import { useFormat } from "@sdw/controllers";
import type { BlogPostSummary } from "@sdw/core";
import { Badge, MediaImage } from "../../../components/ui";
import styles from "./content.module.css";

export function PostCard({ post }: { post: BlogPostSummary }) {
  const f = useFormat();
  return (
    <article className={styles.postCard}>
      <MediaImage image={post.cover} fallback="/images/placeholders/blog-default.webp" ratio="16 / 9" />
      <div className={styles.postBody}>
        <p className={styles.small}>
          <time dateTime={post.publishedAt}>{f.shortDate(post.publishedAt)}</time>
        </p>
        <h2 className={styles.postTitle}>
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className={styles.small}>{post.excerpt}</p>
        {post.tags.length ? (
          <div className={styles.tags}>
            {post.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
