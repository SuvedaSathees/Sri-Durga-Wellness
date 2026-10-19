/** Expo inlines EXPO_PUBLIC_* variables at build time (see .env.example). */
declare const process: { env: Record<string, string | undefined> };
/** Metro bundles images and other assets referenced with require(). */
declare function require(path: string): number;
