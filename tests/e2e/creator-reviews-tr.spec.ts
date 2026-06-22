import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type ReviewItem = {
  quote: string;
  author: string;
  date: string;
};

type CreatorReviews = {
  profileLabel: string;
  profileSubtitle: string;
  ratingMax: string;
  ratingCount: string;
  viewProfile: string;
  heading: string;
  intro: string;
  items: ReviewItem[];
};

const tr = JSON.parse(
  readFileSync(resolve(process.cwd(), "src/locales/tr.json"), "utf8"),
) as { creatorReviews: CreatorReviews };

test.describe("CreatorReviews — Turkish locale", () => {
  test("renders correct Turkish heading, intro and 4 quotes after switching language and reloading", async ({ page, context }) => {
    // Pre-seed the persisted locale so that on reload the app boots in TR
    // (mirrors what the header switcher does via persistLocale()).
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("graftgen.lang", "tr");
      } catch {
        /* ignore */
      }
    });

    await page.goto("/");

    // Sanity check: the header switcher exposes a TR button and reflects state.
    const switcher = page
      .getByRole("group", { name: /dil|language|język/i })
      .first();
    await expect(switcher).toBeVisible();
    const trButton = switcher.getByRole("button", { name: /^tr$/i }).first();
    await trButton.click();

    // Reload to verify TR persists across full page loads.
    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("lang", "tr");

    // Locate via the heading; the section uses aria-labelledby="creator-reviews-heading".
    const section = page.locator("[aria-labelledby='creator-reviews-heading']");
    await section.scrollIntoViewIfNeeded();

    // Verify the ZnanyLekarz profile card strings are localized.
    const profileCard = section.locator("a", {
      hasText: tr.creatorReviews.profileLabel,
    });
    await expect(profileCard).toBeVisible();
    await expect(profileCard).toContainText(tr.creatorReviews.viewProfile);

    // Verify heading and intro.
    await expect(
      section.getByRole("heading", { level: 2, name: tr.creatorReviews.heading }),
    ).toBeVisible();
    await expect(section).toContainText(tr.creatorReviews.intro);

    // Exactly 4 quotes are expected.
    expect(tr.creatorReviews.items).toHaveLength(4);

    for (const item of tr.creatorReviews.items) {
      // Match a stable quote prefix (avoids whitespace/quote normalization issues).
      const quoteSnippet = item.quote.slice(0, 80);
      const quoteLocator = section.getByText(quoteSnippet, { exact: false }).first();
      await expect(quoteLocator).toBeVisible();
      // Author + date footer must be visible in the section.
      await expect(section).toContainText(`— ${item.author}, ${item.date}`);
    }

    // No raw i18n placeholders should leak into the rendered section.
    await expect(section).not.toContainText("creatorReviews.");
  });
});
