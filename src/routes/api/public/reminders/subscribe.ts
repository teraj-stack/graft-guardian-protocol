import { createFileRoute } from "@tanstack/react-router";
import { subscribeSchema } from "@/lib/reminders/schema";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const Route = createFileRoute("/api/public/reminders/subscribe")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders() }),
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json(
            { error: "invalid_json" },
            { status: 400, headers: corsHeaders() }
          );
        }
        const parsed = subscribeSchema.safeParse(payload);
        if (!parsed.success) {
          return Response.json(
            { error: "validation_failed", details: parsed.error.flatten() },
            { status: 400, headers: corsHeaders() }
          );
        }
        const data = parsed.data;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: row, error } = await supabaseAdmin
          .from("reminder_subscriptions")
          .insert({
            email: data.email,
            phone: data.phone ?? null,
            surgery_date: data.surgeryDate,
            channel_email: data.channelEmail,
            channel_sms: data.channelSms,
            selected_weeks: data.selectedWeeks,
          })
          .select("id, unsubscribe_token")
          .single();
        if (error) {
          console.error("[reminders.subscribe] insert failed", error);
          return Response.json(
            { error: "internal_error" },
            { status: 500, headers: corsHeaders() }
          );
        }
        return Response.json(
          {
            ok: true,
            id: row.id,
            unsubscribeToken: row.unsubscribe_token,
          },
          { status: 201, headers: corsHeaders() }
        );
      },
    },
  },
});
