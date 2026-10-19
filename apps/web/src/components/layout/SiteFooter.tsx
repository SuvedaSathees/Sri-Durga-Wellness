import { Link } from "react-router";
import { useContentBlocks, useSite, useT } from "@sdw/controllers";
import { lines, mailtoLink, telLink, whatsappLink } from "@sdw/core";
import { Icon } from "../ui";
import { MAIN_NAV, POLICY_NAV } from "./navigation";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  const t = useT();
  const site = useSite().data;
  const blocks = useContentBlocks("footer.");
  const contact = site?.contact;
  const hasContact = !!(contact?.phone || contact?.whatsapp || contact?.email);
  const name = site?.clinicName ?? "Sri Durga Wellness";

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.about}>
          <p className={styles.brand}>{name}</p>
          {blocks.text("footer.about") ? <p>{blocks.text("footer.about")}</p> : null}
        </div>

        <nav aria-label={t("Footer")}>
          <h2 className={styles.heading}>{t("Explore")}</h2>
          <ul className={styles.links}>
            {MAIN_NAV.slice(1).map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{t(item.label)}</Link>
              </li>
            ))}
            <li>
              <Link to="/free-consultation">{t("Free consultation")}</Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className={styles.heading}>{t("Visit & contact")}</h2>
          <div className={styles.contact}>
            {site?.branches.map((b) => (
              <address key={b.id} className={styles.branch}>
                <strong>{b.name}</strong>
                <span>{[b.addressLine, b.city, b.state, b.pincode].filter(Boolean).join(", ")}</span>
                {lines(b.openingHours).map((l) => (
                  <span key={l} className="muted">
                    {l}
                  </span>
                ))}
              </address>
            ))}
            {hasContact ? (
              <ul className={styles.links}>
                {contact?.phone ? (
                  <li>
                    <a href={telLink(contact.phone)}>
                      <Icon name="phone" size={16} /> {contact.phone}
                    </a>
                  </li>
                ) : null}
                {contact?.whatsapp ? (
                  <li>
                    <a href={whatsappLink(contact.whatsapp)} target="_blank" rel="noopener noreferrer">
                      <Icon name="chat" size={16} /> {t("Chat on WhatsApp")}
                    </a>
                  </li>
                ) : null}
                {contact?.email ? (
                  <li>
                    <a href={mailtoLink(contact.email)}>
                      <Icon name="mail" size={16} /> {contact.email}
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="muted">{t("Contact details will be added soon.")}</p>
            )}
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <ul className={styles.policies}>
          {POLICY_NAV.map((p) => (
            <li key={p.to}>
              <Link to={p.to}>{t(p.label)}</Link>
            </li>
          ))}
        </ul>
        <p className="muted">{t("© {year} {name}. All rights reserved.", { year: new Date().getFullYear(), name })}</p>
      </div>
    </footer>
  );
}
