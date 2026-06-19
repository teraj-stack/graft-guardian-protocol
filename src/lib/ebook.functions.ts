import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export interface EbookChapter {
  id: string;
  slug: string;
  title: string;
  day_label: string;
  day_from: number;
  day_to: number;
  body_md: string;
  order_idx: number;
  published: boolean;
  updated_at: string;
}

/* ---------- Public reads ---------- */

export const getPublishedChapters = createServerFn({ method: "GET" }).handler(
  async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
    const { data, error } = await supabase
      .from("ebook_chapters")
      .select(
        "id, slug, title, day_label, day_from, day_to, body_md, order_idx, published, updated_at"
      )
      .eq("published", true)
      .order("order_idx", { ascending: true });
    if (error) {
      console.error("[ebook] getPublishedChapters error", error);
      return [] as EbookChapter[];
    }
    return (data ?? []) as EbookChapter[];
  }
);

/* ---------- Token-gated access to e-book ---------- */

export const verifyEbookAccess = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) =>
    z.object({ token: z.string().min(20).max(200) }).parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: lead, error } = await supabaseAdmin
      .from("ebook_leads")
      .select("id, created_at")
      .eq("access_token", data.token)
      .maybeSingle();
    if (error || !lead) return { valid: false as const };
    return { valid: true as const, issuedAt: lead.created_at };
  });

/* ---------- Admin: list / upsert / delete chapters ---------- */

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const adminListChapters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("ebook_chapters")
      .select("*")
      .order("order_idx", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as EbookChapter[];
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(200),
  day_label: z.string().min(1).max(60),
  day_from: z.number().int().min(0).max(60),
  day_to: z.number().int().min(0).max(60),
  body_md: z.string().max(20000),
  order_idx: z.number().int().min(0).max(999),
  published: z.boolean(),
});

export const adminUpsertChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("ebook_chapters")
      .upsert(data, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(data)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("ebook_chapters")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
