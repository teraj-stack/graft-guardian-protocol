#!/usr/bin/env node
/**
 * i18n integrity guard (CI + local).
 *
 * Fails the build when:
 *   1. Locale files (pl/en/tr) have mismatched key sets.
 *   2. Any translation value is empty / whitespace.
 *   3. Source uses t("foo.bar") with a key missing in any locale.
 *   4. A locale value contains stop-words from the wrong language
 *      (mixed-language leak, e.g. polish text inside en.json).
 *   5. (--dist) raw i18n placeholders leak into built HTML.
 *
 * Reporting flags:
 *   --dist                       additionally scan dist/*.html
 *   --report[=path]              write JSON report (default: dist/_i18n-report.json)
 *   --sarif[=path]               write SARIF 2.1.0 (default: dist/_i18n.sarif)
 *   --ci                         enable GitHub annotations + step summary;
 *                                implies --report and --sarif with defaults
 *   --warn-only                  exit 0 even if issues found (for monitoring)
 *
 * Usage:
 *   node scripts/check-i18n-integrity.mjs
 *   node scripts/check-i18n-integrity.mjs --dist
 *   node scripts/check-i18n-integrity.mjs --ci --dist
 */
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join, extname, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const LOCALES_DIR = join(ROOT, "src", "locales");
const SRC_DIR = join(ROOT, "src");
const DIST_DIR = join(ROOT, "dist");

const LOCALES = ["pl", "en", "tr"];

// ---------- CLI ----------
const argv = process.argv.slice(2);
const hasFlag = (name) => argv.some((a) => a === name || a.startsWith(`${name}=`));
const flagValue = (name, dflt) => {
  const hit = argv.find((a) => a === name || a.startsWith(`${name}=`));
  if (!hit) return undefined;
  if (hit === name) return dflt;
  return hit.slice(name.length + 1);
};
const SCAN_DIST = hasFlag("--dist");
const CI_MODE = hasFlag("--ci");
const WARN_ONLY = hasFlag("--warn-only");
const REPORT_PATH = hasFlag("--report") || CI_MODE
  ? (flagValue("--report") ?? join(DIST_DIR, "_i18n-report.json"))
  : null;
const SARIF_PATH = hasFlag("--sarif") || CI_MODE
  ? (flagValue("--sarif") ?? join(DIST_DIR, "_i18n.sarif"))
  : null;

/** @type {{rule:string,severity:'error'|'warning',message:string,file?:string,key?:string,locale?:string}[]} */
const issues = [];
const add = (rule, message, extra = {}) =>
  issues.push({ rule, severity: "error", message, ...extra });

// ---------- 1. Load locales ----------
const data = {};
for (const lng of LOCALES) {
  const p = join(LOCALES_DIR, `${lng}.json`);
  if (!existsSync(p)) {
    add("missing-locale", `Missing locale file: src/locales/${lng}.json`, { file: `src/locales/${lng}.json`, locale: lng });
    continue;
  }
  try {
    data[lng] = JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    add("invalid-json", `Invalid JSON in src/locales/${lng}.json: ${e.message}`, { file: `src/locales/${lng}.json`, locale: lng });
  }
}

const flatten = (obj, prefix = "") => {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
};

const flat = Object.fromEntries(
  Object.entries(data).map(([lng, obj]) => [lng, flatten(obj)]),
);

// ---------- 2. Key parity ----------
const allKeys = new Set();
for (const lng of LOCALES) for (const k of Object.keys(flat[lng] ?? {})) allKeys.add(k);

for (const key of allKeys) {
  for (const lng of LOCALES) {
    if (!(key in (flat[lng] ?? {}))) {
      add("parity", `"${key}" missing in ${lng}.json`, { key, locale: lng, file: `src/locales/${lng}.json` });
    }
  }
}

// ---------- 3. Empty values ----------
const isEmpty = (v) => {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0 || v.every(isEmpty);
  return false;
};

for (const lng of LOCALES) {
  for (const [k, v] of Object.entries(flat[lng] ?? {})) {
    if (isEmpty(v)) add("empty", `${lng}.json :: "${k}" is empty`, { key: k, locale: lng, file: `src/locales/${lng}.json` });
  }
}

// ---------- 4. Source key references ----------
const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (SOURCE_EXT.has(extname(p))) out.push(p);
  }
  return out;
};

const T_CALL = /\bt\(\s*["'`]([a-zA-Z0-9_.-]+)["'`]/g;
const referenced = new Map();

for (const file of walk(SRC_DIR)) {
  const src = readFileSync(file, "utf8");
  let m;
  while ((m = T_CALL.exec(src)) !== null) {
    const key = m[1];
    if (!key.includes(".")) continue;
    if (!referenced.has(key)) referenced.set(key, []);
    referenced.get(key).push(relative(ROOT, file));
  }
}

for (const [key, files] of referenced) {
  for (const lng of LOCALES) {
    if (!(key in (flat[lng] ?? {}))) {
      add("unresolved", `t("${key}") used in ${files[0]} but missing in ${lng}.json`, { key, locale: lng, file: files[0] });
    }
  }
}

// ---------- 5. Mixed-language leak ----------
const STOPWORDS = {
  pl: ["oraz","jest","które","który","która","także","dzień","tygodnia","włosów","leczenia","można","powinien","zabieg","zabiegu","pacjenta","godzin","tygodni","dotyczy","następnie","wówczas","dlaczego"],
  en: [" the "," and "," with "," should "," patient "," treatment "," hair "," days "," weeks "," after "," before "],
  tr: ["saç","tedavi","hasta","gün","hafta","sonra","önce","nakli","yıkama","uyarı"],
};

const containsStopword = (text, lang) => {
  const s = String(text);
  if (s.length < 30) return false;
  const t = ` ${s.toLowerCase()} `;
  let hits = 0;
  for (const w of STOPWORDS[lang]) {
    if (t.includes(w.toLowerCase())) hits++;
    if (hits >= 2) return true;
  }
  return false;
};

const scanLeaks = (lng) => {
  const others = LOCALES.filter((l) => l !== lng);
  for (const [k, v] of Object.entries(flat[lng] ?? {})) {
    const values = Array.isArray(v) ? v : [v];
    for (const val of values) {
      if (typeof val !== "string" || val.length < 8) continue;
      for (const other of others) {
        if (containsStopword(val, other)) {
          add("mixed", `${lng}.json :: "${k}" looks like ${other.toUpperCase()} text → "${val.slice(0, 80)}"`, { key: k, locale: lng, file: `src/locales/${lng}.json` });
        }
      }
    }
  }
};
for (const lng of LOCALES) scanLeaks(lng);

// ---------- 6. Built HTML scan ----------
if (SCAN_DIST) {
  if (!existsSync(DIST_DIR)) {
    add("dist-missing", `--dist flag set but dist/ does not exist; run \`vite build\` first.`);
  } else {
    const htmlFiles = [];
    const walkHtml = (dir) => {
      for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        const s = statSync(p);
        if (s.isDirectory()) walkHtml(p);
        else if (extname(p) === ".html") htmlFiles.push(p);
      }
    };
    walkHtml(DIST_DIR);

    const namespaces = new Set(
      Object.keys(data.pl ?? {}).filter((k) => typeof data.pl[k] === "object"),
    );
    if (namespaces.size > 0) {
      const nsList = [...namespaces].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      const RAW = new RegExp(`>(\\s*)(?:${nsList})(?:\\.[a-zA-Z0-9_-]+){1,5}(\\s*)<`, "g");
      for (const f of htmlFiles) {
        const html = readFileSync(f, "utf8");
        const hits = html.match(RAW);
        if (hits) {
          for (const h of hits.slice(0, 10)) {
            add("placeholder", `${relative(ROOT, f)} :: raw i18n key in HTML → ${h.trim()}`, { file: relative(ROOT, f) });
          }
        }
      }
    }
  }
}

// ---------- Reporting ----------
const counts = issues.reduce((acc, i) => ((acc[i.rule] = (acc[i.rule] ?? 0) + 1), acc), {});
const summary = {
  generatedAt: new Date().toISOString(),
  ok: issues.length === 0,
  totals: { issues: issues.length, keys: allKeys.size, locales: LOCALES.length, byRule: counts },
  issues,
};

const ensureDir = (p) => mkdirSync(dirname(p), { recursive: true });

if (REPORT_PATH) {
  ensureDir(REPORT_PATH);
  writeFileSync(REPORT_PATH, JSON.stringify(summary, null, 2));
  console.log(`📝 i18n report: ${relative(ROOT, REPORT_PATH)}`);
}

if (SARIF_PATH) {
  const sarif = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [{
      tool: { driver: { name: "check-i18n-integrity", informationUri: "https://graftgen.com", rules: [
        { id: "parity", shortDescription: { text: "Missing key in locale" } },
        { id: "empty", shortDescription: { text: "Empty translation value" } },
        { id: "unresolved", shortDescription: { text: "t() key missing in locale" } },
        { id: "mixed", shortDescription: { text: "Mixed-language leak" } },
        { id: "placeholder", shortDescription: { text: "Raw i18n placeholder in built HTML" } },
      ]}},
      results: issues.map((i) => ({
        ruleId: i.rule,
        level: i.severity === "error" ? "error" : "warning",
        message: { text: i.message },
        locations: i.file ? [{ physicalLocation: { artifactLocation: { uri: i.file } } }] : [],
      })),
    }],
  };
  ensureDir(SARIF_PATH);
  writeFileSync(SARIF_PATH, JSON.stringify(sarif, null, 2));
  console.log(`📝 SARIF: ${relative(ROOT, SARIF_PATH)}`);
}

if (CI_MODE) {
  // GitHub Actions annotations
  for (const i of issues) {
    const file = i.file ?? `src/locales/${i.locale ?? "pl"}.json`;
    const msg = i.message.replace(/\n/g, " ");
    console.log(`::error file=${file},title=i18n/${i.rule}::${msg}`);
  }
  // Step summary
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const lines = [
      `## i18n integrity ${issues.length === 0 ? "✅" : "❌"}`,
      ``,
      `- Keys: **${allKeys.size}** × ${LOCALES.length} locales`,
      `- Issues: **${issues.length}**`,
      ``,
    ];
    if (issues.length > 0) {
      lines.push(`| Rule | Count |`, `| --- | ---: |`);
      for (const [rule, n] of Object.entries(counts)) lines.push(`| \`${rule}\` | ${n} |`);
      lines.push(``, `<details><summary>First 50 issues</summary>`, ``);
      for (const i of issues.slice(0, 50)) lines.push(`- **${i.rule}** — ${i.message}`);
      lines.push(``, `</details>`);
    }
    appendFileSync(summaryPath, lines.join("\n") + "\n");
  }
}

if (issues.length > 0) {
  console.error(`\n✖ i18n integrity check ${WARN_ONLY ? "(warn-only) " : ""}found ${issues.length} issue${issues.length === 1 ? "" : "s"}:\n`);
  for (const e of issues.slice(0, 200)) console.error(`  - [${e.rule}] ${e.message}`);
  if (issues.length > 200) console.error(`  … and ${issues.length - 200} more`);
  if (!WARN_ONLY) process.exit(1);
}

console.log(`✓ i18n integrity OK — ${allKeys.size} keys × ${LOCALES.length} locales`);
