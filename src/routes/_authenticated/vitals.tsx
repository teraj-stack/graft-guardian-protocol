import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { getVitalsSummary, exportVitalsCsv } from "@/lib/vitals.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vitals")({
  head: () => ({ meta: [{ title: "Web Vitals (RUM) — Graftgen" }] }),
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["vitals-summary"],
      queryFn: () => getVitalsSummary(),
    }),
  component: VitalsPage,
});

const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  CLS: { good: 0.1, poor: 0.25 },
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
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

type TrendRow = { date: string; CLS: number | null; LCP: number | null; INP: number | null; samples: number };

function TrendChart({
  metric,
  data,
  unit,
}: {
  metric: "CLS" | "LCP" | "INP";
  data: TrendRow[];
  unit: string;
}) {
  const t = THRESHOLDS[metric];
  const values = data.map((d) => d[metric]).filter((v): v is number => v != null);
  const max = Math.max(t.poor * 1.05, ...values);
  const hasData = values.length > 0;

  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold tracking-wide">
          {metric} <span className="text-xs text-muted-foreground font-normal">(p75 dziennie{unit ? `, ${unit}` : ""})</span>
        </h3>
        <span className="text-xs text-muted-foreground">
          próg good ≤ {metric === "CLS" ? t.good.toFixed(2) : `${t.good} ms`}
        </span>
      </div>
      <div style={{ width: "100%", height: 180 }}>
        {hasData ? (
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={[0, Math.ceil(max)]}
                width={40}
              />
              <Tooltip
                formatter={(v: number) => fmt(metric, v)}
                labelFormatter={(l: string) => l}
                contentStyle={{ fontSize: 12 }}
              />
              <ReferenceLine y={t.good} stroke="#10b981" strokeDasharray="4 4" />
              <ReferenceLine y={t.poor} stroke="#ef4444" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="#c8b06c"
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            Brak danych w wybranym oknie
          </div>
        )}
      </div>
    </div>
  );
}

function VitalsPage() {
  const { data } = useSuspenseQuery({
    queryKey: ["vitals-summary"],
    queryFn: () => getVitalsSummary(),
  });
  const [range, setRange] = useState<7 | 28>(7);
  const [expMetric, setExpMetric] = useState<"all" | "CLS" | "LCP" | "INP" | "FCP" | "TTFB">("all");
  const [expDevice, setExpDevice] = useState<"all" | "mobile" | "desktop" | "tablet">("all");
  const [exporting, setExporting] = useState(false);
  const exportFn = useServerFn(exportVitalsCsv);
  const trend = (range === 7 ? data.trend7 : data.trend28) as TrendRow[];

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportFn({ data: { days: range, metric: expMetric, device: expDevice } });
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Wyeksportowano ${res.count} rekordów`);
    } catch (e) {
      toast.error(`Eksport nie powiódł się: ${(e as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-2">Web Vitals — dane polowe (RUM)</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Okno: od {new Date(data.since).toLocaleDateString("pl-PL")} •{" "}
        Łączna liczba próbek: <strong>{data.total}</strong>
      </p>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Trend p75</h2>
        <div className="inline-flex rounded-md border overflow-hidden text-sm">
          {[7, 28].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d as 7 | 28)}
              className={`px-3 py-1.5 ${
                range === d ? "bg-foreground text-background" : "bg-background hover:bg-muted"
              }`}
            >
              {d} dni
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3 mb-10">
        <TrendChart metric="CLS" data={trend} unit="" />
        <TrendChart metric="LCP" data={trend} unit="ms" />
        <TrendChart metric="INP" data={trend} unit="ms" />
      </div>

      <h2 className="text-lg font-semibold mb-2">Tabela p75 (28 dni)</h2>
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
      </p>
    </main>
  );
}
