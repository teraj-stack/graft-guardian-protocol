#!/usr/bin/env python3
"""Visual diff generator for Graftgen / MSC logo screenshots.

Compares freshly captured screenshots in ``visual-report/<viewport>/`` against
committed baselines in ``tests/visual-baselines/<viewport>/`` and emits, for
every matched pair:

  visual-report/diff/<viewport>/<name>.baseline.png   - baseline copy
  visual-report/diff/<viewport>/<name>.current.png    - current copy
  visual-report/diff/<viewport>/<name>.heatmap.png    - red heatmap of |delta|
  visual-report/diff/<viewport>/<name>.overlay.png    - current + red overlay
  visual-report/diff/<viewport>/<name>.sidebyside.png - baseline | current | heatmap

Also writes ``visual-report/diff/diff-report.json`` and a browsable
``visual-report/diff/index.html`` so the artifact uploaded by CI is enough to
review every regression visually.

Exit codes:
  0 - no pair exceeded the per-image diff threshold (default 1.0%)
  1 - at least one pair exceeded the threshold
  2 - no baselines found (treated as soft-fail; CI keeps the run green but the
      script prints how to seed baselines)

Seeding baselines locally::

  BASE_URL=http://localhost:8080 python scripts/visual-logo-check.py
  python scripts/visual-diff.py --update-baselines

Env:
  VISUAL_OUT          (default: visual-report)
  VISUAL_BASELINES    (default: tests/visual-baselines)
  VISUAL_DIFF_THRESHOLD pct, default 1.0
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

OUT = Path(os.environ.get("VISUAL_OUT", "visual-report"))
BASELINES = Path(os.environ.get("VISUAL_BASELINES", "tests/visual-baselines"))
DIFF_DIR = OUT / "diff"
THRESHOLD_PCT = float(os.environ.get("VISUAL_DIFF_THRESHOLD", "1.0"))

# Pixel intensity (0-255) above which a channel-delta counts as "changed".
PIXEL_NOISE = 12


def _normalize(a: Image.Image, b: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Resize the larger image to the smaller one's size so we can diff."""
    if a.size != b.size:
        w = min(a.size[0], b.size[0])
        h = min(a.size[1], b.size[1])
        a = a.resize((w, h))
        b = b.resize((w, h))
    return a.convert("RGB"), b.convert("RGB")


def _heatmap(diff: Image.Image) -> Image.Image:
    """Red intensity heatmap from an absolute RGB diff image."""
    gray = diff.convert("L").filter(ImageFilter.MaxFilter(3))
    w, h = gray.size
    red = Image.new("RGB", (w, h), (0, 0, 0))
    red_pixels = red.load()
    g = gray.load()
    for y in range(h):
        for x in range(w):
            v = g[x, y]
            if v > PIXEL_NOISE:
                # punch low-signal noise, boost real changes
                boost = min(255, int((v - PIXEL_NOISE) * 2.2))
                red_pixels[x, y] = (boost, 0, 0)
    return red


def _overlay(current: Image.Image, heat: Image.Image) -> Image.Image:
    base = current.convert("RGBA")
    # Build a red translucent layer driven by the heatmap luminance.
    red_layer = Image.new("RGBA", base.size, (255, 0, 0, 0))
    alpha = heat.convert("L").point(lambda v: min(180, int(v * 0.9)))
    red_layer.putalpha(alpha)
    return Image.alpha_composite(base, red_layer).convert("RGB")


def _sidebyside(baseline: Image.Image, current: Image.Image, heat: Image.Image) -> Image.Image:
    w, h = baseline.size
    canvas = Image.new("RGB", (w * 3 + 16, h), (20, 20, 24))
    canvas.paste(baseline, (0, 0))
    canvas.paste(current, (w + 8, 0))
    canvas.paste(heat, (w * 2 + 16, 0))
    return canvas


def _changed_ratio(diff: Image.Image) -> float:
    gray = diff.convert("L")
    hist = gray.histogram()
    changed = sum(hist[PIXEL_NOISE + 1 :])
    total = sum(hist) or 1
    return changed / total


def discover_pairs() -> list[tuple[str, str, Path, Path]]:
    """Return (viewport, name, baseline_path, current_path) for every shot."""
    pairs: list[tuple[str, str, Path, Path]] = []
    if not OUT.exists():
        return pairs
    for vp_dir in sorted(p for p in OUT.iterdir() if p.is_dir() and p.name != "diff"):
        vp = vp_dir.name
        for current in sorted(vp_dir.glob("*.png")):
            baseline = BASELINES / vp / current.name
            pairs.append((vp, current.stem, baseline, current))
    return pairs


def update_baselines() -> int:
    pairs = discover_pairs()
    if not pairs:
        print("No current screenshots in", OUT, "— run visual-logo-check first.")
        return 1
    count = 0
    for vp, _name, baseline, current in pairs:
        baseline.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(current, baseline)
        count += 1
    print(f"Updated {count} baselines under {BASELINES}/")
    return 0


def render_html(report: dict) -> str:
    rows = []
    for r in report["images"]:
        status = "OK" if r["ok"] else "REGRESSION"
        color = "#1f8a4c" if r["ok"] else "#c8364f"
        if r["status"] == "missing-baseline":
            status, color = "NEW", "#b8852b"
        rel = lambda p: p  # paths are already relative to diff/
        cells = ""
        if r["status"] == "ok":
            cells = f"""
              <img src="{rel(r['sidebyside'])}" alt="side by side" />
            """
        elif r["status"] == "missing-baseline":
            cells = f"""
              <div class="missing">No baseline yet — current screenshot:</div>
              <img src="{rel(r['current'])}" alt="current" />
            """
        rows.append(
            f"""
            <section>
              <header>
                <h2>{r['viewport']} / {r['name']}</h2>
                <span class="badge" style="background:{color}">{status}</span>
                <span class="meta">changed: {r['changed_pct']:.2f}%</span>
              </header>
              {cells}
            </section>
            """
        )
    summary = report["summary"]
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>Visual logo diff report</title>
<style>
  body {{ font: 14px system-ui, sans-serif; background:#0f1116; color:#e7e9ee; margin:0; padding:24px; }}
  h1 {{ margin:0 0 8px; font-size:20px; }}
  .summary {{ margin:0 0 24px; color:#a9b0bd; }}
  section {{ background:#181b23; border:1px solid #242833; border-radius:10px; padding:16px; margin-bottom:20px; }}
  section header {{ display:flex; align-items:center; gap:12px; margin-bottom:12px; }}
  h2 {{ font-size:15px; margin:0; }}
  .badge {{ font-size:11px; padding:3px 8px; border-radius:999px; color:#fff; }}
  .meta {{ font-size:12px; color:#8b93a4; margin-left:auto; }}
  img {{ max-width:100%; display:block; border:1px solid #242833; border-radius:6px; }}
  .missing {{ color:#b8852b; margin:6px 0; }}
</style></head>
<body>
  <h1>Visual logo diff</h1>
  <p class="summary">
    {summary['total']} pairs · {summary['regressions']} regressions ·
    {summary['missing_baselines']} new · threshold {THRESHOLD_PCT:.2f}%
  </p>
  {''.join(rows)}
</body></html>"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--update-baselines", action="store_true")
    args = ap.parse_args()

    if args.update_baselines:
        return update_baselines()

    pairs = discover_pairs()
    if not pairs:
        print("No screenshots found in", OUT, "— run scripts/visual-logo-check.py first.")
        return 2

    DIFF_DIR.mkdir(parents=True, exist_ok=True)
    images: list[dict] = []
    regressions = 0
    missing = 0

    for vp, name, baseline_path, current_path in pairs:
        out_vp = DIFF_DIR / vp
        out_vp.mkdir(parents=True, exist_ok=True)
        current_copy = out_vp / f"{name}.current.png"
        shutil.copy2(current_path, current_copy)

        if not baseline_path.exists():
            missing += 1
            images.append({
                "viewport": vp,
                "name": name,
                "status": "missing-baseline",
                "ok": True,
                "changed_pct": 0.0,
                "current": str(current_copy.relative_to(DIFF_DIR)),
            })
            continue

        baseline_copy = out_vp / f"{name}.baseline.png"
        shutil.copy2(baseline_path, baseline_copy)

        a = Image.open(baseline_path)
        b = Image.open(current_path)
        a, b = _normalize(a, b)
        diff = ImageChops.difference(a, b)
        heat = _heatmap(diff)
        overlay = _overlay(b, heat)
        side = _sidebyside(a, b, heat)

        heat_path = out_vp / f"{name}.heatmap.png"
        overlay_path = out_vp / f"{name}.overlay.png"
        side_path = out_vp / f"{name}.sidebyside.png"
        heat.save(heat_path)
        overlay.save(overlay_path)
        side.save(side_path)

        ratio = _changed_ratio(diff)
        pct = ratio * 100.0
        ok = pct <= THRESHOLD_PCT
        if not ok:
            regressions += 1
        images.append({
            "viewport": vp,
            "name": name,
            "status": "ok",
            "ok": ok,
            "changed_pct": pct,
            "baseline": str(baseline_copy.relative_to(DIFF_DIR)),
            "current": str(current_copy.relative_to(DIFF_DIR)),
            "heatmap": str(heat_path.relative_to(DIFF_DIR)),
            "overlay": str(overlay_path.relative_to(DIFF_DIR)),
            "sidebyside": str(side_path.relative_to(DIFF_DIR)),
        })

    report = {
        "threshold_pct": THRESHOLD_PCT,
        "summary": {
            "total": len(images),
            "regressions": regressions,
            "missing_baselines": missing,
        },
        "images": images,
    }
    (DIFF_DIR / "diff-report.json").write_text(json.dumps(report, indent=2))
    (DIFF_DIR / "index.html").write_text(render_html(report))

    print(
        f"diff: {len(images)} pairs, {regressions} regression(s), "
        f"{missing} missing baseline(s). threshold={THRESHOLD_PCT:.2f}%"
    )
    if missing and not any(i["status"] == "ok" for i in images):
        print("No baselines committed yet. Run with --update-baselines to seed.")
        return 2
    return 1 if regressions else 0


if __name__ == "__main__":
    sys.exit(main())
