import { test, expect, request as pwRequest, type APIResponse } from "@playwright/test";

/**
 * E2E: wykrywa `noindex` na publicznych routach — zarówno w nagłówku
 * `X-Robots-Tag`, jak i w meta tagu `<meta name="robots">`. Dodatkowo
 * podąża za przekierowaniami 301/302 i sprawdza CAŁY łańcuch przekierowań
 * (nie tylko końcową odpowiedź), aby wykryć pośrednie `X-Robots-Tag: noindex`
 * wstawione np. przez CDN/proxy/edge.
 *
 * Zakres = publiczne routy z sitemap[.]xml.ts. Routy świadomie wyłączone
 * z indeksu (np. /auth, /admin, /_authenticated/*) NIE są tu testowane.
 */

const PUBLIC_ROUTES = [
  "/",
  "/sklep",
  "/koszt-przeszczepu-wlosow",
  "/przypomnienia",
  "/prywatnosc",
  "/cookies",
];

const NOINDEX_DIRECTIVE = /\b(noindex|none)\b/i;
const NOFOLLOW_DIRECTIVE = /\bnofollow\b/i;

function headerValue(res: APIResponse, name: string): string | null {
  const headers = res.headers();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] ?? null : null;
}

function assertHeadersClean(res: APIResponse, where: string) {
  const xrt = headerValue(res, "x-robots-tag");
  if (xrt) {
    expect(
      NOINDEX_DIRECTIVE.test(xrt),
      `[${where}] X-Robots-Tag wymusza noindex/none: "${xrt}"`,
    ).toBe(false);
    expect(
      NOFOLLOW_DIRECTIVE.test(xrt),
      `[${where}] X-Robots-Tag wymusza nofollow: "${xrt}"`,
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

      assertHeadersClean(res, `hop ${hop} ${url} [${status}]`);

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

function extractMetaRobots(html: string): string[] {
  const out: string[] = [];
  const re = /<meta\b[^>]*\bname\s*=\s*["']robots["'][^>]*>/gi;
  for (const match of html.matchAll(re)) {
    const tag = match[0];
    const contentMatch = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    if (contentMatch) out.push(contentMatch[1]);
  }
  return out;
}

for (const route of PUBLIC_ROUTES) {
  test(`publiczna routa ${route} nie ma noindex (z uwzględnieniem przekierowań)`, async ({ baseURL }) => {
    const { status, headers, body, chain } = await followRedirectChain(baseURL!, route);

    expect(
      status >= 200 && status < 300,
      `[${route}] łańcuch ${chain.join(" -> ")} zakończył się statusem ${status}`,
    ).toBe(true);

    const xrt = headers["x-robots-tag"];
    if (xrt) {
      expect(NOINDEX_DIRECTIVE.test(xrt), `[${route}] final X-Robots-Tag: "${xrt}"`).toBe(false);
    }

    const ct = headers["content-type"] ?? "";
    if (ct.includes("text/html")) {
      const metas = extractMetaRobots(body);
      for (const value of metas) {
        expect(
          NOINDEX_DIRECTIVE.test(value),
          `[${route}] <meta name="robots" content="${value}"> wymusza noindex`,
        ).toBe(false);
      }
    }
  });
}

test("kontrolny: detekcja noindex w meta działa (self-test regexpa)", async () => {
  // Sanity-check: upewnia się, że nasza ekstrakcja i regexp w ogóle łapią noindex.
  const html = `<html><head><meta name="robots" content="noindex, follow"></head></html>`;
  const metas = extractMetaRobots(html);
  expect(metas).toEqual(["noindex, follow"]);
  expect(NOINDEX_DIRECTIVE.test(metas[0])).toBe(true);
});
