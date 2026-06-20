#!/usr/bin/env node
/**
 * Regression guard for public API endpoints under src/routes/api/public/**.
 *
 * Fails the build when:
 *   1. A handler returns a raw PG/Supabase error field (error.message, error.details,
 *      error.hint, error.code) in a Response body — that leaks schema details.
 *   2. (Optional, when PGHOST is set) Any Postgres extension is installed in the
 *      `public` schema. Extensions must live in `extensions` (or a dedicated schema).
 *
 * Usage:
 *   node scripts/check-public-api-leaks.mjs
 *
 * Exit codes:
 *   0 = clean, 1 = regression detected.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const PUBLIC_API_DIR = join(ROOT, "src/routes/api/public");

/** Recursively collect all .ts/.tsx files under a directory. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|mjs|js)$/.test(entry)) out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. Static scan for leaked error fields in Response bodies
// ---------------------------------------------------------------------------
const LEAK_PATTERNS = [
  // returning the raw PG error object or message/details/hint/code in a response
  /message:\s*(?:err|error|e|dbError|pgError)\??\.message\b/,
  /details:\s*(?:err|error|e|dbError|pgError)\??\.details\b/,
  /hint:\s*(?:err|error|e|dbError|pgError)\??\.hint\b/,
  /code:\s*(?:err|error|e|dbError|pgError)\??\.code\b/,
  // JSON.stringify of an error object inside Response/json
  /Response\.json\([^)]*\b(?:err|error|e|dbError|pgError)\b\s*[,)]/,
];

const leaks = [];
if (statSync(PUBLIC_API_DIR, { throwIfNoEntry: false })) {
  for (const file of walk(PUBLIC_API_DIR)) {
    const src = readFileSync(file, "utf8");
    // Look only at lines that appear inside a Response.json / new Response chunk.
    // Heuristic: scan every line; LEAK_PATTERNS are tight enough to avoid false hits.
    const lines = src.split("\n");
    lines.forEach((line, i) => {
      // skip comments
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      for (const pat of LEAK_PATTERNS) {
        if (pat.test(line)) {
          leaks.push({
            file: relative(ROOT, file),
            line: i + 1,
            snippet: trimmed,
            pattern: pat.source,
          });
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 2. Optional: pg_extension check (only when DB env is present)
// ---------------------------------------------------------------------------
let extensionRows = [];
let dbChecked = false;
if (process.env.PGHOST) {
  try {
    const out = execSync(
      `psql -tAX -c "SELECT e.extname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE n.nspname = 'public'"`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    extensionRows = out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    dbChecked = true;
  } catch (err) {
    console.warn(
      `[check-public-api-leaks] Skipping pg_extension check — psql failed: ${err.message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
let failed = false;

if (leaks.length > 0) {
  failed = true;
  console.error("\n❌ Public API leak regression detected:\n");
  for (const l of leaks) {
    console.error(`  ${l.file}:${l.line}`);
    console.error(`    ${l.snippet}`);
    console.error(`    matched: /${l.pattern}/\n`);
  }
  console.error(
    "Fix: do not echo raw PG error fields (error.message/details/hint/code) to clients.\n" +
      "     Log with console.error server-side and return a generic { error: \"internal_error\" }.\n",
  );
} else {
  console.log("✓ Public API handlers do not leak raw DB error fields.");
}

if (dbChecked) {
  if (extensionRows.length > 0) {
    failed = true;
    console.error(
      `\n❌ Extensions installed in the public schema: ${extensionRows.join(", ")}`,
    );
    console.error(
      "   Move them to the `extensions` schema (or a dedicated one):\n" +
        "     ALTER EXTENSION <name> SET SCHEMA extensions;\n",
    );
  } else {
    console.log("✓ No Postgres extensions in the public schema.");
  }
} else {
  console.log("• pg_extension check skipped (PGHOST not set).");
}

process.exit(failed ? 1 : 0);
