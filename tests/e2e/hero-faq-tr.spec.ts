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

    // Switch to Turkish via the header language switcher.
    await page.getByRole("group", { name: /dil|language|język/i }).first()
      .getByRole("button", { name: /^tr$/i }).first()
      .click();

    // Reload to ensure the locale persists.
    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("lang", "tr");

    const section = page.locator("#hero-faq");
    await section.scrollIntoViewIfNeeded();

    await expect(section).toContainText(tr.heroFaq.eyebrow);
    await expect(section.getByRole("heading", { name: tr.heroFaq.title })).toBeVisible();

    expect(tr.heroFaq.items).toHaveLength(6);

    for (const { q, a } of tr.heroFaq.items) {
      const trigger = section.getByRole("button", { name: q });
      await expect(trigger).toBeVisible();

      // Open the accordion item if collapsed.
      const expanded = await trigger.getAttribute("aria-expanded");
      if (expanded !== "true") {
        await trigger.click();
      }

      // Match a robust prefix to avoid whitespace/quote-normalization issues.
      const snippet = a.slice(0, 40);
      await expect(section.getByText(snippet, { exact: false }).first()).toBeVisible();
    }

    // No raw i18n placeholders should leak into the rendered section.
    await expect(section).not.toContainText("heroFaq.");
  });
});
