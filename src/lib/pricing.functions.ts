import { createServerFn } from "@tanstack/react-start";

export interface PricingOverride {
  code: string;
  hidden: boolean;
  restore_at: string | null;
}

export const getPricingOverrides = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Auto-restore anything whose restore date has passed
    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("pricing_overrides")
      .update({ hidden: false })
      .lte("restore_at", nowIso);

    if (updateError) {
      console.error("[pricing-overrides] auto-restore error", updateError);
    }

    const { data, error } = await supabaseAdmin
      .from("pricing_overrides")
      .select("code, hidden, restore_at");

    if (error) {
      console.error("[pricing-overrides] select error", error);
      return [] as PricingOverride[];
    }

    return (data ?? []) as PricingOverride[];
  }
);
