/** Live online classes: how they work, then every class with its next batch. */
import { useClasses, useT } from "@sdw/controllers";
import { ClassCard } from "../../../components/cards/Cards";
import { ButtonLink, EmptyState, LoadingCards, PageHeader, QueryState } from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "../components/learning.module.css";

export function ClassesScreen() {
  const t = useT();
  const classes = useClasses();
  useDocumentTitle(t("Online Classes"));
  const steps = [
    { title: t("Choose a batch"), body: t("Pick a class and a batch with dates that suit you.") },
    {
      title: t("Register and pay"),
      body: t("Free classes are confirmed straight away. For paid classes, pay by UPI and enter the reference."),
    },
    {
      title: t("Join on Google Meet"),
      body: t("Once confirmed, your private joining link appears in My account. Please don't share it."),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow={t("Live online classes")}
        title={t("Practise together, from wherever you are")}
        intro={t(
          "Guided live classes on Google Meet — join from anywhere in India. Joining links are shared privately with registered students.",
        )}
        crumbs={[{ label: t("Online Classes") }]}
      />
      <section className="section">
        <div className="container">
          <h2 className="visually-hidden">{t("How it works")}</h2>
          <ol className={styles.howItWorks}>
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className={styles.stepNo} aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <strong>{s.title}</strong>
                  <span className="muted">{s.body}</span>
                </div>
              </li>
            ))}
          </ol>
          <QueryState
            query={classes}
            loading={<LoadingCards count={3} />}
            empty={
              <EmptyState
                title={t("New classes are being planned")}
                action={
                  <ButtonLink to="/contact" variant="secondary">
                    {t("Ask us about classes")}
                  </ButtonLink>
                }
              >
                {t("Upcoming batches will appear here as soon as they are scheduled.")}
              </EmptyState>
            }
          >
            {(list) => (
              <div className="grid-cards">
                {list.map((c) => (
                  <ClassCard key={c.id} item={c} />
                ))}
              </div>
            )}
          </QueryState>
        </div>
      </section>
    </>
  );
}
