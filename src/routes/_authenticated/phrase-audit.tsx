import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { scanEbookForPhrase, type EbookPhraseHit } from "@/lib/phrase-audit.functions";

export const Route = createFileRoute("/_authenticated/phrase-audit")({
  head: () => ({
    meta: [
      { title: "Audyt frazy — Graftgen.com" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PhraseAuditPage,
});

// Bundle source files as raw text at build time so we can grep client-side.
// Exclude generated route tree (no default export when imported as ?raw) and this page itself.
const SOURCE_FILES = import.meta.glob(
  [
    "/src/**/*.{ts,tsx,js,jsx,md,mdx,html,css}",
    "!/src/routeTree.gen.ts",
    "!/src/routes/_authenticated/phrase-audit.tsx",
  ],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

type SourceHit = {
  file: string;
  line: number;
  column: number;
  snippet: string;
};

function scanSource(phrase: string): SourceHit[] {
  if (phrase.length < 2) return [];
  const needle = phrase.toLowerCase();
  const out: SourceHit[] = [];
  for (const [path, content] of Object.entries(SOURCE_FILES)) {
    // Skip the audit page itself (would always match) and generated files.
    if (path.includes("routeTree.gen") || path.endsWith("phrase-audit.tsx")) continue;
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      const idx = line.toLowerCase().indexOf(needle);
      if (idx >= 0) {
        out.push({
          file: path.replace(/^\//, ""),
          line: i + 1,
          column: idx + 1,
          snippet: line.trim().slice(0, 280),
        });
      }
    });
  }
  return out;
}

// ---------- Snapshot (baseline) persistence ----------
type Snapshot = {
  phrase: string;
  name: string; // human-readable date label
  savedAt: string; // ISO
  scope: { ui: number; ebook: number };
  source: string[]; // sourceKey()
  ebook: string[]; // ebookKey()
};

const SNAP_LS_PREFIX = "phrase-audit:snapshot:v1:";
const INDEX_LS_KEY = "phrase-audit:snapshot-index:v1";
const sourceKey = (h: SourceHit) => `${h.file}:${h.line}:${h.column}`;
const ebookKey = (h: EbookPhraseHit) => `${h.slug}:${h.line}:${h.column}`;

function loadSnapshot(phrase: string): Snapshot | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SNAP_LS_PREFIX + phrase.toLowerCase());
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
}

function loadIndex(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_LS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function persistSnapshot(snap: Snapshot) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SNAP_LS_PREFIX + snap.phrase.toLowerCase(), JSON.stringify(snap));
    const idx = loadIndex();
    const key = snap.phrase.toLowerCase();
    if (!idx.includes(key)) {
      idx.push(key);
      localStorage.setItem(INDEX_LS_KEY, JSON.stringify(idx));
    }
  } catch {
    /* noop */
  }
}

function formatBaselineName(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `Baseline ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const QUICK_PHRASES = [
  "Faza intensywna",
  "Graftgen",
  "FUE",
  "Cennik",
  "48 godzin",
] as const;


function PhraseAuditPage() {
  const [phrase, setPhrase] = useState("Faza intensywna");
  const [activePhrase, setActivePhrase] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [savedIndex, setSavedIndex] = useState<string[]>([]);
  const [savingPhrase, setSavingPhrase] = useState<string | null>(null);

  const scanEbook = useServerFn(scanEbookForPhrase);
  const ebookScan = useMutation({
    mutationFn: (p: string) => scanEbook({ data: { phrase: p } }),
  });

  const sourceHits = useMemo(
    () => (activePhrase ? scanSource(activePhrase) : []),
    [activePhrase],
  );

  const ebookHits: EbookPhraseHit[] = ebookScan.data?.hits ?? [];
  const totalChapters = ebookScan.data?.totalChapters ?? 0;

  useEffect(() => {
    setSavedIndex(loadIndex());
  }, []);

  // Load snapshot for active phrase from localStorage.
  useEffect(() => {
    if (!activePhrase) return;
    setSnapshot(loadSnapshot(activePhrase));
  }, [activePhrase]);

  const buildSnapshot = (
    p: string,
    src: SourceHit[],
    eb: EbookPhraseHit[],
  ): Snapshot => {
    const now = new Date();
    return {
      phrase: p,
      name: formatBaselineName(now),
      savedAt: now.toISOString(),
      scope: { ui: src.length, ebook: eb.length },
      source: src.map(sourceKey),
      ebook: eb.map(ebookKey),
    };
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phrase.trim();
    if (trimmed.length < 2) return;
    setActivePhrase(trimmed);
    setSnapshot(loadSnapshot(trimmed));
    ebookScan.mutate(trimmed);
  };

  const saveAsBaseline = () => {
    if (!activePhrase || ebookScan.isPending) return;
    const snap = buildSnapshot(activePhrase, sourceHits, ebookHits);
    persistSnapshot(snap);
    setSnapshot(snap);
    setSavedIndex(loadIndex());
  };

  // Scan + save baseline for a phrase without disturbing the active view.
  const saveBaselineFor = async (p: string) => {
    setSavingPhrase(p);
    try {
      const src = scanSource(p);
      const res = await scanEbook({ data: { phrase: p } });
      const snap = buildSnapshot(p, src, res.hits);
      persistSnapshot(snap);
      setSavedIndex(loadIndex());
      if (activePhrase && activePhrase.toLowerCase() === p.toLowerCase()) {
        setSnapshot(snap);
      }
    } finally {
      setSavingPhrase(null);
    }
  };


  const diff = useMemo(() => {
    if (!snapshot) return null;
    const currentSource = new Set(sourceHits.map(sourceKey));
    const currentEbook = new Set(ebookHits.map(ebookKey));
    const prevSource = new Set(snapshot.source);
    const prevEbook = new Set(snapshot.ebook);
    return {
      sourceAdded: [...currentSource].filter((k) => !prevSource.has(k)),
      sourceRemoved: [...prevSource].filter((k) => !currentSource.has(k)),
      ebookAdded: [...currentEbook].filter((k) => !prevEbook.has(k)),
      ebookRemoved: [...prevEbook].filter((k) => !currentEbook.has(k)),
    };
  }, [snapshot, sourceHits, ebookHits]);

  const total = sourceHits.length + ebookHits.length;
  const prevTotal = snapshot ? snapshot.source.length + snapshot.ebook.length : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Narzędzie wewnętrzne
          </p>
          <h1 className="mt-1 font-serif text-3xl">Audyt frazy — UI + e-book</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Skanuje cały kod źródłowy aplikacji (komponenty, treści, FAQ) oraz rozdziały
            e-booka w bazie danych pod kątem dokładnej frazy (niewrażliwe na wielkość liter).
          </p>
        </div>
        <Link
          to="/brand-audit"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Audyt marki →
        </Link>
      </div>

      <form onSubmit={onSubmit} className="mb-6 flex flex-wrap items-center gap-2">
        <input
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder='np. "Faza intensywna to 14 dni"'
          className="min-w-[280px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          aria-label="Fraza do wyszukania"
        />
        <button
          type="submit"
          disabled={ebookScan.isPending}
          className="rounded-md bg-[#c8b06c] px-4 py-2 text-sm font-medium text-[#0c121b] hover:bg-[#d4bf7d] disabled:opacity-50"
        >
          {ebookScan.isPending ? "Skanuję…" : "Skanuj"}
        </button>
        {(["Faza intensywna", "Graftgen", "FUE", "Cennik", "48 godzin"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setPhrase(s);
              setActivePhrase(s);
              ebookScan.mutate(s);
            }}
            className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
          >
            {s}
          </button>
        ))}
      </form>

      {!activePhrase ? (
        <div className="rounded-md border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Wpisz frazę i kliknij „Skanuj", aby uzyskać kompletne wyniki z UI oraz e-booka.
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Stat label="Łącznie wystąpień" value={total} accent />
            <Stat label="W kodzie UI" value={sourceHits.length} />
            <Stat
              label="W e-booku"
              value={ebookScan.isPending ? "…" : ebookHits.length}
              hint={
                ebookScan.isError
                  ? "błąd zapytania"
                  : `${totalChapters} rozdziałów przeskanowanych`
              }
            />
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
            <span className="font-medium">Porównanie z poprzednim skanem:</span>
            {snapshot ? (
              <>
                <span className="text-muted-foreground">
                  baseline {new Date(snapshot.savedAt).toLocaleString("pl-PL")} ({prevTotal}{" "}
                  → {total},{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{(diff?.sourceAdded.length ?? 0) + (diff?.ebookAdded.length ?? 0)}
                  </span>{" "}
                  /{" "}
                  <span className="text-rose-600 dark:text-rose-400">
                    −{(diff?.sourceRemoved.length ?? 0) + (diff?.ebookRemoved.length ?? 0)}
                  </span>
                  )
                </span>
                <button
                  type="button"
                  onClick={() => setCompareMode((v) => !v)}
                  className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
                >
                  {compareMode ? "Ukryj różnice" : "Pokaż różnice"}
                </button>
              </>
            ) : (
              <span className="text-muted-foreground">Brak zapisanego baseline.</span>
            )}
            <button
              type="button"
              onClick={saveAsBaseline}
              disabled={ebookScan.isPending}
              className="ml-auto rounded-md border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50"
            >
              Zapisz bieżący jako baseline
            </button>
          </div>

          {compareMode && diff ? (
            <section className="mb-8 grid gap-4 md:grid-cols-2">
              <DiffList
                title="Dodane (nowe wystąpienia)"
                tone="add"
                items={[...diff.sourceAdded, ...diff.ebookAdded]}
              />
              <DiffList
                title="Usunięte (już ich nie ma)"
                tone="remove"
                items={[...diff.sourceRemoved, ...diff.ebookRemoved]}
              />
            </section>
          ) : null}



          <section className="mb-8">
            <h2 className="mb-3 font-serif text-xl">
              UI / kod źródłowy ({sourceHits.length})
            </h2>
            {sourceHits.length === 0 ? (
              <p className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Brak wystąpień frazy „{activePhrase}" w kodzie UI.
              </p>
            ) : (
              <ul className="space-y-2">
                {sourceHits.map((h, i) => (
                  <li
                    key={`${h.file}:${h.line}:${i}`}
                    className="rounded-md border border-border bg-background p-3"
                  >
                    <div className="font-mono text-xs text-muted-foreground">
                      {h.file}:{h.line}:{h.column}
                    </div>
                    <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-2 font-mono text-xs">
                      {highlight(h.snippet, activePhrase)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl">
              E-book (baza danych) ({ebookHits.length})
            </h2>
            {ebookScan.isError ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
                Nie udało się zapytać bazy. Sprawdź, czy jesteś zalogowany.
              </p>
            ) : ebookScan.isPending ? (
              <p className="text-sm text-muted-foreground">Skanowanie rozdziałów…</p>
            ) : ebookHits.length === 0 ? (
              <p className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Brak wystąpień frazy „{activePhrase}" w {totalChapters} rozdziałach e-booka.
              </p>
            ) : (
              <ul className="space-y-2">
                {ebookHits.map((h, i) => (
                  <li
                    key={`${h.chapterId}:${h.line}:${i}`}
                    className="rounded-md border border-border bg-background p-3"
                  >
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{h.title}</span>{" "}
                      <span className="font-mono">
                        ({h.slug}:{h.line}:{h.column})
                      </span>
                    </div>
                    <pre className="mt-1 overflow-x-auto rounded bg-muted/60 p-2 font-mono text-xs">
                      {highlight(h.snippet, activePhrase)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function highlight(text: string, needle: string) {
  const lower = text.toLowerCase();
  const n = needle.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(n, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={idx} className="bg-amber-300/60 text-foreground">
        {text.slice(idx, idx + needle.length)}
      </mark>,
    );
    i = idx + needle.length;
  }
  return <>{parts}</>;
}

function Stat({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-serif text-2xl ${accent ? "text-amber-600 dark:text-amber-400" : ""}`}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function DiffList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "add" | "remove";
  items: string[];
}) {
  const colors =
    tone === "add"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : "border-rose-500/40 bg-rose-500/5";
  return (
    <div className={`rounded-md border p-3 ${colors}`}>
      <h3 className="mb-2 text-sm font-medium">
        {title} ({items.length})
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">— brak —</p>
      ) : (
        <ul className="space-y-1 font-mono text-xs">
          {items.map((k) => (
            <li key={k} className="truncate" title={k}>
              {tone === "add" ? "+ " : "− "}
              {k}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

