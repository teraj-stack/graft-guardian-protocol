import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";

/**
 * E2E: weryfikuje, że każdy <url> w sitemap.xml (oraz w sub-sitemapach
 * pod sitemap-index) ma:
 *  - niepusty <loc> będący absolutnym URL-em,
 *  - jeśli zawiera <lastmod> — wartość zgodną z ISO 8601 (W3C Datetime,
 *    akceptowany przez sitemaps.org), niepustą, i parsowalną do Date,
 *  - opcjonalne <changefreq> i <priority> mają wartości z dozwolonych
 *    zakresów (sanity), jeśli występują.
 *
 * Pusta wartość <lastmod></lastmod> lub format niezgodny z ISO 8601 jest
 * traktowany jako błąd — Google odrzuca takie wpisy i ostrzega w GSC.
 *
 * Dozwolone formaty W3C Datetime (sitemaps.org):
 *   YYYY
 *   YYYY-MM
 *   YYYY-MM-DD
 *   YYYY-MM-DDThh:mmTZD
 *   YYYY-MM-DDThh:mm:ssTZD
 *   YYYY-MM-DDThh:mm:ss.sTZD
 * gdzie TZD = "Z" lub ±hh:mm
 */

const ISO8601_RE =
  /^(?:\d{4}(?:-\d{2}(?:-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?)?)?)$/;

const VALID_CHANGEFREQ = new Set([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
]);

interface UrlEntry {
  source: string; // który sitemap
  loc: string | null;
  lastmod: string | null; // null = brak tagu; "" = pusty tag
  changefreq: string | null;
  priority: string | null;
}

function detectKind(xml: string): "sitemapindex" | "urlset" | "unknown" {
  if (/<sitemapindex\b/i.test(xml)) return "sitemapindex";
  if (/<urlset\b/i.test(xml)) return "urlset";
  return "unknown";
}

function extractTag(block: string, tag: string): string | null {
  // Zwraca null gdy taga nie ma, "" gdy tag jest pusty (np. <lastmod></lastmod>).
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m) {
    // sprawdź self-closing <lastmod />
    const self = new RegExp(`<${tag}\\b[^>]*\\/>`, "i");
    return self.test(block) ? "" : null;
  }
  return m[1].trim();
}

function parseUrlBlocks(xml: string, source: string): UrlEntry[] {
  const out: UrlEntry[] = [];
  for (const m of xml.matchAll(/<url\b[\s\S]*?<\/url>/gi)) {
    const block = m[0];
    out.push({
      source,
      loc: extractTag(block, "loc"),
      lastmod: extractTag(block, "lastmod"),
      changefreq: extractTag(block, "changefreq"),
      priority: extractTag(block, "priority"),
    });
  }
  return out;
}

function extractSitemapEntries(xml: string): string[] {
  const out: string[] = [];
  for (const block of xml.matchAll(/<sitemap\b[\s\S]*?<\/sitemap>/gi)) {
    const loc = block[0].match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
    if (loc) out.push(loc.trim());
  }
  return out;
}

async function fetchXml(ctx: APIRequestContext, url: string) {
  const res = await ctx.fetch(url, { failOnStatusCode: false, maxRedirects: 10 });
  return { status: res.status(), body: await res.text() };
}

function isValidIsoLastmod(v: string): boolean {
  if (!ISO8601_RE.test(v)) return false;
  // Daty bez czasu (YYYY, YYYY-MM, YYYY-MM-DD) — Date.parse też je przyjmuje.
  const t = Date.parse(v);
  return Number.isFinite(t);
}

let entries: UrlEntry[];

test.beforeAll(async ({ baseURL }) => {
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const root = await fetchXml(ctx, "/sitemap.xml");
    expect(root.status, `/sitemap.xml status ${root.status}`).toBeLessThan(300);
    const kind = detectKind(root.body);
    expect(kind, "/sitemap.xml: ani <sitemapindex> ani <urlset>").not.toBe("unknown");

    const collected: UrlEntry[] = [];
    if (kind === "urlset") {
      collected.push(...parseUrlBlocks(root.body, "/sitemap.xml"));
    } else {
      const subs = extractSitemapEntries(root.body);
      expect(subs.length, "sitemap-index pusty").toBeGreaterThan(0);
      for (const sub of subs) {
        const r = await fetchXml(ctx, sub);
        expect(r.status, `sub-sitemap ${sub} status ${r.status}`).toBeLessThan(300);
        expect(detectKind(r.body), `${sub} nie jest <urlset>`).toBe("urlset");
        collected.push(...parseUrlBlocks(r.body, sub));
      }
    }
    expect(collected.length, "brak wpisów <url> w sitemap").toBeGreaterThan(0);
    entries = collected;
  } finally {
    await ctx.dispose();
  }
});

test("każdy <url> ma niepusty <loc> jako absolutny URL", () => {
  const failures: string[] = [];
  for (const e of entries) {
    if (e.loc === null) {
      failures.push(`[${e.source}] <url> bez <loc>`);
      continue;
    }
    if (e.loc.trim() === "") {
      failures.push(`[${e.source}] pusty <loc>`);
      continue;
    }
    try {
      const u = new URL(e.loc);
      if (!/^https?:$/.test(u.protocol)) failures.push(`[${e.source}] niepoprawny protokół: ${e.loc}`);
    } catch {
      failures.push(`[${e.source}] <loc> nie jest absolutnym URL-em: ${e.loc}`);
    }
  }
  expect(failures, `Błędne <loc>:\n${failures.join("\n")}`).toEqual([]);
});

test("każdy <lastmod> jest niepusty i zgodny z ISO 8601 (W3C Datetime)", () => {
  const failures: string[] = [];
  for (const e of entries) {
    if (e.lastmod === null) continue; // tag opcjonalny — brak = OK
    if (e.lastmod === "") {
      failures.push(`[${e.source}] ${e.loc}: <lastmod></lastmod> pusty`);
      continue;
    }
    if (!isValidIsoLastmod(e.lastmod)) {
      failures.push(`[${e.source}] ${e.loc}: <lastmod>${e.lastmod}</lastmod> nie jest ISO 8601`);
    }
  }
  expect(failures, `Niepoprawne <lastmod>:\n${failures.join("\n")}`).toEqual([]);
});

test("opcjonalne <changefreq> i <priority> mieszczą się w dozwolonych zakresach", () => {
  const failures: string[] = [];
  for (const e of entries) {
    if (e.changefreq !== null) {
      if (e.changefreq === "" || !VALID_CHANGEFREQ.has(e.changefreq.toLowerCase())) {
        failures.push(`[${e.source}] ${e.loc}: <changefreq>${e.changefreq}</changefreq> nieprawidłowe`);
      }
    }
    if (e.priority !== null) {
      if (e.priority === "") {
        failures.push(`[${e.source}] ${e.loc}: pusty <priority>`);
      } else {
        const n = Number(e.priority);
        if (!Number.isFinite(n) || n < 0 || n > 1) {
          failures.push(`[${e.source}] ${e.loc}: <priority>${e.priority}</priority> poza [0.0, 1.0]`);
        }
      }
    }
  }
  expect(failures, `Niepoprawne changefreq/priority:\n${failures.join("\n")}`).toEqual([]);
});

// ---------------- self-testy ----------------

test("self-test: walidator ISO 8601 lastmod", () => {
  // poprawne
  for (const v of [
    "2025",
    "2025-06",
    "2025-06-20",
    "2025-06-20T12:30Z",
    "2025-06-20T12:30:45Z",
    "2025-06-20T12:30:45.123Z",
    "2025-06-20T12:30:45+02:00",
    "2025-06-20T12:30:45-05:00",
  ]) {
    expect(isValidIsoLastmod(v), `powinno być poprawne: ${v}`).toBe(true);
  }
  // niepoprawne
  for (const v of [
    "",
    "2025/06/20",
    "20-06-2025",
    "2025-6-20",
    "2025-06-20 12:30:45",
    "2025-06-20T12:30:45", // brak TZD
    "yesterday",
  ]) {
    expect(isValidIsoLastmod(v), `powinno być niepoprawne: ${v}`).toBe(false);
  }
});

test("self-test: extractTag rozróżnia brak, pusty i self-closing", () => {
  const blockMissing = `<url><loc>https://x/a</loc></url>`;
  const blockEmpty = `<url><loc>https://x/a</loc><lastmod></lastmod></url>`;
  const blockSelf = `<url><loc>https://x/a</loc><lastmod /></url>`;
  const blockFull = `<url><loc>https://x/a</loc><lastmod>2025-06-20</lastmod></url>`;
  expect(extractTag(blockMissing, "lastmod")).toBeNull();
  expect(extractTag(blockEmpty, "lastmod")).toBe("");
  expect(extractTag(blockSelf, "lastmod")).toBe("");
  expect(extractTag(blockFull, "lastmod")).toBe("2025-06-20");
});
