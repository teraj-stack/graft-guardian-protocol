import { test, expect, type Page } from "@playwright/test";

/**
 * E2E: weryfikacja, że wyszukiwarka oraz filtry produktowe Shopify Storefront
 * (zasilające stronę /sklep) nie zwracają usuniętej oferty BMC: HIFU,
 * Fusion Plasma, Baby Face Lift, Laser pikosekundowy.
 *
 * Strona /sklep renderuje listę bezpośrednio z Storefront API
 * (`storefrontApiRequest` + `STOREFRONT_PRODUCTS_QUERY`). Test sprawdza
 * dwie warstwy:
 *   1. Storefront API: każda fraza użyta jako `query` produktowy musi zwrócić
 *      pustą listę (filtr po stronie Shopify).
 *   2. DOM /sklep: karty produktów wyrenderowane po hydration nie zawierają
 *      zakazanych fraz (filtr po stronie klienta).
 */

const SHOPIFY_STOREFRONT_URL =
  "https://graft-guardian-protocol-j7u4y.myshopify.com/api/2025-07/graphql.json";
const SHOPIFY_STOREFRONT_TOKEN = "99228b4e977dd8200a6f18f9bd591232";

const FORBIDDEN = [
  { label: "HIFU", query: "HIFU", pattern: /\bHIFU\b/i },
  { label: "Fusion Plasma", query: "Fusion Plasma", pattern: /\bfusion\s+plasma\b/i },
  { label: "Baby Face Lift", query: "Baby Face Lift", pattern: /\bbaby\s+face\s+lift\b/i },
  {
    label: "Laser pikosekundowy",
    query: "pikosekundowy",
    pattern: /\b(laser\s+pikosekundowy|pikosekundow[ayie]+)\b/i,
  },
];

const SEARCH_QUERY = `
  query Search($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges { node { id title handle description productType tags vendor } }
    }
  }
`;

async function storefrontSearch(query: string) {
  const res = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query: SEARCH_QUERY, variables: { first: 50, query } }),
  });
  expect(res.ok, `Storefront API HTTP ${res.status} dla query="${query}"`).toBe(true);
  const json = (await res.json()) as {
    data?: { products?: { edges?: Array<{ node: Record<string, unknown> }> } };
    errors?: Array<{ message: string }>;
  };
  expect(json.errors, `Shopify zwrócił błędy dla query="${query}"`).toBeFalsy();
  return json.data?.products?.edges ?? [];
}

test.describe("Sklep — wyszukiwarka i filtry produktów nie zwracają usuniętej oferty", () => {
  for (const { label, query, pattern } of FORBIDDEN) {
    test(`Storefront query="${query}" nie zwraca produktów (${label})`, async () => {
      const edges = await storefrontSearch(query);
      // 1. Brak jakichkolwiek wyników.
      expect(edges.length, `Wyszukanie "${query}" zwróciło ${edges.length} produktów`).toBe(0);

      // 2. Defensywnie — gdyby Shopify rozszerzył dopasowanie, żaden zwrócony
      //    rekord nie może zawierać zakazanej frazy w polach indeksowanych.
      for (const { node } of edges) {
        const haystack = [node.title, node.description, node.productType, node.vendor]
          .filter(Boolean)
          .join(" ");
        expect(
          pattern.test(haystack),
          `Produkt "${node.title}" pasuje do zakazanej frazy ${label}`,
        ).toBe(false);
      }
    });
  }

  test("/sklep — wyrenderowane karty produktów nie zawierają zakazanych fraz", async ({
    page,
  }: { page: Page }) => {
    await page.goto("/sklep", { waitUntil: "networkidle" });
    // Czekamy aż useQuery zhydratuje wynik Storefront API.
    await page.waitForFunction(
      () => !document.body.innerText.includes("Ładowanie produktów"),
      undefined,
      { timeout: 15_000 },
    );

    // Lista produktów (kontener z kartami) — jeśli nie ma żadnych kart, też OK
    // (sklep jest pusty, ale zakazane frazy na pewno nie wystąpią).
    const shopText = await page.locator("main, body").first().innerText();
    for (const { label, pattern } of FORBIDDEN) {
      expect(pattern.test(shopText), `Karta produktu z frazą "${label}" w /sklep`).toBe(false);
    }
  });
});
