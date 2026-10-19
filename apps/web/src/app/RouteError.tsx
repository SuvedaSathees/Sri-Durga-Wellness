import { isRouteErrorResponse, useRouteError } from "react-router";
import { useT } from "@sdw/controllers";
import { ButtonLink, EmptyState, ErrorState } from "../components/ui";

/** Shown when a screen fails to load or throws (for example after a new deployment). */
export function RouteError() {
  const error = useRouteError();
  const t = useT();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="container section">
        <EmptyState
          icon="leaf"
          title={t("We couldn't find that page")}
          action={<ButtonLink to="/">{t("Go to the homepage")}</ButtonLink>}
        >
          {t("The link may be out of date, or the page may have moved.")}
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="container section">
      <ErrorState error={error} title={t("This page didn't load properly")} onRetry={() => window.location.reload()} />
    </div>
  );
}
