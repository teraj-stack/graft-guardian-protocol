#!/usr/bin/env bash
# Clean caches + dist, run a fresh build, then verify forbidden phrases are gone.
# Fails (non-zero exit) if "Cennik / Sklep" (or any other forbidden phrase) leaks into dist/.
set -euo pipefail

echo "🧹 [clean-build-check] Removing dist/ and Vite caches..."
rm -rf dist .vite node_modules/.vite node_modules/.cache .tanstack 2>/dev/null || true

echo "🏗  [clean-build-check] Running fresh production build..."
bun run vite build

echo "🔎 [clean-build-check] Scanning dist/ for forbidden phrases (with JSON report)..."
node scripts/check-dist-forbidden-phrases.mjs --report=dist/_forbidden-phrases-report.json

echo "✅ [clean-build-check] Clean build passed forbidden-phrase guard."
echo "   Report: dist/_forbidden-phrases-report.json"
