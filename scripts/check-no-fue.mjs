#!/usr/bin/env node
// Strażnik terminologii: blokuje wystąpienia "FUE" (po migracji na DHI).
// Użycie:
//   node scripts/check-no-fue.mjs            # raport + exit 1 jeśli znaleziono
//   node scripts/check-no-fue.mjs --json     # raport JSON
//
// Skanuje repo (bez node_modules, build artefaktów, plików .gen, lockfile'ów
// oraz samego skryptu). Dopuszcza wpisy na allowlist (np. cytaty historyczne).

import { readFileSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { relative, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const PATTERN = /\bFUE\b/g; // tylko samodzielne słowo, case-sensitive
const ALLOWLIST = new Set([
  // np. "docs/historia.md" — dodaj tu pliki, w których FUE musi pozostać
  "scripts/check-no-fue.mjs",
  "src/__tests__/no-fue.test.ts",
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

function listFiles() {
  // Preferuj git (szybciej, respektuje .gitignore); fallback: find.
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
  if (!content.includes("FUE")) continue;
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    if (PATTERN.test(line)) {
      hits.push({ file: rel, line: i + 1, text: line.trim().slice(0, 200) });
      PATTERN.lastIndex = 0;
    }
  });
}

const asJson = process.argv.includes("--json");
if (asJson) {
  process.stdout.write(JSON.stringify({ ok: hits.length === 0, hits }, null, 2) + "\n");
} else if (hits.length === 0) {
  console.log("✓ Brak wystąpień „FUE" — terminologia DHI spójna.");
} else {
  console.error(`✗ Znaleziono ${hits.length} wystąpień „FUE":\n`);
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}  ${h.text}`);
  }
  console.error("\nPodmień na „DHI" lub dopisz plik do ALLOWLIST w scripts/check-no-fue.mjs.");
}
process.exit(hits.length === 0 ? 0 : 1);
