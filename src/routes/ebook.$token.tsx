import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  getPublishedChapters,
  verifyEbookAccess,
  type EbookChapter,
} from "@/lib/ebook.functions";

const TITLE = "Patient Journey — przewodnik po pierwszych 14 dniach";

const chaptersQuery = queryOptions({
  queryKey: ["ebook", "chapters"],
  queryFn: () => getPublishedChapters(),
});

export const Route = createFileRoute("/ebook/$token")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async ({ params }) => {
    const res = await verifyEbookAccess({ data: { token: params.token } });
    if (!res.valid) throw notFound();
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(chaptersQuery),
  errorComponent: () => (
    <ErrorState message="Nie udało się załadować e-booka. Odśwież stronę." />
  ),
  notFoundComponent: () => (
    <ErrorState
      message="Link wygasł lub jest nieprawidłowy. Wypełnij formularz ponownie, aby otrzymać nowy link."
    />
  ),
  component: EbookPage,
});

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">Patient Journey</h1>
      <p className="mt-4 text-muted-foreground">{message}</p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm hover:bg-secondary"
      >
        ← Wróć na stronę główną
      </Link>
    </div>
  );
}

/* ---------- Tiny markdown renderer (bold, lists, paragraphs) ---------- */

function renderMarkdown(md: string) {
  const lines = md.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className="my-4 list-disc space-y-1 pl-6 text-sm md:text-base"
      >
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };
  const flushPara = () => {
    if (paraBuffer.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="my-3 text-sm leading-relaxed md:text-base">
        {renderInline(paraBuffer.join(" "))}
      </p>
    );
    paraBuffer = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^[-•] /.test(line)) {
      flushPara();
      listBuffer.push(line.replace(/^[-•] /, ""));
    } else if (line.trim() === "") {
      flushList();
      flushPara();
    } else {
      flushList();
      paraBuffer.push(line);
    }
  }
  flushList();
  flushPara();
  return blocks;
}

function renderInline(text: string): React.ReactNode {
  // **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function EbookPage() {
  const { data: chapters } = useSuspenseQuery(chaptersQuery);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header — hidden on print */}
      <header className="border-b border-border/60 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
            ← Strona główna
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            Pobierz / Drukuj PDF
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 md:py-20 print:py-6">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">
          Patient Journey — Graftgen.com
        </p>
        <h1 className="mt-4 font-display text-4xl md:text-6xl">
          Przewodnik po pierwszych 14 dniach po przeszczepie włosów metodą DHI
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground">
          Protokół kliniczny oparty na EBM. Wersja {new Date().toISOString().slice(0, 10)}.
        </p>

        <div className="mt-12 space-y-12">
          {chapters.map((c: EbookChapter) => (
            <article
              key={c.id}
              id={c.slug}
              className="break-inside-avoid border-t border-border/60 pt-8 print:pt-4"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-accent">
                {c.day_label}
              </p>
              <h2 className="mt-2 font-display text-2xl md:text-3xl">
                {c.title}
              </h2>
              <div className="mt-4 text-muted-foreground">
                {renderMarkdown(c.body_md)}
              </div>
            </article>
          ))}
        </div>

        <footer className="mt-16 border-t border-border/60 pt-8 text-xs text-muted-foreground print:mt-8">
          © {new Date().getFullYear()} Graftgen.com. Materiał edukacyjny — nie zastępuje konsultacji lekarskiej.
        </footer>
      </main>

      <style>{`
        @media print {
          @page { margin: 18mm; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}
