import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/noto-sans-tamil/400.css";
import "@fontsource/noto-sans-tamil/600.css";
import "@fontsource/noto-serif-tamil/500.css";
import "./styles/tokens.css";
import "./styles/global.css";
import { App } from "./app/App";
import { createWebRuntime } from "./app/bootstrap";
import { hideSplash } from "./app/splash";

const root = createRoot(document.getElementById("root")!);

createWebRuntime()
  .then((runtime) => {
    root.render(
      <StrictMode>
        <App runtime={runtime} />
      </StrictMode>,
    );
    // Let the first screen paint underneath, then fade the loading screen away.
    requestAnimationFrame(() => requestAnimationFrame(hideSplash));
  })
  .catch((error: unknown) => {
    // Misconfiguration (e.g. live mode without a base URL) — show it plainly instead of a blank page.
    console.error(error);
    root.render(
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Configuration problem</h1>
        <p>{error instanceof Error ? error.message : String(error)}</p>
      </main>,
    );
    hideSplash();
  });
