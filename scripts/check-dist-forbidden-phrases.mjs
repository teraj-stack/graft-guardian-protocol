#!/usr/bin/env node
/**
 * Postbuild guard: fails the build if any phrase listed in
 *   scripts/forbidden-phrases.json
 * appears inside the dist/ output.
 *
 * Config (see forbidden-phrases.schema.json):
 *   - top-level `ignore`: globs (relative to dist/) skipped for ALL phrases
 *   - per-entry `ignore`: globs skipped only for that phrase
 *
 * Entry formats:
 *   "plain string"
 *   { "phrase": "text", "reason": "...", "replacement": "...",
 *     "caseInsensitive": false, "regex": false, "ignore": ["**\/*.map"] }
 *
 * Glob syntax: `**` (any segments), `*` (within one segment), `?` (one char).
 * Paths are compared with forward slashes, relative to dist/.
 *
 * CLI flags:
 *   --report[=path]   Write a JSON report (default: dist/_forbidden-phrases-report.json)
 *                     The report lists every match (file + line + column + snippet)
 *                     plus all files/dirs skipped via ignore rules.
 *   --no-fail         Always exit 0 (still writes the report). Useful for audits.
 *   --quiet           Suppress per-violation console output (the report still has it).
 */
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, extname, dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const CONFIG = resolve(__dirname, "forbidden-phrases.json");
const SCAN_EXT = new Set([".html", ".js", ".mjs", ".cjs", ".css", ".json", ".txt", ".xml", ".svg"]);

// ---- CLI ----
const argv = process.argv.slice(2);
function flag(name) {
  return argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
}
const reportFlag = flag("report");
const writeReport = Boolean(reportFlag);
const reportPath = reportFlag?.includes("=")
  ? resolve(process.cwd(), reportFlag.split("=").slice(1).join("="))
  : resolve(DIST, "_forbidden-phrases-report.json");
const noFail = Boolean(flag("no-fail"));
const quiet = Boolean(flag("quiet"));

if (!existsSync(CONFIG)) {
  console.error(`[check-dist] Missing config: ${CONFIG}`);
  process.exit(2);
}
if (!existsSync(DIST)) {
  console.warn(`[check-dist] ${DIST}/ not found, skipping.`);
  process.exit(0);
}

const raw = JSON.parse(readFileSync(CONFIG, "utf8"));
if (!raw || !Array.isArray(raw.phrases)) {
  console.error(`[check-dist] Invalid config: expected { "phrases": [...] }`);
  process.exit(2);
}

// Minimal glob → RegExp. Supports **, *, ?. Anchored (^...$).
function globToRegex(glob) {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i++;
        if (glob[i + 1] === "/") i++;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") re += "[^/]";
    else if (/[.+^${}()|[\]\\]/.test(c)) re += "\\" + c;
    else re += c;
  }
  re += "$";
  return new RegExp(re);
}

function compileIgnores(list) {
  return (list ?? []).map((g) => ({ glob: g, re: globToRegex(g) }));
}
function matchesAny(relPath, compiled) {
  return compiled.find((r) => r.re.test(relPath));
}

const globalIgnores = compileIgnores(raw.ignore);

const entries = raw.phrases.map((e, i) => {
  const o = typeof e === "string" ? { phrase: e } : e;
  if (!o || typeof o.phrase !== "string" || !o.phrase) {
    console.error(`[check-dist] Invalid entry at index ${i}`);
    process.exit(2);
  }
  const matcher = o.regex
    ? new RegExp(o.phrase, o.caseInsensitive ? "gi" : "g")
    : new RegExp(
        o.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        o.caseInsensitive ? "gi" : "g",
      );
  return { ...o, matcher, ignoreCompiled: compileIgnores(o.ignore) };
});

if (entries.length === 0) {
  console.log("✅ [check-dist] No forbidden phrases configured — nothing to check.");
  process.exit(0);
}

const hits = []; // { file, phrase, reason, replacement, line, column, snippet }
const skipped = []; // { path, type: 'file'|'dir', byPhrase?: string, glob }
let scannedFiles = 0;
let skippedCount = 0;

function toRel(p) {
  return relative(DIST, p).split(sep).join("/");
}

function findAllMatches(content, entry) {
  const out = [];
  entry.matcher.lastIndex = 0;
  let m;
  while ((m = entry.matcher.exec(content)) !== null) {
    const idx = m.index;
    // Compute line/col
    let line = 1;
    let lineStart = 0;
    for (let i = 0; i < idx; i++) {
      if (content.charCodeAt(i) === 10) {
        line++;
        lineStart = i + 1;
      }
    }
    const column = idx - lineStart + 1;
    const lineEnd = content.indexOf("\n", idx);
    const rawLine = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
    const snippet = rawLine.length > 240 ? rawLine.slice(0, 240) + "…" : rawLine;
    out.push({ line, column, match: m[0], snippet });
    if (m.index === entry.matcher.lastIndex) entry.matcher.lastIndex++;
  }
  return out;
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    const rel = toRel(p);
    if (s.isDirectory()) {
      const hit =
        matchesAny(rel, globalIgnores) || matchesAny(rel + "/", globalIgnores);
      if (hit) {
        skippedCount++;
        skipped.push({ path: rel, type: "dir", glob: hit.glob, scope: "global" });
        continue;
      }
      walk(p);
    } else if (SCAN_EXT.has(extname(p))) {
      const gHit = matchesAny(rel, globalIgnores);
      if (gHit) {
        skippedCount++;
        skipped.push({ path: rel, type: "file", glob: gHit.glob, scope: "global" });
        continue;
      }
      scannedFiles++;
      const content = readFileSync(p, "utf8");
      for (const entry of entries) {
        const pHit = matchesAny(rel, entry.ignoreCompiled);
        if (pHit) {
          skipped.push({
            path: rel,
            type: "file",
            glob: pHit.glob,
            scope: "phrase",
            phrase: entry.phrase,
          });
          continue;
        }
        for (const m of findAllMatches(content, entry)) {
          hits.push({
            file: rel,
            phrase: entry.phrase,
            reason: entry.reason,
            replacement: entry.replacement,
            line: m.line,
            column: m.column,
            match: m.match,
            snippet: m.snippet,
          });
        }
      }
    }
  }
}
walk(DIST);

console.log(
  `[check-dist] Scanned ${scannedFiles} file(s) in dist/ against ${entries.length} forbidden phrase(s) ` +
    `(${skippedCount} path(s) skipped by global ignore rules).`,
);

if (writeReport) {
  const report = {
    generatedAt: new Date().toISOString(),
    distDir: relative(resolve(__dirname, ".."), DIST).split(sep).join("/"),
    config: relative(resolve(__dirname, ".."), CONFIG).split(sep).join("/"),
    summary: {
      phrasesChecked: entries.length,
      filesScanned: scannedFiles,
      pathsSkipped: skippedCount,
      violations: hits.length,
    },
    phrases: entries.map((e) => ({
      phrase: e.phrase,
      reason: e.reason ?? null,
      replacement: e.replacement ?? null,
      regex: Boolean(e.regex),
      caseInsensitive: Boolean(e.caseInsensitive),
      ignore: (e.ignore ?? []),
      hits: hits.filter((h) => h.phrase === e.phrase).length,
    })),
    ignore: {
      global: (raw.ignore ?? []),
    },
    matches: hits,
    skipped,
  };
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(
    `📝 [check-dist] Report written: ${relative(process.cwd(), reportPath) || reportPath}`,
  );
}

if (hits.length) {
  if (!quiet) {
    console.error(`\n❌ [check-dist] ${hits.length} violation(s) found:\n`);
    for (const h of hits) {
      console.error(`  • "${h.phrase}"  →  dist/${h.file}:${h.line}:${h.column}`);
      if (h.reason) console.error(`      reason: ${h.reason}`);
      if (h.replacement) console.error(`      use instead: "${h.replacement}"`);
      console.error(`      ${h.snippet}`);
    }
    console.error(`\nEdit source files (and/or scripts/forbidden-phrases.json), then rebuild.\n`);
  }
  process.exit(noFail ? 0 : 1);
}

console.log("✅ [check-dist] No forbidden phrases found in dist/.");
