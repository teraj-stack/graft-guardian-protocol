import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Row = { metric: string; value: number; device: string; page: string };

function p75(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(s.length * 0.75));
  return s[i];
}

export const getVitalsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const since = new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("web_vitals")
      .select("metric,value,device,page")
      .gte("created_at", since)
      .limit(50_000);
    if (error) throw new Response(error.message, { status: 500 });

    const rows = (data ?? []) as Row[];
    const byMetric: Record<string, { all: number[]; mobile: number[]; desktop: number[] }> = {};
    for (const r of rows) {
      const m = (byMetric[r.metric] ??= { all: [], mobile: [], desktop: [] });
      m.all.push(r.value);
      if (r.device === "mobile") m.mobile.push(r.value);
      if (r.device === "desktop") m.desktop.push(r.value);
    }
    const summary = Object.entries(byMetric).map(([metric, b]) => ({
      metric,
      samples: b.all.length,
      p75_all: p75(b.all),
      p75_mobile: p75(b.mobile),
      p75_desktop: p75(b.desktop),
    }));
    return { since, total: rows.length, summary };
  });
