# Visual logo baselines

Committed baseline screenshots for the Graftgen / MSC visual diff.

The diff job (`scripts/visual-diff.py`) compares fresh captures from
`scripts/visual-logo-check.py` against the PNGs in this folder and writes
heatmaps, overlays, and a side-by-side report into
`visual-report/diff/`, which CI uploads as the `visual-logo-report`
artifact.

## Seed / refresh baselines locally

```bash
# 1. Build + start a preview server on :8080
bun run build && bun run preview --port 8080 &

# 2. Capture current screenshots
BASE_URL=http://localhost:8080 python scripts/visual-logo-check.py

# 3. Promote them to baselines and commit the diff
python scripts/visual-diff.py --update-baselines
git add tests/visual-baselines
```

## Layout

```
tests/visual-baselines/
  desktop/
    home-pbm.png
    home-hbot.png
    home-ladd.png
    sklep.png
    product-<handle>.png
  mobile/
    ...
```

File names must match exactly what `visual-logo-check.py` writes into
`visual-report/<viewport>/`. New screenshots without a baseline are
reported as `NEW` (soft-pass) until promoted.

## Tuning

- `VISUAL_DIFF_THRESHOLD` (default `1.0`%) — per-image regression budget.
- `PIXEL_NOISE` constant in `visual-diff.py` — minimum per-channel delta
  that counts as a real change (filters JPEG-like noise).
