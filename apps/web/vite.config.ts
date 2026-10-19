import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Environment variables are read in src/config/env.ts (VITE_* only). Nothing secret belongs here:
// everything prefixed VITE_ is visible to anyone who opens the site.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react()],
    server: { port: 5173 },
    preview: { port: 4173 },
    build: {
      sourcemap: env.VITE_APP_ENV !== "production",
      target: "es2022",
    },
  };
});
