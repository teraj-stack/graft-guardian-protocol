import { test, expect, request as pwRequest, type APIResponse } from "@playwright/test";

/**
 * E2E: weryfikuje, że dla stron paginowanych:
 *  1. Każdy `<loc>` w sitemap.xml jest "czystą" wersją URL — bez `?page=`,
 *     bez `?page=1`, bez śmieci typu filtr/sort/utm/q.
 *  2. Dla każdej routy paginowanej (`/sklep`, `/koszt-przeszczepu-wlosow`)
 *     i każdego wariantu paginacji (brak query, `?page=1`, `?page=2`, `?page=3`),
 *     `<link rel="canonical">` w HTML wskazuje DOKŁADNIE ten sam URL, który
 *     widnieje w sitemap.xml — string-equal, nie tylko pathname-equal.
 *  3. Sitemap NIE zawiera duplikatów (każdy `<loc>` unikalny).
 *  4. Sitemap NIE zawiera strony 1 jako oddzielnego wpisu (`/sklep?page=1`
 *     to duplikat `/sklep`).
 */

const PAGINATED_ROUTES = ["/sklep", "/koszt-przeszczepu-wlosow"];
const PAGE_VARIANTS = [undefined, 1, 2, 3] as const;

const FORBIDDEN_SITEMAP_QUERY_KEYS = ["page", "sort", "filter", "q", "utm_source", "utm_medium", "utm_campaign"];

function headerValue(res: APIResponse, name: string): string | null {
  const h = res.headers();
  const k = Object.keys(h).find((x) => x.toLowerCase() === name.toLowerCase());
  return k ? h[k] ?? null : null;
}

function extractLocs(xml: string): string[] {
  const out: string[] = [];
  for (const m of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) out.push(m[1]);
  return out;
}

function extractCanonical(html: string): string | null {
  const tag = html.match(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i)?.[0];
  if (!tag) return null;
  return tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;
}

function toAbsolute(urlOrPath: string, baseURL: string): string {
  try {
    return new URL(urlOrPath, baseURL).toString().replace(/\/$/, "");
  } catch {
    return urlOrPath.replace(/\/$/, "");
  }
}

function pathnameOf(absUrl: string): string {
  try {
    return (new URL(absUrl).pathname.replace(/\/+$/, "") || "/");
  } catch {
    return absUrl;
  }
}

let sitemapLocs: string[] = [];
let sitemapByPath: Map<string, string> = new Map();

test.beforeAll(async ({ baseURL }) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const res = await ctx.fetch("/sitemap.xml", { failOnStatusCode: false });
    expect(res.ok(), `/sitemap.xml status ${res.status()}`).toBe(true);
    const xml = await res.text();
    sitemapLocs = extractLocs(xml);
    expect(sitemapLocs.length, "sitemap pusty").toBeGreaterThan(0);
    sitemapByPath = new Map(sitemapLocs.map((loc) => [pathnameOf(loc), loc]));
  } finally {
    await ctx.dispose();
  }
});

test("sitemap: każdy <loc> bez query stringów paginacji/filtra/utm", () => {
  for (const loc of sitemapLocs) {
    const u = new URL(loc);
    for (const key of FORBIDDEN_SITEMAP_QUERY_KEYS) {
      expect(
        u.searchParams.has(key),
        `<loc>${loc}</loc> zawiera zakazany parametr "${key}" — sitemap nie powinien indeksować wariantów paginacji/filtra`,
      ).toBe(false);
    }
    // Dodatkowo: w ogóle żadnego query stringa nie powinno tu być
    expect(u.search, `<loc>${loc}</loc> ma query string "${u.search}" — sitemap musi zawierać czyste URL-e`).toBe("");
  }
});

test("sitemap: brak duplikatów wpisów", () => {
  const seen = new Set<string>();
  const dups: string[] = [];
  for (const loc of sitemapLocs) {
    if (seen.has(loc)) dups.push(loc);
    seen.add(loc);
  }
  expect(dups, `zduplikowane <loc>: ${dups.join(", ")}`).toEqual([]);
});

test("sitemap: brak osobnego wpisu dla strony 1 (np. ?page=1)", () => {
  for (const route of PAGINATED_ROUTES) {
    for (const loc of sitemapLocs) {
      const p = pathnameOf(loc);
      const u = new URL(loc);
      const isSameRoute = p === route.replace(/\/+$/, "");
      const looksLikePage1 = u.searchParams.get("page") === "1";
      expect(
        isSameRoute && looksLikePage1,
        `sitemap zawiera duplikat strony 1: ${loc}`,
      ).toBe(false);
    }
  }
});

for (const route of PAGINATED_ROUTES) {
  for (const pageNum of PAGE_VARIANTS) {
    const path = pageNum === undefined ? route : `${route}?page=${pageNum}`;
    const label = pageNum === undefined ? `${route} (bez query)` : `${route}?page=${pageNum}`;

    test(`${label} — canonical === wpis w sitemap (dokładny string)`, async ({ baseURL }) => {
      const ctx = await pwRequest.newContext({ baseURL });
      try {
        const res = await ctx.fetch(path, { maxRedirects: 10, failOnStatusCode: false });
        expect(res.status(), `[${label}] status ${res.status()}`).toBeGreaterThanOrEqual(200);
        expect(res.status()).toBeLessThan(300);
        const ct = headerValue(res, "content-type") ?? "";
        if (!ct.includes("text/html")) test.skip(true, "nie-HTML");

        const html = await res.text();
        const canonical = extractCanonical(html);
        expect(canonical, `[${label}] brak <link rel="canonical">`).not.toBeNull();

        const canonicalAbs = toAbsolute(canonical!, baseURL!);
        const canonicalPath = pathnameOf(canonicalAbs);

        // 1) canonical wskazuje route bazową (bez query)
        expect(canonicalPath, `[${label}] canonical pathname ${canonicalPath} ≠ ${route}`).toBe(route);
        expect(canonicalAbs.includes("?"), `[${label}] canonical zawiera query: ${canonicalAbs}`).toBe(false);

        // 2) ten sam pathname występuje w sitemap
        const sitemapEntry = sitemapByPath.get(route);
        expect(sitemapEntry, `[${label}] sitemap nie zawiera wpisu dla ${route}`).toBeTruthy();

        // 3) dokładny string match: canonical absolutny === <loc> z sitemap
        //    (normalizujemy oba przez toAbsolute, żeby ścieżki relatywne w canonical
        //     też się zmapowały do tej samej formy)
        const sitemapAbs = toAbsolute(sitemapEntry!, baseURL!);
        expect(
          canonicalAbs,
          `[${label}] canonical "${canonicalAbs}" ≠ sitemap <loc> "${sitemapAbs}"`,
        ).toBe(sitemapAbs);
      } finally {
        await ctx.dispose();
      }
    });
  }
}

// ─── Self-test parserów ───
test("self-test: extractLocs + extractCanonical + pathnameOf", () => {
  const xml = `<urlset><url><loc>https://graftgen.com/sklep</loc></url><url><loc>https://graftgen.com/</loc></url></urlset>`;
  expect(extractLocs(xml)).toEqual(["https://graftgen.com/sklep", "https://graftgen.com/"]);
  expect(extractCanonical(`<link rel="canonical" href="/sklep">`)).toBe("/sklep");
  expect(pathnameOf("https://graftgen.com/sklep/")).toBe("/sklep");
  expect(pathnameOf("https://graftgen.com/")).toBe("/");
});
