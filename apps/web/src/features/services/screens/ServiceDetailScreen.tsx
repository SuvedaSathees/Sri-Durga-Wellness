/** One service: description, practical facts and how to book it. */
import { Link, useParams } from "react-router";
import { useFormat, useService, useT } from "@sdw/controllers";
import { SERVICE_MODE_LABEL } from "@sdw/core";
import {
  ButtonLink,
  Card,
  ErrorState,
  Facts,
  Icon,
  isIconName,
  LoadingState,
  Markdown,
  MediaImage,
  Notice,
  PageHeader,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "./Services.module.css";

export function ServiceDetailScreen() {
  const { slug = "" } = useParams();
  const t = useT();
  const f = useFormat();
  const query = useService(slug);
  const service = query.data;
  useDocumentTitle(service?.name ?? t("Services"));

  if (query.isPending) return <LoadingState />;
  if (query.isError || !service) {
    return (
      <div className="container section">
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const bookable = service.isBookable && service.doctors.some((d) => d.acceptsAppointments);
  const bookHref = `/book?service=${encodeURIComponent(service.slug)}`;

  return (
    <>
      <PageHeader
        eyebrow={t(SERVICE_MODE_LABEL[service.mode])}
        title={service.name}
        intro={service.summary}
        crumbs={[{ label: t("Services"), to: "/services" }, { label: service.name }]}
      />
      <section className="section">
        <div className={`container ${styles.layout}`}>
          <Markdown text={service.description} />
          <aside className={styles.aside} aria-label={t("Booking information")}>
            <Card className={styles.infoCard}>
              <span className={styles.infoIcon} aria-hidden="true">
                <Icon name={isIconName(service.icon) ? service.icon : "leaf"} size={26} />
              </span>
              <Facts
                items={[
                  { label: t("Duration"), value: f.duration(service.durationMinutes) },
                  { label: t("Format"), value: t(SERVICE_MODE_LABEL[service.mode]) },
                  service.price !== null && { label: t("Fee"), value: f.price(service.price) },
                ]}
              />
              {bookable ? (
                <ButtonLink to={bookHref} fullWidth icon="calendar">
                  {t("Book this service")}
                </ButtonLink>
              ) : (
                <Notice tone="info" action={<Link to="/contact">{t("Contact the clinic")}</Link>}>
                  {t("Online booking isn't available for this service. Please contact the clinic to arrange a visit.")}
                </Notice>
              )}
              {service.price !== null ? (
                <p className="muted">{t("Fees are paid at the clinic unless stated otherwise.")}</p>
              ) : null}
            </Card>

            {service.doctors.length > 0 ? (
              <Card className={styles.infoCard}>
                <h2 className={styles.asideTitle}>{t("Practitioners")}</h2>
                <ul className={styles.doctorList}>
                  {service.doctors.map((d) => (
                    <li key={d.id} className={styles.doctorRow}>
                      <MediaImage
                        image={d.photo ? { ...d.photo, alt: "" } : null}
                        fallback="/images/placeholders/doctor.webp"
                        ratio="1 / 1"
                        className={styles.avatar}
                      />
                      <span className={styles.doctorText}>
                        <span className={styles.doctorName}>{d.name}</span>
                        <span className="muted">{d.specialisation}</span>
                      </span>
                      {bookable && d.acceptsAppointments ? (
                        <ButtonLink
                          to={`${bookHref}&doctor=${encodeURIComponent(d.slug)}`}
                          variant="ghost"
                          size="sm"
                          aria-label={t("Book with {name}", { name: d.name })}
                        >
                          {t("Book")}
                        </ButtonLink>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}
