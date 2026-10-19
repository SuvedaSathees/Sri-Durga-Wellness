/** All services the clinic offers, the practitioners, and a nudge towards the free consultation. */
import { useDoctors, useServiceList, useT } from "@sdw/controllers";
import { ServiceCard } from "../../../components/cards/Cards";
import { ButtonLink, EmptyState, LoadingCards, PageHeader, QueryState, SectionHeading } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { DoctorCard } from "../components/DoctorCard";
import styles from "./Services.module.css";

export function ServicesScreen() {
  const t = useT();
  const services = useServiceList();
  const doctors = useDoctors();
  useDocumentTitle(t("Services"));

  return (
    <>
      <PageHeader
        eyebrow={t("Our services")}
        title={t("Ways we can help")}
        intro={t(
          "Every plan begins with a conversation. Choose a service to learn more, or book a time that suits you.",
        )}
        crumbs={[{ label: t("Services") }]}
        actions={
          <ButtonLink to="/book" icon="calendar">
            {t("Book an Appointment")}
          </ButtonLink>
        }
      />
      <section className="section">
        <div className="container">
          <QueryState
            query={services}
            loading={<LoadingCards count={6} />}
            empty={
              <EmptyState title={t("Services will be listed here soon")}>
                {t("Please contact the clinic to ask about appointments.")}
              </EmptyState>
            }
          >
            {(list) => (
              <div className="grid-cards">
                {list.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            )}
          </QueryState>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="practitioners-title">
        <div className="container">
          <SectionHeading
            eyebrow={t("Our practitioners")}
            title={<span id="practitioners-title">{t("Meet the people who will care for you")}</span>}
            intro={t("Get to know our practitioners before your first visit.")}
          />
          <QueryState query={doctors} loading={<LoadingCards count={3} />} empty={null}>
            {(list) => (
              <div className={styles.doctors}>
                {list.map((d) => (
                  <DoctorCard key={d.id} doctor={d} bookHref={`/book?doctor=${encodeURIComponent(d.slug)}`} />
                ))}
              </div>
            )}
          </QueryState>
        </div>
      </section>

      <section className="section">
        <div className={`container ${styles.cta}`}>
          <h2>{t("Not sure where to start?")}</h2>
          <p className="lead">{t("Request a free consultation and we'll help you choose the right service.")}</p>
          <ButtonLink to="/free-consultation" variant="secondary">
            {t("Request a free consultation")}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
