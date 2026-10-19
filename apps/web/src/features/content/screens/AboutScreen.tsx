/** About the clinic: its story and approach (editable text from the API) and verified practitioners. */
import { useContentBlocks, useDoctors, useT } from "@sdw/controllers";
import type { Doctor } from "@sdw/core";
import {
  Badge,
  ButtonLink,
  Card,
  LoadingCards,
  Markdown,
  PageHeader,
  QueryState,
  SectionHeading,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "../components/content.module.css";

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const t = useT();
  return (
    <Card as="article" className={styles.doctor}>
      <div className={styles.doctorHead}>
        <span className={styles.avatar}>
          <img src={doctor.photo?.url ?? "/images/placeholders/doctor.webp"} alt="" loading="lazy" decoding="async" />
        </span>
        <div>
          <h3 className={styles.doctorName}>{doctor.name}</h3>
          <p className={styles.small}>{doctor.specialisation}</p>
        </div>
      </div>
      {doctor.isSample ? (
        <div>
          <Badge tone="warning">{t("Sample profile")}</Badge>
        </div>
      ) : null}
      {/* Exactly what the API returns — qualifications are never filled in by the app. */}
      <p className={styles.small}>{doctor.qualifications}</p>
      {doctor.experienceYears ? (
        <p className={styles.small}>{t("{years}+ years of practice", { years: doctor.experienceYears })}</p>
      ) : null}
      {doctor.languages ? (
        <p className={styles.small}>{t("Speaks {languages}", { languages: doctor.languages })}</p>
      ) : null}
      <p>{doctor.shortBio}</p>
      {doctor.acceptsAppointments ? (
        <div>
          <ButtonLink
            to={`/book?doctor=${encodeURIComponent(doctor.slug)}`}
            variant="secondary"
            size="sm"
            icon="calendar"
          >
            {t("Book with {name}", { name: doctor.name })}
          </ButtonLink>
        </div>
      ) : null}
    </Card>
  );
}

export function AboutScreen() {
  const t = useT();
  const blocks = useContentBlocks("about.");
  const doctors = useDoctors();
  useDocumentTitle(t("About us"));

  return (
    <>
      <PageHeader
        eyebrow={t("About us")}
        title={t("A calm place to begin")}
        intro={blocks.text("about.intro") || undefined}
        crumbs={[{ label: t("About") }]}
      />
      <QueryState query={blocks} isEmpty={() => false}>
        {() => (
          <section className="section">
            <div className={`container ${styles.split}`}>
              <div className="stack">
                {blocks.text("about.story") ? (
                  <>
                    <h2>{t("Our story")}</h2>
                    <Markdown text={blocks.text("about.story")} />
                  </>
                ) : null}
                {blocks.text("about.philosophy") ? (
                  <>
                    <h2>{t("Our philosophy")}</h2>
                    <Markdown text={blocks.text("about.philosophy")} />
                  </>
                ) : null}
                {blocks.text("about.approach") ? (
                  <>
                    <h2>{t("How we work")}</h2>
                    <Markdown text={blocks.text("about.approach")} />
                  </>
                ) : null}
              </div>
              <div className={styles.photo}>
                <img
                  src="/images/placeholders/clinic.webp"
                  alt={blocks.text("about.imageAlt")}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </section>
        )}
      </QueryState>
      <section className="section section-alt" aria-labelledby="team-title">
        <div className="container">
          <SectionHeading
            eyebrow={t("Our practitioners")}
            title={<span id="team-title">{t("Meet the people who will care for you")}</span>}
            intro={t("Get to know our practitioners before your first visit.")}
          />
          <QueryState
            query={doctors}
            loading={<LoadingCards count={3} />}
            empty={<p className="muted">{t("Practitioner profiles will be added soon.")}</p>}
          >
            {(list) => (
              <div className="grid-cards">
                {list.map((d) => (
                  <DoctorCard key={d.id} doctor={d} />
                ))}
              </div>
            )}
          </QueryState>
        </div>
      </section>
    </>
  );
}
