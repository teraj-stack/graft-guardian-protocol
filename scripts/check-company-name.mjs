#!/usr/bin/env node
// Strażnik nazwy firmy: nazwa musi brzmieć dokładnie
// "Medical Lasers and STEM Cells Solutions Sp. z o.o." we wszystkich
// miejscach widocznych dla użytkownika (UI, SEO, polityki).
// Blokuje wszelkie warianty starej nazwy "Bujok Medical".
//
// Użycie:
//   node scripts/check-company-name.mjs
//   node scripts/check-company-name.mjs --json

import { readFileSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const FORBIDDEN = /\bBujok\s*Medical\b/gi;
const CANONICAL = "Medical Lasers and STEM Cells Solutions";

// Pliki, w których pozostałość nazwy jest dopuszczalna (np. nazwy assetów,
// odwołania do historycznego identyfikatora w storage).
const ALLOWLIST = new Set([
  "scripts/check-company-name.mjs",
  "src/assets/bujok-medical.jpg.asset.json", // wewnętrzny klucz assetu
]);
const ALLOW_PREFIX = ["src/assets/"]; // identyfikatory plików graficznych
const EXCLUDE_DIRS = [
  "node_modules", ".git", "dist", "build", ".output", ".vinxi",
  ".tanstack", ".cache", "coverage", ".vercel", ".wrangler",
];
const EXCLUDE_GLOBS = [
  "*.gen.*", "bun.lock", "package-lock.json", "pnpm-lock.yaml",
  "yarn.lock", "*.png", "*.jpg", "*.jpeg", "*.webp", "*.mp4",
  "*.mov", "*.ico", "*.pdf", "*.woff", "*.woff2", "*.ttf",
];

function listFiles() {
  try {
    const out = execSync("git ls-files -z", { cwd: ROOT }).toString("utf8");
    return out.split("\0").filter(Boolean);
  } catch {
    const excl = EXCLUDE_DIRS.map((d) => `-path ./${d} -prune`).join(" -o ");
    const out = execSync(`find . \\( ${excl} \\) -o -type f -print`, { cwd: ROOT }).toString("utf8");
    return out.split("\n").filter(Boolean).map((p) => p.replace(/^\.\//, ""));
  }
}

function isExcluded(path) {
  if (ALLOWLIST.has(path)) return true;
  if (ALLOW_PREFIX.some((p) => path.startsWith(p))) return true;
  if (EXCLUDE_DIRS.some((d) => path.startsWith(d + "/"))) return true;
  const base = path.split("/").pop() || "";
  return EXCLUDE_GLOBS.some((g) => g.startsWith("*.") ? base.endsWith(g.slice(1)) : base === g);
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
  if (!/bujok/i.test(content)) continue;
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    FORBIDDEN.lastIndex = 0;
    if (FORBIDDEN.test(line)) {
      hits.push({ file: rel, line: i + 1, text: line.trim().slice(0, 200) });
    }
  });
}

const asJson = process.argv.includes("--json");
if (asJson) {
  process.stdout.write(JSON.stringify({ ok: hits.length === 0, canonical: CANONICAL, hits }, null, 2) + "\n");
} else if (hits.length === 0) {
  console.log(`OK: nazwa firmy spojna - "${CANONICAL} Sp. z o.o.".`);
} else {
  console.error(`BLAD: znaleziono ${hits.length} nieaktualnych wystapien "Bujok Medical":\n`);
  for (const h of hits) console.error(`  ${h.file}:${h.line}  ${h.text}`);
  console.error(`\nPodmien na "${CANONICAL} Sp. z o.o." lub dopisz plik do ALLOWLIST.`);
}
process.exit(hits.length === 0 ? 0 : 1);
