#!/usr/bin/env node
// Porównanie Lighthouse (lab) vs CrUX (field) dla podanego URL.
// Użycie: node scripts/lighthouse-vs-crux.mjs https://graftgen.com [mobile|desktop]
// Wymaga: zmienna PSI_API_KEY (opcjonalna — zwiększa limity).

const url = process.argv[2] ?? "https://graftgen.com";
const strategy = process.argv[3] ?? "mobile";
const key = process.env.PSI_API_KEY;

const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
api.searchParams.set("url", url);
api.searchParams.set("strategy", strategy);
["performance"].forEach((c) => api.searchParams.append("category", c));
if (key) api.searchParams.set("key", key);

const labels = {
  LARGEST_CONTENTFUL_PAINT_MS: "LCP",
  CUMULATIVE_LAYOUT_SHIFT_SCORE: "CLS",
  INTERACTION_TO_NEXT_PAINT: "INP",
  FIRST_CONTENTFUL_PAINT_MS: "FCP",
  EXPERIMENTAL_TIME_TO_FIRST_BYTE: "TTFB",
};

const fmt = (k, v) =>
  v == null ? "—" : k === "CLS" ? (v / 100).toFixed(3) : `${Math.round(v)} ms`;

console.log(`\n→ ${url}  (${strategy})\n`);
const res = await fetch(api);
if (!res.ok) {
  console.error("PSI error", res.status, await res.text());
  process.exit(1);
}
const json = await res.json();

const lab = json.lighthouseResult?.audits ?? {};
const labMetrics = {
  LCP: lab["largest-contentful-paint"]?.numericValue,
  CLS: parseFloat(lab["cumulative-layout-shift"]?.displayValue ?? "0"),
  INP: lab["interaction-to-next-paint"]?.numericValue,
  FCP: lab["first-contentful-paint"]?.numericValue,
  TTFB: lab["server-response-time"]?.numericValue,
};

const crux = json.loadingExperience?.metrics ?? {};
const originCrux = json.originLoadingExperience?.metrics ?? {};
const fieldP75 = (src) =>
  Object.fromEntries(
    Object.entries(labels).map(([k, lbl]) => [lbl, src[k]?.percentile])
  );
const page = fieldP75(crux);
const origin = fieldP75(originCrux);

const rows = ["LCP", "CLS", "INP", "FCP", "TTFB"].map((m) => ({
  metric: m,
  lab: m === "CLS" ? (labMetrics.CLS ?? 0).toFixed(3) : fmt(m, labMetrics[m]),
  crux_page: fmt(m, page[m]),
  crux_origin: fmt(m, origin[m]),
}));

console.table(rows);

const overall = json.loadingExperience?.overall_category ?? "N/A";
const perf = Math.round(
  (json.lighthouseResult?.categories?.performance?.score ?? 0) * 100
);
console.log(`\nLighthouse Performance: ${perf}/100`);
console.log(`CrUX overall_category (page): ${overall}\n`);

if (!Object.keys(crux).length) {
  console.log(
    "ℹ Brak danych CrUX dla samej strony — origin agreguje wszystkie URL-e tej domeny."
  );
}
