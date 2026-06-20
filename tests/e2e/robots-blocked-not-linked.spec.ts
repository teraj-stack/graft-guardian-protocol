import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";

/**
 * E2E: strony zablokowane w `robots.txt` (Disallow dla `User-agent: *`)
 * NIE MOGĄ pojawiać się ani w `/sitemap.xml`, ani w wewnętrznych
 * linkach do indeksowania na publicznych stronach.
 *
 * Zakres:
 *  1. Parsuje `robots.txt` i wyciąga reguły grupy `User-agent: *`
 *     (algorytm Google: longest match wygrywa, Allow przebija Disallow
 *     przy remisie).
 *  2. Pobiera `/sitemap.xml` (rozwija sitemap-index do sub-sitemap).
 *     Każdy `<loc>` musi być Allow dla `*`.
 *  3. Crawluje stronę główną i kluczowe publiczne route'y. Każdy
 *     wewnętrzny link `<a href>` BEZ `rel="nofollow"` musi być Allow
 *     dla `*`. Link z `rel="nofollow"` jest dozwolony (sygnalizuje
 *     crawlerom, by nie podążali).
 *
 * Cel: zapobiec sprzecznościom "blokuję w robots.txt, ale linkuję do
 * indeksowania" — Google traktuje to jako mieszane sygnały i może
 * zaindeksować URL bez treści (z opisem "A description for this result
 * is not available because of this site's robots.txt").
 */

type Rule = { type: "allow" | "disallow"; path: string };
type Group = { agents: string[]; rules: Rule[] };

function parseRobots(txt: string): { groups: Group[] } {
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) {
      lastWasAgent = false;
      continue;
    }
    const m = line.match(/^([a-zA-Z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [value], rules: [] };
        groups.push(current);
      } else {
        current.agents.push(value);
      }
      lastWasAgent = true;
    } else if (field === "allow" || field === "disallow") {
      if (!current) {
        current = { agents: ["*"], rules: [] };
        groups.push(current);
      }
      current.rules.push({ type: field, path: value });
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  return { groups };
}

function findStarGroup(groups: Group[]): Group | null {
  return groups.find((g) => g.agents.includes("*")) ?? null;
}

function decide(group: Group, urlPath: string): "allow" | "disallow" {
  let best: { rule: Rule; len: number } | null = null;
  for (const rule of group.rules) {
    if (!rule.path) continue;
    if (urlPath.startsWith(rule.path)) {
      const len = rule.path.length;
      if (
        !best ||
        len > best.len ||
        (len === best.len && rule.type === "allow" && best.rule.type === "disallow")
      ) {
        best = { rule, len };
      }
    }
  }
  return best ? best.rule.type : "allow";
}

async function fetchText(ctx: APIRequestContext, path: string): Promise<string> {
  const res = await ctx.fetch(path, { failOnStatusCode: false, maxRedirects: 10 });
  expect(res.status(), `${path} → ${res.status()}`).toBeLessThan(400);
  return await res.text();
}

async function collectSitemapLocs(ctx: APIRequestContext, entry = "/sitemap.xml"): Promise<string[]> {
  const xml = await fetchText(ctx, entry);
  const isIndex = /<sitemapindex[\s>]/i.test(xml);
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1]);
  if (!isIndex) return locs;
  const all: string[] = [];
  for (const sm of locs) {
    const subPath = new URL(sm).pathname + new URL(sm).search;
    const sub = await fetchText(ctx, subPath);
    for (const m of sub.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) all.push(m[1]);
  }
  return all;
}

/** Wyciąga `<a href>` (tylko publiczne, te same-origin) z HTML. Zwraca
 *  pary [path, rel] — rel jest stringiem rozdzielanym spacjami. */
function extractAnchors(html: string, baseOrigin: string): { path: string; rel: string }[] {
  const out: { path: string; rel: string }[] = [];
  const re = /<a\s+([^>]*?)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const hrefM = attrs.match(/\shref\s*=\s*"([^"]+)"|^href\s*=\s*"([^"]+)"|href\s*=\s*'([^']+)'/i);
    if (!hrefM) continue;
    const href = (hrefM[1] || hrefM[2] || hrefM[3] || "").trim();
    if (!href) continue;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    let url: URL;
    try {
      url = new URL(href, baseOrigin);
    } catch {
      continue;
    }
    if (url.origin !== baseOrigin) continue;
    const relM = attrs.match(/\srel\s*=\s*"([^"]*)"|rel\s*=\s*'([^']*)'/i);
    const rel = (relM?.[1] || relM?.[2] || "").toLowerCase();
    out.push({ path: url.pathname, rel });
  }
  return out;
}

const PUBLIC_ROUTES_TO_CRAWL = [
  "/",
  "/sklep",
  "/koszt-przeszczepu-wlosow",
  "/panel",
  "/przypomnienia",
  "/prywatnosc",
  "/cookies",
];

test("robots Disallow nie pojawia się w sitemap.xml ani w follow-linkach publicznych stron", async ({
  baseURL,
}) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    // 1) robots → grupa *
    const robotsTxt = await fetchText(ctx, "/robots.txt");
    const { groups } = parseRobots(robotsTxt);
    const star = findStarGroup(groups);
    expect(star, "robots.txt: brak grupy User-agent: *").not.toBeNull();

    // 2) sitemap
    const locs = await collectSitemapLocs(ctx);
    expect(locs.length, "sitemap pusta").toBeGreaterThan(0);
    const blockedInSitemap: string[] = [];
    for (const loc of locs) {
      const p = new URL(loc).pathname;
      if (decide(star!, p) === "disallow") blockedInSitemap.push(loc);
    }
    expect(
      blockedInSitemap,
      `Sitemap zawiera URL-e zablokowane w robots.txt:\n  - ${blockedInSitemap.join("\n  - ")}`,
    ).toEqual([]);

    // 3) follow-linki na publicznych stronach
    const origin = new URL(baseURL!).origin;
    const violations: { page: string; href: string }[] = [];
    for (const route of PUBLIC_ROUTES_TO_CRAWL) {
      const html = await fetchText(ctx, route);
      const anchors = extractAnchors(html, origin);
      for (const a of anchors) {
        const rels = a.rel.split(/\s+/).filter(Boolean);
        const isNofollow = rels.includes("nofollow");
        if (isNofollow) continue;
        if (decide(star!, a.path) === "disallow") {
          violations.push({ page: route, href: a.path });
        }
      }
    }
    // Deduplikacja dla czytelnego błędu
    const uniq = [...new Set(violations.map((v) => `${v.page} → ${v.href}`))];
    expect(
      uniq,
      `Follow-linki na publicznych stronach prowadzą do ścieżek zablokowanych w robots.txt (dodaj rel="nofollow" lub usuń link):\n  - ${uniq.join("\n  - ")}`,
    ).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

// ─── Self-testy ───
test("self-test: decide — longest match + Allow przebija remis", () => {
  const g: Group = {
    agents: ["*"],
    rules: [
      { type: "allow", path: "/" },
      { type: "disallow", path: "/admin" },
      { type: "allow", path: "/admin/public" },
    ],
  };
  expect(decide(g, "/")).toBe("allow");
  expect(decide(g, "/admin")).toBe("disallow");
  expect(decide(g, "/admin/x")).toBe("disallow");
  expect(decide(g, "/admin/public/x")).toBe("allow");
});

test("self-test: extractAnchors — same-origin + rel parsing", () => {
  const html = `
    <a href="/sklep">Sklep</a>
    <a href="/admin" rel="nofollow noopener">Admin</a>
    <a href="https://other.test/x">Ext</a>
    <a href="#hash">Hash</a>
    <a href="mailto:a@b.c">Mail</a>
  `;
  const out = extractAnchors(html, "https://x.test");
  expect(out).toEqual([
    { path: "/sklep", rel: "" },
    { path: "/admin", rel: "nofollow noopener" },
  ]);
});
