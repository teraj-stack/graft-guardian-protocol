import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * Visual asset regression guard for the HBOT section (#hbot).
 *
 * Detects:
 *  - <img> tags whose src fails to load (404, network error, decode error)
 *  - <img> tags rendered at 0×0 (broken layout / missing intrinsic size)
 *  - <svg> icons with empty bounding box (CSS regressions, missing fills)
 *  - any visual child that overflows the section horizontally
 *    (logo too wide, card grid breaking out, etc.)
 *  - badge pills present on both protocol cards (icon-like brand chips)
 *
 * The section currently ships without raster images; the test still asserts
 * that any future image/icon added stays intact and aligned.
 */

async function imageIsLoaded(img: Locator): Promise<{
  ok: boolean;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  complete: boolean;
}> {
  return await img.evaluate((el: HTMLImageElement) => ({
    ok: el.complete && el.naturalWidth > 0 && el.naturalHeight > 0,
    src: el.currentSrc || el.src,
    naturalWidth: el.naturalWidth,
    naturalHeight: el.naturalHeight,
    complete: el.complete,
  }));
}

async function gotoHbot(page: Page) {
  const failedRequests: string[] = [];
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (/\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|mp4|webm)(\?|$)/i.test(url)) {
      failedRequests.push(`${req.failure()?.errorText ?? "failed"} ${url}`);
    }
  });
  page.on("response", (res) => {
    const url = res.url();
    if (
      res.status() >= 400 &&
      /\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|mp4|webm)(\?|$)/i.test(url)
    ) {
      failedRequests.push(`${res.status()} ${url}`);
    }
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const section = page.locator("section#hbot");
  await section.scrollIntoViewIfNeeded();
  // Allow lazy-loaded images / fonts to settle.
  await page.waitForLoadState("networkidle").catch(() => {});
  return { section, failedRequests };
}

test.describe("HBOT visual assets", () => {
  test("every <img> inside #hbot loads with non-zero intrinsic size", async ({ page }) => {
    const { section, failedRequests } = await gotoHbot(page);

    const imgs = section.locator("img");
    const count = await imgs.count();

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const img = imgs.nth(i);
      const status = await imageIsLoaded(img);
      const alt = (await img.getAttribute("alt")) ?? "";
      if (!status.ok) {
        failures.push(
          `img[${i}] alt="${alt}" src="${status.src}" — complete=${status.complete} natural=${status.naturalWidth}x${status.naturalHeight}`,
        );
      }
      // Accessibility tripwire — img without alt is also a visual-asset bug.
      if (alt === null) failures.push(`img[${i}] missing alt attribute (src=${status.src})`);
    }

    expect(failures, failures.join("\n")).toHaveLength(0);
    expect(failedRequests, failedRequests.join("\n")).toHaveLength(0);
  });

  test("every <svg> icon inside #hbot has a non-zero rendered box", async ({ page }) => {
    const { section } = await gotoHbot(page);
    const svgs = section.locator("svg");
    const count = await svgs.count();

    const broken: string[] = [];
    for (let i = 0; i < count; i++) {
      const box = await svgs.nth(i).boundingBox();
      if (!box || box.width < 1 || box.height < 1) {
        broken.push(`svg[${i}] box=${JSON.stringify(box)}`);
      }
    }
    expect(broken, broken.join("\n")).toHaveLength(0);
  });

  test("nothing inside #hbot overflows the section horizontally", async ({ page }) => {
    const { section } = await gotoHbot(page);
    const sectionBox = await section.boundingBox();
    expect(sectionBox).not.toBeNull();
    const right = (sectionBox!.x + sectionBox!.width) + 1; // 1px tolerance

    const visuals = section.locator("img, svg, video, picture, article");
    const count = await visuals.count();
    const overflow: string[] = [];
    for (let i = 0; i < count; i++) {
      const el = visuals.nth(i);
      const box = await el.boundingBox();
      if (!box) continue;
      if (box.x + box.width > right) {
        const tag = await el.evaluate((n) => n.tagName.toLowerCase());
        overflow.push(`${tag}[${i}] extends to ${box.x + box.width}px (section right=${right}px)`);
      }
    }
    expect(overflow, overflow.join("\n")).toHaveLength(0);
  });

  test("brand chips (badges) render on both protocol cards", async ({ page }) => {
    const { section } = await gotoHbot(page);
    // Badges are short uppercase pills next to card titles — visual icons of the protocol.
    await expect(section).toContainText("1,5–3,0 ATA");
    await expect(section).toContainText(/pO₂\s*×10/);

    const cards = section.locator("article");
    await expect(cards).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      const card = cards.nth(i);
      const box = await card.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThan(100);
      expect(box?.height ?? 0).toBeGreaterThan(80);
    }
  });

  test("mobile viewport: assets stay inside #hbot at 390px wide", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1800 });
    const { section } = await gotoHbot(page);
    const sectionBox = await section.boundingBox();
    expect(sectionBox).not.toBeNull();
    expect(sectionBox!.width).toBeLessThanOrEqual(390);

    const imgs = section.locator("img");
    const count = await imgs.count();
    for (let i = 0; i < count; i++) {
      const status = await imageIsLoaded(imgs.nth(i));
      expect(status.ok, `mobile img[${i}] not loaded: ${JSON.stringify(status)}`).toBe(true);
      const box = await imgs.nth(i).boundingBox();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(sectionBox!.x + sectionBox!.width + 1);
      }
    }
  });
});
