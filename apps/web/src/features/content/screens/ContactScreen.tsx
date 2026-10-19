/** Contact: branches, the clinic's own contact details (only when the API has them) and a message form. */
import { useState } from "react";
import { useContactMessage, useContentBlocks, useForm, useSite, useT } from "@sdw/controllers";
import { contactSchema, lines, mailtoLink, telLink, whatsappLink, type ContactInput } from "@sdw/core";
import {
  Button,
  Card,
  FormError,
  Icon,
  LoadingState,
  Notice,
  PageHeader,
  QueryState,
  TextArea,
  TextField,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import styles from "../components/content.module.css";

const EMPTY: ContactInput = { name: "", email: "", phone: "", subject: "", message: "" };

function MessageForm() {
  const t = useT();
  const form = useForm(contactSchema, EMPTY);
  const send = useContactMessage();
  const [reference, setReference] = useState<string | null>(null);

  if (reference) {
    return (
      <div className={styles.success} role="status">
        <Notice tone="success" title={t("Thank you — your message has been sent.")}>
          {t("We'll reply by email as soon as we can, usually within one working day.")}
        </Notice>
        <p>
          {t("Your reference")}: <span className={styles.reference}>{reference}</span>
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            form.reset();
            setReference(null);
          }}
        >
          {t("Send another message")}
        </Button>
      </div>
    );
  }

  const submit = form.handleSubmit(async (data) => {
    const res = await send.mutateAsync(data);
    setReference(res.reference);
  });

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <FormError message={form.formError} />
      <div className={styles.formRow}>
        <TextField
          label={t("Your name")}
          required
          autoComplete="name"
          value={form.values.name}
          onChange={(v) => form.setField("name", v)}
          error={form.errorFor("name")}
        />
        <TextField
          label={t("Email")}
          required
          type="email"
          autoComplete="email"
          value={form.values.email}
          onChange={(v) => form.setField("email", v)}
          error={form.errorFor("email")}
        />
      </div>
      <TextField
        label={t("Phone")}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        value={form.values.phone ?? ""}
        onChange={(v) => form.setField("phone", v)}
        error={form.errorFor("phone")}
      />
      <TextField
        label={t("Subject")}
        required
        value={form.values.subject}
        onChange={(v) => form.setField("subject", v)}
        error={form.errorFor("subject")}
      />
      <TextArea
        label={t("Message")}
        required
        rows={6}
        value={form.values.message}
        onChange={(v) => form.setField("message", v)}
        error={form.errorFor("message")}
      />
      <p className={styles.small}>
        {t("Please don't include detailed medical information here. We'll talk about your health privately.")}
      </p>
      <div>
        <Button type="submit" loading={form.submitting} icon="mail">
          {t("Send message")}
        </Button>
      </div>
    </form>
  );
}

export function ContactScreen() {
  const t = useT();
  const site = useSite();
  const blocks = useContentBlocks("contact.");
  useDocumentTitle(t("Contact us"));
  const contact = site.data?.contact;
  const hasContact = !!(contact?.phone || contact?.whatsapp || contact?.email);

  return (
    <>
      <PageHeader
        eyebrow={t("Contact")}
        title={t("We're here to help")}
        intro={blocks.text("contact.intro") || undefined}
        crumbs={[{ label: t("Contact") }]}
      />
      <section className="section">
        <div className={`container ${styles.split}`}>
          <Card>
            <div className="stack">
              <h2>{t("Send us a message")}</h2>
              <MessageForm />
            </div>
          </Card>
          <div className="stack">
            <h2>{t("Visit & contact")}</h2>
            <QueryState query={site} loading={<LoadingState />} isEmpty={() => false}>
              {(info) => (
                <>
                  {hasContact ? (
                    <ul className={styles.contactList}>
                      {contact?.phone ? (
                        <li>
                          <a href={telLink(contact.phone)}>
                            <Icon name="phone" size={18} /> {contact.phone}
                          </a>
                        </li>
                      ) : null}
                      {contact?.whatsapp ? (
                        <li>
                          <a href={whatsappLink(contact.whatsapp)} target="_blank" rel="noopener noreferrer">
                            <Icon name="chat" size={18} /> {t("Chat on WhatsApp")}
                            <span className="visually-hidden"> {t("(opens in a new tab)")}</span>
                          </a>
                        </li>
                      ) : null}
                      {contact?.email ? (
                        <li>
                          <a href={mailtoLink(contact.email)}>
                            <Icon name="mail" size={18} /> {contact.email}
                          </a>
                        </li>
                      ) : null}
                    </ul>
                  ) : (
                    <Notice tone="info">{t("Contact details will be added soon.")}</Notice>
                  )}
                  <div className={styles.branches}>
                    {info.branches.map((b) => (
                      <Card key={b.id} as="article">
                        <address className={styles.branch}>
                          <h3 className={styles.branchTitle}>{b.name}</h3>
                          <span>{[b.addressLine, b.city, b.state, b.pincode].filter(Boolean).join(", ")}</span>
                          {b.openingHours ? (
                            <>
                              <strong>{t("Opening hours")}</strong>
                              {lines(b.openingHours).map((l) => (
                                <span key={l} className={styles.small}>
                                  {l}
                                </span>
                              ))}
                            </>
                          ) : null}
                          {b.phone ? (
                            <a href={telLink(b.phone)}>
                              <Icon name="phone" size={16} /> {b.phone}
                            </a>
                          ) : null}
                          {b.mapUrl ? (
                            <a href={b.mapUrl} target="_blank" rel="noopener noreferrer">
                              <Icon name="mapPin" size={16} /> {t("Get directions on Google Maps")}
                              <span className="visually-hidden"> {t("(opens in a new tab)")}</span>
                            </a>
                          ) : null}
                        </address>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </QueryState>
          </div>
        </div>
      </section>
    </>
  );
}
