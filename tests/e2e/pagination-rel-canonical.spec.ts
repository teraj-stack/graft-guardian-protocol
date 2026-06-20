import { test, expect, request as pwRequest, type APIResponse } from "@playwright/test";

/**
 * E2E: dla każdej strony paginowanej (page=1..N) weryfikuje, że:
 *  1. `<link rel="canonical">` istnieje i wskazuje URL bez query stringa
 *     (czysta ścieżka bazowa), tożsamy z routą — Google traktuje warianty
 *     paginacji jako duplikaty kanonicznego URL.
 *  2. `<link rel="next">` (jeśli istnieje) wskazuje TĘ SAMĄ ścieżkę co
 *     canonical, różni się wyłącznie wartością `page` = current+1.
 *  3. `<link rel="prev">` (jeśli istnieje) wskazuje tę samą ścieżkę co
 *     canonical i:
 *       - dla page=2 → brak `page` LUB `page=1` (nie duplikujemy strony 1
 *         pod URL-em `?page=1`),
 *       - dla page>2 → `page=current-1`.
 *  4. Na stronie 1 (bez query lub `?page=1`) — `rel=prev` NIE istnieje.
 *  5. Wszystkie hrefy w rel=next/prev/canonical mają ten sam origin lub
 *     są root-relative; pathname jest identyczny.
 */

const PAGINATED_ROUTES = ["/sklep", "/koszt-przeszczepu-wlosow"];
const PAGES_TO_CHECK = [undefined, 1, 2, 3] as const;

function headerValue(res: APIResponse, name: string): string | null {
  const h = res.headers();
  const k = Object.keys(h).find((x) => x.toLowerCase() === name.toLowerCase());
  return k ? h[k] ?? null : null;
}

async function fetchFollow(baseURL: string, path: string): Promise<{ status: number; body: string; contentType: string }> {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const res = await ctx.fetch(path, { maxRedirects: 10, failOnStatusCode: false });
    return {
      status: res.status(),
      body: await res.text(),
      contentType: headerValue(res, "content-type") ?? "",
    };
  } finally {
    await ctx.dispose();
  }
}

function extractLinkRel(html: string, rel: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const relM = tag.match(/\brel\s*=\s*["']([^"']+)["']/i);
    if (!relM) continue;
    const rels = relM[1].toLowerCase().split(/\s+/);
    if (!rels.includes(rel)) continue;
    const hrefM = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (hrefM) out.push(hrefM[1]);
  }
  return out;
}

function parseUrl(urlOrPath: string): { origin: string; pathname: string; page: string | null; query: string } {
  const u = new URL(urlOrPath, "http://x.invalid");
  return {
    origin: u.origin === "http://x.invalid" ? "" : u.origin,
    pathname: u.pathname.replace(/\/+$/, "") || "/",
    page: u.searchParams.get("page"),
    query: u.search,
  };
}

function buildPath(route: string, page?: number): string {
  return page === undefined ? route : `${route}?page=${page}`;
}

for (const route of PAGINATED_ROUTES) {
  for (const pageNum of PAGES_TO_CHECK) {
    const path = buildPath(route, pageNum);
    const label = pageNum === undefined ? `${route} (brak ?page)` : `${route}?page=${pageNum}`;
    const current = pageNum ?? 1;

    test(`${label} — canonical bez query; rel=next/prev wskazują właściwą stronę`, async ({ baseURL }) => {
      const { status, body, contentType } = await fetchFollow(baseURL!, path);
      expect(status, `[${label}] status ${status}`).toBeGreaterThanOrEqual(200);
      expect(status, `[${label}] status ${status}`).toBeLessThan(300);
      if (!contentType.includes("text/html")) test.skip(true, "nie-HTML");

      const expectedPath = route.replace(/\/+$/, "") || "/";

      // 1) Canonical — istnieje dokładnie raz, czysta ścieżka bez query
      const canonicals = extractLinkRel(body, "canonical");
      expect(canonicals.length, `[${label}] oczekuję dokładnie 1 canonical, jest ${canonicals.length}`).toBe(1);
      const canon = parseUrl(canonicals[0]);
      expect(canon.pathname, `[${label}] canonical pathname ${canon.pathname} ≠ ${expectedPath}`).toBe(expectedPath);
      expect(
        canon.query,
        `[${label}] canonical nie powinien zawierać query stringa, jest "${canon.query}"`,
      ).toBe("");

      // 2) rel=next
      const nexts = extractLinkRel(body, "next");
      expect(nexts.length, `[${label}] zduplikowane rel=next: ${nexts.join(", ")}`).toBeLessThanOrEqual(1);
      if (nexts.length === 1) {
        const n = parseUrl(nexts[0]);
        expect(n.pathname, `[${label}] rel=next pathname ${n.pathname} ≠ canonical ${expectedPath}`).toBe(expectedPath);
        if (n.origin && canon.origin) {
          expect(n.origin, `[${label}] rel=next origin ≠ canonical origin`).toBe(canon.origin);
        }
        expect(
          n.page,
          `[${label}] rel=next powinien wskazywać page=${current + 1}, jest "${n.page}"`,
        ).toBe(String(current + 1));
      }

      // 3 + 4) rel=prev
      const prevs = extractLinkRel(body, "prev");
      expect(prevs.length, `[${label}] zduplikowane rel=prev: ${prevs.join(", ")}`).toBeLessThanOrEqual(1);

      if (current === 1) {
        expect(
          prevs.length,
          `[${label}] strona 1 nie powinna mieć rel=prev; jest: ${prevs.join(", ")}`,
        ).toBe(0);
      } else if (prevs.length === 1) {
        const p = parseUrl(prevs[0]);
        expect(p.pathname, `[${label}] rel=prev pathname ${p.pathname} ≠ canonical ${expectedPath}`).toBe(expectedPath);
        if (p.origin && canon.origin) {
          expect(p.origin, `[${label}] rel=prev origin ≠ canonical origin`).toBe(canon.origin);
        }
        if (current === 2) {
          // KRYTYCZNE: page=2 → prev = strona 1 = brak page LUB page=1.
          // Preferujemy formę bez "page", ale akceptujemy też "page=1"
          // pod warunkiem, że NIE jest to ten sam URL co canonical+?page=1
          // wskazujący na duplikat strony 1.
          expect(
            p.page === null || p.page === "1",
            `[${label}] rel=prev z page=2 musi wskazywać stronę 1 (brak page lub page=1), jest "${p.page}"`,
          ).toBe(true);
        } else {
          expect(
            p.page,
            `[${label}] rel=prev z page=${current} powinien wskazywać page=${current - 1}, jest "${p.page}"`,
          ).toBe(String(current - 1));
        }
      }

      // 5) Spójność: jeśli oba istnieją, ten sam pathname
      if (nexts.length === 1 && prevs.length === 1) {
        expect(parseUrl(nexts[0]).pathname).toBe(parseUrl(prevs[0]).pathname);
      }
    });
  }
}

// ─── Self-testy parserów ───
test("self-test: extractLinkRel + parseUrl", () => {
  const html = `
    <link rel="canonical" href="https://graftgen.com/sklep">
    <link rel="next" href="/sklep?page=2">
    <link rel="prev" href="/sklep">
  `;
  expect(extractLinkRel(html, "canonical")).toEqual(["https://graftgen.com/sklep"]);
  expect(parseUrl("/sklep?page=2")).toMatchObject({ pathname: "/sklep", page: "2" });
  expect(parseUrl("https://graftgen.com/sklep/")).toMatchObject({ pathname: "/sklep", page: null, query: "" });
});
