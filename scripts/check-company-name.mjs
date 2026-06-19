#!/usr/bin/env node
// Straznik spojnosci danych firmy: nazwa, adres, NIP, KRS, REGON.
// Pojedyncze zrodlo prawdy: src/lib/company.ts.
//
// Reguly:
//  - Zaden plik nie moze zawierac wariantu starej nazwy "Bujok Medical".
//  - Kazdy numer po etykiecie NIP / KRS / REGON musi odpowiadac wartosci
//    kanonicznej (po odfiltrowaniu separatorow ' ', '-').
//  - Wzmianki o ulicy/miescie musza odpowiadac kanonicznemu adresowi
//    (heurystyka: jesli linia wspomina "Kominka" lub "Rybnik" / kod 44-217,
//    powinna zawierac kanoniczna ulice i kod pocztowy).
//
// Uzycie:
//   node scripts/check-company-name.mjs
//   node scripts/check-company-name.mjs --json

import { readFileSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());

// --- Wartosci kanoniczne (musza byc zgodne z src/lib/company.ts) ---
const CANONICAL_NAME = "Medical Lasers and STEM Cells Solutions";
const CANONICAL_NIP = "6423218241";
const CANONICAL_KRS = "0000791172";
const CANONICAL_REGON = "383695904";
const CANONICAL_STREET = "Kard. Bolesława Kominka 44";
const CANONICAL_POSTCODE = "44-217";
const CANONICAL_CITY = "Rybnik";

const FORBIDDEN_NAME = /\bBujok\s*Medical\b/gi;
// Etykieta + opcjonalne ":" + cyfry rozdzielone spacja/myslnikiem
const ID_PATTERN = /\b(NIP|KRS|REGON)\b[^0-9A-Za-z]{0,5}([0-9][0-9 \-]{5,20}[0-9])/gi;

const CANONICAL_IDS = {
  NIP: CANONICAL_NIP,
  KRS: CANONICAL_KRS,
  REGON: CANONICAL_REGON,
};

const ALLOWLIST = new Set([
  "scripts/check-company-name.mjs",
  "src/lib/company.ts",
  "src/assets/bujok-medical.jpg.asset.json",
]);
const ALLOW_PREFIX = ["src/assets/"];
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
function report(file, line, kind, text, expected) {
  hits.push({ file, line, kind, expected, text: text.trim().slice(0, 200) });
}

for (const rel of listFiles()) {
  if (isExcluded(rel)) continue;
  const abs = resolve(ROOT, rel);
  let st;
  try { st = statSync(abs); } catch { continue; }
  if (!st.isFile() || st.size > 2_000_000) continue;
  let content;
  try { content = readFileSync(abs, "utf8"); } catch { continue; }

  const lines = content.split("\n");
  lines.forEach((line, i) => {
    const ln = i + 1;

    // 1) Stara nazwa firmy
    FORBIDDEN_NAME.lastIndex = 0;
    if (FORBIDDEN_NAME.test(line)) {
      report(rel, ln, "name", line, `${CANONICAL_NAME} Sp. z o.o.`);
    }

    // 2) Identyfikatory NIP/KRS/REGON
    ID_PATTERN.lastIndex = 0;
    let m;
    while ((m = ID_PATTERN.exec(line)) !== null) {
      const label = m[1].toUpperCase();
      const digits = m[2].replace(/[\s-]/g, "");
      const expected = CANONICAL_IDS[label];
      if (digits !== expected) {
        report(rel, ln, label.toLowerCase(), line, expected);
      }
    }

    // 3) Adres: jesli linia mowi o ulicy/miescie, musi byc kanoniczna.
    const mentionsAddr = /Kominka|Rybnik|44-217/i.test(line);
    if (mentionsAddr) {
      const okStreet = line.includes("Kominka 44");
      const okCity = line.includes(CANONICAL_CITY);
      const okPost = line.includes(CANONICAL_POSTCODE);
      if (!(okStreet && okCity && okPost)) {
        // Linia zawiera fragment adresu — wymagamy pelnego, kanonicznego zapisu
        // w obrebie tego samego bloku tekstu (linii).
        report(rel, ln, "address", line, `${CANONICAL_STREET}, ${CANONICAL_POSTCODE} ${CANONICAL_CITY}`);
      }
    }
  });
}

const asJson = process.argv.includes("--json");
if (asJson) {
  process.stdout.write(JSON.stringify({
    ok: hits.length === 0,
    canonical: {
      name: `${CANONICAL_NAME} Sp. z o.o.`,
      address: `${CANONICAL_STREET}, ${CANONICAL_POSTCODE} ${CANONICAL_CITY}`,
      nip: CANONICAL_NIP, krs: CANONICAL_KRS, regon: CANONICAL_REGON,
    },
    hits,
  }, null, 2) + "\n");
} else if (hits.length === 0) {
  console.log("OK: nazwa, adres, NIP, KRS i REGON spojne w calej aplikacji.");
} else {
  console.error(`BLAD: znaleziono ${hits.length} niespojnosci danych firmy:\n`);
  for (const h of hits) {
    console.error(`  [${h.kind}] ${h.file}:${h.line}`);
    console.error(`     znaleziono: ${h.text}`);
    console.error(`     oczekiwano: ${h.expected}`);
  }
}
process.exit(hits.length === 0 ? 0 : 1);
