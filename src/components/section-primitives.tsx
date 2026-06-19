import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  children,
}: {
  id: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="mb-10 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {eyebrow}
        </p>
        {children}
      </div>
    </section>
  );
}

export function SectionHeader({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div className="mb-12 max-w-3xl">
      <h2 className="font-display text-3xl break-words md:text-5xl">{title}</h2>
      {lead && <div className="mt-6 text-base text-muted-foreground md:text-lg">{lead}</div>}
    </div>
  );
}

export function Para({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{children}</p>;
}

export function Card({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-editorial)] md:p-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="font-display text-2xl break-words md:text-3xl">{title}</h3>
        {badge && (
          <span className="shrink-0 rounded-sm border border-accent/40 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-accent">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-4 text-sm text-muted-foreground md:text-base">{children}</div>
    </article>
  );
}

export function Mech({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 border-l-2 border-accent/60 bg-secondary/40 p-3 text-xs italic text-foreground/80 md:text-sm">
      {children}
    </p>
  );
}
