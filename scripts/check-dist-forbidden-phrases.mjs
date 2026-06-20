#!/usr/bin/env node
/**
 * Postbuild guard: fails the build if forbidden legacy phrases leak into dist/.
 * Currently enforced:
 *   - "Cennik / Sklep" (replaced site-wide by "Sklep")
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const DIST = "dist";
const FORBIDDEN = ["Cennik / Sklep"];
const SCAN_EXT = new Set([".html", ".js", ".mjs", ".cjs", ".css", ".json", ".txt", ".xml", ".svg"]);

if (!existsSync(DIST)) {
  console.warn(`[check-dist] ${DIST}/ not found, skipping.`);
  process.exit(0);
}

const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (SCAN_EXT.has(extname(p))) {
      const content = readFileSync(p, "utf8");
      for (const phrase of FORBIDDEN) {
        if (content.includes(phrase)) hits.push({ file: p, phrase });
      }
    }
  }
}
walk(DIST);

if (hits.length) {
  console.error("\n❌ [check-dist] Forbidden phrase(s) found in build output:");
  for (const h of hits) console.error(`   - "${h.phrase}" → ${h.file}`);
  console.error("\nUpdate source files to remove these phrases, then rebuild.\n");
  process.exit(1);
}

console.log(`✅ [check-dist] No forbidden phrases found in ${DIST}/.`);
