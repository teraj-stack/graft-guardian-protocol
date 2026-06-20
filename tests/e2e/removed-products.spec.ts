import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: weryfikacja, że usunięte produkty (oferta zewnętrzna BMC) nie pojawiają
 * się w żadnej publicznej podstronie aplikacji Graftgen — w tym w sklepie
 * (renderowanym z Shopify Storefront API).
 */

const FORBIDDEN: { label: string; pattern: RegExp }[] = [
  { label: "HIFU", pattern: /\bHIFU\b/i },
  { label: "Fusion Plasma", pattern: /\bfusion\s+plasma\b/i },
  { label: "Baby Face Lift", pattern: /\bbaby\s+face\s+lift\b/i },
  { label: "Laser pikosekundowy", pattern: /\b(laser\s+pikosekundowy|pikosekundow[ayie]+)\b/i },
];

// Publiczne trasy renderowane po stronie klienta lub SSR.
const PUBLIC_ROUTES = [
  "/",
  "/sklep",
  "/koszt-przeszczepu-wlosow",
  "/prywatnosc",
  "/cookies",
  "/przypomnienia",
  "/auth",
];

async function assertClean(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: "networkidle" });
  expect(response, `brak odpowiedzi dla ${route}`).not.toBeNull();
  expect(
    response!.status(),
    `nieoczekiwany status ${response!.status()} dla ${route}`,
  ).toBeLessThan(400);

  // Pobierz pełny tekst widocznego DOM (po hydration / Shopify fetch).
  const text = await page.locator("body").innerText();

  for (const { label, pattern } of FORBIDDEN) {
    expect(
      pattern.test(text),
      `Zabroniona fraza "${label}" znaleziona na ${route}`,
    ).toBe(false);
  }
}

test.describe("Brak usuniętych produktów na publicznych podstronach", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`route ${route} nie zawiera zakazanych fraz`, async ({ page }) => {
      await assertClean(page, route);
    });
  }

  test("sklep: lista produktów zawiera tylko ofertę Graftgen", async ({ page }) => {
    await page.goto("/sklep", { waitUntil: "networkidle" });
    // Daj Shopify Storefront API moment na renderowanie kart.
    await page.waitForTimeout(1500);
    const text = await page.locator("body").innerText();
    for (const { label, pattern } of FORBIDDEN) {
      expect(pattern.test(text), `Fraza "${label}" w /sklep`).toBe(false);
    }
  });
});
