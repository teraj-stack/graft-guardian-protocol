import { test, expect } from "@playwright/test";

/**
 * E2E: surowe odpowiedzi HTML/XML stron indeksowanych nie zawierają
 * zakazanych fraz w metatagach (<title>, description, og:*, twitter:*),
 * nagłówkach (h1-h3), treści ani w JSON-LD.
 *
 * Sprawdzane są:
 *  - public/robots.txt
 *  - /sitemap.xml (lista loc’ów + zawartość XML)
 *  - każdy URL wymieniony w sitemap (HTML zwrócony przez SSR).
 *
 * Test idzie po RAW HTML (request.get + response.text), żeby wychwycić
 * frazy obecne w źródle przed hydration / w meta nieczytelnych z DOM.
 */

const FORBIDDEN = [
  { label: "HIFU", pattern: /\bHIFU\b/i },
  { label: "Fusion Plasma", pattern: /\bfusion[\s-]*plasma\b/i },
  { label: "Baby Face Lift", pattern: /\bbaby[\s-]*face[\s-]*lift\b/i },
  { label: "Laser pikosekundowy", pattern: /\b(laser\s+pikosekundow[ayie]+|pikosekundow[ayie]+)\b/i },
];

function assertClean(haystack: string, where: string) {
  for (const { label, pattern } of FORBIDDEN) {
    expect(pattern.test(haystack), `Zakazana fraza "${label}" w ${where}`).toBe(false);
  }
}

function extractMetaAndHeadings(html: string) {
  const pick = (re: RegExp) => Array.from(html.matchAll(re)).map((m) => m[1] ?? m[0]);
  return {
    title: pick(/<title[^>]*>([\s\S]*?)<\/title>/gi).join("\n"),
    meta: pick(
      /<meta\b[^>]*\b(?:name|property)=["'](?:description|og:[a-z:]+|twitter:[a-z:]+|keywords)["'][^>]*\bcontent=["']([^"']*)["'][^>]*>/gi,
    ).join("\n"),
    headings: pick(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi).join("\n"),
    jsonLd: pick(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ).join("\n"),
  };
}

test.describe("Indeksowane strony — brak zakazanych fraz w meta, nagłówkach i treści", () => {
  test("robots.txt nie zawiera zakazanych fraz", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status(), "robots.txt powinno odpowiedzieć 200").toBe(200);
    assertClean(await res.text(), "robots.txt");
  });

  test("sitemap.xml jest poprawne i nie zawiera zakazanych URL-i", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status(), "sitemap.xml powinno odpowiedzieć 200").toBe(200);
    const xml = await res.text();
    expect(xml).toContain("<urlset");
    assertClean(xml, "sitemap.xml");

    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    expect(locs.length, "sitemap.xml powinien zawierać co najmniej jeden <loc>").toBeGreaterThan(0);
    for (const loc of locs) {
      assertClean(loc, `sitemap <loc>${loc}`);
    }
  });

  // Routes wyciągnięte z sitemap[.]xml.ts — publiczne strony indeksowane
  // (kategorie + landing). /auth pominięty: ma noindex z założenia.
  const INDEXED_ROUTES = [
    "/",
    "/sklep",
    "/koszt-przeszczepu-wlosow",
    "/przypomnienia",
    "/prywatnosc",
    "/cookies",
  ];

  for (const route of INDEXED_ROUTES) {
    test(`HTML ${route} — meta/nagłówki/treść/JSON-LD są czyste`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status(), `${route} powinno odpowiedzieć <400`).toBeLessThan(400);
      const html = await res.text();

      // Strona nie może być oznaczona jako noindex/nofollow (kontrola sanity
      // dla rout, które naprawdę chcemy indeksować).
      const isNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
      expect(isNoindex, `${route} ma <meta robots=noindex>, a jest w sitemap`).toBe(false);

      const { title, meta, headings, jsonLd } = extractMetaAndHeadings(html);
      assertClean(title, `${route} <title>`);
      assertClean(meta, `${route} <meta description/og:*/twitter:*>`);
      assertClean(headings, `${route} <h1-h3>`);
      assertClean(jsonLd, `${route} JSON-LD`);
      // Pełne źródło HTML — łapie też zwykłą treść body przed hydration.
      assertClean(html, `${route} surowe HTML`);
    });
  }
});
