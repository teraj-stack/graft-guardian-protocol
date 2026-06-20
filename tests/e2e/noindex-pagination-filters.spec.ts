import { test, expect, request as pwRequest, type APIResponse } from "@playwright/test";

/**
 * E2E: weryfikuje, że URL-e z parametrami paginacji i filtrowania
 * (`?page=`, `?sort=`, `?filter=`, `?q=`, ...) na publicznych routach:
 *
 *  1. Nie wprowadzają bot-specific `noindex` w żadnym hopie łańcucha
 *     przekierowań (X-Robots-Tag + meta dla googlebot/bingbot/AI botów).
 *  2. Mają `<link rel="canonical">` wskazujący na CZYSTĄ wersję URL
 *     (bez query stringa) — żeby Google nie indeksował zduplikowanych
 *     wariantów filtra/strony.
 *  3. Czysta wersja URL (canonical target) jest obecna w sitemap.xml.
 *
 * Routy testowane = przeglądowe / katalogowe (sklep, hub kosztów),
 * gdzie filtry i paginacja są realistyczne. Strony statyczne (prywatność,
 * cookies) pominięte — query string nie ma tam sensu.
 */

type Variant = { suffix: string; label: string };

const PAGINATION_FILTER_VARIANTS: Variant[] = [
  { suffix: "?page=2", label: "paginacja: page=2" },
  { suffix: "?page=99", label: "paginacja: page=99 (poza zakresem)" },
  { suffix: "?sort=price-asc", label: "sortowanie" },
  { suffix: "?filter=hbot", label: "filtr: kategoria" },
  { suffix: "?filter=hbot&page=2", label: "filtr + paginacja" },
  { suffix: "?q=laser", label: "wyszukiwarka" },
  { suffix: "?utm_source=test&utm_medium=e2e", label: "śmieci UTM" },
];

const PUBLIC_BROWSE_ROUTES = [
  "/sklep",
  "/koszt-przeszczepu-wlosow",
];

const NOINDEX_DIRECTIVE = /\b(noindex|none)\b/i;

const BOT_NAMES = [
  "robots", "googlebot", "googlebot-news", "googlebot-image", "bingbot",
  "slurp", "duckduckbot", "yandex", "baiduspider", "applebot",
  "gptbot", "oai-searchbot", "chatgpt-user", "claudebot", "anthropic-ai",
  "perplexitybot", "ccbot", "google-extended", "bytespider",
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

function extractCanonical(html: string): string | null {
  // Bierze pierwszy <link rel="canonical" href="...">
  const re = /<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i;
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  return tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;
}

function stripQuery(urlOrPath: string): string {
  try {
    const u = new URL(urlOrPath, "http://x.invalid");
    return u.pathname.replace(/\/$/, "") || "/";
  } catch {
    return urlOrPath.split("?")[0].replace(/\/$/, "") || "/";
  }
}

async function fetchSitemapPaths(baseURL: string): Promise<Set<string>> {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const res = await ctx.fetch("/sitemap.xml", { failOnStatusCode: false });
    expect(res.ok(), `/sitemap.xml status ${res.status()}`).toBe(true);
    const xml = await res.text();
    const paths = new Set<string>();
    for (const m of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
      paths.add(stripQuery(m[1]));
    }
    return paths;
  } finally {
    await ctx.dispose();
  }
}

let sitemapPaths: Set<string>;

test.beforeAll(async ({ baseURL }) => {
  sitemapPaths = await fetchSitemapPaths(baseURL!);
});

for (const route of PUBLIC_BROWSE_ROUTES) {
  for (const variant of PAGINATION_FILTER_VARIANTS) {
    test(`${route} ${variant.label} — brak bot-noindex, canonical na czystą URL w sitemap`, async ({
      baseURL,
    }) => {
      const path = `${route}${variant.suffix}`;
      const { status, headers, body, chain } = await followChain(baseURL!, path);

      expect(
        status >= 200 && status < 300,
        `[${path}] łańcuch ${chain.join(" -> ")} zakończony statusem ${status}`,
      ).toBe(true);

      // 1) Finalny X-Robots-Tag (na wszelki wypadek — hopy już były sprawdzone)
      const xrt = headers["x-robots-tag"];
      if (xrt) {
        for (const { bot, directives } of parseXRobotsTag(xrt)) {
          expect(
            NOINDEX_DIRECTIVE.test(directives),
            `[${path}] final X-Robots-Tag dla "${bot}": "${directives}"`,
          ).toBe(false);
        }
      }

      const ct = headers["content-type"] ?? "";
      if (!ct.includes("text/html")) return;

      // 2) Bot-specific meta — żadna nazwa bota nie wymusza noindex
      for (const bot of BOT_NAMES) {
        for (const value of extractMetaForBot(body, bot)) {
          expect(
            NOINDEX_DIRECTIVE.test(value),
            `[${path}] <meta name="${bot}" content="${value}"> wymusza noindex`,
          ).toBe(false);
        }
      }

      // 3) Canonical — musi istnieć i wskazywać na czystą (paramless) wersję URL,
      //    a ścieżka canonical musi być obecna w sitemap.xml.
      const canonical = extractCanonical(body);
      expect(canonical, `[${path}] brak <link rel="canonical">`).not.toBeNull();

      const canonicalPath = stripQuery(canonical!);
      const expectedPath = stripQuery(route);

      expect(
        canonicalPath,
        `[${path}] canonical "${canonical}" powinien wskazywać czystą wersję ${expectedPath} (bez query stringa)`,
      ).toBe(expectedPath);

      // canonical musi być bez query stringa
      expect(
        canonical!.includes("?"),
        `[${path}] canonical "${canonical}" zawiera query string — duplikuje wariant filtra`,
      ).toBe(false);

      // canonical musi być w sitemap
      expect(
        sitemapPaths.has(canonicalPath),
        `[${path}] canonical ${canonicalPath} nie występuje w sitemap.xml (sitemap: ${[...sitemapPaths].join(", ")})`,
      ).toBe(true);
    });
  }
}

// ─── Self-test parser / ekstrakcja ───
test("self-test: extractCanonical + stripQuery", () => {
  const html = `<link rel="canonical" href="https://graftgen.com/sklep">`;
  expect(extractCanonical(html)).toBe("https://graftgen.com/sklep");
  expect(stripQuery("https://graftgen.com/sklep?page=2&sort=x")).toBe("/sklep");
  expect(stripQuery("/sklep?page=2")).toBe("/sklep");
  expect(stripQuery("/sklep/")).toBe("/sklep");
});
