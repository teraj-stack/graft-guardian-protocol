import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";

/**
 * E2E: dla każdego <loc> w sitemap.xml (oraz w sub-sitemapach pod
 * sitemap-index) pobiera stronę i weryfikuje, że <link rel="canonical">
 * w HTML wskazuje dokładnie ten sam URL co <loc>.
 *
 * Normalizacja:
 *  - trim po obu stronach,
 *  - protokół i host porównywane case-insensitive,
 *  - ścieżka / query / fragment porównywane case-sensitive,
 *  - trailing slash znaczący (musi się zgadzać) — sitemap powinien być
 *    spójny z canonical co do znaku.
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

function normalizeForCompare(u: string): string {
  // protokół + host lower-case, reszta bez zmian; bez sztucznego usuwania
  // trailing slash (jeśli sitemap go ma, canonical musi też).
  try {
    const parsed = new URL(u);
    const proto = parsed.protocol.toLowerCase();
    const host = parsed.host.toLowerCase();
    return `${proto}//${host}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return u;
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

test("każda strona z <loc> w sitemap.xml ma <link rel=\"canonical\"> równy <loc>", async ({
  baseURL,
}) => {
  const ctx = await pwRequest.newContext({ baseURL });
  const failures: string[] = [];
  try {
    for (const e of entries) {
      const res = await ctx.fetch(e.loc, { failOnStatusCode: false, maxRedirects: 10 });
      if (res.status() >= 400) {
        failures.push(`[${e.source}] ${e.loc}: HTTP ${res.status()}`);
        continue;
      }
      const ct = res.headers()["content-type"] ?? "";
      if (!ct.includes("text/html")) {
        // canonical jest atrybutem HTML — pliki XML/JSON pomijamy świadomie.
        continue;
      }
      const html = await res.text();
      const canonical = extractCanonical(html);
      if (!canonical) {
        failures.push(`[${e.source}] ${e.loc}: brak <link rel="canonical">`);
        continue;
      }
      // canonical musi być absolutny — względny powoduje rozjazd z sitemap.
      let absoluteCanonical: string;
      try {
        absoluteCanonical = new URL(canonical, e.loc).toString();
      } catch {
        failures.push(`[${e.source}] ${e.loc}: nieprawidłowy canonical="${canonical}"`);
        continue;
      }
      const expected = normalizeForCompare(e.loc);
      const got = normalizeForCompare(absoluteCanonical);
      if (expected !== got) {
        failures.push(
          `[${e.source}] ${e.loc}: canonical="${absoluteCanonical}" ≠ <loc>="${e.loc}"`,
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
  expect(
    extractCanonical(`<link rel="canonical" href="https://x/a">`),
  ).toBe("https://x/a");
  expect(
    extractCanonical(`<link href="https://x/a" rel="canonical">`),
  ).toBe("https://x/a");
  expect(
    extractCanonical(`<link rel='canonical' href='https://x/a' />`),
  ).toBe("https://x/a");
  expect(extractCanonical(`<link rel="alternate" href="https://x/a">`)).toBeNull();
});

test("self-test: normalizeForCompare jest case-insensitive dla host/protocol", () => {
  expect(normalizeForCompare("HTTPS://Graftgen.com/a")).toBe("https://graftgen.com/a");
  // ścieżka case-sensitive
  expect(normalizeForCompare("https://x/A") === normalizeForCompare("https://x/a")).toBe(false);
  // trailing slash znaczący
  expect(normalizeForCompare("https://x/a/") === normalizeForCompare("https://x/a")).toBe(false);
});
