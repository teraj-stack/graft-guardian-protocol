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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<"portrait" | "landscape">("landscape");
  const [pdfMetadata, setPdfMetadata] = useState(true);
  const [pdfMode, setPdfMode] = useState<"table" | "chart" | "both">("table");
  const [pdfPercentile, setPdfPercentile] = useState<50 | 75 | 90>(75);
  const [pdfMetrics, setPdfMetrics] = useState<Array<"CLS" | "LCP" | "INP">>(["CLS", "LCP", "INP"]);
  const [pdfWindow, setPdfWindow] = useState<"all" | "d0-3" | "d4-14" | "m1+">("all");
  const WINDOW_LABEL: Record<typeof pdfWindow, string> = {
    "all": "całe okno",
    "d0-3": "D0–3 (ostatnie 4 dni)",
    "d4-14": "D4–14",
    "m1+": "M1+ (15+ dni)",
  };
  type WinKey = "all" | "d0-3" | "d4-14" | "m1+";
  const filterByWindow = (rows: TrendRow[], w: WinKey): TrendRow[] => {
    if (w === "all") return rows;
    const n = rows.length;
    return rows.filter((_, i) => {
      const daysAgo = n - 1 - i;
      if (w === "d0-3") return daysAgo <= 3;
      if (w === "d4-14") return daysAgo >= 4 && daysAgo <= 14;
      return daysAgo >= 15; // m1+
    });
  };
  const filterWindow = (rows: TrendRow[]): TrendRow[] => filterByWindow(rows, pdfWindow);
  const [pdfCompare, setPdfCompare] = useState(false);
  const [pdfCompareWindows, setPdfCompareWindows] = useState<WinKey[]>(["d0-3", "d4-14"]);
  const [pdfCompareLayout, setPdfCompareLayout] = useState<"overlay" | "side-by-side">("overlay");
  const [pdfCompareYScale, setPdfCompareYScale] = useState<"shared" | "independent">("shared");
  const toggleCompareWindow = (w: WinKey) =>
    setPdfCompareWindows((cur) => (cur.includes(w) ? cur.filter((x) => x !== w) : [...cur, w]));
  const WINDOW_COLORS: Record<WinKey, [number, number, number]> = {
    "all": [120, 120, 120],
    "d0-3": [200, 176, 108],
    "d4-14": [59, 130, 246],
    "m1+": [16, 185, 129],
  };
  const toggleMetric = (m: "CLS" | "LCP" | "INP") =>
    setPdfMetrics((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  const METRIC_COLORS: Record<"CLS" | "LCP" | "INP", [number, number, number]> = {
    CLS: [200, 176, 108],
    LCP: [59, 130, 246],
    INP: [16, 185, 129],
  };
  const exportFn = useServerFn(exportVitalsCsv);
  const trend = (range === 7 ? data.trend7 : data.trend28) as TrendRow[];

  const validateRange = () => {
    if (dateFrom && dateTo && dateTo < dateFrom) {
      toast.error("Data końcowa nie może być wcześniejsza niż data początkowa. Popraw zakres dat.");
      return false;
    }
    return true;
  };

  const handleExport = async () => {
    if (!validateRange()) return;
    setExporting(true);
    try {
      const res = await exportFn({ data: { days: range, metric: expMetric, device: expDevice } });
      if (res.count === 0) {
        toast.info("Brak danych dla wybranego zakresu — zmień filtry i spróbuj ponownie.");
        return;
      }
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

  const handleExportPdf = async () => {
    if (!validateRange()) return;
    if (pdfMode !== "table" && pdfMetrics.length === 0) {
      toast.error("Wybierz przynajmniej jedną metrykę do wykresu trendu (CLS, LCP lub INP).");
      return;
    }
    if (pdfMode !== "table" && pdfCompare && pdfCompareWindows.length < 2) {
      toast.error("W trybie porównania wybierz co najmniej 2 okna.");
      return;
    }
    if (pdfCompareYScale === "independent" && pdfCompareLayout !== "side-by-side") {
      toast.error("Skala Y 'Niezależna' działa tylko w układzie 'Obok siebie'. Zmień układ lub skalę.");
      return;
    }
    setExportingPdf(true);
    try {
      const res = await exportFn({ data: { days: range, metric: expMetric, device: expDevice } });
      if (res.count === 0) {
        toast.info("Brak danych dla wybranego zakresu — zmień filtry i spróbuj ponownie.");
        return;
      }
      const lines = res.csv.trim().split("\n").map((l) => l.split(","));
      const header = lines[0];
      let rows = lines.slice(1);
      if (dateFrom || dateTo) {
        const dateIdx = header.findIndex((h) => /date|created|timestamp/i.test(h));
        if (dateIdx >= 0) {
          rows = rows.filter((r) => {
            const d = (r[dateIdx] || "").slice(0, 10);
            if (dateFrom && d < dateFrom) return false;
            if (dateTo && d > dateTo) return false;
            return true;
          });
        }
      }
      if (rows.length === 0) {
        toast.info("Brak danych w wybranym zakresie dat.");
        return;
      }
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: pdfOrientation, unit: "pt" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      let startY = 40;
      if (pdfMetadata) {
        doc.setFontSize(14);
        doc.text("Web Vitals — raport RUM (Graftgen)", 40, 40);
        doc.setFontSize(10);
        const meta = [
          `Wygenerowano: ${new Date().toLocaleString("pl-PL")}`,
          `Okno: ${range} dni`,
          `Metryka (CSV): ${expMetric}`,
          `Urzadzenie: ${expDevice}`,
          dateFrom || dateTo ? `Daty: ${dateFrom || "—"} → ${dateTo || "—"}` : "Daty: pełne okno",
          `Rekordów: ${rows.length}`,
          pdfMode !== "table"
            ? pdfCompare
              ? `Porównanie okien: ${pdfCompareWindows.map((w) => WINDOW_LABEL[w]).join(" vs ")} • p${pdfPercentile} • ${pdfMetrics.join(", ")}`
              : `Wykres: p${pdfPercentile} • ${pdfMetrics.join(", ")} • okno ${WINDOW_LABEL[pdfWindow]}`
            : "",
        ].filter(Boolean).join("  •  ");
        doc.text(meta, 40, 58);
        startY = 76;
      }

      if (pdfMode !== "table") {
        const trendKey = `trend${range}${pdfPercentile === 75 ? "" : `_p${pdfPercentile}`}` as keyof typeof data;
        const pdfTrendRaw = ((data as Record<string, unknown>)[trendKey] as TrendRow[]) || trend;
        const chartW = pageW - 100;
        const chartH = 170;
        const drawAxes = (chartX: number, chartY: number, w: number, h: number, t: { good: number; poor: number }, yMin: number, yMax: number, isCLS: boolean, showRightLabels = true) => {
          const yFor = (v: number) => chartY + h - ((v - yMin) / (yMax - yMin)) * h;
          doc.setDrawColor(180);
          doc.rect(chartX, chartY, w, h);
          doc.setDrawColor(16, 185, 129);
          doc.setLineDashPattern([3, 3], 0);
          doc.line(chartX, yFor(t.good), chartX + w, yFor(t.good));
          doc.setDrawColor(239, 68, 68);
          doc.line(chartX, yFor(t.poor), chartX + w, yFor(t.poor));
          doc.setLineDashPattern([], 0);
          doc.setFontSize(7);
          doc.setTextColor(110);
          const fmtY = (v: number) => (isCLS ? v.toFixed(2) : `${Math.round(v)}`);
          doc.text(fmtY(yMax), chartX - 4, chartY + 8, { align: "right" });
          doc.text(fmtY(yMin), chartX - 4, chartY + h, { align: "right" });
          if (showRightLabels) {
            doc.text(`good ${fmtY(t.good)}`, chartX + w + 2, yFor(t.good) + 3);
            doc.text(`poor ${fmtY(t.poor)}`, chartX + w + 2, yFor(t.poor) + 3);
          }
          doc.setTextColor(0);
          return yFor;
        };
        const calcPct = (vals: number[], p: number) => {
          if (!vals.length) return 0;
          const s = [...vals].sort((a, b) => a - b);
          return s[Math.min(s.length - 1, Math.floor(s.length * p))];
        };

        for (const m of pdfMetrics) {
          if (startY + chartH + 60 > pageH - 40) {
            doc.addPage();
            startY = 40;
          }
          const chartX = 50;
          const chartY = startY + 18;
          doc.setFontSize(11);
          doc.setTextColor(0);
          const title = pdfCompare
            ? `Porównanie okien — ${m} (p${pdfPercentile}, ${range} dni)`
            : `Trend p${pdfPercentile} — ${m} (${range} dni • ${WINDOW_LABEL[pdfWindow]})`;
          doc.text(title, chartX, startY + 12);

          if (pdfCompare) {
            const series = pdfCompareWindows.map((w) => {
              const win = filterByWindow(pdfTrendRaw, w);
              const pts = win.filter((d) => d[m] != null) as Array<TrendRow & Record<typeof m, number>>;
              return { w, pts, vals: pts.map((d) => d[m]) };
            });
            const allVals = series.flatMap((s) => s.vals);
            const t = THRESHOLDS[m];
            const fmtV = (v: number) => (m === "CLS" ? v.toFixed(3) : `${Math.round(v)}`);
            if (allVals.length === 0) {
              doc.setDrawColor(180);
              doc.rect(chartX, chartY, chartW, chartH);
              doc.setFontSize(9);
              doc.setTextColor(120);
              doc.text("Brak danych w wybranych oknach", chartX + chartW / 2 - 70, chartY + chartH / 2);
              doc.setTextColor(0);
              startY = chartY + chartH + 36;
            } else if (pdfCompareLayout === "side-by-side") {
              const sharedYMax = Math.max(t.poor * 1.05, ...allVals);
              const N = series.length;
              const gap = 18;
              const subW = (chartW - gap * (N - 1)) / N;
              for (let si = 0; si < N; si++) {
                const s = series[si];
                const subX = chartX + si * (subW + gap);
                const subYMax = pdfCompareYScale === "independent"
                  ? Math.max(t.poor * 1.05, ...(s.vals.length ? s.vals : [t.poor]))
                  : sharedYMax;
                const yFor = drawAxes(subX, chartY, subW, chartH, t, 0, subYMax, m === "CLS", si === N - 1);
                // Subplot title (window label)
                doc.setFontSize(8);
                doc.setTextColor(60);
                doc.text(WINDOW_LABEL[s.w], subX + subW / 2, chartY - 4, { align: "center" });
                doc.setTextColor(0);
                const n = s.pts.length;
                if (n === 0) {
                  doc.setFontSize(8);
                  doc.setTextColor(120);
                  doc.text("brak danych", subX + subW / 2, chartY + chartH / 2, { align: "center" });
                  doc.setTextColor(0);
                } else {
                  const [r, g, b] = WINDOW_COLORS[s.w];
                  doc.setDrawColor(r, g, b);
                  doc.setFillColor(r, g, b);
                  doc.setLineWidth(1.2);
                  const xFor = (i: number) => subX + (n === 1 ? subW / 2 : (i * subW) / (n - 1));
                  for (let i = 1; i < n; i++) {
                    doc.line(xFor(i - 1), yFor(s.pts[i - 1][m]), xFor(i), yFor(s.pts[i][m]));
                  }
                  for (let i = 0; i < n; i++) {
                    doc.circle(xFor(i), yFor(s.pts[i][m]), 1.4, "F");
                  }
                  doc.setLineWidth(0.2);
                }
                // Per-subplot stats
                const avg = s.vals.length ? s.vals.reduce((a, b2) => a + b2, 0) / s.vals.length : 0;
                const pct = calcPct(s.vals, pdfPercentile / 100);
                doc.setFontSize(7);
                doc.setTextColor(60);
                doc.text(
                  `avg ${fmtV(avg)} • p${pdfPercentile} ${fmtV(pct)} • n=${s.vals.length}`,
                  subX + subW / 2,
                  chartY + chartH + 14,
                  { align: "center" },
                );
                doc.setTextColor(0);
              }
              startY = chartY + chartH + 32;
            } else {
              const yMax = Math.max(t.poor * 1.05, ...allVals);
              const yFor = drawAxes(chartX, chartY, chartW, chartH, t, 0, yMax, m === "CLS");
              for (const s of series) {
                const n = s.pts.length;
                if (n === 0) continue;
                const [r, g, b] = WINDOW_COLORS[s.w];
                doc.setDrawColor(r, g, b);
                doc.setFillColor(r, g, b);
                doc.setLineWidth(1.2);
                const xFor = (i: number) => chartX + (n === 1 ? chartW / 2 : (i * chartW) / (n - 1));
                for (let i = 1; i < n; i++) {
                  doc.line(xFor(i - 1), yFor(s.pts[i - 1][m]), xFor(i), yFor(s.pts[i][m]));
                }
                for (let i = 0; i < n; i++) {
                  doc.circle(xFor(i), yFor(s.pts[i][m]), 1.6, "F");
                }
              }
              doc.setLineWidth(0.2);
              // Legend with avg + p{percentile}
              doc.setFontSize(8);
              let lx = chartX;
              const ly = chartY + chartH + 16;
              for (const s of series) {
                const [r, g, b] = WINDOW_COLORS[s.w];
                doc.setFillColor(r, g, b);
                doc.rect(lx, ly - 6, 8, 8, "F");
                doc.setTextColor(0);
                const avg = s.vals.length ? s.vals.reduce((a, b2) => a + b2, 0) / s.vals.length : 0;
                const pct = calcPct(s.vals, pdfPercentile / 100);
                const label = `${WINDOW_LABEL[s.w]}  avg ${fmtV(avg)}  p${pdfPercentile} ${fmtV(pct)}  (n=${s.vals.length})`;
                doc.text(label, lx + 12, ly);
                lx += doc.getTextWidth(label) + 28;
                if (lx > chartX + chartW - 100) {
                  lx = chartX;
                }
              }
              startY = chartY + chartH + 36;
            }
          } else {
            const pdfTrend = filterWindow(pdfTrendRaw);
            const chartData = pdfTrend.filter((d) => d[m] != null) as Array<TrendRow & Record<typeof m, number>>;
            if (chartData.length === 0) {
              doc.setDrawColor(180);
              doc.rect(chartX, chartY, chartW, chartH);
              doc.setFontSize(9);
              doc.setTextColor(120);
              doc.text("Brak danych w wybranym oknie", chartX + chartW / 2 - 60, chartY + chartH / 2);
              doc.setTextColor(0);
            } else {
              const t = THRESHOLDS[m];
              const vals = chartData.map((d) => d[m]);
              const yMax = Math.max(t.poor * 1.05, ...vals);
              const n = chartData.length;
              const yFor = drawAxes(chartX, chartY, chartW, chartH, t, 0, yMax, m === "CLS");
              const xFor = (i: number) => chartX + (n === 1 ? chartW / 2 : (i * chartW) / (n - 1));
              const [r, g, b] = METRIC_COLORS[m];
              doc.setDrawColor(r, g, b);
              doc.setFillColor(r, g, b);
              doc.setLineWidth(1.2);
              for (let i = 1; i < n; i++) {
                doc.line(xFor(i - 1), yFor(chartData[i - 1][m]), xFor(i), yFor(chartData[i][m]));
              }
              const step = Math.max(1, Math.ceil(n / 8));
              doc.setFontSize(7);
              doc.setTextColor(110);
              for (let i = 0; i < n; i++) {
                doc.circle(xFor(i), yFor(chartData[i][m]), 1.6, "F");
                if (i % step === 0 || i === n - 1) {
                  doc.text(chartData[i].date.slice(5), xFor(i), chartY + chartH + 12, { align: "center" });
                }
              }
              doc.setTextColor(0);
              doc.setLineWidth(0.2);
            }
            startY = chartY + chartH + 28;
          }
        }
      }


      if (pdfMode !== "chart") {
        autoTable(doc, {
          startY,
          head: [header],
          body: rows,
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [200, 176, 108] },
          margin: { left: 40, right: 40 },
        });
      }
      const filename = res.filename.replace(/\.csv$/i, ".pdf");
      doc.save(filename);
      toast.success(`Wyeksportowano ${rows.length} rekordów do PDF`);
    } catch (e) {
      toast.error(`Eksport PDF nie powiódł się: ${(e as Error).message}`);
    } finally {
      setExportingPdf(false);
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

      <div className="rounded-md border bg-card p-4 mb-10">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Zakres</label>
            <select
              value={range}
              onChange={(e) => setRange(Number(e.target.value) as 7 | 28)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value={7}>7 dni</option>
              <option value={28}>28 dni</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Metryka</label>
            <select
              value={expMetric}
              onChange={(e) => setExpMetric(e.target.value as typeof expMetric)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">Wszystkie</option>
              <option value="CLS">CLS</option>
              <option value="LCP">LCP</option>
              <option value="INP">INP</option>
              <option value="FCP">FCP</option>
              <option value="TTFB">TTFB</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Urządzenie</label>
            <select
              value={expDevice}
              onChange={(e) => setExpDevice(e.target.value as typeof expDevice)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">Wszystkie</option>
              <option value="mobile">Mobile</option>
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Od</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Do</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Układ PDF</label>
            <select
              value={pdfOrientation}
              onChange={(e) => setPdfOrientation(e.target.value as "portrait" | "landscape")}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Zawartość PDF</label>
            <select
              value={pdfMode}
              onChange={(e) => setPdfMode(e.target.value as typeof pdfMode)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="table">Tabela</option>
              <option value="chart">Wykres trendu</option>
              <option value="both">Wykres + tabela</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Percentyl</label>
            <select
              value={pdfPercentile}
              onChange={(e) => setPdfPercentile(Number(e.target.value) as 50 | 75 | 90)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value={50}>p50</option>
              <option value={75}>p75</option>
              <option value={90}>p90</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Okno wykresu PDF</label>
            <select
              value={pdfWindow}
              onChange={(e) => setPdfWindow(e.target.value as typeof pdfWindow)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">Całe okno</option>
              <option value="d0-3">D0–3 (ostatnie 4 dni)</option>
              <option value="d4-14">D4–14</option>
              <option value="m1+">M1+ (15+ dni)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Metryki wykresu PDF</label>
            <div className="h-9 inline-flex items-center gap-3 rounded-md border bg-background px-3 text-sm">
              {(["CLS", "LCP", "INP"] as const).map((m) => (
                <label key={m} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pdfMetrics.includes(m)}
                    onChange={() => toggleMetric(m)}
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={pdfCompare}
              onChange={(e) => setPdfCompare(e.target.checked)}
              className="rounded border bg-background"
            />
            Porównanie okien
          </label>
          {pdfCompare && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Okna do porównania</label>
              <div className="h-9 inline-flex items-center gap-3 rounded-md border bg-background px-3 text-sm">
                {(["d0-3", "d4-14", "m1+", "all"] as const).map((w) => (
                  <label key={w} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pdfCompareWindows.includes(w)}
                      onChange={() => toggleCompareWindow(w)}
                    />
                    {w === "all" ? "Całe" : w.toUpperCase()}
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <label className="block text-xs text-muted-foreground mb-1">Układ porównania</label>
                <select
                  value={pdfCompareLayout}
                  onChange={(e) => setPdfCompareLayout(e.target.value as "overlay" | "side-by-side")}
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                  <option value="overlay">Nałożone (overlay)</option>
                  <option value="side-by-side">Obok siebie (side-by-side)</option>
                </select>
              </div>
              {pdfCompareLayout === "side-by-side" && (
                <div className="mt-2">
                  <label className="block text-xs text-muted-foreground mb-1">Skala Y podwykresów</label>
                  <select
                    value={pdfCompareYScale}
                    onChange={(e) => setPdfCompareYScale(e.target.value as "shared" | "independent")}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="shared">Wspólna (porównywalne)</option>
                    <option value="independent">Niezależna (per okno)</option>
                  </select>
                </div>
              )}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={pdfMetadata}
              onChange={(e) => setPdfMetadata(e.target.checked)}
              className="rounded border bg-background"
            />
            Metadane w PDF
          </label>
          <button
            onClick={handleExport}
            disabled={exporting || exportingPdf}
            className="h-9 px-4 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {exporting ? "Eksportowanie…" : "Eksportuj CSV"}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exporting || exportingPdf}
            className="h-9 px-4 rounded-md border border-foreground text-foreground text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {exportingPdf ? "Generowanie PDF…" : "Eksportuj PDF"}
          </button>
        </div>
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
