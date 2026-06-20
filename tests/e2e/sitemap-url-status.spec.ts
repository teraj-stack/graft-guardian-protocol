import { test, expect, request as pwRequest, type APIResponse, type APIRequestContext } from "@playwright/test";

/**
 * E2E: weryfikuje, że KAŻDY URL z sitemap.xml zwraca poprawny status HTTP
 * (bez 4xx/5xx) po podążeniu za przekierowaniami.
 *
 *  1. Pobiera /sitemap.xml. Jeśli to sitemap-index — rekurencyjnie zbiera
 *     URL-e ze wszystkich sub-sitemap.
 *  2. Dla każdego unikalnego URL-a wykonuje GET z follow-redirects
 *     (maxRedirects: 10) i sprawdza, że końcowy status mieści się w 2xx/3xx.
 *     Status 3xx oznacza, że łańcuch redirectów się nie zakończył (limit
 *     przekroczony / pętla) — traktujemy to jako błąd.
 *  3. Dla każdego URL-a niezależnie weryfikuje też brak nieskończonej pętli
 *     redirectów (śledząc Location ręcznie z hard-cap 10 hopów).
 *  4. Wszystkie błędy zbierane są do jednej listy, raportowane w jednym
 *     assert — ułatwia diagnozę gdy więcej niż jedna strona jest zepsuta.
 */

function headerValue(res: APIResponse, name: string): string | null {
  const h = res.headers();
  const k = Object.keys(h).find((x) => x.toLowerCase() === name.toLowerCase());
  return k ? h[k] ?? null : null;
}

function detectKind(xml: string): "sitemapindex" | "urlset" | "unknown" {
  if (/<sitemapindex\b/i.test(xml)) return "sitemapindex";
  if (/<urlset\b/i.test(xml)) return "urlset";
  return "unknown";
}

function extractLocs(xml: string): string[] {
  const out: string[] = [];
  for (const m of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) out.push(m[1].trim());
  return out;
}

function extractSitemapEntries(xml: string): string[] {
  const out: string[] = [];
  for (const block of xml.matchAll(/<sitemap\b[\s\S]*?<\/sitemap>/gi)) {
    const loc = block[0].match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
    if (loc) out.push(loc.trim());
  }
  return out;
}

async function fetchXml(ctx: APIRequestContext, url: string) {
  const res = await ctx.fetch(url, { failOnStatusCode: false, maxRedirects: 10 });
  return { status: res.status(), body: await res.text() };
}

async function collectAllPageUrls(ctx: APIRequestContext, baseURL: string): Promise<string[]> {
  const root = await fetchXml(ctx, "/sitemap.xml");
  expect(root.status, `/sitemap.xml status ${root.status}`).toBeLessThan(300);
  expect(root.status).toBeGreaterThanOrEqual(200);

  const kind = detectKind(root.body);
  expect(kind, "/sitemap.xml: ani <sitemapindex> ani <urlset>").not.toBe("unknown");

  if (kind === "urlset") return extractLocs(root.body);

  const subs = extractSitemapEntries(root.body);
  expect(subs.length, "sitemap-index pusty").toBeGreaterThan(0);

  const all: string[] = [];
  for (const sub of subs) {
    const r = await fetchXml(ctx, sub);
    expect(r.status, `sub-sitemap ${sub} status ${r.status}`).toBeLessThan(300);
    expect(detectKind(r.body), `sub-sitemap ${sub} nie jest <urlset>`).toBe("urlset");
    all.push(...extractLocs(r.body));
  }
  return all;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/** Ręczne śledzenie redirectów — wykrywa pętle i nadmierną głębokość. */
async function followChain(
  ctx: APIRequestContext,
  startUrl: string,
  maxHops = 10,
): Promise<{ finalStatus: number; hops: string[]; loop: boolean; tooDeep: boolean }> {
  const hops: string[] = [];
  let url = startUrl;
  for (let i = 0; i <= maxHops; i++) {
    if (hops.includes(url)) {
      return { finalStatus: 0, hops, loop: true, tooDeep: false };
    }
    hops.push(url);
    const res = await ctx.fetch(url, { failOnStatusCode: false, maxRedirects: 0 });
    const s = res.status();
    if (s >= 300 && s < 400) {
      const loc = headerValue(res, "location");
      if (!loc) return { finalStatus: s, hops, loop: false, tooDeep: false };
      url = new URL(loc, url).toString();
      continue;
    }
    return { finalStatus: s, hops, loop: false, tooDeep: false };
  }
  return { finalStatus: 0, hops, loop: false, tooDeep: true };
}

let allUrls: string[];

test.beforeAll(async ({ baseURL }) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const collected = await collectAllPageUrls(ctx, baseURL!);
    allUrls = unique(collected);
    expect(allUrls.length, "sitemap nie zawiera żadnych URL-i").toBeGreaterThan(0);
  } finally {
    await ctx.dispose();
  }
});

test("każdy URL z sitemap.xml zwraca 2xx po follow-redirects", async ({ baseURL }) => {
  const ctx = await pwRequest.newContext({ baseURL });
  const failures: string[] = [];
  try {
    for (const url of allUrls) {
      const res = await ctx.fetch(url, { failOnStatusCode: false, maxRedirects: 10 });
      const s = res.status();
      if (s < 200 || s >= 400) {
        failures.push(`${url} → HTTP ${s}`);
      } else if (s >= 300 && s < 400) {
        // maxRedirects wyczerpany — łańcuch nie zakończył się
        failures.push(`${url} → łańcuch redirectów nie zakończony (final ${s})`);
      }
    }
  } finally {
    await ctx.dispose();
  }
  expect(failures, `URL-e z sitemap z błędnym statusem:\n${failures.join("\n")}`).toEqual([]);
});

test("żaden URL z sitemap nie ma pętli ani nadmiernej głębokości redirectów", async ({ baseURL }) => {
  const ctx = await pwRequest.newContext({ baseURL });
  const failures: string[] = [];
  try {
    for (const url of allUrls) {
      const r = await followChain(ctx, url, 10);
      if (r.loop) {
        failures.push(`${url} → pętla redirectów: ${r.hops.join(" → ")}`);
      } else if (r.tooDeep) {
        failures.push(`${url} → > 10 redirectów: ${r.hops.join(" → ")}`);
      } else if (r.finalStatus < 200 || r.finalStatus >= 400) {
        failures.push(`${url} → final HTTP ${r.finalStatus} (hops: ${r.hops.length})`);
      }
    }
  } finally {
    await ctx.dispose();
  }
  expect(failures, `Problemy z łańcuchami redirectów:\n${failures.join("\n")}`).toEqual([]);
});

// ---------------- self-testy parserów ----------------

test("self-test: extractLocs i extractSitemapEntries", () => {
  const urlset = `<?xml version="1.0"?><urlset><url><loc>https://x/a</loc></url><url><loc> https://x/b </loc></url></urlset>`;
  expect(extractLocs(urlset)).toEqual(["https://x/a", "https://x/b"]);

  const idx = `<?xml version="1.0"?><sitemapindex><sitemap><loc>https://x/s1.xml</loc></sitemap><sitemap><loc>https://x/s2.xml</loc></sitemap></sitemapindex>`;
  expect(detectKind(idx)).toBe("sitemapindex");
  expect(extractSitemapEntries(idx)).toEqual(["https://x/s1.xml", "https://x/s2.xml"]);
});
