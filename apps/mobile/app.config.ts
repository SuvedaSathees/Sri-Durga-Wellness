/**
 * Expo app configuration. API settings come from EXPO_PUBLIC_* variables (see .env.example) and are
 * read in src/config/env.ts — nothing secret belongs here, because EXPO_PUBLIC_* values are bundled
 * into the app.
 */
type ExpoConfig = Record<string, unknown>;

const config: ExpoConfig = {
  name: "Sri Durga Wellness",
  slug: "sri-durga-wellness",
  scheme: "sridurgawellness",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  backgroundColor: "#faf8f2",
  splash: { image: "./assets/splash.png", resizeMode: "contain", backgroundColor: "#faf8f2" },
  ios: {
    bundleIdentifier: "com.sridurgawellness.app",
    supportsTablet: true,
    infoPlist: { LSApplicationQueriesSchemes: ["upi", "tez", "phonepe", "paytmmp", "whatsapp"] },
  },
  android: {
    package: "com.sridurgawellness.app",
    adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: "#344a3d" },
  },
  plugins: ["expo-secure-store", "expo-localization", "expo-web-browser"],
};

export default config;
