import { test, expect, request as pwRequest, type APIResponse } from "@playwright/test";

/**
 * E2E: weryfikuje, że `robots.txt` zawiera poprawne dyrektywy Disallow/Allow
 * dla stron NIEdozwolonych do indeksowania, bez naruszania sekcji Sitemap.
 *
 *  1. `/robots.txt` jest pobieralny (2xx, text/plain).
 *  2. Parser rozbija plik na grupy `User-agent` z listą reguł
 *     `Allow:` / `Disallow:` (RFC 9309). Linie `Sitemap:` są globalne.
 *  3. Grupa `User-agent: *` MUSI istnieć i zawierać `Allow: /`.
 *  4. Dla każdej "MUST_DISALLOW" ścieżki (panele auth, API, internal,
 *     gated readers, unsubscribe linki) reguła decydująca dla `*`
 *     MUSI być `Disallow` (zgodnie z regułą "najdłuższy match wygrywa",
 *     z `Allow` rozstrzygającym remis).
 *  5. Dla każdej "MUST_ALLOW" ścieżki (strony publiczne z sitemap)
 *     reguła decydująca dla `*` MUSI być `Allow` — żeby ukryć panel
 *     nie zostały przypadkiem zablokowane strony indeksowane.
 *  6. Sekcja Sitemap jest nienaruszona: ≥1 dyrektywa `Sitemap:`,
 *     każda absolutną URL, niezduplikowana, NIE wewnątrz grupy
 *     `User-agent` (Sitemap musi być na poziomie globalnym).
 *  7. Dyrektywy Disallow nie blokują żadnego URL-a wymienionego w
 *     `/sitemap.xml` — sprzeczność robots vs sitemap = błąd SEO.
 *  8. Self-testy parsera + algorytmu "longest match".
 */

function headerValue(res: APIResponse, name: string): string | null {
  const h = res.headers();
  const k = Object.keys(h).find((x) => x.toLowerCase() === name.toLowerCase());
  return k ? h[k] ?? null : null;
}

type Rule = { type: "allow" | "disallow"; path: string };
type Group = { agents: string[]; rules: Rule[] };
type Parsed = {
  groups: Group[];
  sitemaps: string[];
  sitemapInsideGroup: boolean;
};

function parseRobots(txt: string): Parsed {
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  let current: Group | null = null;
  let sitemapInsideGroup = false;
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
    } else if (field === "sitemap") {
      sitemaps.push(value);
      if (current && lastWasAgent === false && current.rules.length === 0) {
        // sitemap pojawił się tuż po user-agent bez reguł — i tak globalne,
        // ale ostrzegamy gdy występuje "wewnątrz" grupy z regułami.
      }
      if (current && current.rules.length > 0) {
        sitemapInsideGroup = true;
      }
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  return { groups, sitemaps, sitemapInsideGroup };
}

function findStarGroup(p: Parsed): Group | null {
  return p.groups.find((g) => g.agents.includes("*")) ?? null;
}

/**
 * Wybiera regułę decydującą dla danego URL-a wg algorytmu Google:
 * najdłuższy match wygrywa; przy remisie `Allow` przebija `Disallow`.
 * Pusty `Disallow:` oznacza "nic nie blokuj" — ignorujemy go w matchu.
 * Zwraca "allow" gdy nie ma żadnej dopasowanej reguły (default allow).
 */
function decide(group: Group, urlPath: string): "allow" | "disallow" {
  let best: { rule: Rule; len: number } | null = null;
  for (const rule of group.rules) {
    if (!rule.path) continue; // pusty Disallow = nic
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
  return best ? best.type : "allow";
}

function isAbsoluteUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const MUST_DISALLOW = [
  "/admin",
  "/admin/anything",
  "/raporty",
  "/raporty/status",
  "/brand-audit",
  "/phrase-audit",
  "/vitals",
  "/email-test",
  "/ebook",
  "/ebook/some-token",
  "/auth",
  "/api/public/contact",
  "/api/public/reminders/dispatch",
  "/lovable/email/queue/process",
  "/email/unsubscribe",
  "/przypomnienia/wypisz",
];

const MUST_ALLOW = [
  "/",
  "/sklep",
  "/koszt-przeszczepu-wlosow",
  "/panel",
  "/przypomnienia",
  "/raport",
  "/prywatnosc",
  "/cookies",
];

test("robots.txt — Disallow/Allow dla niedozwolonych ścieżek, sekcja Sitemap nietknięta", async ({
  baseURL,
}) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const res = await ctx.fetch("/robots.txt", { failOnStatusCode: false, maxRedirects: 10 });
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(300);
    const ct = (headerValue(res, "content-type") ?? "").toLowerCase();
    expect(ct, `content-type "${ct}"`).toMatch(/^text\/plain/);
    const body = await res.text();

    const parsed = parseRobots(body);

    // 3) User-agent: * istnieje + Allow: /
    const star = findStarGroup(parsed);
    expect(star, "robots.txt: brak grupy User-agent: *").not.toBeNull();
    expect(
      star!.rules.some((r) => r.type === "allow" && r.path === "/"),
      "robots.txt: grupa * nie zawiera `Allow: /`",
    ).toBe(true);

    // 4) MUST_DISALLOW
    const wrongAllow: string[] = [];
    for (const url of MUST_DISALLOW) {
      if (decide(star!, url) !== "disallow") wrongAllow.push(url);
    }
    expect(
      wrongAllow,
      `robots.txt: te ścieżki MUSZĄ być Disallow dla *, a są Allow: ${wrongAllow.join(", ")}`,
    ).toEqual([]);

    // 5) MUST_ALLOW
    const wrongDisallow: string[] = [];
    for (const url of MUST_ALLOW) {
      if (decide(star!, url) !== "allow") wrongDisallow.push(url);
    }
    expect(
      wrongDisallow,
      `robots.txt: publiczne strony zostały przypadkiem zablokowane: ${wrongDisallow.join(", ")}`,
    ).toEqual([]);

    // 6) Sekcja Sitemap
    expect(parsed.sitemaps.length, "brak dyrektywy Sitemap").toBeGreaterThan(0);
    for (const s of parsed.sitemaps) {
      expect(isAbsoluteUrl(s), `Sitemap nie jest absolutną URL: ${s}`).toBe(true);
    }
    const dupSitemap = parsed.sitemaps.filter((s, i) => parsed.sitemaps.indexOf(s) !== i);
    expect(dupSitemap, `zduplikowane Sitemap: ${dupSitemap.join(", ")}`).toEqual([]);
    expect(
      parsed.sitemapInsideGroup,
      "Sitemap: musi być dyrektywą globalną (poza grupą User-agent z regułami)",
    ).toBe(false);

    // 7) Brak sprzeczności Disallow vs sitemap URL-e
    const smRes = await ctx.fetch("/sitemap.xml", { failOnStatusCode: false, maxRedirects: 10 });
    expect(smRes.status()).toBeLessThan(300);
    const xml = await smRes.text();
    const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1]);
    expect(locs.length, "sitemap pusta").toBeGreaterThan(0);
    const blocked: string[] = [];
    for (const loc of locs) {
      const p = new URL(loc).pathname;
      if (decide(star!, p) === "disallow") blocked.push(loc);
    }
    expect(
      blocked,
      `robots.txt blokuje URL-e wymienione w sitemap: ${blocked.join(", ")}`,
    ).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

// ─── Self-testy ───
test("self-test: parseRobots — grupy, reguły, sitemap globalny", () => {
  const t = `
User-agent: *
Allow: /
Disallow: /admin

User-agent: Googlebot
Disallow: /private

Sitemap: https://x.test/sitemap.xml
`;
  const p = parseRobots(t);
  expect(p.groups.length).toBe(2);
  expect(p.groups[0].agents).toEqual(["*"]);
  expect(p.groups[0].rules).toEqual([
    { type: "allow", path: "/" },
    { type: "disallow", path: "/admin" },
  ]);
  expect(p.groups[1].agents).toEqual(["Googlebot"]);
  expect(p.sitemaps).toEqual(["https://x.test/sitemap.xml"]);
  expect(p.sitemapInsideGroup).toBe(false);
});

test("self-test: parseRobots — wykrywa Sitemap wewnątrz grupy z regułami", () => {
  const t = `User-agent: *\nDisallow: /x\nSitemap: https://x.test/s.xml\n`;
  expect(parseRobots(t).sitemapInsideGroup).toBe(true);
});

test("self-test: decide — longest match + Allow przebija Disallow przy remisie", () => {
  const g: Group = {
    agents: ["*"],
    rules: [
      { type: "allow", path: "/" },
      { type: "disallow", path: "/admin" },
      { type: "allow", path: "/admin/public" },
      { type: "disallow", path: "/api/" },
      { type: "disallow", path: "/x" },
      { type: "allow", path: "/x" }, // remis → allow
    ],
  };
  expect(decide(g, "/")).toBe("allow");
  expect(decide(g, "/admin")).toBe("disallow");
  expect(decide(g, "/admin/anything")).toBe("disallow");
  expect(decide(g, "/admin/public/page")).toBe("allow");
  expect(decide(g, "/api/x")).toBe("disallow");
  expect(decide(g, "/x")).toBe("allow"); // Allow wygrywa remis
  expect(decide(g, "/other")).toBe("allow");
});
