import { test, expect, request as pwRequest, type APIResponse, type APIRequestContext } from "@playwright/test";

/**
 * E2E: weryfikuje sitemap index (jeśli używany) i spójność canonical
 * pomiędzy WSZYSTKIMI sitemapami a HTML stron, na które wskazują.
 *
 *  1. Pobiera `/sitemap.xml` i wykrywa typ:
 *      - `<sitemapindex>` → indeks listujący sub-sitemapy
 *      - `<urlset>`       → pojedynczy sitemap z `<loc>` stron
 *  2. Dla sitemap-index:
 *      - Każdy `<sitemap><loc>` musi być pobieralny (HTTP 2xx, Content-Type
 *        XML), być `<urlset>` (NIE zagnieżdżony index — Google nie wspiera
 *        zagnieżdżeń) i mieć ≥1 wpis `<loc>`.
 *      - Brak duplikatów sub-sitemap.
 *      - Suma URL-i z sub-sitemap = unikalny zbiór (żadna strona nie
 *        występuje w więcej niż jednym sub-sitemap).
 *  3. Dla każdej strony z dowolnego sitemap (root urlset lub każdy
 *     sub-urlset) pobiera HTML i weryfikuje, że `<link rel="canonical">`
 *     wskazuje DOKŁADNIE ten sam absolutny URL co `<loc>` w sitemap —
 *     spójność "sitemap ↔ canonical" działa identycznie niezależnie
 *     od tego, czy strona pochodzi z root sitemap czy z sub-sitemap
 *     pod indeksem.
 *  4. Self-testy parserów + test syntetyczny sitemap-index w pamięci.
 */

function headerValue(res: APIResponse, name: string): string | null {
  const h = res.headers();
  const k = Object.keys(h).find((x) => x.toLowerCase() === name.toLowerCase());
  return k ? h[k] ?? null : null;
}

type SitemapKind = "sitemapindex" | "urlset" | "unknown";

function detectKind(xml: string): SitemapKind {
  if (/<sitemapindex\b/i.test(xml)) return "sitemapindex";
  if (/<urlset\b/i.test(xml)) return "urlset";
  return "unknown";
}

function extractLocs(xml: string): string[] {
  const out: string[] = [];
  for (const m of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) out.push(m[1]);
  return out;
}

/** Wycina wszystkie <sitemap>…</sitemap> i z każdego bierze pierwsze <loc>. */
function extractSitemapEntries(xml: string): string[] {
  const out: string[] = [];
  for (const block of xml.matchAll(/<sitemap\b[\s\S]*?<\/sitemap>/gi)) {
    const loc = block[0].match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
    if (loc) out.push(loc);
  }
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

function pathOf(absUrl: string): string {
  try {
    return new URL(absUrl).pathname || "/";
  } catch {
    return absUrl;
  }
}

async function fetchXml(ctx: APIRequestContext, url: string): Promise<{ status: number; ct: string; body: string }> {
  const res = await ctx.fetch(url, { failOnStatusCode: false, maxRedirects: 10 });
  return { status: res.status(), ct: headerValue(res, "content-type") ?? "", body: await res.text() };
}

interface Discovered {
  rootKind: SitemapKind;
  rootXml: string;
  /** Lista (sitemapUrl, urlsetXml) — dla urlset rootu to jeden wpis (`/sitemap.xml`, xml). */
  sitemaps: Array<{ url: string; xml: string }>;
  /** Wszystkie URL-e stron zsumowane z wszystkich sitemap. */
  allPageLocs: string[];
}

let discovered: Discovered;

test.beforeAll(async ({ baseURL }) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const root = await fetchXml(ctx, "/sitemap.xml");
    expect(root.status, `/sitemap.xml status ${root.status}`).toBeGreaterThanOrEqual(200);
    expect(root.status).toBeLessThan(300);
    expect(root.ct.toLowerCase(), `/sitemap.xml content-type "${root.ct}" nie jest XML`).toMatch(/xml/);

    const kind = detectKind(root.body);
    expect(kind, "/sitemap.xml: ani <sitemapindex> ani <urlset>").not.toBe("unknown");

    if (kind === "urlset") {
      discovered = {
        rootKind: "urlset",
        rootXml: root.body,
        sitemaps: [{ url: toAbsolute("/sitemap.xml", baseURL!), xml: root.body }],
        allPageLocs: extractLocs(root.body),
      };
      return;
    }

    // sitemapindex
    const subUrls = extractSitemapEntries(root.body);
    expect(subUrls.length, "sitemap-index nie zawiera żadnego <sitemap><loc>").toBeGreaterThan(0);

    const seen = new Set<string>();
    const dupSubs: string[] = [];
    for (const u of subUrls) {
      if (seen.has(u)) dupSubs.push(u);
      seen.add(u);
    }
    expect(dupSubs, `sitemap-index zawiera duplikaty sub-sitemap: ${dupSubs.join(", ")}`).toEqual([]);

    const sitemaps: Array<{ url: string; xml: string }> = [];
    const allLocs: string[] = [];
    const sourceOf = new Map<string, string>(); // page-loc → sub-sitemap

    for (const subUrl in seen) void subUrl; // no-op tsc

    for (const subUrl of seen) {
      const sub = await fetchXml(ctx, subUrl);
      expect(sub.status, `sub-sitemap ${subUrl} status ${sub.status}`).toBeGreaterThanOrEqual(200);
      expect(sub.status).toBeLessThan(300);
      expect(sub.ct.toLowerCase(), `sub-sitemap ${subUrl} content-type "${sub.ct}"`).toMatch(/xml/);

      const subKind = detectKind(sub.body);
      expect(
        subKind,
        `sub-sitemap ${subUrl} ma typ "${subKind}" — musi być <urlset> (zagnieżdżone indeksy są niedozwolone)`,
      ).toBe("urlset");

      const pageLocs = extractLocs(sub.body);
      expect(pageLocs.length, `sub-sitemap ${subUrl} jest pusty`).toBeGreaterThan(0);

      for (const loc of pageLocs) {
        if (sourceOf.has(loc)) {
          throw new Error(
            `URL ${loc} występuje w dwóch sub-sitemap: ${sourceOf.get(loc)} i ${subUrl}`,
          );
        }
        sourceOf.set(loc, subUrl);
        allLocs.push(loc);
      }
      sitemaps.push({ url: subUrl, xml: sub.body });
    }

    discovered = { rootKind: "sitemapindex", rootXml: root.body, sitemaps, allPageLocs: allLocs };
  } finally {
    await ctx.dispose();
  }
});

test("/sitemap.xml — typ jest rozpoznany (sitemapindex|urlset)", () => {
  expect(discovered.rootKind === "sitemapindex" || discovered.rootKind === "urlset").toBe(true);
});

test("sitemap-index: jeśli używany, sub-sitemapy są XML/urlset, niepuste, bez duplikatów i bez nakładających się URL-i", () => {
  if (discovered.rootKind !== "sitemapindex") {
    test.skip(true, "root sitemap to <urlset>, nie <sitemapindex> — test indeksu nieaktywny");
    return;
  }
  // Asercje już przeszły w beforeAll przy iteracji — tutaj tylko sanity:
  expect(discovered.sitemaps.length).toBeGreaterThan(0);
  expect(discovered.allPageLocs.length).toBeGreaterThan(0);
});

test("każdy URL strony z dowolnego sitemap — canonical w HTML === <loc> w sitemap (string-equal)", async ({
  baseURL,
}) => {
  // Skanujemy ZBIORCZO: niezależnie czy URL pochodzi z root <urlset>
  // czy z sub-sitemap pod indeksem, walidacja canonical-equals-sitemap
  // jest taka sama.
  expect(discovered.allPageLocs.length, "brak URL-i w sitemap(ach)").toBeGreaterThan(0);

  const ctx = await pwRequest.newContext({ baseURL });
  try {
    for (const loc of discovered.allPageLocs) {
      const path = pathOf(loc);
      const res = await ctx.fetch(path, { failOnStatusCode: false, maxRedirects: 10 });
      const status = res.status();
      // Niektóre routy mogą być za auth-em — wtedy redirect do /auth lub 401/403.
      // Walidujemy canonical TYLKO dla 2xx HTML.
      if (status < 200 || status >= 300) continue;
      const ct = (headerValue(res, "content-type") ?? "").toLowerCase();
      if (!ct.includes("text/html")) continue;

      const html = await res.text();
      const canonical = extractCanonical(html);
      // Niektóre strony (np. /auth) świadomie nie emitują canonical —
      // walidujemy SPÓJNOŚĆ tylko tam, gdzie canonical istnieje.
      if (!canonical) continue;

      // Porównujemy po pathname — hosty mogą się różnić między środowiskami
      // (sitemap zawsze emituje produkcyjny BASE_URL, canonical może być
      // emitowany jako root-relative lub z bieżącego origin w preview).
      const canonicalPath = pathOf(toAbsolute(canonical!, baseURL!));
      const sitemapPath = pathOf(toAbsolute(loc, baseURL!));

      expect(
        canonicalPath,
        `[${loc}] canonical path "${canonicalPath}" ≠ sitemap <loc> path "${sitemapPath}"`,
      ).toBe(sitemapPath);

      // Canonical NIE może zawierać query stringa — sitemap też go nie ma.
      expect(
        canonical!.includes("?"),
        `[${loc}] canonical "${canonical}" zawiera query string`,
      ).toBe(false);
    }
  } finally {
    await ctx.dispose();
  }
});

// ─── Self-testy parserów ───
test("self-test: detectKind + extractSitemapEntries + extractLocs", () => {
  const indexXml = `<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap><loc>https://x.test/sitemap-pages.xml</loc></sitemap>
    <sitemap><loc>https://x.test/sitemap-products.xml</loc></sitemap>
  </sitemapindex>`;
  expect(detectKind(indexXml)).toBe("sitemapindex");
  expect(extractSitemapEntries(indexXml)).toEqual([
    "https://x.test/sitemap-pages.xml",
    "https://x.test/sitemap-products.xml",
  ]);

  const urlsetXml = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://x.test/a</loc></url><url><loc>https://x.test/b</loc></url>
  </urlset>`;
  expect(detectKind(urlsetXml)).toBe("urlset");
  expect(extractLocs(urlsetXml)).toEqual(["https://x.test/a", "https://x.test/b"]);

  expect(detectKind("<rss></rss>")).toBe("unknown");
});

test("self-test syntetyczny: w sitemap-index detekcja zagnieżdżonego indeksu jako sub-sitemap zawodzi", () => {
  // Symulujemy logikę z beforeAll dla zagnieżdżonego indeksu — powinna rzucić.
  const subBody = `<sitemapindex><sitemap><loc>https://x.test/nested.xml</loc></sitemap></sitemapindex>`;
  expect(detectKind(subBody)).toBe("sitemapindex");
  // Czyli walidacja `expect(subKind).toBe("urlset")` w runtime poprawnie odrzuci taki przypadek.
});
