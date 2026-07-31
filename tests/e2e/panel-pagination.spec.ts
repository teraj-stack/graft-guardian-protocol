import { test, expect } from "@playwright/test";

test.describe("Panel section 09 — results pagination", () => {
  test("renders accessible pagination and navigates between pages", async ({ page }) => {
    await page.goto("/panel");

    const nav = page.getByTestId("panel-pagination");
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute("aria-label", /pagination|paginacja|sayfalama/i);

    // page 1: 6 cards, current page marked
    const current = nav.locator('[aria-current="page"]');
    await expect(current).toHaveText("1");
    await expect(current).toHaveAttribute("aria-label", /1/);

    // each page link exposes an aria-label
    const links = nav.locator("ul li a");
    expect(await links.count()).toBeGreaterThan(2);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute("aria-label", /.+/);
    }

    // navigate to the last page
    const last = nav.locator("ul li a").filter({ hasText: /^3$/ });
    await last.click();
    await expect(page).toHaveURL(/page=3/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText("3");

    // "next" is disabled on the last page
    await expect(nav.locator('[aria-disabled="true"]').last()).toBeVisible();
  });

  test("resets to page 1 when a filter changes", async ({ page }) => {
    await page.goto("/panel?page=3");
    await expect(page.getByTestId("panel-pagination").locator('[aria-current="page"]')).toHaveText(
      "3",
    );

    await page.getByRole("link", { name: /HBOT/i }).first().click();
    await expect(page).not.toHaveURL(/page=3/);
  });
});
