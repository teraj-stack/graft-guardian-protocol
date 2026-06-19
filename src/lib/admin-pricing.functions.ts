import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminPricingOverride {
  code: string;
  hidden: boolean;
  restore_at: string | null;
  updated_at?: string | null;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const adminListPricingOverrides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("pricing_overrides")
      .select("code, hidden, restore_at, updated_at")
      .order("code");
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminPricingOverride[];
  });

export const adminUpsertPricingOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string; hidden: boolean; restore_at: string | null }) => {
    if (!input || typeof input.code !== "string" || input.code.length === 0) {
      throw new Error("code is required");
    }
    if (typeof input.hidden !== "boolean") throw new Error("hidden must be boolean");
    if (input.hidden) {
      if (!input.restore_at || typeof input.restore_at !== "string") {
        throw new Error("restore_at is required when item is hidden");
      }
      const d = new Date(input.restore_at);
      if (Number.isNaN(d.getTime())) throw new Error("restore_at must be a valid date");
      if (d.getTime() <= Date.now()) throw new Error("restore_at must be in the future");
    }
    if (!input.hidden && input.restore_at !== null && typeof input.restore_at !== "string") {
      throw new Error("restore_at must be ISO string or null");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pricing_overrides")
      .upsert(
        { code: data.code, hidden: data.hidden, restore_at: data.restore_at },
        { onConflict: "code" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeletePricingOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => {
    if (!input?.code) throw new Error("code is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pricing_overrides")
      .delete()
      .eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
