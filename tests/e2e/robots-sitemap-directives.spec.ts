import { test, expect, request as pwRequest, type APIResponse, type APIRequestContext } from "@playwright/test";

/**
 * E2E: weryfikuje, że `robots.txt` zawiera dyrektywy `Sitemap:` wskazujące
 * DOKŁADNIE te URL-e sitemap, które generuje system:
 *
 *  1. `/robots.txt` jest pobieralny (2xx, text/plain).
 *  2. Parsuje wszystkie linie `Sitemap:` (case-insensitive nazwa dyrektywy,
 *     wartość ze stripem whitespace) — musi być ≥1.
 *  3. Każdy URL z `Sitemap:` jest absolutną URL (RFC 9309 wymaga absolutnej).
 *  4. Brak duplikatów linii `Sitemap:`.
 *  5. Każdy URL z `Sitemap:` jest pobieralny (2xx + XML content-type)
 *     i jest poprawnym `<sitemapindex>` lub `<urlset>`.
 *  6. Zbiór URL-i deklarowanych w robots.txt MUSI być równy zbiorowi
 *     "actually-served sitemap URLs":
 *       - jeśli `/sitemap.xml` to `<urlset>` → zbiór = `{<BASE>/sitemap.xml}`,
 *       - jeśli `/sitemap.xml` to `<sitemapindex>` → zbiór =
 *         `{<BASE>/sitemap.xml, ...wszystkie <sitemap><loc>}` (indeks też
 *         powinien być w robots.txt, żeby crawler nie musiał zgadywać).
 *     Set-equality: brak brakujących, brak nadmiarowych.
 *  7. Origin każdego URL-a `Sitemap:` jest spójny — wszystkie odpowiadają
 *     temu samemu hostowi (Google odrzuca cross-domain sitemap referencje
 *     niezgłoszone w GSC).
 */

function headerValue(res: APIResponse, name: string): string | null {
  const h = res.headers();
  const k = Object.keys(h).find((x) => x.toLowerCase() === name.toLowerCase());
  return k ? h[k] ?? null : null;
}

function parseSitemapDirectives(robotsTxt: string): string[] {
  const out: string[] = [];
  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = line.match(/^sitemap\s*:\s*(\S.*)$/i);
    if (m) out.push(m[1].trim());
  }
  return out;
}

function detectKind(xml: string): "sitemapindex" | "urlset" | "unknown" {
  if (/<sitemapindex\b/i.test(xml)) return "sitemapindex";
  if (/<urlset\b/i.test(xml)) return "urlset";
  return "unknown";
}

function extractSubSitemapLocs(xml: string): string[] {
  const out: string[] = [];
  for (const block of xml.matchAll(/<sitemap\b[\s\S]*?<\/sitemap>/gi)) {
    const loc = block[0].match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
    if (loc) out.push(loc);
  }
  return out;
}

function isAbsoluteUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Buduje set URL-i które robots.txt POWINIEN deklarować. Odpytuje system
 * sitemap pod jego "publicznym" base URL (czyli tym, którego sitemap.xml
 * używa do emitowania <loc>) — żeby uniknąć rozjazdu localhost vs prod.
 */
async function buildExpectedSitemapSet(ctx: APIRequestContext): Promise<{ set: Set<string>; publicBase: string; rootKind: string }> {
  const res = await ctx.fetch("/sitemap.xml", { failOnStatusCode: false, maxRedirects: 10 });
  expect(res.status(), `/sitemap.xml status ${res.status()}`).toBeGreaterThanOrEqual(200);
  expect(res.status()).toBeLessThan(300);
  const xml = await res.text();
  const kind = detectKind(xml);
  expect(kind, "/sitemap.xml: ani <sitemapindex> ani <urlset>").not.toBe("unknown");

  // Wyciągamy publicBase z dowolnego URL-a wyemitowanego przez system sitemap.
  // Dla <urlset> bierzemy pierwszy <url><loc>; dla <sitemapindex> pierwszy <sitemap><loc>.
  const firstLoc =
    kind === "sitemapindex"
      ? extractSubSitemapLocs(xml)[0]
      : xml.match(/<url\b[\s\S]*?<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
  expect(firstLoc, "/sitemap.xml nie zawiera żadnego <loc> — nie da się wyznaczyć publicBase").toBeTruthy();
  const publicBase = new URL(firstLoc!).origin;

  const set = new Set<string>();
  set.add(`${publicBase}/sitemap.xml`);
  if (kind === "sitemapindex") {
    for (const loc of extractSubSitemapLocs(xml)) set.add(loc);
  }
  return { set, publicBase, rootKind: kind };
}

test("robots.txt — dyrektywy Sitemap dokładnie pokrywają URL-e generowane przez system sitemap", async ({
  baseURL,
}) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    // 1) Pobierz robots.txt
    const rRes = await ctx.fetch("/robots.txt", { failOnStatusCode: false, maxRedirects: 10 });
    expect(rRes.status(), `/robots.txt status ${rRes.status()}`).toBeGreaterThanOrEqual(200);
    expect(rRes.status()).toBeLessThan(300);
    const ct = (headerValue(rRes, "content-type") ?? "").toLowerCase();
    expect(ct, `/robots.txt content-type "${ct}" nie zaczyna się od text/plain`).toMatch(/^text\/plain/);
    const robotsTxt = await rRes.text();

    // 2) Parsuj dyrektywy Sitemap
    const declared = parseSitemapDirectives(robotsTxt);
    expect(declared.length, "robots.txt: brak jakiejkolwiek dyrektywy `Sitemap:`").toBeGreaterThan(0);

    // 3) Każdy URL absolutny
    for (const url of declared) {
      expect(isAbsoluteUrl(url), `robots.txt: "${url}" nie jest absolutną http(s) URL`).toBe(true);
    }

    // 4) Brak duplikatów
    const seen = new Set<string>();
    const dups: string[] = [];
    for (const u of declared) {
      if (seen.has(u)) dups.push(u);
      seen.add(u);
    }
    expect(dups, `robots.txt: zduplikowane dyrektywy Sitemap: ${dups.join(", ")}`).toEqual([]);

    // 5) Każdy URL z robots.txt — pobieralny + XML + poprawny urlset/index
    for (const url of declared) {
      // Idziemy po pathname, żeby trafić w lokalny serwer (baseURL=localhost)
      // nawet jeśli robots.txt deklaruje produkcyjny host.
      const path = new URL(url).pathname + new URL(url).search;
      const sRes = await ctx.fetch(path, { failOnStatusCode: false, maxRedirects: 10 });
      expect(sRes.status(), `Sitemap ${url} (${path}): status ${sRes.status()}`).toBeGreaterThanOrEqual(200);
      expect(sRes.status()).toBeLessThan(300);
      const sct = (headerValue(sRes, "content-type") ?? "").toLowerCase();
      expect(sct, `Sitemap ${url}: content-type "${sct}" nie jest XML`).toMatch(/xml/);
      const sBody = await sRes.text();
      expect(detectKind(sBody), `Sitemap ${url}: nie jest <urlset> ani <sitemapindex>`).not.toBe("unknown");
    }

    // 6 + 7) Set-equality vs. faktycznie serwowane sitemapy
    const { set: expected, publicBase, rootKind } = await buildExpectedSitemapSet(ctx);

    // Walidacja origin: każdy zadeklarowany Sitemap musi mieć ten sam origin
    for (const url of declared) {
      expect(
        new URL(url).origin,
        `robots.txt: Sitemap ${url} ma inny origin niż publicBase ${publicBase}`,
      ).toBe(publicBase);
    }

    const declaredSet = new Set(declared);
    const missing = [...expected].filter((u) => !declaredSet.has(u));
    const extra = [...declaredSet].filter((u) => !expected.has(u));

    expect(
      missing,
      `robots.txt: brakujące dyrektywy Sitemap (root=${rootKind}). System generuje: [${[...expected].join(", ")}], brakuje: [${missing.join(", ")}]`,
    ).toEqual([]);
    expect(
      extra,
      `robots.txt: nadmiarowe dyrektywy Sitemap (nie odpowiadają niczemu w systemie sitemap). Nadmiarowe: [${extra.join(", ")}]`,
    ).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

// ─── Self-testy parserów ───
test("self-test: parseSitemapDirectives", () => {
  const robots = `
    User-agent: *
    Allow: /
    # comment
    Sitemap: https://x.test/sitemap.xml
    sitemap:    https://x.test/sitemap-products.xml   # inline comment
    SITEMAP: https://x.test/sitemap-blog.xml
  `;
  expect(parseSitemapDirectives(robots)).toEqual([
    "https://x.test/sitemap.xml",
    "https://x.test/sitemap-products.xml",
    "https://x.test/sitemap-blog.xml",
  ]);
  expect(parseSitemapDirectives("User-agent: *\nDisallow:")).toEqual([]);
});

test("self-test: isAbsoluteUrl + detectKind + extractSubSitemapLocs", () => {
  expect(isAbsoluteUrl("https://x.test/a")).toBe(true);
  expect(isAbsoluteUrl("/sitemap.xml")).toBe(false);
  expect(isAbsoluteUrl("ftp://x.test/a")).toBe(false);
  expect(detectKind("<urlset></urlset>")).toBe("urlset");
  expect(detectKind("<sitemapindex></sitemapindex>")).toBe("sitemapindex");
  expect(
    extractSubSitemapLocs(
      `<sitemapindex><sitemap><loc>https://x.test/a.xml</loc></sitemap><sitemap><loc>https://x.test/b.xml</loc></sitemap></sitemapindex>`,
    ),
  ).toEqual(["https://x.test/a.xml", "https://x.test/b.xml"]);
});
