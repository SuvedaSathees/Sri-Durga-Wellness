/** Guards private routes: waits for the session, then sends signed-out visitors to sign in. */
import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "@sdw/controllers";
import { LoadingState } from "../components/ui";

export function RequireAuth() {
  const { status } = useSession();
  const location = useLocation();
  if (status === "loading") return <LoadingState />;
  if (status === "signedOut") {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return <Outlet />;
}

/** Only follow `next` to our own pages (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
