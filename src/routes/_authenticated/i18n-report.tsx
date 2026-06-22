import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/i18n-report")({
  head: () => ({
    meta: [
      { title: "Raport i18n — panel administracyjny" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: I18nReportPage,
});

// -------- Bundle locales + source at build time --------
const LOCALES = ["pl", "en", "tr"] as const;
type Locale = (typeof LOCALES)[number];

const LOCALE_FILES = import.meta.glob("/src/locales/*.json", {
  eager: true,
}) as Record<string, { default: unknown }>;

const SOURCE_FILES = import.meta.glob(
  [
    "/src/**/*.{ts,tsx,js,jsx}",
    "!/src/routeTree.gen.ts",
    "!/src/routes/_authenticated/i18n-report.tsx",
  ],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

// -------- Types --------
type Severity = "error" | "warning";
type Rule = "parity" | "empty" | "unresolved" | "mixed";
interface Issue {
  rule: Rule;
  severity: Severity;
  message: string;
  file?: string;
  key?: string;
  locale?: Locale | string;
}

// -------- Helpers --------
function flatten(obj: unknown, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!obj || typeof obj !== "object") return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

const isEmpty = (v: unknown): boolean => {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0 || v.every(isEmpty);
  return false;
};

const STOPWORDS: Record<Locale, string[]> = {
  pl: ["oraz","jest","które","który","która","także","dzień","tygodnia","włosów","leczenia","można","powinien","zabieg","zabiegu","pacjenta","godzin","tygodni","dotyczy","następnie","wówczas","dlaczego"],
  en: [" the "," and "," with "," should "," patient "," treatment "," hair "," days "," weeks "," after "," before "],
  tr: ["saç","tedavi","hasta","gün","hafta","sonra","önce","nakli","yıkama","uyarı"],
};

const containsStopword = (text: string, lang: Locale): boolean => {
  if (text.length < 30) return false;
  const t = ` ${text.toLowerCase()} `;
  let hits = 0;
  for (const w of STOPWORDS[lang]) {
    if (t.includes(w.toLowerCase())) hits++;
    if (hits >= 2) return true;
  }
  return false;
};

// -------- Build the report once (memoize at module scope) --------
function buildReport() {
  const data: Partial<Record<Locale, unknown>> = {};
  const flat: Partial<Record<Locale, Record<string, unknown>>> = {};
  const issues: Issue[] = [];

  for (const lng of LOCALES) {
    const key = `/src/locales/${lng}.json`;
    const mod = LOCALE_FILES[key];
    if (!mod) {
      issues.push({
        rule: "parity",
        severity: "error",
        message: `Missing locale file: src/locales/${lng}.json`,
        file: `src/locales/${lng}.json`,
        locale: lng,
      });
      continue;
    }
    data[lng] = mod.default;
    flat[lng] = flatten(mod.default);
  }

  // Parity
  const allKeys = new Set<string>();
  for (const lng of LOCALES) for (const k of Object.keys(flat[lng] ?? {})) allKeys.add(k);

  for (const key of allKeys) {
    for (const lng of LOCALES) {
      if (!(key in (flat[lng] ?? {}))) {
        issues.push({
          rule: "parity",
          severity: "error",
          message: `"${key}" missing in ${lng}.json`,
          key,
          locale: lng,
          file: `src/locales/${lng}.json`,
        });
      }
    }
  }

  // Empty
  for (const lng of LOCALES) {
    for (const [k, v] of Object.entries(flat[lng] ?? {})) {
      if (isEmpty(v)) {
        issues.push({
          rule: "empty",
          severity: "error",
          message: `${lng}.json :: "${k}" is empty`,
          key: k,
          locale: lng,
          file: `src/locales/${lng}.json`,
        });
      }
    }
  }

  // Source key references
  const T_CALL = /\bt\(\s*["'`]([a-zA-Z0-9_.-]+)["'`]/g;
  const referenced = new Map<string, string[]>();
  for (const [path, src] of Object.entries(SOURCE_FILES)) {
    let m: RegExpExecArray | null;
    while ((m = T_CALL.exec(src)) !== null) {
      const k = m[1];
      if (!k.includes(".")) continue;
      const file = path.replace(/^\//, "");
      const list = referenced.get(k) ?? [];
      list.push(file);
      referenced.set(k, list);
    }
  }
  for (const [key, files] of referenced) {
    for (const lng of LOCALES) {
      if (!(key in (flat[lng] ?? {}))) {
        issues.push({
          rule: "unresolved",
          severity: "error",
          message: `t("${key}") used in ${files[0]} but missing in ${lng}.json`,
          key,
          locale: lng,
          file: files[0],
        });
      }
    }
  }

  // Mixed-language leak
  for (const lng of LOCALES) {
    const others = LOCALES.filter((l) => l !== lng);
    for (const [k, v] of Object.entries(flat[lng] ?? {})) {
      const values = Array.isArray(v) ? v : [v];
      for (const val of values) {
        if (typeof val !== "string" || val.length < 8) continue;
        for (const other of others) {
          if (containsStopword(val, other)) {
            issues.push({
              rule: "mixed",
              severity: "error",
              message: `${lng}.json :: "${k}" looks like ${other.toUpperCase()} text → "${val.slice(0, 80)}"`,
              key: k,
              locale: lng,
              file: `src/locales/${lng}.json`,
            });
          }
        }
      }
    }
  }

  const byRule = issues.reduce<Record<string, number>>((acc, i) => {
    acc[i.rule] = (acc[i.rule] ?? 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    ok: issues.length === 0,
    totals: {
      issues: issues.length,
      keys: allKeys.size,
      locales: LOCALES.length,
      byRule,
    },
    issues,
  };
}

const RULE_LEVEL: Record<Rule, "error" | "warning"> = {
  parity: "error",
  empty: "error",
  unresolved: "error",
  mixed: "warning",
};

function toSarif(report: ReturnType<typeof buildReport>) {
  const ruleIds = Array.from(new Set(report.issues.map((i) => i.rule)));
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "graftgen-i18n-integrity",
            informationUri: "https://graftgen.com",
            rules: ruleIds.map((id) => ({
              id,
              shortDescription: { text: `i18n ${id}` },
              defaultConfiguration: { level: RULE_LEVEL[id as Rule] ?? "error" },
            })),
          },
        },
        results: report.issues.map((i) => ({
          ruleId: i.rule,
          level: RULE_LEVEL[i.rule] ?? "error",
          message: { text: i.message },
          locations: i.file
            ? [
                {
                  physicalLocation: {
                    artifactLocation: { uri: i.file },
                  },
                },
              ]
            : undefined,
          properties: { key: i.key, locale: i.locale },
        })),
      },
    ],
  };
}

function downloadBlob(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCsv(issues: Issue[]): string {
  const head = ["rule", "severity", "locale", "file", "key", "message"];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = issues.map((i) =>
    [i.rule, i.severity, i.locale ?? "", i.file ?? "", i.key ?? "", i.message].map(esc).join(","),
  );
  return [head.join(","), ...rows].join("\n");
}

// -------- Page --------
function I18nReportPage() {
  const report = useMemo(() => buildReport(), []);
  const [ruleFilter, setRuleFilter] = useState<string>("all");
  const [localeFilter, setLocaleFilter] = useState<string>("all");
  const [fileFilter, setFileFilter] = useState<string>("");
  const [keyFilter, setKeyFilter] = useState<string>("");

  const filtered = useMemo(() => {
    return report.issues.filter((i) => {
      if (ruleFilter !== "all" && i.rule !== ruleFilter) return false;
      if (localeFilter !== "all" && i.locale !== localeFilter) return false;
      if (fileFilter && !(i.file ?? "").toLowerCase().includes(fileFilter.toLowerCase())) return false;
      if (keyFilter && !(i.key ?? "").toLowerCase().includes(keyFilter.toLowerCase())) return false;
      return true;
    });
  }, [report.issues, ruleFilter, localeFilter, fileFilter, keyFilter]);

  const rules = Object.keys(report.totals.byRule);
  const stamp = report.generatedAt.replace(/[:.]/g, "-");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Admin</p>
            <h1 className="font-display text-2xl font-light">Raport i18n</h1>
          </div>
          <Link
            to="/admin"
            className="rounded-sm border border-border px-4 py-2 text-sm transition hover:bg-secondary"
          >
            ← Panel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Status" value={report.ok ? "OK" : "Problemy"} tone={report.ok ? "ok" : "err"} />
          <Stat label="Klucze" value={String(report.totals.keys)} />
          <Stat label="Lokalizacje" value={LOCALES.join(", ").toUpperCase()} />
          <Stat label="Problemy" value={String(report.totals.issues)} tone={report.totals.issues ? "err" : "ok"} />
        </section>

        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Wygenerowano: {new Date(report.generatedAt).toLocaleString("pl-PL")}
        </p>

        {/* By-rule chips */}
        {rules.length > 0 && (
          <section className="mt-6 flex flex-wrap gap-2">
            {rules.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-xs uppercase tracking-wider"
              >
                <span className="text-muted-foreground">{r}</span>
                <span className="font-medium">{report.totals.byRule[r]}</span>
              </span>
            ))}
          </section>
        )}

        {/* Downloads */}
        <section className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              downloadBlob(`i18n-report-${stamp}.json`, "application/json", JSON.stringify(report, null, 2))
            }
            className="rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            Pobierz JSON
          </button>
          <button
            type="button"
            onClick={() =>
              downloadBlob(`i18n-${stamp}.sarif`, "application/sarif+json", JSON.stringify(toSarif(report), null, 2))
            }
            className="rounded-sm border border-border px-4 py-2 text-sm transition hover:bg-secondary"
          >
            Pobierz SARIF
          </button>
          <button
            type="button"
            onClick={() => downloadBlob(`i18n-issues-${stamp}.csv`, "text/csv;charset=utf-8", toCsv(filtered))}
            className="rounded-sm border border-border px-4 py-2 text-sm transition hover:bg-secondary"
            disabled={filtered.length === 0}
          >
            Pobierz CSV (filtr: {filtered.length})
          </button>
        </section>

        {/* Filters */}
        <section className="mt-8 grid gap-3 rounded-sm border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Reguła
            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value)}
              className="rounded-sm border border-border bg-background px-3 py-2 text-sm normal-case text-foreground"
            >
              <option value="all">Wszystkie</option>
              {rules.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Locale
            <select
              value={localeFilter}
              onChange={(e) => setLocaleFilter(e.target.value)}
              className="rounded-sm border border-border bg-background px-3 py-2 text-sm normal-case text-foreground"
            >
              <option value="all">Wszystkie</option>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Plik
            <input
              type="text"
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              placeholder="np. locales/tr"
              className="rounded-sm border border-border bg-background px-3 py-2 text-sm normal-case text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Klucz
            <input
              type="text"
              value={keyFilter}
              onChange={(e) => setKeyFilter(e.target.value)}
              placeholder="np. clinical.hbot"
              className="rounded-sm border border-border bg-background px-3 py-2 text-sm normal-case text-foreground"
            />
          </label>
        </section>

        {/* Issues */}
        <section className="mt-6 rounded-sm border border-border bg-card">
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-display text-2xl">{report.ok ? "Brak problemów 🎉" : "Brak wyników dla filtrów"}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {report.ok
                  ? `Pełen parytet: ${report.totals.keys} kluczy × ${LOCALES.length} lokalizacji.`
                  : "Zmień filtry powyżej."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="border-b border-border/60">
                  <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="px-4 py-3">Reguła</th>
                    <th className="px-4 py-3">Locale</th>
                    <th className="px-4 py-3">Plik</th>
                    <th className="px-4 py-3">Klucz</th>
                    <th className="px-4 py-3">Wiadomość</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 500).map((i, idx) => (
                    <tr key={idx} className="border-b border-border/30 align-top hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <span
                          className={
                            "rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-wider " +
                            (i.severity === "error"
                              ? "border-destructive/50 text-destructive"
                              : "border-accent/50 text-accent")
                          }
                        >
                          {i.rule}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs uppercase">{i.locale ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i.file ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{i.key ?? "—"}</td>
                      <td className="px-4 py-3 text-xs">{i.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 500 && (
                <p className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
                  Pokazano pierwsze 500 z {filtered.length}. Pobierz CSV/JSON, aby uzyskać pełną listę.
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "err";
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p
        className={
          "mt-2 font-display text-2xl " +
          (tone === "ok" ? "text-accent" : tone === "err" ? "text-destructive" : "text-foreground")
        }
      >
        {value}
      </p>
    </div>
  );
}
