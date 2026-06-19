import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Row = { metric: string; value: number; device: string; page: string; created_at: string };

function calcPercentile(values: number[], pct: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor(s.length * pct));
  return s[i];
}

function p75(values: number[]): number {
  return calcPercentile(values, 0.75);
}

const TRACKED = ["CLS", "LCP", "INP"] as const;
type TrackedMetric = (typeof TRACKED)[number];

function dayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD UTC
}

function buildSeries(rows: Row[], days: number) {
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  const bucket: Record<string, Record<TrackedMetric, number[]>> = {};
  for (const r of rows) {
    const t = new Date(r.created_at).getTime();
    if (t < cutoff) continue;
    if (!TRACKED.includes(r.metric as TrackedMetric)) continue;
    const d = dayKey(r.created_at);
    const b = (bucket[d] ??= { CLS: [], LCP: [], INP: [] });
    b[r.metric as TrackedMetric].push(r.value);
  }
  // Fill missing days so the line is continuous.
  const series: Array<{ date: string; CLS: number | null; LCP: number | null; INP: number | null; samples: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const b = bucket[d];
    series.push({
      date: d,
      CLS: b && b.CLS.length ? Number(p75(b.CLS).toFixed(3)) : null,
      LCP: b && b.LCP.length ? Math.round(p75(b.LCP)) : null,
      INP: b && b.INP.length ? Math.round(p75(b.INP)) : null,
      samples: b ? b.CLS.length + b.LCP.length + b.INP.length : 0,
    });
  }
  return series;
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
      .select("metric,value,device,page,created_at")
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

    return {
      since,
      total: rows.length,
      summary,
      trend7: buildSeries(rows, 7),
      trend28: buildSeries(rows, 28),
    };
  });

export const exportVitalsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number; metric?: string; device?: string }) =>
    z
      .object({
        days: z.union([z.literal(7), z.literal(28)]).default(7),
        metric: z.enum(["all", "CLS", "LCP", "INP", "FCP", "TTFB"]).default("all"),
        device: z.enum(["all", "mobile", "desktop", "tablet"]).default("all"),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ filename: string; csv: string; count: number }> => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - data.days * 24 * 3600 * 1000).toISOString();
    let q = supabaseAdmin
      .from("web_vitals")
      .select("metric,value,device,page,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50_000);
    if (data.metric !== "all") q = q.eq("metric", data.metric);
    if (data.device !== "all") q = q.eq("device", data.device);
    const { data: rows, error } = await q;
    if (error) throw new Response(error.message, { status: 500 });

    const headers = ["created_at", "metric", "value", "device", "page"];
    const esc = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(",")];
    for (const r of (rows ?? []) as Row[]) {
      lines.push([r.created_at, r.metric, r.value, r.device, r.page].map(esc).join(","));
    }
    const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return {
      filename: `web-vitals_${data.days}d_${data.metric}_${data.device}_${stamp}.csv`,
      csv,
      count: rows?.length ?? 0,
    };
  });
