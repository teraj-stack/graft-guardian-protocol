import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { decode } from "blurhash";

/** Decode a BlurHash string into a small <canvas> placeholder. */
function BlurHashCanvas({ hash, className }: { hash: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const w = 32, h = 32;
    try {
      const pixels = decode(hash, w, h);
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const img = ctx.createImageData(w, h);
      img.data.set(pixels);
      ctx.putImageData(img, 0, 0);
    } catch {
      /* invalid hash — leave blank */
    }
  }, [hash]);
  return <canvas ref={ref} width={32} height={32} aria-hidden="true" className={className} />;
}

/**
 * Lekki, wydajny kafel z animacją wideo (mp4 + webm).
 * - lazy-load przez IntersectionObserver (preload="none")
 * - autoplay tylko, gdy widoczny w viewporcie
 * - respektuje prefers-reduced-motion (pokazuje sam poster/pierwszą klatkę)
 * - muted, loop, playsInline — gotowe pod iOS/Android
 */
export function AnimatedTile({
  src,
  alt,
  poster,
  lqip,
  aspect = "16/9",
  className = "",
}: {
  /** Bazowa nazwa pliku w /public/videos (bez rozszerzenia), np. "evidence-1" */
  src: string;
  alt: string;
  /** Ścieżka do statycznego placeholdera (np. /videos/evidence-1.jpg) */
  poster?: string;
  /** BlurHash (~28 chars) — dekodowany na canvas jako natychmiastowy podgląd przed JPG */
  lqip?: string;
  /** CSS aspect-ratio, np. "16/9" lub "1/1" */
  aspect?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const shouldPlayRef = useRef(false);

  // Detect reduced motion / autoplay-off — keep poster as the final state.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Delay spinner so it doesn't flash on fast connections.
  // Stop spinning once we've decided to show the static fallback.
  useEffect(() => {
    if (videoReady || fallback || reducedMotion) {
      setShowSpinner(false);
      return;
    }
    const t = setTimeout(() => setShowSpinner(true), 300);
    return () => clearTimeout(t);
  }, [videoReady, fallback, reducedMotion]);

  // Watchdog: if the video never reports loadeddata within 8s after sources
  // mount, treat as failed and keep the poster as the persistent fallback.
  useEffect(() => {
    if (!loaded || videoReady || fallback) return;
    const t = setTimeout(() => {
      if (!ref.current) return;
      // readyState < HAVE_CURRENT_DATA (2) means we still have no frame.
      if (ref.current.readyState < 2) setFallback(true);
    }, 8000);
    return () => clearTimeout(t);
  }, [loaded, videoReady, fallback]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (reduce) {
              // Honor reduced motion / autoplay-off: keep poster as final state.
              shouldPlayRef.current = false;
              continue;
            }
            shouldPlayRef.current = true;
            setLoaded(true);
            // If sources are already in the DOM (subsequent intersections), play now.
            if (el.querySelector("source")) {
              el.play().catch(() => setFallback(true));
            }
          } else {
            shouldPlayRef.current = false;
            el.pause();
          }
        }
      },
      { rootMargin: "200px 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // First time sources mount into the DOM, run resource selection then play.
  useEffect(() => {
    if (!loaded) return;
    const el = ref.current;
    if (!el) return;
    try { el.load(); } catch {}
    if (shouldPlayRef.current) {
      el.play().catch(() => {});
    }
  }, [loaded]);


  return (
    <div
      className={`relative overflow-hidden rounded-sm border border-border/60 bg-secondary/40 ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {lqip && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${posterReady || videoReady ? "opacity-0" : "opacity-100"}`}
        >
          <BlurHashCanvas
            hash={lqip}
            className="h-full w-full scale-110 blur-lg"
          />
        </div>
      )}
      {poster && (
        <img
          src={poster}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setPosterReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${videoReady ? "opacity-0" : posterReady ? "opacity-100" : "opacity-0"}`}
        />
      )}
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        aria-label={alt}
        onLoadedData={() => setVideoReady(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${videoReady ? "opacity-100" : "opacity-0"}`}
      >
        {loaded && (
          <>
            <source src={`/videos/${src}.webm`} type="video/webm" />
            <source src={`/videos/${src}.mp4`} type="video/mp4" />
          </>
        )}
      </video>
      {/* Loading state — visible while video buffers on slow connections */}
      {showSpinner && !videoReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/40 text-white transition-opacity duration-300">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          <span className="text-sm font-medium tracking-wide">Przygotowanie animacji…</span>
        </div>
      )}
    </div>
  );
}
