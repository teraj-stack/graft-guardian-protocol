import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export interface EbookPhraseHit {
  chapterId: string;
  slug: string;
  title: string;
  line: number;
  column: number;
  snippet: string;
}

/**
 * Scans ebook_chapters.body_md for an exact (case-insensitive) phrase.
 * Admin-only — requires an authenticated Supabase session.
 */
export const scanEbookForPhrase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ phrase: z.string().min(2).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("ebook_chapters")
      .select("id, slug, title, body_md")
      .order("order_idx", { ascending: true });
    if (error) {
      console.error("[phrase-audit] ebook query", error);
      return { hits: [] as EbookPhraseHit[], totalChapters: 0 };
    }

    const needle = data.phrase.toLowerCase();
    const hits: EbookPhraseHit[] = [];
    for (const row of rows ?? []) {
      const body = String(row.body_md ?? "");
      const lines = body.split("\n");
      lines.forEach((line, i) => {
        const idx = line.toLowerCase().indexOf(needle);
        if (idx >= 0) {
          hits.push({
            chapterId: row.id,
            slug: row.slug,
            title: row.title,
            line: i + 1,
            column: idx + 1,
            snippet: line.trim().slice(0, 280),
          });
        }
      });
    }
    return { hits, totalChapters: rows?.length ?? 0 };
  });
