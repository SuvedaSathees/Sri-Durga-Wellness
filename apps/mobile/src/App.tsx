import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppProvider, type AppRuntime } from "@sdw/controllers";
import { createMobileRuntime } from "./app/bootstrap";
import { Text } from "./components/ui/Text";
import { linking } from "./navigation/linking";
import { RootNavigator } from "./navigation/RootNavigator";
import { theme } from "./theme";

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.color.primary,
    background: theme.color.bg,
    card: theme.color.surface,
    text: theme.color.text,
    border: theme.color.borderStrong,
    notification: theme.color.primary,
  },
};

export function App() {
  const [runtime, setRuntime] = useState<AppRuntime | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createMobileRuntime()
      .then(setRuntime)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) {
    // Misconfiguration (e.g. live mode without a base URL) — shown plainly, never a blank screen.
    return (
      <View style={styles.center}>
        <Text variant="h2">Configuration problem</Text>
        <Text>{error}</Text>
      </View>
    );
  }
  if (!runtime) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.color.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider runtime={runtime}>
        <NavigationContainer theme={navigationTheme} linking={linking}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: theme.color.bg,
  },
});
