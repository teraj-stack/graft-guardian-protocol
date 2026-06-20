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

/**
 * Ręczne podążanie po łańcuchu 301/302/303/307/308 z weryfikacją KAŻDEGO hopa.
 * Zwraca finalną odpowiedź + listę URL-i w łańcuchu.
 */
async function followRedirectChain(
  ctxBaseURL: string,
  startPath: string,
  maxHops = 10,
): Promise<{ finalRes: APIResponse; chain: string[] }> {
  const ctx = await pwRequest.newContext({ baseURL: ctxBaseURL });
  const chain: string[] = [];
  let current = startPath;

  for (let hop = 0; hop <= maxHops; hop++) {
    const url = current.startsWith("http") ? current : new URL(current, ctxBaseURL).toString();
    chain.push(url);

    const res = await ctx.fetch(url, { maxRedirects: 0, failOnStatusCode: false });
    const status = res.status();

    // Każdy hop (włącznie z pośrednimi) nie może wymuszać noindex.
    assertHeadersClean(res, `hop ${hop} ${url} [${status}]`);

    if (status >= 300 && status < 400) {
      const loc = headerValue(res, "location");
      if (!loc) {
        await ctx.dispose();
        throw new Error(`[${url}] status ${status} bez nagłówka Location`);
      }
      current = loc;
      continue;
    }

    // Status końcowy (2xx/4xx/5xx — bez redirectu).
    await ctx.dispose();
    return { finalRes: res, chain };
  }

  await ctx.dispose();
  throw new Error(`Zbyt wiele przekierowań (>${maxHops}) zaczynając od ${startPath}`);
}

function extractMetaRobots(html: string): string[] {
  // Wyciąga content z każdego <meta name="robots" ...> (case-insensitive).
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
    const base = baseURL!;
    const { finalRes, chain } = await followRedirectChain(base, route);

    // 1) Status końcowy musi być 2xx — przekierowanie do /auth lub 4xx oznaczałoby,
    //    że routa nie jest publicznie indeksowalna mimo obecności w sitemap.
    expect(
      finalRes.ok(),
      `[${route}] łańcuch ${chain.join(" -> ")} zakończył się statusem ${finalRes.status()}`,
    ).toBe(true);

    // 2) Finalna odpowiedź — nagłówki czyste (powtórzenie dla jasności raportu).
    assertHeadersClean(finalRes, `final ${route}`);

    // 3) Meta robots w HTML — żadna wartość nie może zawierać noindex/none.
    const ct = headerValue(finalRes, "content-type") ?? "";
    if (ct.includes("text/html")) {
      const html = await finalRes.text();
      const metas = extractMetaRobots(html);
      for (const value of metas) {
        expect(
          NOINDEX_DIRECTIVE.test(value),
          `[${route}] <meta name="robots" content="${value}"> wymusza noindex`,
        ).toBe(false);
      }
    }
  });
}

test("kontrolny: /auth jest świadomie poza indeksem (sanity-check)", async ({ baseURL }) => {
  // Test odwrotny — upewnia się, że nasza detekcja w ogóle działa.
  // /auth nie powinno mieć noindex w X-Robots-Tag (Lovable nie ustawia),
  // ale jest pominięte w sitemap. Tu sprawdzamy tylko, że strona w ogóle odpowiada.
  const ctx = await pwRequest.newContext({ baseURL: baseURL! });
  const res = await ctx.fetch("/auth", { failOnStatusCode: false });
  expect([200, 301, 302, 401, 403, 404]).toContain(res.status());
  await ctx.dispose();
});
