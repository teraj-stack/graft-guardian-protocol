// Cron-triggered dispatcher. Called by pg_cron with a dedicated CRON_SECRET
// in the `x-cron-secret` header. The /api/public/* prefix bypasses edge auth,
// so this server-only secret is the sole gate against public abuse.
// Do NOT fall back to the Supabase anon/publishable key — it ships in the
// client bundle and is therefore not a secret.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/reminders/dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = request.headers.get("x-cron-secret");
        const expected = process.env.CRON_SECRET;
        if (!expected || !cronSecret || cronSecret !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { runDispatch } = await import("@/lib/reminders/dispatcher.server");

        const result = await runDispatch({
          supabase: supabaseAdmin,
          now: new Date(),
        });
        if (!result.ok) {
          return Response.json(
            { ok: false, error: result.error ?? "dispatch failed" },
            { status: 500 }
          );
        }
        return Response.json({
          ok: true,
          processed: result.processed,
          sent: result.sent,
        });
      },
    },
  },
});
