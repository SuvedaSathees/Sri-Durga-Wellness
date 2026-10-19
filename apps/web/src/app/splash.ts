/**
 * Fades out the loading screen that index.html shows on every page load or refresh.
 * It stays up for a short minimum so the opening animation is seen (much shorter with reduced
 * motion), then fades and is removed. Client-side navigation never brings it back.
 */
const MIN_VISIBLE_MS = 3200;
const MIN_VISIBLE_REDUCED_MS = 250;
const FADE_MS = 700;

declare global {
  interface Window {
    __sdwSplashStart?: number;
  }
}

export function hideSplash(): void {
  const el = document.getElementById("sdw-splash");
  if (!el || el.classList.contains("sdw-leaving")) return;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const shown = Date.now() - (window.__sdwSplashStart ?? Date.now());
  const wait = Math.max(0, (reduced ? MIN_VISIBLE_REDUCED_MS : MIN_VISIBLE_MS) - shown);
  window.setTimeout(() => {
    el.classList.add("sdw-leaving");
    el.setAttribute("aria-hidden", "true");
    window.setTimeout(() => el.remove(), reduced ? 50 : FADE_MS);
  }, wait);
}
