import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const tokenSchema = z.string().uuid();

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const Route = createFileRoute("/api/public/reminders/unsubscribe")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders() }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tokenRaw = url.searchParams.get("token") ?? "";
        const parsed = tokenSchema.safeParse(tokenRaw);
        if (!parsed.success) {
          return Response.json(
            { ok: false, status: "invalid_token" },
            { status: 400, headers: corsHeaders() }
          );
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("reminder_subscriptions")
          .select("id, active, email")
          .eq("unsubscribe_token", parsed.data)
          .maybeSingle();
        if (error) {
          return Response.json(
            { ok: false, status: "error" },
            { status: 500, headers: corsHeaders() }
          );
        }
        if (!data) {
          return Response.json(
            { ok: false, status: "not_found" },
            { status: 404, headers: corsHeaders() }
          );
        }
        return Response.json(
          {
            ok: true,
            status: data.active ? "active" : "already_unsubscribed",
            emailHint: maskEmail(data.email),
          },
          { headers: corsHeaders() }
        );
      },
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { ok: false, status: "invalid_json" },
            { status: 400, headers: corsHeaders() }
          );
        }
        const tokenRaw =
          typeof body === "object" && body !== null && "token" in body
            ? String((body as { token: unknown }).token ?? "")
            : "";
        const parsed = tokenSchema.safeParse(tokenRaw);
        if (!parsed.success) {
          return Response.json(
            { ok: false, status: "invalid_token" },
            { status: 400, headers: corsHeaders() }
          );
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("reminder_subscriptions")
          .update({ active: false })
          .eq("unsubscribe_token", parsed.data)
          .select("id")
          .maybeSingle();
        if (error) {
          return Response.json(
            { ok: false, status: "error", message: error.message },
            { status: 500, headers: corsHeaders() }
          );
        }
        if (!data) {
          return Response.json(
            { ok: false, status: "not_found" },
            { status: 404, headers: corsHeaders() }
          );
        }
        return Response.json({ ok: true, status: "unsubscribed" }, { headers: corsHeaders() });
      },
    },
  },
});

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const head = user.length <= 2 ? user[0] : user.slice(0, 2);
  return `${head}***@${domain}`;
}
