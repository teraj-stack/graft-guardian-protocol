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
  aspect = "16/9",
  className = "",
}: {
  /** Bazowa nazwa pliku w /public/videos (bez rozszerzenia), np. "evidence-1" */
  src: string;
  alt: string;
  /** CSS aspect-ratio, np. "16/9" lub "1/1" */
  aspect?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [loaded, setLoaded] = useState(false);

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
      className={`overflow-hidden rounded-sm border border-border/60 bg-secondary/40 ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        aria-label={alt}
        className="h-full w-full object-cover"
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
