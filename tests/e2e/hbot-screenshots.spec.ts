import { test, expect, type Page } from "@playwright/test";

/**
 * Pixel-level visual regression for the HBOT section (#hbot).
 *
 * Uses Playwright's `toHaveScreenshot` snapshot engine. Baselines live in
 * `tests/e2e/hbot-screenshots.spec.ts-snapshots/` and are committed to git.
 *
 * Behaviour:
 *  - First run (no baseline) → run with `--update-snapshots` to generate.
 *  - Subsequent runs → screenshot is compared pixel-by-pixel against baseline.
 *  - `maxDiffPixelRatio: 0.001` (0.1%) tolerance catches even small icon /
 *    image shifts while ignoring sub-pixel AA noise.
 *
 * Snapshots are captured at two viewports (desktop / mobile) and with the
 * section's font fully loaded + animations frozen to keep diffs deterministic.
 */

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 1800 },
  { name: "mobile", width: 390, height: 1800 },
] as const;

async function prepHbot(page: Page) {
  // Disable animations & transitions for deterministic snapshots.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  });
  await page.evaluate(() => document.fonts.ready);

  const section = page.locator("section#hbot");
  await section.scrollIntoViewIfNeeded();
  // Let lazy images & layout settle before we shoot.
  await page.waitForLoadState("networkidle").catch(() => {});

  // Confirm every <img> in the section finished decoding — protects against
  // false "diff" caused by a missing raster on the snapshot run.
  await section.locator("img").evaluateAll((nodes) =>
    Promise.all(
      (nodes as HTMLImageElement[]).map((n) =>
        n.complete && n.naturalWidth > 0 ? null : n.decode().catch(() => null),
      ),
    ),
  );

  return section;
}

for (const vp of VIEWPORTS) {
  test.describe(`HBOT screenshot diff — ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`#hbot matches baseline (${vp.name})`, async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const section = await prepHbot(page);

      await expect(section).toHaveScreenshot(`hbot-${vp.name}.png`, {
        animations: "disabled",
        caret: "hide",
        scale: "css",
        // Strict diff thresholds — catch even tiny icon / image shifts.
        maxDiffPixelRatio: 0.001, // ≤0.1% of pixels may differ
        threshold: 0.15, // per-pixel color tolerance (0=identical, 1=any)
      });
    });

    test(`#hbot protocol cards match baseline (${vp.name})`, async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const section = await prepHbot(page);
      const cards = section.locator("article");
      await expect(cards).toHaveCount(2);

      for (let i = 0; i < 2; i++) {
        await expect(cards.nth(i)).toHaveScreenshot(`hbot-card-${i}-${vp.name}.png`, {
          animations: "disabled",
          caret: "hide",
          scale: "css",
          maxDiffPixelRatio: 0.001,
          threshold: 0.15,
        });
      }
    });
  });
}
