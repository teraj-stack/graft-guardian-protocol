import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getVitalsSummary } from "@/lib/vitals.functions";

export const Route = createFileRoute("/_authenticated/vitals")({
  head: () => ({ meta: [{ title: "Web Vitals (RUM) — Graftgen" }] }),
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["vitals-summary"],
      queryFn: () => getVitalsSummary(),
    }),
  component: VitalsPage,
});

const THRESHOLDS: Record<string, { good: number; poor: number; unit: string }> = {
  CLS: { good: 0.1, poor: 0.25, unit: "" },
  LCP: { good: 2500, poor: 4000, unit: " ms" },
  INP: { good: 200, poor: 500, unit: " ms" },
  FCP: { good: 1800, poor: 3000, unit: " ms" },
  TTFB: { good: 800, poor: 1800, unit: " ms" },
};

function fmt(metric: string, v: number) {
  if (!v) return "—";
  if (metric === "CLS") return v.toFixed(3);
  return `${Math.round(v)} ms`;
}

function badge(metric: string, v: number) {
  const t = THRESHOLDS[metric];
  if (!t || !v) return "text-muted-foreground";
  if (v <= t.good) return "text-emerald-600 font-semibold";
  if (v <= t.poor) return "text-amber-600 font-semibold";
  return "text-red-600 font-semibold";
}

function VitalsPage() {
  const { data } = useSuspenseQuery({
    queryKey: ["vitals-summary"],
    queryFn: () => getVitalsSummary(),
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-2">Web Vitals — dane polowe (RUM)</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Okno: od {new Date(data.since).toLocaleDateString("pl-PL")} •{" "}
        Łączna liczba próbek: <strong>{data.total}</strong>
      </p>

      {data.total === 0 ? (
        <div className="rounded-md border p-6 text-sm text-muted-foreground">
          Brak danych. Po opublikowaniu kolejnej wersji ruch produkcyjny zacznie
          zasilać tabelę.
        </div>
      ) : (
        <table className="w-full text-sm border rounded-md overflow-hidden">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Metryka</th>
              <th className="text-right p-3">Próbki</th>
              <th className="text-right p-3">p75 (all)</th>
              <th className="text-right p-3">p75 mobile</th>
              <th className="text-right p-3">p75 desktop</th>
            </tr>
          </thead>
          <tbody>
            {data.summary.map((r) => (
              <tr key={r.metric} className="border-t">
                <td className="p-3 font-mono">{r.metric}</td>
                <td className="p-3 text-right">{r.samples}</td>
                <td className={`p-3 text-right ${badge(r.metric, r.p75_all)}`}>
                  {fmt(r.metric, r.p75_all)}
                </td>
                <td className={`p-3 text-right ${badge(r.metric, r.p75_mobile)}`}>
                  {fmt(r.metric, r.p75_mobile)}
                </td>
                <td className={`p-3 text-right ${badge(r.metric, r.p75_desktop)}`}>
                  {fmt(r.metric, r.p75_desktop)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="text-lg font-semibold mt-10 mb-2">Lighthouse vs CrUX</h2>
      <p className="text-sm text-muted-foreground">
        Uruchom z terminala:{" "}
        <code className="px-1.5 py-0.5 rounded bg-muted">
          node scripts/lighthouse-vs-crux.mjs https://graftgen.com
        </code>
        . Skrypt pobiera dane lab (Lighthouse) i field (CrUX) z PageSpeed
        Insights i wypisuje porównanie CLS / LCP / INP w jednej tabeli.
      </p>
    </main>
  );
}
