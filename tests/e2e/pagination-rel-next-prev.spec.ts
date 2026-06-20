import { test, expect, request as pwRequest, type APIResponse } from "@playwright/test";

/**
 * E2E: weryfikuje tagi `<link rel="next">` i `<link rel="prev">` na stronach
 * z paginacją publicznych rout przeglądowych, oraz potwierdza, że żaden hop
 * łańcucha przekierowań NIE wstawia bot-specific noindex (X-Robots-Tag +
 * meta dla google/bing/AI botów).
 *
 * Reguły:
 *  1. Pierwsza strona (bez ?page lub ?page=1) — `rel="prev"` NIE może istnieć,
 *     `rel="next"` (jeśli jest) musi wskazywać `?page=2` na tej samej ścieżce.
 *  2. Strona środkowa (?page=2) — `rel="prev"` musi prowadzić do strony 1
 *     (bez query albo `?page=1`), `rel="next"` (jeśli jest) do `?page=3`.
 *  3. href w rel=next/prev musi być absolutny lub zaczynać od "/", musi
 *     wskazywać tę samą ścieżkę (pathname), różnić się tylko parametrem `page`.
 *  4. Na każdym hopie i w finalnej odpowiedzi — brak noindex dla
 *     dowolnej z popularnych nazw botów (googlebot, bingbot, gptbot, ...).
 */

const PUBLIC_BROWSE_ROUTES = ["/sklep", "/koszt-przeszczepu-wlosow"];

const NOINDEX_DIRECTIVE = /\b(noindex|none)\b/i;

const BOT_NAMES = [
  "robots", "googlebot", "googlebot-news", "bingbot", "slurp", "duckduckbot",
  "yandex", "baiduspider", "applebot", "gptbot", "oai-searchbot",
  "chatgpt-user", "claudebot", "anthropic-ai", "perplexitybot", "ccbot",
  "google-extended", "bytespider",
];

function headerValue(res: APIResponse, name: string): string | null {
  const headers = res.headers();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] ?? null : null;
}

function parseXRobotsTag(raw: string): Array<{ bot: string; directives: string }> {
  const segments = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const out: Array<{ bot: string; directives: string }> = [];
  let currentBot = "*";
  let currentDirectives: string[] = [];
  const flush = () => {
    if (currentDirectives.length > 0) {
      out.push({ bot: currentBot, directives: currentDirectives.join(", ") });
      currentDirectives = [];
    }
  };
  for (const seg of segments) {
    const m = seg.match(/^([a-zA-Z0-9_\-]+)\s*:\s*(.+)$/);
    if (m && !/^(max-(snippet|image-preview|video-preview)|unavailable_after)$/i.test(m[1])) {
      flush();
      currentBot = m[1].toLowerCase();
      currentDirectives.push(m[2].trim());
    } else {
      currentDirectives.push(seg);
    }
  }
  flush();
  return out;
}

function assertHopClean(res: APIResponse, where: string) {
  const xrt = headerValue(res, "x-robots-tag");
  if (!xrt) return;
  for (const { bot, directives } of parseXRobotsTag(xrt)) {
    expect(
      NOINDEX_DIRECTIVE.test(directives),
      `[${where}] X-Robots-Tag noindex dla "${bot}": "${directives}"`,
    ).toBe(false);
  }
}

interface FinalResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  chain: string[];
  finalUrl: string;
}

async function followChain(baseURL: string, startPath: string, maxHops = 10): Promise<FinalResponse> {
  const ctx = await pwRequest.newContext({ baseURL });
  const chain: string[] = [];
  let current = startPath;
  try {
    for (let hop = 0; hop <= maxHops; hop++) {
      const url = current.startsWith("http") ? current : new URL(current, baseURL).toString();
      chain.push(url);
      const res = await ctx.fetch(url, { maxRedirects: 0, failOnStatusCode: false });
      const status = res.status();
      assertHopClean(res, `hop ${hop} ${url} [${status}]`);
      if (status >= 300 && status < 400) {
        const loc = headerValue(res, "location");
        if (!loc) throw new Error(`[${url}] ${status} bez Location`);
        current = loc;
        continue;
      }
      return { status, headers: res.headers(), body: await res.text(), chain, finalUrl: url };
    }
    throw new Error(`Za dużo redirectów (>${maxHops}) od ${startPath}`);
  } finally {
    await ctx.dispose();
  }
}

function extractMetaForBot(html: string, botName: string): string[] {
  const escaped = botName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<meta\\b[^>]*\\bname\\s*=\\s*["']${escaped}["'][^>]*>`, "gi");
  const out: string[] = [];
  for (const match of html.matchAll(re)) {
    const cm = match[0].match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    if (cm) out.push(cm[1]);
  }
  return out;
}

/** Wyciąga wszystkie `<link rel="X" href="Y">`; rel matchowany case-insensitive,
 *  zarówno gdy rel jest przed href, jak i po nim. */
function extractLinkRel(html: string, rel: "next" | "prev"): string[] {
  const out: string[] = [];
  const tagRe = /<link\b[^>]*>/gi;
  for (const m of html.matchAll(tagRe)) {
    const tag = m[0];
    const relMatch = tag.match(/\brel\s*=\s*["']([^"']+)["']/i);
    if (!relMatch) continue;
    const rels = relMatch[1].toLowerCase().split(/\s+/);
    if (!rels.includes(rel)) continue;
    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (hrefMatch) out.push(hrefMatch[1]);
  }
  return out;
}

function pathAndPage(urlOrPath: string): { pathname: string; page: string | null } {
  const u = new URL(urlOrPath, "http://x.invalid");
  return {
    pathname: u.pathname.replace(/\/$/, "") || "/",
    page: u.searchParams.get("page"),
  };
}

function assertBotNoindexClean(body: string, where: string) {
  for (const bot of BOT_NAMES) {
    for (const value of extractMetaForBot(body, bot)) {
      expect(
        NOINDEX_DIRECTIVE.test(value),
        `[${where}] <meta name="${bot}" content="${value}"> wymusza noindex`,
      ).toBe(false);
    }
  }
}

for (const route of PUBLIC_BROWSE_ROUTES) {
  test(`${route} (strona 1) — rel=prev nie istnieje, rel=next opcjonalnie wskazuje page=2; brak bot-noindex`, async ({
    baseURL,
  }) => {
    const { status, headers, body, chain } = await followChain(baseURL!, route);
    expect(
      status >= 200 && status < 300,
      `[${route}] ${chain.join(" -> ")} status ${status}`,
    ).toBe(true);

    const ct = headers["content-type"] ?? "";
    if (!ct.includes("text/html")) test.skip(true, "nie-HTML");

    assertBotNoindexClean(body, route);

    const expectedPath = route.replace(/\/$/, "") || "/";

    // rel=prev MUSI być nieobecny na pierwszej stronie
    const prevs = extractLinkRel(body, "prev");
    expect(prevs.length, `[${route}] strona 1 nie powinna mieć rel=prev; znalazłem: ${prevs.join(", ")}`).toBe(0);

    // rel=next opcjonalny; jeśli jest, musi wskazywać tę samą ścieżkę z page=2
    const nexts = extractLinkRel(body, "next");
    expect(nexts.length, `[${route}] zduplikowane rel=next: ${nexts.join(", ")}`).toBeLessThanOrEqual(1);
    if (nexts.length === 1) {
      const href = nexts[0];
      expect(
        href.startsWith("/") || /^https?:\/\//i.test(href),
        `[${route}] rel=next href powinien być absolutny lub root-relative: "${href}"`,
      ).toBe(true);
      const { pathname, page } = pathAndPage(href);
      expect(pathname, `[${route}] rel=next prowadzi do innej ścieżki: ${pathname}`).toBe(expectedPath);
      expect(page, `[${route}] rel=next powinien wskazywać page=2, jest: ${page}`).toBe("2");
    }
  });

  test(`${route}?page=2 — rel=prev → strona 1, rel=next opcjonalnie → page=3; brak bot-noindex na hopach`, async ({
    baseURL,
  }) => {
    const startPath = `${route}?page=2`;
    const { status, headers, body, chain } = await followChain(baseURL!, startPath);
    expect(
      status >= 200 && status < 300,
      `[${startPath}] ${chain.join(" -> ")} status ${status}`,
    ).toBe(true);

    const ct = headers["content-type"] ?? "";
    if (!ct.includes("text/html")) test.skip(true, "nie-HTML");

    assertBotNoindexClean(body, startPath);

    const expectedPath = route.replace(/\/$/, "") || "/";

    // rel=prev jest opcjonalny w naszej aplikacji (paginacja może nie istnieć
    // wcale), ale jeśli rel=next istnieje na stronie >1, rel=prev MUSI istnieć.
    const prevs = extractLinkRel(body, "prev");
    const nexts = extractLinkRel(body, "next");

    expect(prevs.length, `[${startPath}] zduplikowane rel=prev: ${prevs.join(", ")}`).toBeLessThanOrEqual(1);
    expect(nexts.length, `[${startPath}] zduplikowane rel=next: ${nexts.join(", ")}`).toBeLessThanOrEqual(1);

    if (nexts.length === 1 && prevs.length === 0) {
      throw new Error(
        `[${startPath}] rel=next obecny bez rel=prev — niezgodne z modelem paginacji (page>1 musi mieć prev)`,
      );
    }

    if (prevs.length === 1) {
      const href = prevs[0];
      expect(
        href.startsWith("/") || /^https?:\/\//i.test(href),
        `[${startPath}] rel=prev href powinien być absolutny lub root-relative: "${href}"`,
      ).toBe(true);
      const { pathname, page } = pathAndPage(href);
      expect(pathname, `[${startPath}] rel=prev prowadzi do innej ścieżki: ${pathname}`).toBe(expectedPath);
      // Strona 1 = brak page LUB page=1
      expect(
        page === null || page === "1",
        `[${startPath}] rel=prev z page=2 powinien wskazywać stronę 1 (brak page lub page=1), jest: ${page}`,
      ).toBe(true);
    }

    if (nexts.length === 1) {
      const href = nexts[0];
      const { pathname, page } = pathAndPage(href);
      expect(pathname, `[${startPath}] rel=next prowadzi do innej ścieżki: ${pathname}`).toBe(expectedPath);
      expect(page, `[${startPath}] rel=next z page=2 powinien wskazywać page=3, jest: ${page}`).toBe("3");
    }
  });
}

// ─── Self-testy ───
test("self-test: extractLinkRel parsuje rel=next/prev w obu kolejnościach atrybutów", () => {
  const html = `
    <link rel="next" href="/sklep?page=2">
    <link href="/sklep" rel="prev" />
    <link rel="canonical" href="/sklep">
    <link rel="alternate" hreflang="en" href="/en/sklep">
  `;
  expect(extractLinkRel(html, "next")).toEqual(["/sklep?page=2"]);
  expect(extractLinkRel(html, "prev")).toEqual(["/sklep"]);
});

test("self-test: pathAndPage rozdziela ścieżkę i numer strony", () => {
  expect(pathAndPage("/sklep?page=3")).toEqual({ pathname: "/sklep", page: "3" });
  expect(pathAndPage("https://graftgen.com/sklep/?page=1&sort=x")).toEqual({
    pathname: "/sklep",
    page: "1",
  });
  expect(pathAndPage("/sklep")).toEqual({ pathname: "/sklep", page: null });
});
