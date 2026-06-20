#!/usr/bin/env node
/**
 * Brand audit scanner.
 *
 * Scans src/ for occurrences of legacy / unbranded terms and emits
 * public/brand-audit.json. The in-app /admin/brand-audit route reads
 * this manifest and lets you confirm that the migration is complete.
 *
 * Rules:
 *  - "Graftgen" NOT followed by ".com" (and not part of "Graftgen-RefValidator"
 *    or a code identifier like graftgenLogo) → SHOULD become "Graftgen.com".
 *  - Legacy "FUE" technique mention (we standardized on DHI).
 *  - Legacy nav label "Cennik" (we standardized on "Sklep").
 */
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "public", "brand-audit.json");

const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".mdx", ".html", ".css"]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".tanstack", "routeTree.gen.ts"]);

/** @type {{ id: string; label: string; severity: "warn"|"info"; test: (line: string) => null | { match: string; index: number } }[]} */
const RULES = [
  {
    id: "graftgen-bare",
    label: 'Brakuje ".com" przy nazwie Graftgen',
    severity: "warn",
    test: (line) => {
      // skip technical identifiers and the email/user-agent
      if (/graftgenLogo|Graftgen-RefValidator|@graftgen\.com/.test(line)) return null;
      const re = /Graftgen(?![\w.\-])/g;
      const m = re.exec(line);
      return m ? { match: m[0], index: m.index } : null;
    },
  },
  {
    id: "legacy-fue",
    label: "Legacy: technika FUE (standard to DHI)",
    severity: "warn",
    test: (line) => {
      const re = /\bFUE\b/;
      const m = re.exec(line);
      return m ? { match: m[0], index: m.index } : null;
    },
  },
  {
    id: "legacy-cennik-nav",
    label: 'Legacy nawigacja: "Cennik" (standard to "Sklep")',
    severity: "info",
    test: (line) => {
      // only flag obvious nav-label usage
      const re = /["'>]Cennik["'<]/;
      const m = re.exec(line);
      return m ? { match: "Cennik", index: m.index } : null;
    },
  },
];

/** @returns {string[]} */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (EXT.has(full.slice(full.lastIndexOf(".")))) out.push(full);
  }
  return out;
}

const findings = [];
for (const file of walk(SRC)) {
  if (file.endsWith("routeTree.gen.ts")) continue;
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      const hit = rule.test(line);
      if (hit) {
        findings.push({
          rule: rule.id,
          label: rule.label,
          severity: rule.severity,
          file: rel,
          line: i + 1,
          column: hit.index + 1,
          match: hit.match,
          snippet: line.trim().slice(0, 240),
        });
      }
    }
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  total: findings.length,
  byRule: Object.fromEntries(
    RULES.map((r) => [r.id, findings.filter((f) => f.rule === r.id).length]),
  ),
  rules: RULES.map(({ id, label, severity }) => ({ id, label, severity })),
  findings,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(summary, null, 2));
console.log(
  `[brand-audit] ${findings.length} findings → ${relative(ROOT, OUT)} ` +
    `(${Object.entries(summary.byRule).map(([k, v]) => `${k}=${v}`).join(", ")})`,
);
