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
  test("renders correct Turkish content after switching language and reloading", async ({ page }) => {
    await page.goto("/");

    // Switch to Turkish via the header language switcher group.
    const switcher = page
      .getByRole("group", { name: /dil|language|język/i })
      .first();
    await expect(switcher).toBeVisible();
    const trButton = switcher.getByRole("button", { name: /^tr$/i }).first();
    await trButton.click();
    await expect(trButton).toHaveAttribute("aria-pressed", "true");

    // Reload to ensure the locale persists across navigations.
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
