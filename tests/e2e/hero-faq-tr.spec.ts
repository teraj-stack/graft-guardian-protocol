import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type HeroFaq = {
  eyebrow: string;
  title: string;
  items: Array<{ q: string; a: string }>;
};

const tr = JSON.parse(
  readFileSync(resolve(process.cwd(), "src/locales/tr.json"), "utf8"),
) as { heroFaq: HeroFaq };

test.describe("HeroFAQ — Turkish locale", () => {
  test("renders correct Turkish content after switching language and reloading", async ({ page, context }) => {
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

    const section = page.locator("#hero-faq");
    await section.scrollIntoViewIfNeeded();

    // Eyebrow + title.
    await expect(section).toContainText(tr.heroFaq.eyebrow);
    await expect(
      section.getByRole("heading", { level: 2, name: tr.heroFaq.title }),
    ).toBeVisible();

    // Exactly 6 Q/A pairs are expected.
    expect(tr.heroFaq.items).toHaveLength(6);

    for (const { q, a } of tr.heroFaq.items) {
      await expect(
        section.getByRole("heading", { level: 3, name: q }),
      ).toBeVisible();
      // Match a stable answer prefix (avoids whitespace/quote normalization issues).
      const snippet = a.slice(0, 60);
      await expect(section.getByText(snippet, { exact: false }).first())
        .toBeVisible();
    }

    // No raw i18n placeholders should leak into the rendered section.
    await expect(section).not.toContainText("heroFaq.");
  });
});
