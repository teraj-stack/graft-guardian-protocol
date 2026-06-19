import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/pricing-auto-restore")({
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

        const nowIso = new Date().toISOString();
        const { error } = await supabaseAdmin
          .from("pricing_overrides")
          .update({ hidden: false })
          .lte("restore_at", nowIso);

        if (error) {
          console.error("[pricing-auto-restore] error", error);
          return Response.json(
            { success: false, error: error.message },
            { status: 500 }
          );
        }

        return Response.json({ success: true, restored_at: nowIso });
      },
    },
  },
});
