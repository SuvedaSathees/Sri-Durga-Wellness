/**
 * Wraps private screens: shows a spinner while the session is restored, a sign-in prompt when
 * signed out, and the screen when signed in. After signing in, the prompt simply disappears.
 */
import type { ReactNode } from "react";
import { useNavigation } from "@react-navigation/native";
import { useSession, useT } from "@sdw/controllers";
import type { RootNavigation } from "../../navigation/types";
import { Button } from "./Button";
import { EmptyView, LoadingView } from "./Feedback";
import { Stack } from "./Screen";

export function AuthGate({ children, reason }: { children: ReactNode; reason?: string }) {
  const { status } = useSession();
  const navigation = useNavigation<RootNavigation>();
  const t = useT();
  if (status === "loading") return <LoadingView />;
  if (status === "signedOut")
    return (
      <EmptyView
        icon="person-circle-outline"
        title={t("Please sign in to continue")}
        body={reason ?? t("Your bookings, orders, classes and courses are kept safely in your account.")}
        action={
          <Stack gap={10}>
            <Button onPress={() => navigation.navigate("Login")} icon="log-in-outline">
              {t("Log in")}
            </Button>
            <Button variant="secondary" onPress={() => navigation.navigate("Register")}>
              {t("Create an account")}
            </Button>
          </Stack>
        }
      />
    );
  return <>{children}</>;
}
