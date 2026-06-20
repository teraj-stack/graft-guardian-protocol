import { test, expect, request as pwRequest, type APIResponse } from "@playwright/test";

/**
 * E2E: robots.txt — STRATEGIA INDEKSOWANIA
 *
 * Twardo zakodowana, deklaratywna mapa "co ma być Allow / Disallow dla
 * User-agent: *" w produkcyjnym `robots.txt`. Test rozwiązuje dla każdej
 * ścieżki regułę decydującą algorytmem Google (longest-match wins;
 * Allow przebija Disallow przy remisie) i porównuje z oczekiwaniem.
 *
 * Zakres:
 *  1) /robots.txt jest pobieralny (2xx) i typu text/plain.
 *  2) Istnieje grupa User-agent: * z regułą Allow: /.
 *  3) STRATEGIA → /admin, /api, panele wewnętrzne, e-book gated, auth,
 *     unsubscribe linki, /lovable/ → MUSZĄ być Disallow.
 *  4) STRATEGIA → strony marketingowe, sklep, panel pacjenta, raport,
 *     polityki, sitemap → MUSZĄ być Allow.
 *  5) Każda dyrektywa Disallow w pliku ma sens — jest pokryta przez
 *     oczekiwaną strategię (brak "martwych" lub przypadkowych blokad
 *     publicznych zasobów).
 *
 * Test jest komplementarny do `robots-disallow-rules.spec.ts` (który
 * weryfikuje też integralność sekcji Sitemap) — tutaj skupiamy się
 * wyłącznie na mapie strategii indeksowania.
 */

function headerValue(res: APIResponse, name: string): string | null {
  const h = res.headers();
  const k = Object.keys(h).find((x) => x.toLowerCase() === name.toLowerCase());
  return k ? h[k] ?? null : null;
}

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

/** Strategia: ścieżki, które MUSZĄ być zablokowane dla * */
const STRATEGY_DISALLOW: { path: string; reason: string }[] = [
  { path: "/admin", reason: "panel administracyjny" },
  { path: "/admin/anything", reason: "podstrony /admin" },
  { path: "/raporty", reason: "panel raportów (auth)" },
  { path: "/raporty/status", reason: "status wysyłek raportów" },
  { path: "/brand-audit", reason: "audyt marki (internal)" },
  { path: "/phrase-audit", reason: "audyt fraz (internal)" },
  { path: "/vitals", reason: "dashboard RUM (internal)" },
  { path: "/email-test", reason: "testowa wysyłka maila" },
  { path: "/ebook", reason: "e-book bramkowany linkiem" },
  { path: "/ebook/some-token", reason: "gated reader e-booka" },
  { path: "/auth", reason: "logowanie do panelu" },
  { path: "/api/", reason: "endpointy publicznego API" },
  { path: "/api/public/contact", reason: "endpoint kontaktowy" },
  { path: "/api/public/reminders/dispatch", reason: "cron przypomnień" },
  { path: "/lovable/", reason: "endpointy platformy" },
  { path: "/lovable/email/queue/process", reason: "queue procesor maili" },
  { path: "/email/unsubscribe", reason: "tokenowy unsubscribe" },
  { path: "/przypomnienia/wypisz", reason: "tokenowa wypisanie z SMS/Email" },
];

/** Strategia: ścieżki, które MUSZĄ być indeksowalne dla * */
const STRATEGY_ALLOW: { path: string; reason: string }[] = [
  { path: "/", reason: "landing / homepage" },
  { path: "/sklep", reason: "sklep Shopify" },
  { path: "/koszt-przeszczepu-wlosow", reason: "guide cenowy (SEO landing)" },
  { path: "/panel", reason: "publiczny panel pacjenta" },
  { path: "/przypomnienia", reason: "formularz zapisu na przypomnienia" },
  { path: "/raport", reason: "publiczny szablon raportu" },
  { path: "/prywatnosc", reason: "polityka prywatności" },
  { path: "/cookies", reason: "polityka cookies" },
  { path: "/sitemap.xml", reason: "mapa strony dla crawlerów" },
];

test("robots.txt — strategia indeksowania (Allow/Disallow dla kluczowych sekcji)", async ({
  baseURL,
}) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const res = await ctx.fetch("/robots.txt", { failOnStatusCode: false, maxRedirects: 10 });
    expect(res.status(), `status ${res.status()}`).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(300);
    const ct = (headerValue(res, "content-type") ?? "").toLowerCase();
    expect(ct).toMatch(/^text\/plain/);

    const body = await res.text();
    expect(body.trim().length).toBeGreaterThan(0);

    const { groups } = parseRobots(body);
    const star = findStarGroup(groups);
    expect(star, "robots.txt: brak grupy User-agent: *").not.toBeNull();
    expect(
      star!.rules.some((r) => r.type === "allow" && r.path === "/"),
      "robots.txt: grupa * nie zawiera `Allow: /`",
    ).toBe(true);

    // 3) Disallow strategy
    const allowedByMistake: string[] = [];
    for (const { path, reason } of STRATEGY_DISALLOW) {
      if (decide(star!, path) !== "disallow") {
        allowedByMistake.push(`${path} (${reason})`);
      }
    }
    expect(
      allowedByMistake,
      `Ścieżki, które MUSZĄ być Disallow dla *, a są Allow:\n  - ${allowedByMistake.join("\n  - ")}`,
    ).toEqual([]);

    // 4) Allow strategy
    const blockedByMistake: string[] = [];
    for (const { path, reason } of STRATEGY_ALLOW) {
      if (decide(star!, path) !== "allow") {
        blockedByMistake.push(`${path} (${reason})`);
      }
    }
    expect(
      blockedByMistake,
      `Strony publiczne przypadkowo zablokowane w robots.txt:\n  - ${blockedByMistake.join("\n  - ")}`,
    ).toEqual([]);

    // 5) Każda dyrektywa Disallow w pliku ma sens (jest pokryta strategią)
    const expectedDisallowPaths = new Set(STRATEGY_DISALLOW.map((s) => s.path));
    const unjustified: string[] = [];
    for (const rule of star!.rules) {
      if (rule.type !== "disallow" || !rule.path) continue;
      const covered = [...expectedDisallowPaths].some(
        (p) => p === rule.path || p.startsWith(rule.path) || rule.path.startsWith(p),
      );
      if (!covered) unjustified.push(rule.path);
    }
    expect(
      unjustified,
      `Dyrektywy Disallow nieobjęte strategią — sprawdź, czy nie blokujesz publicznej sekcji:\n  - ${unjustified.join("\n  - ")}`,
    ).toEqual([]);
  } finally {
    await ctx.dispose();
  }
});

// ─── Self-testy parsera/algorytmu ───
test("self-test: decide — longest match + Allow przebija Disallow", () => {
  const g: Group = {
    agents: ["*"],
    rules: [
      { type: "allow", path: "/" },
      { type: "disallow", path: "/admin" },
      { type: "allow", path: "/admin/public" },
      { type: "disallow", path: "/api/" },
    ],
  };
  expect(decide(g, "/")).toBe("allow");
  expect(decide(g, "/admin")).toBe("disallow");
  expect(decide(g, "/admin/x")).toBe("disallow");
  expect(decide(g, "/admin/public/x")).toBe("allow");
  expect(decide(g, "/api/x")).toBe("disallow");
  expect(decide(g, "/sklep")).toBe("allow");
});

test("self-test: parseRobots — łączy kolejne User-agent w jedną grupę", () => {
  const t = `User-agent: *\nUser-agent: Googlebot\nDisallow: /x\n`;
  const { groups } = parseRobots(t);
  expect(groups.length).toBe(1);
  expect(groups[0].agents).toEqual(["*", "Googlebot"]);
  expect(groups[0].rules).toEqual([{ type: "disallow", path: "/x" }]);
});
