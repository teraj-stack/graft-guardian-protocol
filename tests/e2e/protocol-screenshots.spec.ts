import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * Pixel-level visual regression for every protocol section on `/` except
 * `#hbot` (covered by `hbot-screenshots.spec.ts`).
 *
 * Same engine, same thresholds, same determinism tricks as the HBOT spec —
 * extended across three viewports to catch icon/image shifts on phone,
 * tablet, and desktop layouts.
 *
 * Baselines live in `tests/e2e/protocol-screenshots.spec.ts-snapshots/`.
 * Regenerate after intentional design changes:
 *   bunx playwright test tests/e2e/protocol-screenshots.spec.ts --update-snapshots
 */

const SECTIONS = [
  { id: "dlaczego", label: "01 — Dlaczego pierwsze 48h" },
  { id: "ex-vivo", label: "02 — Faza Ex Vivo" },
  { id: "pbm", label: "03 — Fotobiomodulacja" },
  { id: "ladd", label: "05 — LADD" },
] as const;

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 1800 },
  { name: "tablet", width: 834, height: 1800 },
  { name: "mobile", width: 390, height: 1800 },
] as const;

async function freezePage(page: Page) {
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
      /* Hide non-deterministic surfaces (cookie banner, toasts, live regions). */
      [data-testid="cookie-consent"],
      [role="status"],
      [role="alert"],
      .sonner-toast,
      [data-sonner-toaster] { visibility: hidden !important; }
    `,
  });
  await page.evaluate(() => document.fonts.ready);
}

async function prepSection(page: Page, id: string): Promise<Locator> {
  const section = page.locator(`section#${id}`);
  await section.scrollIntoViewIfNeeded();
  await page.waitForLoadState("networkidle").catch(() => {});

  // Freeze any <video> in the section to frame 0 so playback state never
  // contributes to the diff (LADD section has an autoplaying poster video).
  await section.locator("video").evaluateAll((vids) => {
    for (const v of vids as HTMLVideoElement[]) {
      try {
        v.pause();
        v.currentTime = 0;
        v.removeAttribute("autoplay");
      } catch {}
    }
  });

  // Make sure raster images have decoded before the shot.
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
  test.describe(`Protocol sections — ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const sec of SECTIONS) {
      test(`#${sec.id} matches baseline (${vp.name})`, async ({ page }) => {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await freezePage(page);
        const section = await prepSection(page, sec.id);

        await expect(section).toHaveScreenshot(`${sec.id}-${vp.name}.png`, {
          animations: "disabled",
          caret: "hide",
          scale: "css",
          // Identical thresholds to hbot-screenshots.spec.ts.
          maxDiffPixelRatio: 0.001,
          threshold: 0.15,
        });
      });
    }
  });
}
