import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/brand-audit")({
  head: () => ({
    meta: [
      { title: "Audyt marki — Graftgen.com" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BrandAuditPage,
});

type Finding = {
  rule: string;
  label: string;
  severity: "warn" | "info";
  file: string;
  line: number;
  column: number;
  match: string;
  snippet: string;
};

type Manifest = {
  generatedAt: string;
  total: number;
  byRule: Record<string, number>;
  rules: { id: string; label: string; severity: "warn" | "info" }[];
  findings: Finding[];
};

const LS_KEY = "brand-audit:reviewed:v1";

function useReviewed() {
  const [reviewed, setReviewed] = useState<Record<string, true>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setReviewed(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);
  const persist = (next: Record<string, true>) => {
    setReviewed(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };
  return {
    reviewed,
    toggle: (id: string) => {
      const next = { ...reviewed };
      if (next[id]) delete next[id];
      else next[id] = true;
      persist(next);
    },
    reset: () => persist({}),
  };
}

const findingId = (f: Finding) => `${f.rule}@${f.file}:${f.line}:${f.column}`;

function BrandAuditPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["brand-audit"],
    queryFn: async (): Promise<Manifest> => {
      const res = await fetch(`/brand-audit.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as Manifest;
    },
    staleTime: 0,
  });

  const [ruleFilter, setRuleFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [hideReviewed, setHideReviewed] = useState(true);
  const { reviewed, toggle, reset } = useReviewed();

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.findings.filter((f) => {
      if (ruleFilter !== "all" && f.rule !== ruleFilter) return false;
      if (hideReviewed && reviewed[findingId(f)]) return false;
      if (q && !(`${f.file} ${f.snippet} ${f.match}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [data, ruleFilter, search, hideReviewed, reviewed]);

  const reviewedCount = useMemo(
    () => (data ? data.findings.filter((f) => reviewed[findingId(f)]).length : 0),
    [data, reviewed],
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Narzędzie wewnętrzne
          </p>
          <h1 className="mt-1 font-serif text-3xl">Audyt marki — Graftgen.com</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Lista miejsc w kodzie, w których pojawia się stara nazwa lub legacy nomenklatura.
            Manifest generowany jest komendą <code className="rounded bg-muted px-1.5 py-0.5">node scripts/brand-audit.mjs</code> i
            zapisywany do <code className="rounded bg-muted px-1.5 py-0.5">/brand-audit.json</code>.
          </p>
        </div>
        <Link
          to="/"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          ← Strona główna
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Wczytywanie manifestu…</p>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          Nie udało się załadować <code>/brand-audit.json</code>. Uruchom{" "}
          <code>node scripts/brand-audit.mjs</code> aby wygenerować plik.
        </div>
      ) : data ? (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Wystąpień łącznie" value={data.total} />
            <Stat label="Sprawdzonych" value={reviewedCount} />
            <Stat label="Pozostało" value={data.total - reviewedCount} accent />
            <Stat
              label="Wygenerowano"
              value={new Date(data.generatedAt).toLocaleString("pl-PL", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            />
          </section>

          <section className="mb-6 flex flex-wrap items-center gap-3">
            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              aria-label="Filtr reguły"
            >
              <option value="all">Wszystkie reguły ({data.total})</option>
              {data.rules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} ({data.byRule[r.id] ?? 0})
                </option>
              ))}
            </select>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj w pliku / snippecie…"
              className="min-w-[220px] flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hideReviewed}
                onChange={(e) => setHideReviewed(e.target.checked)}
              />
              Ukryj sprawdzone
            </label>
            <button
              onClick={() => refetch()}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              {isFetching ? "Odświeżam…" : "Odśwież manifest"}
            </button>
            <button
              onClick={() => {
                if (confirm("Wyczyścić oznaczenia „sprawdzone"?")) reset();
              }}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Reset oznaczeń
            </button>
          </section>

          {filtered.length === 0 ? (
            <div className="rounded-md border border-border bg-muted/40 p-8 text-center text-sm">
              {data.total === 0
                ? "Czysto. Brak wystąpień starej nazwy w kodzie źródłowym."
                : "Brak wyników dla obecnych filtrów — wszystko sprawdzone."}
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((f) => {
                const id = findingId(f);
                const isReviewed = !!reviewed[id];
                return (
                  <li
                    key={id}
                    className={`rounded-md border p-4 transition ${
                      isReviewed
                        ? "border-border/60 bg-muted/30 opacity-60"
                        : f.severity === "warn"
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "border-border bg-background"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                          <span
                            className={`rounded px-1.5 py-0.5 ${
                              f.severity === "warn"
                                ? "bg-amber-500/20 text-amber-900 dark:text-amber-200"
                                : "bg-muted"
                            }`}
                          >
                            {f.severity}
                          </span>
                          <span>{f.label}</span>
                        </div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground">
                          {f.file}:{f.line}:{f.column}
                        </div>
                        <pre className="mt-2 overflow-x-auto rounded bg-muted/60 p-2 font-mono text-xs">
                          {f.snippet}
                        </pre>
                      </div>
                      <label className="flex shrink-0 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isReviewed}
                          onChange={() => toggle(id)}
                        />
                        Sprawdzone
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-serif text-2xl ${accent ? "text-amber-600 dark:text-amber-400" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
