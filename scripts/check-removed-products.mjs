#!/usr/bin/env node
// Strażnik produktów usuniętych z oferty Graftgen (oferta zewnętrzna BMC).
// Blokuje powrót fraz: HIFU, Fusion Plasma, Baby Face Lift, Laser pikosekundowy
// w treści aplikacji (cennik, sklep, dowolna podstrona).
//
// Użycie:
//   node scripts/check-removed-products.mjs
//   node scripts/check-removed-products.mjs --json

import { readFileSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());

// Wzorce — case-insensitive, granice słów tam gdzie sensowne.
const PATTERNS = [
  { name: "HIFU", regex: /\bHIFU\b/gi },
  { name: "Fusion Plasma", regex: /\bfusion\s+plasma\b/gi },
  { name: "Baby Face Lift", regex: /\bbaby\s+face\s+lift\b/gi },
  { name: "Laser pikosekundowy", regex: /\b(laser\s+pikosekundowy|pikosekundow[ayie]+)\b/gi },
];

const ALLOWLIST = new Set([
  "scripts/check-removed-products.mjs",
  "scripts/forbidden-phrases.json",
  ".github/workflows/check-removed-products.yml",
]);

const EXCLUDE_DIRS = [
  "node_modules", ".git", "dist", "build", ".output", ".vinxi",
  ".tanstack", ".cache", "coverage", ".vercel", ".wrangler",
];
const EXCLUDE_GLOBS = [
  "*.gen.*", "bun.lock", "package-lock.json", "pnpm-lock.yaml",
  "yarn.lock", "*.png", "*.jpg", "*.jpeg", "*.webp", "*.mp4",
  "*.mov", "*.ico", "*.pdf", "*.woff", "*.woff2", "*.ttf",
];

// Skanuj tylko pliki treści (UI + dane). Pomija scripts/.
const INCLUDE_PREFIXES = ["src/", "public/", "content/", "data/"];

function listFiles() {
  try {
    const out = execSync("git ls-files -z", { cwd: ROOT }).toString("utf8");
    return out.split("\0").filter(Boolean);
  } catch {
    const excl = EXCLUDE_DIRS.map((d) => `-path ./${d} -prune`).join(" -o ");
    const out = execSync(
      `find . \\( ${excl} \\) -o -type f -print`,
      { cwd: ROOT }
    ).toString("utf8");
    return out.split("\n").filter(Boolean).map((p) => p.replace(/^\.\//, ""));
  }
}

function isExcluded(path) {
  if (ALLOWLIST.has(path)) return true;
  if (!INCLUDE_PREFIXES.some((p) => path.startsWith(p))) return true;
  if (EXCLUDE_DIRS.some((d) => path.startsWith(d + "/"))) return true;
  const base = path.split("/").pop() || "";
  return EXCLUDE_GLOBS.some((g) => {
    if (g.startsWith("*.")) return base.endsWith(g.slice(1));
    return base === g;
  });
}

const hits = [];
for (const rel of listFiles()) {
  if (isExcluded(rel)) continue;
  const abs = resolve(ROOT, rel);
  let st;
  try { st = statSync(abs); } catch { continue; }
  if (!st.isFile() || st.size > 2_000_000) continue;
  let content;
  try { content = readFileSync(abs, "utf8"); } catch { continue; }
  const lines = content.split("\n");
  for (const { name, regex } of PATTERNS) {
    lines.forEach((line, i) => {
      regex.lastIndex = 0;
      if (regex.test(line)) {
        hits.push({
          phrase: name,
          file: rel,
          line: i + 1,
          text: line.trim().slice(0, 200),
        });
      }
    });
  }
}

const asJson = process.argv.includes("--json");
if (asJson) {
  process.stdout.write(JSON.stringify({ ok: hits.length === 0, hits }, null, 2) + "\n");
} else if (hits.length === 0) {
  console.log("OK: brak wystapien usunietych produktow (HIFU / Fusion Plasma / Baby Face Lift / Laser pikosekundowy).");
} else {
  console.error(`BLAD: znaleziono ${hits.length} wystapien usunietych produktow:\n`);
  for (const h of hits) {
    console.error(`  [${h.phrase}] ${h.file}:${h.line}  ${h.text}`);
  }
  console.error("\nUsun fraze lub dopisz plik do ALLOWLIST w scripts/check-removed-products.mjs.");
}
process.exit(hits.length === 0 ? 0 : 1);
