import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders children only once they scroll near the viewport.
 * Reduces initial JS work, DOM size, and defers any data fetching
 * triggered by below-the-fold sections.
 *
 * When `children` is a React.lazy() component, the dynamic import only
 * starts after intersection — i.e. true per-section code splitting.
 *
 * `fallback` is rendered both before intersection AND during Suspense
 * while the chunk is in flight. Provide a section-shaped skeleton sized
 * to match the real content so layout shift (CLS) stays at zero.
 */
export function LazyMount({
  children,
  rootMargin = "400px",
  minHeight = 400,
  fallback,
}: {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: number;
  fallback?: ReactNode;
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

  const placeholder =
    fallback ?? <div style={{ minHeight }} aria-hidden />;

  return (
    <div ref={ref} style={shown ? undefined : { minHeight }}>
      {shown ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}
    </div>
  );
}
