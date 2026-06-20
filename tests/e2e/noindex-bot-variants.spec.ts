import { test, expect, request as pwRequest, type APIResponse } from "@playwright/test";

/**
 * E2E: wykrywa noindex w wariantach SPECYFICZNYCH DLA BOTÓW — zarówno
 * w meta tagach (`googlebot`, `googlebot-news`, `bingbot`, `slurp`,
 * `duckduckbot`, `yandex`, `baiduspider`, `applebot`, `ai2bot`, `gptbot`,
 * `oai-searchbot`, `chatgpt-user`, `claudebot`, `perplexitybot`, ...),
 * jak i w nagłówku `X-Robots-Tag` z prefiksem bota (np.
 * `X-Robots-Tag: googlebot: noindex` lub multi-wartościowy
 * `X-Robots-Tag: googlebot: noindex, bingbot: noindex`).
 *
 * Sprawdza KAŻDY hop łańcucha przekierowań 301/302/303/307/308 — bot-specific
 * noindex często wstrzykiwany jest na pośrednim CDN/proxy, nie na finalnej
 * odpowiedzi.
 *
 * Zakres = publiczne, indeksowane routy z sitemap[.]xml.ts.
 */

const PUBLIC_ROUTES = [
  "/",
  "/sklep",
  "/koszt-przeszczepu-wlosow",
  "/przypomnienia",
  "/prywatnosc",
  "/cookies",
];

const BOT_NAMES = [
  "robots", // generic — dla pewności też tu, na wypadek mieszanych konfiguracji
  "googlebot",
  "googlebot-news",
  "googlebot-image",
  "google",
  "bingbot",
  "msnbot",
  "slurp", // Yahoo
  "duckduckbot",
  "yandex",
  "yandexbot",
  "baiduspider",
  "applebot",
  "applebot-extended",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "ia_archiver", // Internet Archive
  // AI crawlers
  "gptbot",
  "oai-searchbot",
  "chatgpt-user",
  "claudebot",
  "claude-web",
  "anthropic-ai",
  "perplexitybot",
  "ccbot",
  "google-extended",
  "ai2bot",
  "cohere-ai",
  "meta-externalagent",
  "bytespider",
];

const NOINDEX_DIRECTIVE = /\b(noindex|none)\b/i;

function headerValue(res: APIResponse, name: string): string | null {
  const headers = res.headers();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] ?? null : null;
}

/**
 * Parsuje wartość X-Robots-Tag, która może być:
 *   - prosta:        "noindex, nofollow"
 *   - bot-specific:  "googlebot: noindex, nofollow"
 *   - multi (CSV):   "googlebot: noindex, bingbot: noindex, otherbot: noarchive"
 *   - multi (multi nagłówków): Playwright zwraca je sklejone przecinkami w jednym stringu.
 *
 * Zwraca listę { bot, directives } — bot === "*" gdy nie ma prefiksu.
 */
function parseXRobotsTag(raw: string): Array<{ bot: string; directives: string }> {
  // Rozbij po przecinkach z lookahead na "bot:" — żeby "googlebot: noindex, nofollow"
  // nie rozpadło się na ["googlebot: noindex", "nofollow"] z utratą kontekstu bota.
  // Strategia: skanuj segmenty oddzielone przecinkiem, łącz te, które nie zaczynają
  // się od "<bot>:" z poprzednim botem.
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
    if (m && !/^max-(snippet|image-preview|video-preview)$/i.test(m[1]) && !/^unavailable_after$/i.test(m[1])) {
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

function assertXRobotsTagClean(res: APIResponse, where: string) {
  const xrt = headerValue(res, "x-robots-tag");
  if (!xrt) return;
  const parsed = parseXRobotsTag(xrt);
  for (const { bot, directives } of parsed) {
    expect(
      NOINDEX_DIRECTIVE.test(directives),
      `[${where}] X-Robots-Tag wymusza noindex dla bota "${bot}": "${directives}" (pełny nagłówek: "${xrt}")`,
    ).toBe(false);
  }
}

interface FinalResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  chain: string[];
}

async function followRedirectChain(
  ctxBaseURL: string,
  startPath: string,
  maxHops = 10,
): Promise<FinalResponse> {
  const ctx = await pwRequest.newContext({ baseURL: ctxBaseURL });
  const chain: string[] = [];
  let current = startPath;

  try {
    for (let hop = 0; hop <= maxHops; hop++) {
      const url = current.startsWith("http") ? current : new URL(current, ctxBaseURL).toString();
      chain.push(url);

      const res = await ctx.fetch(url, { maxRedirects: 0, failOnStatusCode: false });
      const status = res.status();

      assertXRobotsTagClean(res, `hop ${hop} ${url} [${status}]`);

      if (status >= 300 && status < 400) {
        const loc = headerValue(res, "location");
        if (!loc) throw new Error(`[${url}] status ${status} bez nagłówka Location`);
        current = loc;
        continue;
      }

      const headers = res.headers();
      const body = await res.text();
      return { status, headers, body, chain };
    }
    throw new Error(`Zbyt wiele przekierowań (>${maxHops}) zaczynając od ${startPath}`);
  } finally {
    await ctx.dispose();
  }
}

/** Wyciąga wszystkie `<meta name="<bot>" content="...">` dla podanej nazwy. */
function extractMetaForBot(html: string, botName: string): string[] {
  const escaped = botName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<meta\\b[^>]*\\bname\\s*=\\s*["']${escaped}["'][^>]*>`,
    "gi",
  );
  const out: string[] = [];
  for (const match of html.matchAll(re)) {
    const tag = match[0];
    const cm = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    if (cm) out.push(cm[1]);
  }
  return out;
}

for (const route of PUBLIC_ROUTES) {
  test(`publiczna routa ${route} — brak bot-specific noindex na wszystkich hopach`, async ({ baseURL }) => {
    const { status, headers, body, chain } = await followRedirectChain(baseURL!, route);

    expect(
      status >= 200 && status < 300,
      `[${route}] łańcuch ${chain.join(" -> ")} zakończył się statusem ${status}`,
    ).toBe(true);

    // Finalna odpowiedź — X-Robots-Tag jeszcze raz, dla jasności raportu.
    const xrt = headers["x-robots-tag"];
    if (xrt) {
      const parsed = parseXRobotsTag(xrt);
      for (const { bot, directives } of parsed) {
        expect(
          NOINDEX_DIRECTIVE.test(directives),
          `[${route}] final X-Robots-Tag dla "${bot}": "${directives}"`,
        ).toBe(false);
      }
    }

    // Meta robots dla każdej znanej nazwy bota.
    const ct = headers["content-type"] ?? "";
    if (!ct.includes("text/html")) return;

    for (const bot of BOT_NAMES) {
      const values = extractMetaForBot(body, bot);
      for (const value of values) {
        expect(
          NOINDEX_DIRECTIVE.test(value),
          `[${route}] <meta name="${bot}" content="${value}"> wymusza noindex/none`,
        ).toBe(false);
      }
    }
  });
}

// ─── Self-testy — gwarantują, że parser i ekstrakcja faktycznie łapią noindex ───

test("self-test: parseXRobotsTag wykrywa bot-specific noindex", () => {
  // Prosty
  expect(parseXRobotsTag("noindex")).toEqual([{ bot: "*", directives: "noindex" }]);

  // Bot-specific
  expect(parseXRobotsTag("googlebot: noindex")).toEqual([
    { bot: "googlebot", directives: "noindex" },
  ]);

  // Bot + wiele dyrektyw po przecinku w obrębie tego samego bota
  expect(parseXRobotsTag("googlebot: noindex, nofollow")).toEqual([
    { bot: "googlebot", directives: "noindex, nofollow" },
  ]);

  // Multi-bot w jednym nagłówku
  const multi = parseXRobotsTag("googlebot: noindex, bingbot: noindex, otherbot: noarchive");
  expect(multi).toEqual([
    { bot: "googlebot", directives: "noindex" },
    { bot: "bingbot", directives: "noindex" },
    { bot: "otherbot", directives: "noarchive" },
  ]);

  // Każdy z botów wykrywany przez regex noindex
  for (const entry of multi.slice(0, 2)) {
    expect(NOINDEX_DIRECTIVE.test(entry.directives)).toBe(true);
  }

  // Tokeny z dwukropkiem, które NIE są botami (max-snippet, unavailable_after), nie tworzą nowej grupy
  const mixed = parseXRobotsTag("googlebot: noindex, max-snippet:-1, unavailable_after: 2030-01-01");
  expect(mixed[0].bot).toBe("googlebot");
});

test("self-test: extractMetaForBot wykrywa <meta name=googlebot>", () => {
  const html = `
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="noindex, nofollow">
    <meta name="BingBot" content="noindex">
  `;
  expect(extractMetaForBot(html, "googlebot")).toEqual(["noindex, nofollow"]);
  expect(extractMetaForBot(html, "bingbot")).toEqual(["noindex"]); // case-insensitive
  expect(NOINDEX_DIRECTIVE.test(extractMetaForBot(html, "googlebot")[0])).toBe(true);
});
