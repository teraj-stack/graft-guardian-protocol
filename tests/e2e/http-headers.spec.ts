import { test, expect, type APIResponse } from "@playwright/test";

/**
 * E2E: weryfikacja nagłówków HTTP indeksowanych stron.
 *
 *  1. Nagłówek `X-Robots-Tag` (jeśli ustawiony) nie zawiera zakazanych fraz
 *     oraz nie wymusza `noindex` / `none` dla rout, które są w sitemap.
 *  2. Nagłówek `Content-Security-Policy` (lub `-Report-Only`) nie zawiera
 *     zakazanych fraz — np. wycieku domeny / produktu w `report-uri`,
 *     `connect-src`, `img-src`.
 *  3. Strona nie ma meta `<meta name="robots" content="noindex">` w HTML.
 *
 * Zakres rout = lista z sitemap[.]xml.ts minus /auth (świadomy noindex).
 */

const FORBIDDEN = [
  { label: "HIFU", pattern: /\bHIFU\b/i },
  { label: "Fusion Plasma", pattern: /\bfusion[\s-]*plasma\b/i },
  { label: "Baby Face Lift", pattern: /\bbaby[\s-]*face[\s-]*lift\b/i },
  { label: "Laser pikosekundowy", pattern: /\b(laser\s+pikosekundow[ayie]+|pikosekundow[ayie]+)\b/i },
];

function assertCleanString(value: string | null | undefined, where: string) {
  if (!value) return;
  for (const { label, pattern } of FORBIDDEN) {
    expect(pattern.test(value), `Zakazana fraza "${label}" w ${where}: ${value}`).toBe(false);
  }
}

function headerValue(res: APIResponse, name: string): string | null {
  const headers = res.headers();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : null;
}

const INDEXED_ROUTES = [
  "/",
  "/sklep",
  "/koszt-przeszczepu-wlosow",
  "/przypomnienia",
  "/prywatnosc",
  "/cookies",
];

test.describe("Nagłówki HTTP — brak zakazanych fraz i brak noindex na stronach indeksowanych", () => {
  for (const route of INDEXED_ROUTES) {
    test(`${route}: X-Robots-Tag / CSP / meta robots`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status(), `${route} powinno odpowiedzieć <400`).toBeLessThan(400);

      // 1. X-Robots-Tag
      const xRobots = headerValue(res, "x-robots-tag");
      assertCleanString(xRobots, `${route} X-Robots-Tag`);
      if (xRobots) {
        expect(
          /\b(noindex|none|nofollow)\b/i.test(xRobots),
          `${route} ma X-Robots-Tag="${xRobots}", a jest w sitemap`,
        ).toBe(false);
      }

      // 2. Content-Security-Policy (enforce + report-only)
      assertCleanString(headerValue(res, "content-security-policy"), `${route} CSP`);
      assertCleanString(
        headerValue(res, "content-security-policy-report-only"),
        `${route} CSP-Report-Only`,
      );

      // Defensywnie — pozostałe nagłówki SEO-istotne też nie powinny ujawniać
      // zakazanych fraz (np. Link: rel=canonical, Referrer-Policy w komentarzu).
      for (const h of ["link", "referrer-policy", "server", "x-powered-by"]) {
        assertCleanString(headerValue(res, h), `${route} ${h}`);
      }

      // 3. <meta name="robots" content="noindex"> w HTML
      const html = await res.text();
      const metaRobots = html.match(
        /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i,
      );
      if (metaRobots) {
        expect(
          /\b(noindex|none)\b/i.test(metaRobots[1]),
          `${route} ma <meta robots="${metaRobots[1]}">, a jest w sitemap`,
        ).toBe(false);
      }
    });
  }

  test("/auth: świadomy noindex pozostaje aktywny (kontrola odwrotna)", async ({ request }) => {
    const res = await request.get("/auth");
    expect(res.status()).toBeLessThan(400);
    const html = await res.text();
    const xRobots = headerValue(res, "x-robots-tag") ?? "";
    const metaRobots = html.match(
      /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i,
    );
    const hasNoindex =
      /\b(noindex|none)\b/i.test(xRobots) ||
      (metaRobots ? /\b(noindex|none)\b/i.test(metaRobots[1]) : false);
    expect(hasNoindex, "/auth powinno pozostawać poza indeksem").toBe(true);
  });
});
