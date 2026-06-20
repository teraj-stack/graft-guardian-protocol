import { test, expect, request as pwRequest, type APIResponse } from "@playwright/test";

/**
 * E2E: weryfikuje nagłówki `X-Robots-Tag` i meta `<meta name="robots">`
 * na stronach NIEdozwolonych do indeksowania, oraz spójność z
 * `robots.txt` i `sitemap.xml`:
 *
 *  1. Każda ścieżka z listy NON_INDEXABLE (zgodna z `Disallow:` w
 *     robots.txt) MUSI mieć `noindex` ustawiony przez:
 *       - nagłówek `X-Robots-Tag: ... noindex ...` LUB
 *       - `<meta name="robots" content="...noindex...">` w HTML.
 *     Sprawdzamy końcową odpowiedź po follow-redirects.
 *     Endpoint zwracający JSON (`/email/unsubscribe`) musi mieć
 *     `X-Robots-Tag` w nagłówku (brak HTML, brak meta).
 *
 *  2. ŻADEN URL z `sitemap.xml` nie może mieć `noindex` — sprzeczność
 *     "w sitemap + noindex" to klasyczny błąd SEO (Google deindexuje
 *     i ignoruje sitemap hint).
 *
 *  3. ŻADEN URL z `sitemap.xml` nie może być `Disallow` w `robots.txt`
 *     dla `User-agent: *` (cross-check spójności).
 *
 *  4. Self-testy parserów `parseMetaRobots`, `hasNoindex`, `decideRobots`.
 */

// ─── Helpers ───
function headerValue(res: APIResponse, name: string): string | null {
  const h = res.headers();
  const k = Object.keys(h).find((x) => x.toLowerCase() === name.toLowerCase());
  return k ? h[k] ?? null : null;
}

function parseMetaRobots(html: string): string[] {
  const out: string[] = [];
  const re = /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1]);
  // Również wariant z odwróconą kolejnością atrybutów
  const re2 = /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["'][^>]*>/gi;
  while ((m = re2.exec(html))) out.push(m[1]);
  return out;
}

function hasNoindexDirective(value: string | null | undefined): boolean {
  if (!value) return false;
  return /\b(noindex|none)\b/i.test(value);
}

/** "noindex" dla strony = header X-Robots-Tag LUB jakikolwiek meta robots z noindex. */
function pageHasNoindex(xRobots: string | null, metaValues: string[]): boolean {
  if (hasNoindexDirective(xRobots)) return true;
  return metaValues.some(hasNoindexDirective);
}

// ─── robots.txt parser (subset — najdłuższy match, Allow wygrywa remis) ───
type Rule = { type: "allow" | "disallow"; path: string };
type Group = { agents: string[]; rules: Rule[] };

function parseRobotsGroups(txt: string): Group[] {
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
  return groups;
}

function decideRobots(group: Group, urlPath: string): "allow" | "disallow" {
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

// Lista stron NIEindeksowalnych — mapuje się 1:1 na `Disallow:` w robots.txt.
// /api/ i /lovable/ omijamy (write-only endpointy, nie HTML).
// /ebook/$token wymaga prawdziwego tokenu — testujemy stronę gated reader pod
// realistycznym placeholderem (musi zwrócić noindex niezależnie od ważności).
const NON_INDEXABLE_HTML: { path: string; jsonOnly?: boolean }[] = [
  { path: "/auth" },
  { path: "/admin" },
  { path: "/raporty" },
  { path: "/raporty/status" },
  { path: "/brand-audit" },
  { path: "/phrase-audit" },
  { path: "/vitals" },
  { path: "/email-test" },
  { path: "/ebook" },
  { path: "/ebook/test-token-placeholder" },
  { path: "/przypomnienia/wypisz" },
  { path: "/email/unsubscribe?token=test", jsonOnly: true },
];

test.describe("noindex na stronach niedozwolonych do indeksowania", () => {
  for (const route of NON_INDEXABLE_HTML) {
    test(`${route.path} — X-Robots-Tag lub meta robots = noindex`, async ({ baseURL }) => {
      const ctx = await pwRequest.newContext({ baseURL });
      try {
        const res = await ctx.fetch(route.path, { failOnStatusCode: false, maxRedirects: 10 });
        // 401/403 też są OK (gate auth zwraca brak treści) — ale jeśli 2xx, MUSI noindex
        if (res.status() >= 400) return;

        const xRobots = headerValue(res, "x-robots-tag");
        const ct = (headerValue(res, "content-type") ?? "").toLowerCase();
        let metaValues: string[] = [];
        if (ct.startsWith("text/html")) {
          const html = await res.text();
          metaValues = parseMetaRobots(html);
        } else if (route.jsonOnly) {
          // dla JSON endpointu meta nie istnieje — header MUSI nieść noindex
          expect(
            hasNoindexDirective(xRobots),
            `${route.path} (JSON): brak X-Robots-Tag z noindex (got "${xRobots ?? ""}")`,
          ).toBe(true);
          return;
        }

        expect(
          pageHasNoindex(xRobots, metaValues),
          `${route.path}: brak noindex. X-Robots-Tag="${xRobots ?? ""}", meta=[${metaValues.join(" | ")}]`,
        ).toBe(true);
      } finally {
        await ctx.dispose();
      }
    });
  }
});

test("sitemap.xml — żaden URL nie może być noindex ani Disallow w robots.txt", async ({
  baseURL,
}) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    // sitemap
    const smRes = await ctx.fetch("/sitemap.xml", { failOnStatusCode: false, maxRedirects: 10 });
    expect(smRes.status()).toBeLessThan(300);
    const xml = await smRes.text();
    const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1]);
    expect(locs.length, "sitemap pusta").toBeGreaterThan(0);

    // robots.txt — grupa *
    const rRes = await ctx.fetch("/robots.txt", { failOnStatusCode: false, maxRedirects: 10 });
    expect(rRes.status()).toBeLessThan(300);
    const groups = parseRobotsGroups(await rRes.text());
    const star = groups.find((g) => g.agents.includes("*"));
    expect(star, "robots.txt: brak grupy *").toBeTruthy();

    const noindexed: string[] = [];
    const disallowed: string[] = [];

    for (const loc of locs) {
      const pathname = new URL(loc).pathname;

      // (3) robots.txt cross-check
      if (decideRobots(star!, pathname) === "disallow") disallowed.push(loc);

      // (2) noindex check — pobieramy po lokalnym pathname
      const r = await ctx.fetch(pathname, { failOnStatusCode: false, maxRedirects: 10 });
      if (r.status() >= 400) continue;
      const xRobots = headerValue(r, "x-robots-tag");
      const ct = (headerValue(r, "content-type") ?? "").toLowerCase();
      const meta = ct.startsWith("text/html") ? parseMetaRobots(await r.text()) : [];
      if (pageHasNoindex(xRobots, meta)) noindexed.push(loc);
    }

    expect(
      disallowed,
      `Konflikt robots.txt vs sitemap — Disallow + w sitemap: ${disallowed.join(", ")}`,
    ).toEqual([]);
    expect(
      noindexed,
      `Konflikt noindex vs sitemap — w sitemap + noindex: ${noindexed.join(", ")}`,
    ).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

// ─── Self-testy ───
test("self-test: parseMetaRobots + hasNoindexDirective", () => {
  expect(parseMetaRobots(`<meta name="robots" content="noindex, nofollow"/>`)).toEqual([
    "noindex, nofollow",
  ]);
  expect(parseMetaRobots(`<meta content="all" name="robots">`)).toEqual(["all"]);
  expect(parseMetaRobots(`<meta name="description" content="x">`)).toEqual([]);
  expect(hasNoindexDirective("noindex, nofollow")).toBe(true);
  expect(hasNoindexDirective("none")).toBe(true);
  expect(hasNoindexDirective("index, follow")).toBe(false);
  expect(hasNoindexDirective(null)).toBe(false);
  expect(pageHasNoindex(null, ["index"])).toBe(false);
  expect(pageHasNoindex("noindex", [])).toBe(true);
  expect(pageHasNoindex(null, ["noindex"])).toBe(true);
});

test("self-test: decideRobots — longest match + Allow przebija Disallow", () => {
  const g: Group = {
    agents: ["*"],
    rules: [
      { type: "allow", path: "/" },
      { type: "disallow", path: "/admin" },
      { type: "allow", path: "/admin/public" },
    ],
  };
  expect(decideRobots(g, "/")).toBe("allow");
  expect(decideRobots(g, "/admin")).toBe("disallow");
  expect(decideRobots(g, "/admin/public/x")).toBe("allow");
  expect(decideRobots(g, "/sklep")).toBe("allow");
});
