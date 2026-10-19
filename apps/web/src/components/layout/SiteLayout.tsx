import { useEffect } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { useConfig, useLocale, useSite, useT } from "@sdw/controllers";
import { languageTag } from "@sdw/core";
import { readPreviewUi } from "../../config/env";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import styles from "./SiteLayout.module.css";

/**
 * Notice shown while the API serves sample data: a live backend still using placeholders, or mock
 * mode (unless the build turns the preview UI off with VITE_PREVIEW_UI=off).
 */
function SampleBanner() {
  const t = useT();
  const site = useSite().data;
  const config = useConfig();
  const show = config.apiMode === "mock" ? readPreviewUi() : !!site?.isSampleContent;
  if (!show) return null;
  return (
    <p className={styles.sample}>
      {t("Preview · sample content — to be replaced with clinic-approved details before launch")}
    </p>
  );
}

export function SiteLayout() {
  const t = useT();
  const [locale] = useLocale();

  useEffect(() => {
    document.documentElement.lang = languageTag(locale);
  }, [locale]);

  return (
    <div className={styles.shell}>
      <a href="#main" className="skip-link">
        {t("Skip to main content")}
      </a>
      <SampleBanner />
      <SiteHeader />
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}
