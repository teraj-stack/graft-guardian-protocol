#!/usr/bin/env node
/**
 * i18n integrity guard (CI).
 *
 * Fails the build when:
 *   1. Locale files (pl/en/tr) have mismatched key sets.
 *   2. Any translation value is empty / whitespace.
 *   3. Source uses t("foo.bar") with a key missing in any locale.
 *   4. A locale value contains stop-words from the wrong language
 *      (mixed-language leak, e.g. polish text inside en.json).
 *
 * Run with `--dist` to additionally scan built HTML in dist/ for raw
 * i18n placeholders (e.g. `clinical.why.eyebrow`) that escaped rendering.
 *
 * Usage:
 *   node scripts/check-i18n-integrity.mjs            # source + locales
 *   node scripts/check-i18n-integrity.mjs --dist     # also scan built HTML
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const LOCALES_DIR = join(ROOT, "src", "locales");
const SRC_DIR = join(ROOT, "src");
const DIST_DIR = join(ROOT, "dist");

const LOCALES = ["pl", "en", "tr"];
const errors = [];
const fail = (msg) => errors.push(msg);

// ---------- 1. Load locales ----------
const data = {};
for (const lng of LOCALES) {
  const p = join(LOCALES_DIR, `${lng}.json`);
  if (!existsSync(p)) {
    fail(`Missing locale file: src/locales/${lng}.json`);
    continue;
  }
  try {
    data[lng] = JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    fail(`Invalid JSON in src/locales/${lng}.json: ${e.message}`);
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
      fail(`[parity] "${key}" missing in ${lng}.json`);
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
    if (isEmpty(v)) fail(`[empty] ${lng}.json :: "${k}" is empty`);
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

// Match t("key.path") / t('key.path') / i18n.t(... ) — static keys only.
const T_CALL = /\bt\(\s*["'`]([a-zA-Z0-9_.-]+)["'`]/g;
const referenced = new Map(); // key -> [file, ...]

for (const file of walk(SRC_DIR)) {
  const src = readFileSync(file, "utf8");
  let m;
  while ((m = T_CALL.exec(src)) !== null) {
    const key = m[1];
    // Ignore single-segment ids (not i18n keys, e.g. element ids)
    if (!key.includes(".")) continue;
    if (!referenced.has(key)) referenced.set(key, []);
    referenced.get(key).push(relative(ROOT, file));
  }
}

for (const [key, files] of referenced) {
  for (const lng of LOCALES) {
    if (!(key in (flat[lng] ?? {}))) {
      fail(`[unresolved] t("${key}") used in ${files[0]} but missing in ${lng}.json`);
    }
  }
}

// ---------- 5. Mixed-language leak ----------
// Stop-words unique to each language; presence inside another locale's value
// signals an untranslated PL/EN/TR string leaked into the wrong file.
const STOPWORDS = {
  pl: [
    "oraz","jest","które","który","która","także","dzień","tygodnia",
    "włosów","leczenia","można","powinien","zabieg","zabiegu","pacjenta",
    "godzin","tygodni","dotyczy","następnie","wówczas","dlaczego",
  ],
  en: [
    " the "," and "," with "," should "," patient "," treatment ",
    " hair "," days "," weeks "," after "," before ",
  ],
  tr: [
    "saç","tedavi","hasta","gün","hafta","sonra","önce","nakli","yıkama","uyarı",
  ],
};

const containsStopword = (text, lang) => {
  const t = ` ${String(text).toLowerCase()} `;
  return STOPWORDS[lang].some((w) => t.includes(w.toLowerCase()));
};

const scanLeaks = (lng) => {
  const others = LOCALES.filter((l) => l !== lng);
  for (const [k, v] of Object.entries(flat[lng] ?? {})) {
    const values = Array.isArray(v) ? v : [v];
    for (const val of values) {
      if (typeof val !== "string" || val.length < 8) continue;
      for (const other of others) {
        if (containsStopword(val, other)) {
          fail(`[mixed] ${lng}.json :: "${k}" looks like ${other.toUpperCase()} text → "${val.slice(0, 80)}"`);
        }
      }
    }
  }
};
for (const lng of LOCALES) scanLeaks(lng);

// ---------- 6. Built HTML scan (placeholders / raw keys) ----------
if (process.argv.includes("--dist")) {
  if (!existsSync(DIST_DIR)) {
    fail(`[dist] --dist flag set but dist/ does not exist; run \`vite build\` first.`);
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

    // A raw i18n placeholder in rendered HTML looks like: clinical.why.eyebrow
    // We restrict to known top-level namespaces from locale files to avoid
    // matching legitimate text containing dots.
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
            fail(`[placeholder] ${relative(ROOT, f)} :: raw i18n key in HTML → ${h.trim()}`);
          }
        }
      }
    }
  }
}

// ---------- Report ----------
if (errors.length > 0) {
  console.error(`\n✖ i18n integrity check failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):\n`);
  for (const e of errors.slice(0, 200)) console.error("  - " + e);
  if (errors.length > 200) console.error(`  … and ${errors.length - 200} more`);
  process.exit(1);
}

console.log(`✓ i18n integrity OK — ${allKeys.size} keys × ${LOCALES.length} locales`);
