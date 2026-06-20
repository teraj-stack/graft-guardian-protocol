import { useEffect, useRef, useState } from "react";

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
  aspect = "16/9",
  className = "",
}: {
  /** Bazowa nazwa pliku w /public/videos (bez rozszerzenia), np. "evidence-1" */
  src: string;
  alt: string;
  /** Ścieżka do statycznego placeholdera (np. /videos/evidence-1.jpg) */
  poster?: string;
  /** CSS aspect-ratio, np. "16/9" lub "1/1" */
  aspect?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setLoaded(true);
            if (!reduce) el.play().catch(() => {});
          } else {
            el.pause();
          }
        }
      },
      { rootMargin: "200px 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-sm border border-border/60 bg-secondary/40 ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {poster && (
        <img
          src={poster}
          alt={alt}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${videoReady ? "opacity-0" : "opacity-100"}`}
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
    </div>
  );
}
