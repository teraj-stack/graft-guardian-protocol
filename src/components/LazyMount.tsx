import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders children only once they scroll near the viewport.
 * Reduces initial JS work, DOM size, and defers any data fetching
 * triggered by below-the-fold sections.
 *
 * When `children` is a React.lazy() component, the dynamic import only
 * starts after intersection — i.e. true per-section code splitting.
 * A Suspense boundary is included with `minHeight` as the fallback to
 * prevent layout shift while the chunk is in flight.
 */
export function LazyMount({
  children,
  rootMargin = "400px",
  minHeight = 400,
}: {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, rootMargin]);

  return (
    <div ref={ref} style={shown ? undefined : { minHeight }}>
      {shown ? (
        <Suspense fallback={<div style={{ minHeight }} aria-hidden />}>{children}</Suspense>
      ) : null}
    </div>
  );
}
