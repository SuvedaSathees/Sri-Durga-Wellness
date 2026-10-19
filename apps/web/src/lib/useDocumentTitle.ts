import { useEffect } from "react";
import { useSite } from "@sdw/controllers";

/** Sets the browser tab title: "Page — Clinic name", or the clinic name and tagline on the home page. */
export function useDocumentTitle(title: string | null | undefined) {
  const site = useSite().data;
  useEffect(() => {
    const name = site?.clinicName ?? "Sri Durga Wellness";
    document.title = title ? `${title} — ${name}` : site?.tagline ? `${name} — ${site.tagline}` : name;
  }, [title, site?.clinicName, site?.tagline]);
}
