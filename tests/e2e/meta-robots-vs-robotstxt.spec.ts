import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";

/**
 * E2E: META ROBOTS ↔ robots.txt ↔ LINKI WEWNĘTRZNE
 *
 * Dla każdej znanej publicznej strony oraz dla reprezentatywnych ścieżek
 * zablokowanych w `robots.txt` weryfikujemy spójność sygnałów
 * indeksowania (zarówno per-strona, jak i w wewnętrznym linkowaniu):
 *
 *  1) Strony ALLOW w robots.txt (z `/sitemap.xml`) → renderują się 2xx
 *     i NIE mają `<meta name="robots" content="noindex">`. Tag może być
 *     nieobecny (domyślnie index,follow) lub zawierać wyłącznie
 *     pozytywne dyrektywy (index/follow/all/max-*-preview).
 *  2) Strony DISALLOW w robots.txt → jeżeli serwer odpowiada 2xx,
 *     MUSZĄ mieć `<meta name="robots">` zawierające `noindex` LUB
 *     nagłówek HTTP `X-Robots-Tag: noindex`. To eliminuje sprzeczność
 *     "zablokowane w robots, ale crawlowalne i indeksowalne, jeśli
 *     trafi się link zewnętrzny".
 *  3) Na każdej publicznej stronie wewnętrzne `<a href>` BEZ
 *     `rel="nofollow"` NIE mogą prowadzić do ścieżek z `noindex`
 *     (zarówno noindex w meta, jak i w X-Robots-Tag). Inaczej
 *     mieszamy sygnały: "podążaj i indeksuj" ↔ "nie indeksuj".
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

/** Parsuje wartość `<meta name="robots">` lub nagłówka `X-Robots-Tag`
 *  na zbiór tokenów (lowercased, bez whitespace). */
function parseDirectives(value: string | null | undefined): Set<string> {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .flatMap((s) => s.split(/\s+/))
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

function metaRobotsFromHtml(html: string): string | null {
  // Bierze pierwsze wystąpienie <meta name="robots" content="...">
  const m = html.match(
    /<meta\s+[^>]*name\s*=\s*["']robots["'][^>]*content\s*=\s*["']([^"']*)["']/i,
  );
  if (m) return m[1];
  // Wariant odwrócony content=...name=...
  const m2 = html.match(
    /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']robots["']/i,
  );
  return m2 ? m2[1] : null;
}

function headerOf(headers: Record<string, string>, name: string): string | null {
  const k = Object.keys(headers).find((x) => x.toLowerCase() === name.toLowerCase());
  return k ? headers[k] : null;
}

function isNoindex(meta: string | null, xRobots: string | null): boolean {
  const a = parseDirectives(meta);
  const b = parseDirectives(xRobots);
  return a.has("noindex") || a.has("none") || b.has("noindex") || b.has("none");
}

function hasOnlyPositive(meta: string | null): boolean {
  const a = parseDirectives(meta);
  if (a.size === 0) return true;
  for (const tok of a) {
    if (tok === "noindex" || tok === "nofollow" || tok === "none") return false;
  }
  return true;
}

async function fetchText(ctx: APIRequestContext, path: string) {
  const res = await ctx.fetch(path, { failOnStatusCode: false, maxRedirects: 10 });
  const body = await res.text();
  return { status: res.status(), headers: res.headers(), body };
}

async function collectSitemapLocs(ctx: APIRequestContext, entry = "/sitemap.xml"): Promise<string[]> {
  const { status, body } = await fetchText(ctx, entry);
  expect(status, `${entry} → ${status}`).toBeLessThan(400);
  const isIndex = /<sitemapindex[\s>]/i.test(body);
  const locs = [...body.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1]);
  if (!isIndex) return locs;
  const all: string[] = [];
  for (const sm of locs) {
    const u = new URL(sm);
    const sub = await fetchText(ctx, u.pathname + u.search);
    for (const m of sub.body.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) all.push(m[1]);
  }
  return all;
}

function extractAnchors(html: string, baseOrigin: string): { path: string; rel: string }[] {
  const out: { path: string; rel: string }[] = [];
  const re = /<a\s+([^>]*?)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const hrefM = attrs.match(/href\s*=\s*"([^"]+)"|href\s*=\s*'([^']+)'/i);
    if (!hrefM) continue;
    const href = (hrefM[1] || hrefM[2] || "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    let url: URL;
    try {
      url = new URL(href, baseOrigin);
    } catch {
      continue;
    }
    if (url.origin !== baseOrigin) continue;
    const relM = attrs.match(/rel\s*=\s*"([^"]*)"|rel\s*=\s*'([^']*)'/i);
    const rel = (relM?.[1] || relM?.[2] || "").toLowerCase();
    out.push({ path: url.pathname, rel });
  }
  return out;
}

/** Reprezentatywne ścieżki, dla których robots.txt mówi Disallow.
 *  Sprawdzamy, że jeśli odpowiadają 2xx, to mają noindex (meta lub HTTP). */
const DISALLOWED_PROBES = [
  "/admin",
  "/raporty",
  "/raporty/status",
  "/brand-audit",
  "/phrase-audit",
  "/vitals",
  "/email-test",
  "/ebook",
  "/auth",
  "/przypomnienia/wypisz",
];

test("meta robots zgodne z robots.txt — strony ALLOW nie mają noindex", async ({ baseURL }) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const robots = await fetchText(ctx, "/robots.txt");
    const star = findStarGroup(parseRobots(robots.body).groups)!;
    expect(star, "brak grupy User-agent: * w robots.txt").not.toBeNull();

    const locs = await collectSitemapLocs(ctx);
    const violations: string[] = [];
    for (const loc of locs) {
      const u = new URL(loc);
      const p = u.pathname;
      if (decide(star, p) !== "allow") continue;
      const r = await fetchText(ctx, p);
      if (r.status >= 300) {
        violations.push(`${p} → ${r.status} (sitemap obiecuje 2xx)`);
        continue;
      }
      const meta = metaRobotsFromHtml(r.body);
      const xrt = headerOf(r.headers, "x-robots-tag");
      if (isNoindex(meta, xrt)) {
        violations.push(
          `${p} ma noindex (meta="${meta ?? ""}", x-robots-tag="${xrt ?? ""}"), ` +
            `ale robots.txt: Allow + jest w sitemap`,
        );
      }
      // Pozytywna walidacja: meta jeśli obecna — tylko pozytywne dyrektywy
      if (!hasOnlyPositive(meta)) {
        violations.push(`${p}: meta robots zawiera negatywną dyrektywę: "${meta}"`);
      }
    }
    expect(violations, `Strony Allow z noindex/none:\n  - ${violations.join("\n  - ")}`).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

test("meta robots zgodne z robots.txt — strony DISALLOW mają noindex (meta lub X-Robots-Tag)", async ({
  baseURL,
}) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const robots = await fetchText(ctx, "/robots.txt");
    const star = findStarGroup(parseRobots(robots.body).groups)!;

    const missing: string[] = [];
    for (const probe of DISALLOWED_PROBES) {
      expect(decide(star, probe), `${probe} powinno być Disallow w robots.txt`).toBe("disallow");
      const r = await fetchText(ctx, probe);
      if (r.status >= 400) continue; // 404/410 = nieindeksowalne z definicji
      const meta = metaRobotsFromHtml(r.body);
      const xrt = headerOf(r.headers, "x-robots-tag");
      if (!isNoindex(meta, xrt)) {
        missing.push(
          `${probe} (status ${r.status}) — brak noindex w meta ani w X-Robots-Tag ` +
            `(meta="${meta ?? ""}", x-robots-tag="${xrt ?? ""}")`,
        );
      }
    }
    expect(
      missing,
      `Ścieżki Disallow odpowiadające 2xx/3xx MUSZĄ mieć noindex (sprzeczność robots.txt vs meta):\n  - ${missing.join("\n  - ")}`,
    ).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

test("brak sprzeczności: follow-linki ze stron publicznych nie prowadzą do noindex", async ({
  baseURL,
}) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const origin = new URL(baseURL!).origin;
    const robots = await fetchText(ctx, "/robots.txt");
    const star = findStarGroup(parseRobots(robots.body).groups)!;

    // publiczne strony: te z sitemap
    const locs = await collectSitemapLocs(ctx);
    const publicPaths = [...new Set(locs.map((l) => new URL(l).pathname))];

    // cache statusu noindex per ścieżka
    const noindexCache = new Map<string, boolean>();
    async function isPathNoindex(p: string): Promise<boolean> {
      if (noindexCache.has(p)) return noindexCache.get(p)!;
      const r = await fetchText(ctx, p);
      if (r.status >= 400) {
        noindexCache.set(p, true); // 4xx = i tak nie do indeksowania
        return true;
      }
      const meta = metaRobotsFromHtml(r.body);
      const xrt = headerOf(r.headers, "x-robots-tag");
      const v = isNoindex(meta, xrt);
      noindexCache.set(p, v);
      return v;
    }

    const violations: string[] = [];
    for (const page of publicPaths) {
      const r = await fetchText(ctx, page);
      if (r.status >= 400) continue;
      const anchors = extractAnchors(r.body, origin);
      for (const a of anchors) {
        const rels = a.rel.split(/\s+/).filter(Boolean);
        if (rels.includes("nofollow")) continue;
        // Tylko same-origin, te które naprawdę istnieją jako strony
        if (a.path === page) continue;
        // Ograniczamy do ścieżek, które robots.txt nie blokuje —
        // sprzeczność "blokuję w robots, ale linkuję bez nofollow" pokrywa
        // już `robots-blocked-not-linked.spec.ts`. Tu skupiamy się na
        // sprzeczności meta-robots ↔ rel.
        if (decide(star, a.path) === "disallow") continue;
        if (await isPathNoindex(a.path)) {
          violations.push(`${page} → ${a.path} (noindex bez rel="nofollow")`);
        }
      }
    }
    const uniq = [...new Set(violations)];
    expect(
      uniq,
      `Follow-linki prowadzą do stron z noindex (dodaj rel="nofollow" lub usuń noindex):\n  - ${uniq.join("\n  - ")}`,
    ).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

// ─── Self-testy ───
test("self-test: parseDirectives + isNoindex", () => {
  expect(isNoindex("noindex, nofollow", null)).toBe(true);
  expect(isNoindex("index, follow", null)).toBe(false);
  expect(isNoindex(null, "noindex")).toBe(true);
  expect(isNoindex("none", null)).toBe(true);
  expect(isNoindex(null, null)).toBe(false);
});

test("self-test: metaRobotsFromHtml", () => {
  expect(
    metaRobotsFromHtml(`<meta name="robots" content="noindex, nofollow">`),
  ).toBe("noindex, nofollow");
  expect(
    metaRobotsFromHtml(`<meta content="index" name="robots" />`),
  ).toBe("index");
  expect(metaRobotsFromHtml(`<meta name="description" content="x">`)).toBeNull();
});

test("self-test: decide — longest match + Allow przebija remis", () => {
  const g: Group = {
    agents: ["*"],
    rules: [
      { type: "allow", path: "/" },
      { type: "disallow", path: "/admin" },
      { type: "allow", path: "/admin/public" },
    ],
  };
  expect(decide(g, "/admin")).toBe("disallow");
  expect(decide(g, "/admin/public/x")).toBe("allow");
  expect(decide(g, "/")).toBe("allow");
});
