/** EN | தமிழ் switch. Changes the whole interface and the content language the API returns. */
import { useLocale, useT } from "@sdw/controllers";
import type { Locale } from "@sdw/core";
import styles from "./LanguageToggle.module.css";

const OPTIONS: Array<{ value: Locale; short: string; name: string; lang: string }> = [
  { value: "en", short: "EN", name: "English", lang: "en" },
  { value: "ta", short: "தமிழ்", name: "தமிழ் (Tamil)", lang: "ta" },
];

export function LanguageToggle({ className }: { className?: string }) {
  const [locale, setLocale] = useLocale();
  const t = useT();
  return (
    <div className={[styles.toggle, className ?? ""].join(" ")} role="group" aria-label={`${t("Language")} · மொழி`}>
      <span className={styles.thumb} data-side={locale === "ta" ? "end" : "start"} aria-hidden="true" />
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.lang}
          className={styles.option}
          aria-pressed={locale === o.value}
          aria-label={o.name}
          onClick={() => setLocale(o.value)}
        >
          {o.short}
        </button>
      ))}
    </div>
  );
}
