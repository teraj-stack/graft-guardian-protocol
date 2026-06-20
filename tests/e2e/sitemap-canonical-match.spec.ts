import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";

/**
 * E2E: dla każdego <loc> w sitemap.xml (oraz w sub-sitemapach pod
 * sitemap-index) pobiera stronę i weryfikuje, że <link rel="canonical">
 * w HTML wskazuje ten sam zasób co <loc>.
 *
 * Strategia środowiskowa:
 *  - sitemap może zawierać URL-e produkcyjne (np. https://graftgen.com/...).
 *    Testy odpalają się jednak na baseURL (preview/local), więc fetch
 *    wykonujemy pod baseURL + pathname z <loc>.
 *  - Porównujemy pathname + search + hash <loc> i canonical
 *    (host/protokół mogą się różnić między środowiskami; to OK).
 *  - Trailing slash i case w ścieżce są znaczące — muszą się zgadzać.
 */

interface UrlEntry {
  source: string;
  loc: string;
}

function detectKind(xml: string): "sitemapindex" | "urlset" | "unknown" {
  if (/<sitemapindex\b/i.test(xml)) return "sitemapindex";
  if (/<urlset\b/i.test(xml)) return "urlset";
  return "unknown";
}

function extractLocs(xml: string, blockTag: "url" | "sitemap"): string[] {
  const out: string[] = [];
  const blockRe = new RegExp(`<${blockTag}\\b[\\s\\S]*?<\\/${blockTag}>`, "gi");
  for (const m of xml.matchAll(blockRe)) {
    const loc = m[0].match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
    if (loc) out.push(loc.trim());
  }
  return out;
}

async function fetchXml(ctx: APIRequestContext, url: string) {
  const res = await ctx.fetch(url, { failOnStatusCode: false, maxRedirects: 10 });
  return { status: res.status(), body: await res.text() };
}

function extractCanonical(html: string): string | null {
  // Obsługa <link rel="canonical" href="..."> i <link href="..." rel="canonical">,
  // case-insensitive, pojedyncze i podwójne cudzysłowy.
  const re =
    /<link\b[^>]*?\brel\s*=\s*["']canonical["'][^>]*?\bhref\s*=\s*["']([^"']+)["'][^>]*>|<link\b[^>]*?\bhref\s*=\s*["']([^"']+)["'][^>]*?\brel\s*=\s*["']canonical["'][^>]*>/i;
  const m = html.match(re);
  if (!m) return null;
  return (m[1] ?? m[2] ?? "").trim();
}

function pathQueryHash(u: string): string | null {
  try {
    const parsed = new URL(u);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

let entries: UrlEntry[];

test.beforeAll(async ({ baseURL }) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const root = await fetchXml(ctx, "/sitemap.xml");
    expect(root.status, `/sitemap.xml status ${root.status}`).toBeLessThan(300);
    const kind = detectKind(root.body);
    expect(kind, "/sitemap.xml: ani <sitemapindex> ani <urlset>").not.toBe("unknown");

    const collected: UrlEntry[] = [];
    if (kind === "urlset") {
      for (const loc of extractLocs(root.body, "url")) {
        collected.push({ source: "/sitemap.xml", loc });
      }
    } else {
      const subs = extractLocs(root.body, "sitemap");
      expect(subs.length, "sitemap-index pusty").toBeGreaterThan(0);
      for (const sub of subs) {
        const r = await fetchXml(ctx, sub);
        expect(r.status, `sub-sitemap ${sub} status ${r.status}`).toBeLessThan(300);
        expect(detectKind(r.body), `${sub} nie jest <urlset>`).toBe("urlset");
        for (const loc of extractLocs(r.body, "url")) {
          collected.push({ source: sub, loc });
        }
      }
    }
    expect(collected.length, "brak wpisów <url> w sitemap").toBeGreaterThan(0);
    entries = collected;
  } finally {
    await ctx.dispose();
  }
});

test("każda strona z <loc> w sitemap.xml ma <link rel=\"canonical\"> zgodny z <loc>", async ({
  baseURL,
}) => {
  const ctx = await pwRequest.newContext({ baseURL });
  const failures: string[] = [];
  try {
    for (const e of entries) {
      const expectedPath = pathQueryHash(e.loc);
      if (expectedPath === null) {
        failures.push(`[${e.source}] ${e.loc}: <loc> nie jest absolutnym URL-em`);
        continue;
      }
      // Fetch względem baseURL — niezależnie od hosta w <loc>.
      const res = await ctx.fetch(expectedPath, { failOnStatusCode: false, maxRedirects: 10 });
      if (res.status() >= 400) {
        failures.push(`[${e.source}] ${e.loc}: HTTP ${res.status()}`);
        continue;
      }
      const ct = res.headers()["content-type"] ?? "";
      if (!ct.includes("text/html")) continue;

      const html = await res.text();
      const canonical = extractCanonical(html);
      if (!canonical) {
        failures.push(`[${e.source}] ${e.loc}: brak <link rel="canonical">`);
        continue;
      }
      let absoluteCanonical: string;
      try {
        // Rozwiń względem <loc>, by porównać pełny URL gdy canonical jest relatywny.
        absoluteCanonical = new URL(canonical, e.loc).toString();
      } catch {
        failures.push(`[${e.source}] ${e.loc}: nieprawidłowy canonical="${canonical}"`);
        continue;
      }
      const gotPath = pathQueryHash(absoluteCanonical);
      if (gotPath !== expectedPath) {
        failures.push(
          `[${e.source}] ${e.loc}: canonical path="${gotPath}" ≠ <loc> path="${expectedPath}"`,
        );
      }
    }
  } finally {
    await ctx.dispose();
  }
  expect(failures, `Rozjazd canonical ↔ sitemap:\n${failures.join("\n")}`).toEqual([]);
});

// ---------------- self-testy ----------------

test("self-test: extractCanonical obsługuje oba porządki atrybutów", () => {
  expect(extractCanonical(`<link rel="canonical" href="https://x/a">`)).toBe("https://x/a");
  expect(extractCanonical(`<link href="https://x/a" rel="canonical">`)).toBe("https://x/a");
  expect(extractCanonical(`<link rel='canonical' href='https://x/a' />`)).toBe("https://x/a");
  expect(extractCanonical(`<link rel="alternate" href="https://x/a">`)).toBeNull();
});

test("self-test: pathQueryHash izoluje ścieżkę od hosta", () => {
  expect(pathQueryHash("https://graftgen.com/a?x=1#h")).toBe("/a?x=1#h");
  expect(pathQueryHash("https://other.app/a?x=1#h")).toBe("/a?x=1#h");
  expect(pathQueryHash("/relatywny")).toBeNull();
  // trailing slash i case w ścieżce są znaczące
  expect(pathQueryHash("https://x/a/") === pathQueryHash("https://x/a")).toBe(false);
  expect(pathQueryHash("https://x/A") === pathQueryHash("https://x/a")).toBe(false);
});
