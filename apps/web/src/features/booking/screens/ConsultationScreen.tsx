/** Free consultation request: a short form; the team calls back to arrange a time. */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useConsultationRequest, useContentBlocks, useForm, useSession, useSite, useT } from "@sdw/controllers";
import {
  CONSULTATION_METHOD_LABEL,
  consultationMethods,
  consultationSchema,
  type ConsultationRequestInput,
} from "@sdw/core";
import {
  Button,
  ButtonLink,
  Card,
  CheckboxField,
  FormError,
  Icon,
  Markdown,
  PageHeader,
  RadioGroup,
  TextArea,
  TextField,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "./Booking.module.css";

function Success({ reference }: { reference: string }) {
  const t = useT();
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className={styles.done} role="status">
      <span className={styles.doneIcon} aria-hidden="true">
        <Icon name="checkCircle" size={34} />
      </span>
      <h2 ref={ref} tabIndex={-1}>
        {t("Thank you")}
      </h2>
      <p className="lead">
        {t("Thank you. A member of our team will contact you shortly to arrange your free consultation.")}
      </p>
      <p>
        {t("Your reference:")} <strong data-testid="consultation-reference">{reference}</strong>
      </p>
      <div className={styles.doneActions}>
        <ButtonLink to="/services" variant="secondary">
          {t("Explore our services")}
        </ButtonLink>
        <ButtonLink to="/" variant="ghost">
          {t("Go to the homepage")}
        </ButtonLink>
      </div>
    </div>
  );
}

export function ConsultationScreen() {
  const t = useT();
  const { user } = useSession();
  const blocks = useContentBlocks("consultation.");
  const request = useConsultationRequest();
  const settings = useSite().data?.consultation;
  const methods = settings?.methods.length ? settings.methods : consultationMethods;
  const minutes = settings?.durationMinutes ?? null;
  const [reference, setReference] = useState<string | null>(null);
  useDocumentTitle(t("Free consultation"));

  const form = useForm(consultationSchema, {
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    preferredMethod: "" as unknown as "PHONE",
    reason: "",
    consent: false as unknown as true,
  });
  const v = form.values;
  const submit = form.handleSubmit(async (data) => {
    const res = await request.mutateAsync(data as ConsultationRequestInput);
    setReference(res.reference);
  });

  return (
    <>
      <PageHeader
        eyebrow={t("Free consultation")}
        title={t("Request a free consultation")}
        intro={
          blocks.text("consultation.intro") || t("Request a free consultation and we'll call you to arrange a time.")
        }
        crumbs={[{ label: t("Free consultation") }]}
      />
      <section className="section">
        <div className={`container ${styles.consult}`}>
          <Card>
            {reference ? (
              <Success reference={reference} />
            ) : (
              <form
                className={styles.form}
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <h2 className={styles.stepTitle}>{t("Your consultation")}</h2>
                {minutes ? (
                  <p className="muted">
                    {t("A free {minutes}-minute conversation — by phone, by video call or at the clinic.", {
                      minutes,
                    })}
                  </p>
                ) : null}
                <FormError message={form.formError} />
                <TextField
                  label={t("Full name")}
                  required
                  autoComplete="name"
                  value={v.name}
                  onChange={(x) => form.setField("name", x)}
                  error={form.errorFor("name")}
                />
                <div className={styles.formRow}>
                  <TextField
                    label={t("Mobile number")}
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={v.phone}
                    onChange={(x) => form.setField("phone", x)}
                    error={form.errorFor("phone")}
                  />
                  <TextField
                    label={t("Email")}
                    required
                    type="email"
                    autoComplete="email"
                    value={v.email}
                    onChange={(x) => form.setField("email", x)}
                    error={form.errorFor("email")}
                  />
                </div>
                <RadioGroup
                  legend={t("Choose how you'd like to have the consultation")}
                  name="preferredMethod"
                  layout="row"
                  value={v.preferredMethod}
                  onChange={(x) => form.setField("preferredMethod", x)}
                  options={methods.map((m) => ({ value: m, label: t(CONSULTATION_METHOD_LABEL[m]) }))}
                  error={form.errorFor("preferredMethod")}
                />
                <TextArea
                  label={t("What you'd like help with")}
                  hint={t("A few words are enough. Please don't include detailed medical records.")}
                  required
                  rows={4}
                  value={v.reason}
                  onChange={(x) => form.setField("reason", x)}
                  error={form.errorFor("reason")}
                />
                <CheckboxField
                  label={
                    <>
                      {t("I agree to the clinic contacting me about this request, as described in the")}{" "}
                      <Link to="/policies/privacy-policy">{t("Privacy Policy")}</Link>.
                    </>
                  }
                  checked={v.consent === true}
                  onChange={(x) => form.setField("consent", x)}
                  error={form.errorFor("consent")}
                />
                <div className={styles.actions}>
                  <Button type="submit" loading={form.submitting} icon="chat">
                    {t("Request my free consultation")}
                  </Button>
                </div>
              </form>
            )}
          </Card>
          <aside className="stack" aria-label={t("What happens next")}>
            <h2 className={styles.stepTitle}>{t("What happens next")}</h2>
            <ol className={styles.steps}>
              <li>
                <span>
                  <strong>{t("You tell us a little")}</strong>
                  <span className="muted">{t("A few details about what you're looking for.")}</span>
                </span>
              </li>
              <li>
                <span>
                  <strong>{t("We call you")}</strong>
                  <span className="muted">{t("Our team contacts you to talk through what you need.")}</span>
                </span>
              </li>
              <li>
                <span>
                  <strong>{t("We agree a time")}</strong>
                  <span className="muted">
                    {t("Your consultation time is confirmed separately, by phone, video or in person.")}
                  </span>
                </span>
              </li>
            </ol>
            {blocks.text("consultation.privacy") ? (
              <Card>
                <Markdown text={blocks.text("consultation.privacy")} />
              </Card>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}
