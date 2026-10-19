/**
 * Home: calm hero, introduction, then previews of services, classes, products and courses, FAQs
 * and a closing invitation. Each section handles its own loading, error and empty state, so one
 * slow request never blanks the whole page.
 */
import { Link } from "react-router";
import {
  useContentBlocks,
  useCourses,
  useFaqs,
  useClasses,
  useProducts,
  useServiceList,
  useT,
  useTestimonials,
  useSite,
} from "@sdw/controllers";
import { ClassCard, CourseCard, ProductCard, ServiceCard } from "../../../components/cards/Cards";
import {
  ButtonLink,
  Icon,
  LoadingCards,
  Markdown,
  QueryState,
  SectionHeading,
  ErrorState,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { Hero } from "../components/Hero";
import styles from "./HomeScreen.module.css";

function Intro() {
  const t = useT();
  const blocks = useContentBlocks("home.");
  const pillars = [
    {
      icon: "care" as const,
      title: t("Personal consultations"),
      body: t("Unhurried, one-to-one care at the clinic or online."),
    },
    {
      icon: "video" as const,
      title: t("Live online classes"),
      body: t("Guided live classes you can join from home, anywhere in India."),
    },
    {
      icon: "book" as const,
      title: t("Learn at your pace"),
      body: t("Recorded courses to revisit whenever you need."),
    },
  ];
  return (
    <section className={`section ${styles.intro}`} aria-labelledby="intro-title">
      <div className={`container ${styles.introGrid}`}>
        <div className={styles.introImage}>
          <img
            src="/images/placeholders/intro.webp"
            alt={blocks.text("home.intro.imageAlt")}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="stack">
          {blocks.text("home.intro.eyebrow") ? (
            <span className="eyebrow">{blocks.text("home.intro.eyebrow")}</span>
          ) : null}
          <h2 id="intro-title">{blocks.text("home.intro.title")}</h2>
          <Markdown text={blocks.text("home.intro.body")} />
          <ul className={styles.pillars}>
            {pillars.map((p) => (
              <li key={p.title}>
                <span className={styles.pillarIcon} aria-hidden="true">
                  <Icon name={p.icon} size={20} />
                </span>
                <span>
                  <strong>{p.title}</strong>
                  <span className="muted">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <div>
            <ButtonLink to="/about" variant="secondary" iconAfter="arrowRight">
              {t("Discover Our Story")}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesPreview() {
  const t = useT();
  const services = useServiceList();
  return (
    <section className="section section-alt" aria-labelledby="services-title">
      <div className="container">
        <SectionHeading
          eyebrow={t("Our services")}
          title={<span id="services-title">{t("Care shaped around you")}</span>}
          intro={t(
            "Every plan begins with a conversation. Choose a service to learn more, or book a time that suits you.",
          )}
          action={
            <ButtonLink to="/services" variant="ghost" iconAfter="arrowRight">
              {t("View all services")}
            </ButtonLink>
          }
        />
        <QueryState query={services} loading={<LoadingCards count={3} />}>
          {(list) => (
            <div className="grid-cards">
              {list.slice(0, 6).map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          )}
        </QueryState>
      </div>
    </section>
  );
}

function ClassesPreview() {
  const t = useT();
  const classes = useClasses();
  return (
    <section className="section" aria-labelledby="classes-title">
      <div className="container">
        <SectionHeading
          eyebrow={t("Live online classes")}
          title={<span id="classes-title">{t("Practise together, from wherever you are")}</span>}
          intro={t(
            "Guided live classes on Google Meet — join from anywhere in India. Joining links are shared privately with registered students.",
          )}
          action={
            <ButtonLink to="/classes" variant="ghost" iconAfter="arrowRight">
              {t("See all classes")}
            </ButtonLink>
          }
        />
        <QueryState
          query={classes}
          loading={<LoadingCards count={3} />}
          isEmpty={(list) => list.filter((c) => c.nextBatch).length === 0}
          empty={<p className="muted">{t("Upcoming batches will appear here as soon as they are scheduled.")}</p>}
        >
          {(list) => (
            <div className="grid-cards">
              {list
                .filter((c) => c.nextBatch)
                .slice(0, 3)
                .map((c) => (
                  <ClassCard key={c.id} item={c} />
                ))}
            </div>
          )}
        </QueryState>
      </div>
    </section>
  );
}

function ShopPreview() {
  const t = useT();
  const products = useProducts({ sort: "featured", pageSize: 4 });
  const site = useSite();
  return (
    <section className="section section-alt" aria-labelledby="shop-title">
      <div className="container">
        <SectionHeading
          eyebrow={t("Wellness shop")}
          title={<span id="shop-title">{t("Thoughtfully chosen essentials")}</span>}
          intro={
            site.data?.shop.deliversAllIndia
              ? t("Products selected by our team, delivered anywhere in India or ready for clinic pickup.")
              : t("Products selected by our team, available for clinic pickup or home delivery.")
          }
          action={
            <ButtonLink to="/shop" variant="ghost" iconAfter="arrowRight">
              {t("Visit the shop")}
            </ButtonLink>
          }
        />
        <QueryState
          query={products}
          loading={<LoadingCards count={4} />}
          isEmpty={(p) => p.items.length === 0}
          empty={null}
        >
          {(page) => (
            <div className={styles.productGrid}>
              {page.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </QueryState>
      </div>
    </section>
  );
}

function CoursesPreview() {
  const t = useT();
  const courses = useCourses();
  return (
    <section className="section" aria-labelledby="courses-title">
      <div className="container">
        <SectionHeading
          eyebrow={t("Recorded courses")}
          title={<span id="courses-title">{t("Learn at your own pace")}</span>}
          action={
            <ButtonLink to="/courses" variant="ghost" iconAfter="arrowRight">
              {t("Browse courses")}
            </ButtonLink>
          }
        />
        <QueryState query={courses} loading={<LoadingCards count={3} />} empty={null}>
          {(list) => (
            <div className="grid-cards">
              {list.slice(0, 3).map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}
        </QueryState>
      </div>
    </section>
  );
}

/** Only approved testimonials with recorded consent come from the API; the section hides when there are none. */
function Testimonials() {
  const t = useT();
  const q = useTestimonials();
  if (!q.data || q.data.length === 0) return null;
  return (
    <section className="section section-alt" aria-labelledby="kind-words">
      <div className="container">
        <SectionHeading
          eyebrow={t("Kind words")}
          title={<span id="kind-words">{t("In their own words")}</span>}
          intro={t("Shared with permission by people who have visited us.")}
        />
        <div className="grid-cards">
          {q.data.map((item) => (
            <figure key={item.id} className={styles.quote}>
              <blockquote>{item.quote}</blockquote>
              <figcaption>
                <strong>{item.authorName}</strong>
                {item.authorDetail ? <span className="muted"> · {item.authorDetail}</span> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faqs() {
  const t = useT();
  const faqs = useFaqs();
  return (
    <section className="section" aria-labelledby="faq-title">
      <div className={`container container-narrow`}>
        <SectionHeading eyebrow={t("FAQ")} title={<span id="faq-title">{t("Questions, answered")}</span>} />
        <QueryState query={faqs} empty={null} loading={<LoadingCards count={1} />}>
          {(list) => (
            <div className={styles.faqs}>
              {list.map((f) => (
                <details key={f.id} className={styles.faq}>
                  <summary>
                    <span>{f.question}</span>
                    <Icon name="chevronDown" size={18} />
                  </summary>
                  <Markdown text={f.answer} />
                </details>
              ))}
            </div>
          )}
        </QueryState>
        <p className={`muted ${styles.faqMore}`}>
          {t("Can't find what you're looking for? We're happy to help.")}{" "}
          <Link to="/contact">{t("Contact the clinic")}</Link>
        </p>
      </div>
    </section>
  );
}

function ClosingCta() {
  const t = useT();
  const blocks = useContentBlocks("home.");
  return (
    <section className={styles.cta} aria-labelledby="cta-title">
      <div className={`container ${styles.ctaInner}`}>
        <h2 id="cta-title">{blocks.text("home.cta.title")}</h2>
        <p>{blocks.text("home.cta.body")}</p>
        <div className="cluster">
          <ButtonLink to="/book" variant="light" icon="calendar">
            {t("Book an Appointment")}
          </ButtonLink>
          <ButtonLink to="/free-consultation" variant="secondary" className={styles.ctaGhost}>
            {t("Book a free consultation")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function HomeScreen() {
  const blocks = useContentBlocks("home.");
  useDocumentTitle(null);
  if (blocks.isError) {
    return (
      <div className="container section">
        <ErrorState error={blocks.error} onRetry={() => void blocks.refetch()} />
      </div>
    );
  }
  return (
    <>
      <Hero />
      <Intro />
      <ServicesPreview />
      <ClassesPreview />
      <ShopPreview />
      <CoursesPreview />
      <Testimonials />
      <Faqs />
      <ClosingCta />
    </>
  );
}
