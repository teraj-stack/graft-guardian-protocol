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
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname, dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const CONFIG = resolve(__dirname, "forbidden-phrases.json");
const SCAN_EXT = new Set([".html", ".js", ".mjs", ".cjs", ".css", ".json", ".txt", ".xml", ".svg"]);

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
        // ** → any chars including /
        re += ".*";
        i++;
        // swallow trailing slash so "foo/**" matches "foo" too
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
  return (list ?? []).map(globToRegex);
}
function matchesAny(relPath, regexes) {
  return regexes.some((r) => r.test(relPath));
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
    : o.caseInsensitive
      ? new RegExp(o.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
      : null;
  return { ...o, matcher, ignoreRegexes: compileIgnores(o.ignore) };
});

if (entries.length === 0) {
  console.log("✅ [check-dist] No forbidden phrases configured — nothing to check.");
  process.exit(0);
}

const hits = [];
let scannedFiles = 0;
let skippedFiles = 0;

function test(content, entry) {
  if (entry.matcher) {
    entry.matcher.lastIndex = 0;
    return entry.matcher.test(content);
  }
  return content.includes(entry.phrase);
}

function toRel(p) {
  return relative(DIST, p).split(sep).join("/");
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    const rel = toRel(p);
    if (s.isDirectory()) {
      // Allow ignoring whole directories with patterns like "foo/**" or "foo"
      if (matchesAny(rel, globalIgnores) || matchesAny(rel + "/", globalIgnores)) {
        skippedFiles++;
        continue;
      }
      walk(p);
    } else if (SCAN_EXT.has(extname(p))) {
      if (matchesAny(rel, globalIgnores)) {
        skippedFiles++;
        continue;
      }
      scannedFiles++;
      const content = readFileSync(p, "utf8");
      for (const entry of entries) {
        if (matchesAny(rel, entry.ignoreRegexes)) continue;
        if (test(content, entry)) hits.push({ file: rel, entry });
      }
    }
  }
}
walk(DIST);

console.log(
  `[check-dist] Scanned ${scannedFiles} file(s) in dist/ against ${entries.length} forbidden phrase(s) ` +
    `(${skippedFiles} path(s) skipped by ignore rules).`,
);

if (hits.length) {
  console.error(`\n❌ [check-dist] ${hits.length} violation(s) found:\n`);
  for (const { file, entry } of hits) {
    console.error(`  • "${entry.phrase}"  →  dist/${file}`);
    if (entry.reason) console.error(`      reason: ${entry.reason}`);
    if (entry.replacement) console.error(`      use instead: "${entry.replacement}"`);
  }
  console.error(`\nEdit source files (and/or scripts/forbidden-phrases.json), then rebuild.\n`);
  process.exit(1);
}

console.log("✅ [check-dist] No forbidden phrases found in dist/.");
