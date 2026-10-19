import { useContentBlocks, useSite, useT } from "@sdw/controllers";
import { ButtonLink, Skeleton } from "../../../components/ui";
import { HeroVideo } from "./HeroVideo";
import styles from "./Hero.module.css";

export function Hero() {
  const t = useT();
  const blocks = useContentBlocks("home.");
  const name = useSite().data?.clinicName ?? "Sri Durga Wellness";
  const title = blocks.text("home.hero.title");
  const subtitle = blocks.text("home.hero.subtitle");
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <img className={styles.poster} src="/images/hero-forest.webp" alt="" fetchPriority="high" decoding="async" />
      <HeroVideo />
      <div className={styles.shade} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <span className={`eyebrow ${styles.eyebrow}`}>{name}</span>
          <h1 id="hero-title" className={styles.title}>
            {title || (blocks.isPending ? <Skeleton height={56} width="80%" /> : name)}
          </h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          <div className={styles.actions}>
            <ButtonLink to="/book" variant="light" size="lg" icon="calendar">
              {t("Book an Appointment")}
            </ButtonLink>
            <ButtonLink to="/classes" variant="secondary" size="lg" className={styles.ghost}>
              {t("Explore Our Classes")}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
