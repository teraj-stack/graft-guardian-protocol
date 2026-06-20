import { test, expect } from "@playwright/test";

/**
 * Regression guard for the HBOT section (#hbot) on the homepage.
 *
 * After any layout edits the section must:
 *  - exist in the DOM with the canonical id
 *  - render its eyebrow, heading and lead copy
 *  - render exactly the two protocol cards (Protokół sesji, Mechanizm działania)
 *  - keep the 1,5–3,0 ATA parameter visible (brand-standard)
 *  - render without runtime console errors
 *  - have a non-zero bounding box (not collapsed by broken JSX)
 */
test.describe("HBOT section", () => {
  test("renders structure, copy and parameters without errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/", { waitUntil: "domcontentloaded" });

    const section = page.locator("section#hbot");
    await expect(section).toHaveCount(1);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();

    // Layout sanity — section should have real height, not collapsed.
    const box = await section.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(200);

    // Eyebrow / heading / lead.
    await expect(section).toContainText(/04\s*—\s*TLENOTERAPIA HIPERBARYCZNA \(HBOT\)/i);
    await expect(section.locator("h2")).toContainText(/Tlen dociera tam/i);
    await expect(section).toContainText(/1,5[–-]3,0 ATA/);
    await expect(section).toContainText(/100% O₂/);

    // Exactly two cards with expected titles.
    const cardTitles = section.locator("article h3");
    await expect(cardTitles).toHaveCount(2);
    await expect(cardTitles.nth(0)).toHaveText(/Protokół sesji/i);
    await expect(cardTitles.nth(1)).toHaveText(/Mechanizm działania/i);

    // Protocol bullets present.
    await expect(section).toContainText(/Doba "Zero"/);
    await expect(section).toContainText(/doba 1 po zabiegu/i);

    // No runtime errors triggered by rendering this section.
    expect(consoleErrors, consoleErrors.join("\n")).toHaveLength(0);
  });

  test("anchor navigation from nav scrolls to #hbot", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator('a[href="#hbot"]').first().click();
    await expect(page).toHaveURL(/#hbot$/);
    await expect(page.locator("section#hbot")).toBeInViewport({ ratio: 0.05 });
  });
});
