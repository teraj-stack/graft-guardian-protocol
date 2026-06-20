#!/usr/bin/env node
/**
 * Postbuild guard: fails the build if any phrase listed in
 *   scripts/forbidden-phrases.json
 * appears inside the dist/ output.
 *
 * Entry formats supported (see forbidden-phrases.schema.json):
 *   "plain string"
 *   { "phrase": "text", "reason": "...", "replacement": "...",
 *     "caseInsensitive": false, "regex": false }
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname, dirname, resolve } from "node:path";
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
  return { ...o, matcher };
});

if (entries.length === 0) {
  console.log("✅ [check-dist] No forbidden phrases configured — nothing to check.");
  process.exit(0);
}

const hits = [];
function test(content, entry) {
  return entry.matcher ? entry.matcher.test(content) : content.includes(entry.phrase);
}
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (SCAN_EXT.has(extname(p))) {
      const content = readFileSync(p, "utf8");
      for (const entry of entries) {
        if (test(content, entry)) hits.push({ file: p, entry });
      }
    }
  }
}
walk(DIST);

console.log(`[check-dist] Scanned dist/ against ${entries.length} forbidden phrase(s).`);

if (hits.length) {
  console.error(`\n❌ [check-dist] ${hits.length} violation(s) found:\n`);
  for (const { file, entry } of hits) {
    console.error(`  • "${entry.phrase}"  →  ${file}`);
    if (entry.reason) console.error(`      reason: ${entry.reason}`);
    if (entry.replacement) console.error(`      use instead: "${entry.replacement}"`);
  }
  console.error(`\nEdit source files (and/or scripts/forbidden-phrases.json), then rebuild.\n`);
  process.exit(1);
}

console.log("✅ [check-dist] No forbidden phrases found in dist/.");
