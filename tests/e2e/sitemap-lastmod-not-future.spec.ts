import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";

/**
 * E2E: weryfikuje, że <lastmod> w sitemap.xml (i sub-sitemapach pod
 * sitemap-index) jest niepusty oraz nie wskazuje daty w przyszłości
 * względem bieżącej daty CI/CD (now()).
 *
 * Tolerancja: 5 minut do przodu — kompensuje drift zegara między
 * runnerem CI a serwerem renderującym sitemap.
 */

const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

interface UrlEntry {
  source: string;
  loc: string | null;
  lastmod: string | null;
}

function detectKind(xml: string): "sitemapindex" | "urlset" | "unknown" {
  if (/<sitemapindex\b/i.test(xml)) return "sitemapindex";
  if (/<urlset\b/i.test(xml)) return "urlset";
  return "unknown";
}

function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m) {
    const self = new RegExp(`<${tag}\\b[^>]*\\/>`, "i");
    return self.test(block) ? "" : null;
  }
  return m[1].trim();
}

function parseUrlBlocks(xml: string, source: string): UrlEntry[] {
  const out: UrlEntry[] = [];
  for (const m of xml.matchAll(/<url\b[\s\S]*?<\/url>/gi)) {
    out.push({
      source,
      loc: extractTag(m[0], "loc"),
      lastmod: extractTag(m[0], "lastmod"),
    });
  }
  return out;
}

interface SitemapEntry {
  loc: string;
  lastmod: string | null;
}

function parseSitemapBlocks(xml: string): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  for (const m of xml.matchAll(/<sitemap\b[\s\S]*?<\/sitemap>/gi)) {
    const loc = extractTag(m[0], "loc");
    if (!loc) continue;
    out.push({ loc, lastmod: extractTag(m[0], "lastmod") });
  }
  return out;
}

async function fetchXml(ctx: APIRequestContext, url: string) {
  const res = await ctx.fetch(url, { failOnStatusCode: false, maxRedirects: 10 });
  return { status: res.status(), body: await res.text() };
}

function parseDate(v: string): number | null {
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

let urlEntries: UrlEntry[];
let sitemapIndexEntries: SitemapEntry[];
let now: number;

test.beforeAll(async ({ baseURL }) => {
  now = Date.now();
  const ctx = await pwRequest.newContext({ baseURL });
  try {
    const root = await fetchXml(ctx, "/sitemap.xml");
    expect(root.status).toBeLessThan(300);
    const kind = detectKind(root.body);
    expect(kind).not.toBe("unknown");

    const collected: UrlEntry[] = [];
    sitemapIndexEntries = [];
    if (kind === "urlset") {
      collected.push(...parseUrlBlocks(root.body, "/sitemap.xml"));
    } else {
      sitemapIndexEntries = parseSitemapBlocks(root.body);
      expect(sitemapIndexEntries.length).toBeGreaterThan(0);
      for (const sub of sitemapIndexEntries) {
        const r = await fetchXml(ctx, sub.loc);
        expect(r.status, `sub-sitemap ${sub.loc}`).toBeLessThan(300);
        expect(detectKind(r.body)).toBe("urlset");
        collected.push(...parseUrlBlocks(r.body, sub.loc));
      }
    }
    expect(collected.length).toBeGreaterThan(0);
    urlEntries = collected;
  } finally {
    await ctx.dispose();
  }
});

test("każdy obecny <lastmod> w <url> jest niepusty", () => {
  const failures: string[] = [];
  for (const e of urlEntries) {
    if (e.lastmod === null) continue; // tag opcjonalny
    if (e.lastmod.trim() === "") {
      failures.push(`[${e.source}] ${e.loc}: pusty <lastmod>`);
    }
  }
  expect(failures, `Puste <lastmod>:\n${failures.join("\n")}`).toEqual([]);
});

test("żaden <lastmod> w <url> nie jest w przyszłości względem now()", () => {
  const cutoff = now + FUTURE_TOLERANCE_MS;
  const nowIso = new Date(now).toISOString();
  const failures: string[] = [];
  for (const e of urlEntries) {
    if (!e.lastmod) continue;
    const t = parseDate(e.lastmod);
    if (t === null) {
      failures.push(`[${e.source}] ${e.loc}: nieparsowalna data <lastmod>${e.lastmod}</lastmod>`);
      continue;
    }
    if (t > cutoff) {
      failures.push(
        `[${e.source}] ${e.loc}: <lastmod>${e.lastmod}</lastmod> w przyszłości (now=${nowIso})`,
      );
    }
  }
  expect(failures, `Daty w przyszłości:\n${failures.join("\n")}`).toEqual([]);
});

test("każdy <lastmod> w sitemap-index jest niepusty i nie w przyszłości", () => {
  if (!sitemapIndexEntries || sitemapIndexEntries.length === 0) {
    test.skip(true, "Nie używamy sitemap-index — test nie ma zastosowania.");
    return;
  }
  const cutoff = now + FUTURE_TOLERANCE_MS;
  const nowIso = new Date(now).toISOString();
  const failures: string[] = [];
  for (const s of sitemapIndexEntries) {
    if (s.lastmod === null) continue;
    if (s.lastmod.trim() === "") {
      failures.push(`sitemap-index ${s.loc}: pusty <lastmod>`);
      continue;
    }
    const t = parseDate(s.lastmod);
    if (t === null) {
      failures.push(`sitemap-index ${s.loc}: nieparsowalna data ${s.lastmod}`);
      continue;
    }
    if (t > cutoff) {
      failures.push(`sitemap-index ${s.loc}: <lastmod>${s.lastmod}</lastmod> w przyszłości (now=${nowIso})`);
    }
  }
  expect(failures, `Sitemap-index <lastmod> problemy:\n${failures.join("\n")}`).toEqual([]);
});

// ---------------- self-testy ----------------

test("self-test: wykrywa datę w przyszłości poza tolerancją", () => {
  const future = Date.now() + 60 * 60 * 1000; // +1h
  const past = Date.now() - 60 * 60 * 1000; // -1h
  expect(future > Date.now() + FUTURE_TOLERANCE_MS).toBe(true);
  expect(past > Date.now() + FUTURE_TOLERANCE_MS).toBe(false);
});

test("self-test: parseDate i extractTag", () => {
  expect(parseDate("2025-06-20")).not.toBeNull();
  expect(parseDate("not-a-date")).toBeNull();
  expect(extractTag("<url><lastmod>2025-06-20</lastmod></url>", "lastmod")).toBe("2025-06-20");
  expect(extractTag("<url><lastmod></lastmod></url>", "lastmod")).toBe("");
  expect(extractTag("<url></url>", "lastmod")).toBeNull();
});
