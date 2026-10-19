/**
 * Silent background clip for the home banner. The still image stays until the clip actually plays.
 * Visitors who prefer reduced motion, use data saver or are on 2G never download it. There is no
 * visible control on the banner; a pause button appears for keyboard users when they Tab to it
 * (WCAG 2.2.2), and the choice is remembered for the visit.
 */
import { useEffect, useRef, useState } from "react";
import { useT } from "@sdw/controllers";
import { Icon } from "../../../components/ui";
import { sessionFlag } from "../../../platform/storage";
import styles from "./Hero.module.css";

const CLIPS = {
  wide: { mp4: "/videos/hero-forest.mp4", webm: "/videos/hero-forest.webm" },
  phone: { mp4: "/videos/hero-forest-mobile.mp4", webm: "/videos/hero-forest-mobile.webm" },
};
const PAUSED_KEY = "sdw.heroPaused";

function shouldLoad(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !(c?.saveData || (c?.effectiveType && /(^|-)2g$/.test(c.effectiveType)));
}

function pick(): string | null {
  const files = window.matchMedia("(max-width: 640px)").matches ? CLIPS.phone : CLIPS.wide;
  const probe = document.createElement("video");
  if (probe.canPlayType('video/mp4; codecs="avc1.640028"')) return files.mp4;
  if (probe.canPlayType('video/webm; codecs="vp9"')) return files.webm;
  return probe.canPlayType("video/mp4") ? files.mp4 : null;
}

export function HeroVideo() {
  const t = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [shown, setShown] = useState(false);
  const userPaused = useRef(false);

  useEffect(() => {
    if (!shouldLoad()) return;
    userPaused.current = sessionFlag.get(PAUSED_KEY);
    const start = () => setSrc(pick());
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    video.muted = true;
    const play = () => {
      if (!userPaused.current && !document.hidden) video.play().catch(() => setPlaying(false));
    };
    const onPlaying = () => {
      setPlaying(true);
      setShown(true);
    };
    const onPause = () => setPlaying(false);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    const observer = new IntersectionObserver(([e]) => (e?.isIntersecting ? play() : video.pause()), {
      threshold: 0.05,
    });
    observer.observe(video);
    const onVisibility = () => (document.hidden ? video.pause() : play());
    document.addEventListener("visibilitychange", onVisibility);
    play();
    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [src]);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    const pause = !video.paused;
    userPaused.current = pause;
    sessionFlag.set(PAUSED_KEY, pause);
    if (pause) video.pause();
    else void video.play().catch(() => undefined);
  };

  if (!src) return null;
  return (
    <>
      <video
        ref={ref}
        className={`${styles.video} ${shown ? styles.videoShown : ""}`}
        src={src}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
      />
      <button
        type="button"
        className={styles.videoToggle}
        onClick={toggle}
        aria-label={playing ? t("Pause background video") : t("Play background video")}
      >
        <Icon name={playing ? "pause" : "play"} size={16} />
      </button>
    </>
  );
}
