import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeletons matched 1:1 to the layout of the lazy-loaded sections in
 * `src/routes/-sections/below-fold.tsx`. They mirror Section's spacing
 * (border-b, max-w-6xl, px-6, py-20 md:py-28) and the eyebrow + header +
 * grid rhythm so the fallback occupies the same box as the real section.
 * This keeps CLS ≈ 0 while the chunk is in flight.
 */

function SectionShell({
  children,
  minHeight,
}: {
  children: React.ReactNode;
  minHeight: number;
}) {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="border-b border-border/60"
      style={{ minHeight }}
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">{children}</div>
    </section>
  );
}

function Header({ titleW = "60%" }: { titleW?: string }) {
  return (
    <>
      <Skeleton className="mb-10 h-3 w-40" />
      <div className="mb-12 max-w-3xl space-y-4">
        <Skeleton className="h-10 md:h-12" style={{ width: titleW }} />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </>
  );
}

function CardBlock({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-editorial)] md:p-8">
      <Skeleton className="mb-6 h-7 w-2/3" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-4/6" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

export function MicrobiomeSkeleton() {
  return (
    <SectionShell minHeight={600}>
      <Header />
      <div className="grid gap-6 md:grid-cols-2">
        <CardBlock lines={5} />
        <CardBlock lines={5} />
      </div>
    </SectionShell>
  );
}

export function TimelineSkeleton() {
  return (
    <SectionShell minHeight={800}>
      <Header titleW="50%" />
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[80px_1fr] gap-6 rounded-sm border border-border bg-card p-5"
          >
            <Skeleton className="h-6 w-16" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function JourneySkeleton() {
  return (
    <SectionShell minHeight={600}>
      <Header />
      <div className="grid gap-6 md:grid-cols-3">
        <CardBlock />
        <CardBlock />
        <CardBlock />
      </div>
    </SectionShell>
  );
}

export function EvidenceBasementSkeleton() {
  return (
    <SectionShell minHeight={800}>
      <Header titleW="55%" />
      <div className="mb-8 flex gap-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardBlock key={i} lines={4} />
        ))}
      </div>
    </SectionShell>
  );
}

export function PricingSkeleton() {
  return (
    <SectionShell minHeight={700}>
      <Header titleW="45%" />
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm border border-border bg-card p-6 md:p-8"
          >
            <Skeleton className="mb-4 h-6 w-1/2" />
            <Skeleton className="mb-6 h-10 w-2/3" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-3 w-full" />
              ))}
            </div>
            <Skeleton className="mt-6 h-10 w-full" />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function FAQSkeleton() {
  return (
    <SectionShell minHeight={500}>
      <Header titleW="40%" />
      <div className="divide-y divide-border border-y border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-6">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-6 w-6" />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function CTASkeleton() {
  return (
    <SectionShell minHeight={300}>
      <div className="flex flex-col items-start gap-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-2 h-11 w-44" />
      </div>
    </SectionShell>
  );
}

export function ContactSkeleton() {
  return (
    <SectionShell minHeight={700}>
      <Header titleW="35%" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-11 w-40" />
        </div>
        <div className="space-y-4">
          <CardBlock lines={6} />
          <CardBlock lines={3} />
        </div>
      </div>
    </SectionShell>
  );
}
