/** Practitioner card: photo, name, specialisation, short introduction and a booking link. */
import { useT } from "@sdw/controllers";
import type { Doctor } from "@sdw/core";
import { Badge, ButtonLink, MediaImage } from "../../../components/ui";
import styles from "./DoctorCard.module.css";

export function DoctorCard({ doctor, bookHref }: { doctor: Doctor; bookHref?: string }) {
  const t = useT();
  return (
    <article className={styles.card}>
      <MediaImage
        image={doctor.photo}
        fallback="/images/placeholders/doctor.webp"
        ratio="1 / 1"
        className={styles.photo}
      />
      <div className={styles.body}>
        <h3 className={styles.name}>{doctor.name}</h3>
        <p className={styles.role}>{doctor.specialisation}</p>
        {doctor.isSample ? <Badge tone="warning">{t("Sample profile")}</Badge> : null}
        <p className="muted">{doctor.shortBio}</p>
        {doctor.experienceYears ? (
          <p className="muted">{t("{years}+ years of practice", { years: doctor.experienceYears })}</p>
        ) : null}
        {doctor.languages ? <p className="muted">{t("Speaks {languages}", { languages: doctor.languages })}</p> : null}
        {bookHref && doctor.acceptsAppointments ? (
          <ButtonLink to={bookHref} variant="secondary" size="sm" icon="calendar" className={styles.book}>
            {t("Book with {name}", { name: doctor.name })}
          </ButtonLink>
        ) : null}
      </div>
    </article>
  );
}
