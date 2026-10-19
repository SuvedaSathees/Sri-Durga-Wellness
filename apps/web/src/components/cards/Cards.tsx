/**
 * Catalogue cards shared by the home page and the list screens. Each card is one link with a
 * clear name, so screen-reader users hear a single, meaningful link per item.
 */
import { Link } from "react-router";
import { useFormat, useT } from "@sdw/controllers";
import {
  accessPeriod,
  BATCH_CLOSED_LABEL,
  discountPercent,
  LEVEL_LABEL,
  SERVICE_MODE_LABEL,
  STOCK_STATUS,
  type CourseSummary,
  type LiveClassSummary,
  type ProductSummary,
  type Service,
} from "@sdw/core";
import { Badge, Icon, isIconName, MediaImage } from "../ui";
import styles from "./Cards.module.css";

export function ServiceCard({ service }: { service: Service }) {
  const t = useT();
  const f = useFormat();
  return (
    <article className={styles.card}>
      <span className={styles.serviceIcon} aria-hidden="true">
        <Icon name={isIconName(service.icon) ? service.icon : "leaf"} size={24} />
      </span>
      <h3 className={styles.title}>
        <Link to={`/services/${service.slug}`} className={styles.stretched}>
          {service.name}
        </Link>
      </h3>
      <p className={styles.summary}>{service.summary}</p>
      <div className={styles.meta}>
        <span>
          <Icon name="clock" size={16} /> {f.duration(service.durationMinutes)}
        </span>
        <span>
          <Icon name={service.mode === "ONLINE" ? "video" : "mapPin"} size={16} /> {t(SERVICE_MODE_LABEL[service.mode])}
        </span>
        {service.price !== null ? <span className={styles.price}>{f.price(service.price)}</span> : null}
      </div>
    </article>
  );
}

export function ClassCard({ item }: { item: LiveClassSummary }) {
  const t = useT();
  const f = useFormat();
  const batch = item.nextBatch;
  return (
    <article className={`${styles.card} ${styles.withMedia}`}>
      <MediaImage image={item.image} fallback="/images/placeholders/class-default.webp" ratio="16 / 10" />
      <div className={styles.body}>
        <div className={styles.badges}>
          <Badge tone="neutral">{t(LEVEL_LABEL[item.level])}</Badge>
          <Badge tone={item.fee === 0 ? "success" : "neutral"}>{f.classFee(item.fee, item.feeType)}</Badge>
        </div>
        <h3 className={styles.title}>
          <Link to={`/classes/${item.slug}`} className={styles.stretched}>
            {item.title}
          </Link>
        </h3>
        <p className={styles.summary}>{item.summary}</p>
        <div className={styles.meta}>
          {batch ? (
            <>
              <span>
                <Icon name="calendar" size={16} /> {t("Starts {date}", { date: f.date(batch.startsAt) })}
              </span>
              {batch.isOpen ? (
                batch.seatsLeft !== null && batch.seatsLeft <= 5 ? (
                  <span>{t("{count} seats left", { count: batch.seatsLeft })}</span>
                ) : null
              ) : (
                <span>{t(BATCH_CLOSED_LABEL[batch.closedReason ?? "CLOSED"])}</span>
              )}
            </>
          ) : (
            <span>{t("New dates coming soon")}</span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCard({ product }: { product: ProductSummary }) {
  const t = useT();
  const f = useFormat();
  const off = discountPercent(product.price, product.mrp);
  const stock = STOCK_STATUS[product.stockStatus];
  return (
    <article className={`${styles.card} ${styles.withMedia}`}>
      <MediaImage image={product.image} fallback="/images/placeholders/product-default.webp" ratio="1 / 1" />
      <div className={styles.body}>
        {product.category ? <span className={styles.kicker}>{product.category.name}</span> : null}
        <h3 className={styles.title}>
          <Link to={`/shop/${product.slug}`} className={styles.stretched}>
            {product.name}
          </Link>
        </h3>
        {product.size ? <p className={styles.summary}>{product.size}</p> : null}
        <div className={styles.priceRow}>
          <span className={styles.price}>{f.price(product.price)}</span>
          {product.mrp && off ? (
            <>
              <s className="muted">
                <span className="visually-hidden">{t("MRP")} </span>
                {f.price(product.mrp)}
              </s>
              <Badge tone="success">{t("{percent}% off", { percent: off })}</Badge>
            </>
          ) : null}
        </div>
        {product.stockStatus !== "IN_STOCK" ? <Badge tone={stock.tone}>{t(stock.label)}</Badge> : null}
      </div>
    </article>
  );
}

export function CourseCard({ course }: { course: CourseSummary }) {
  const t = useT();
  const f = useFormat();
  return (
    <article className={`${styles.card} ${styles.withMedia}`}>
      <MediaImage image={course.cover} fallback="/images/placeholders/course-default.webp" ratio="16 / 10" />
      <div className={styles.body}>
        <div className={styles.badges}>
          {course.category ? <Badge tone="neutral">{course.category}</Badge> : null}
          <Badge tone="neutral">{t(LEVEL_LABEL[course.level])}</Badge>
        </div>
        <h3 className={styles.title}>
          <Link to={`/courses/${course.slug}`} className={styles.stretched}>
            {course.title}
          </Link>
        </h3>
        <p className={styles.summary}>{course.summary}</p>
        <div className={styles.meta}>
          <span>
            <Icon name="video" size={16} />{" "}
            {course.lessonCount === 1 ? t("1 lesson") : t("{count} lessons", { count: course.lessonCount })}
          </span>
          <span>{t(accessPeriod(course.accessDays).label, accessPeriod(course.accessDays).vars)}</span>
          <span className={styles.price}>{f.fee(course.price)}</span>
        </div>
      </div>
    </article>
  );
}
