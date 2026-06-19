import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  sid: z.string().min(1).max(64),
  metric: z.enum(["CLS", "LCP", "INP", "FCP", "TTFB"]),
  value: z.number().finite().min(0).max(120_000),
  rating: z.enum(["good", "needs-improvement", "poor"]).nullable().optional(),
  id: z.string().max(128).optional(),
  navType: z.string().max(32).nullable().optional(),
  page: z.string().max(512),
  device: z.enum(["mobile", "tablet", "desktop"]),
  connection: z.string().max(32).nullable().optional(),
  ua: z.string().max(255).optional(),
});

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } as Record<string, string>;
}

export const Route = createFileRoute("/api/public/vitals")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors() }),
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return new Response("bad json", { status: 400, headers: cors() });
        }
        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
          return new Response("invalid", { status: 400, headers: cors() });
        }
        const d = parsed.data;
        const country =
          request.headers.get("cf-ipcountry") ??
          request.headers.get("x-vercel-ip-country") ??
          null;
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          await supabaseAdmin.from("web_vitals").insert({
            session_id: d.sid,
            metric: d.metric,
            value: d.value,
            rating: d.rating ?? null,
            metric_id: d.id ?? null,
            nav_type: d.navType ?? null,
            page: d.page,
            device: d.device,
            connection: d.connection ?? null,
            country,
            user_agent: d.ua ?? null,
          });
        } catch (e) {
          // Never fail beacons loudly.
          console.error("[vitals] insert failed", e);
        }
        return new Response(null, { status: 204, headers: cors() });
      },
    },
  },
});
