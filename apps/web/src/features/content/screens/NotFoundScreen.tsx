import { useT } from "@sdw/controllers";
import { ButtonLink, Icon } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "../components/content.module.css";

export function NotFoundScreen() {
  const t = useT();
  useDocumentTitle(t("Page not found"));
  return (
    <section className={`container section ${styles.notFound}`} aria-labelledby="not-found-title">
      <span className={styles.notFoundIcon} aria-hidden="true">
        <Icon name="leaf" size={28} />
      </span>
      <p className="eyebrow">{t("Error 404")}</p>
      <h1 id="not-found-title">{t("We couldn't find that page")}</h1>
      <p className="lead">{t("The link may be out of date, or the page may have moved.")}</p>
      <div className={styles.notFoundLinks}>
        <ButtonLink to="/">{t("Go to the homepage")}</ButtonLink>
        <ButtonLink to="/services" variant="secondary">
          {t("Services")}
        </ButtonLink>
        <ButtonLink to="/contact" variant="secondary">
          {t("Contact us")}
        </ButtonLink>
      </div>
    </section>
  );
}
