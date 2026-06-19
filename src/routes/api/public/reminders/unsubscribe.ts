import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// 256-bit random token encoded as URL-safe base64 (43 chars, no padding).
// Accept the legacy UUID format too so links already sent keep working until rotation.
const tokenSchema = z
  .string()
  .min(36)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "invalid_token_format");

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

      // GET only confirms whether the token is currently valid.
      // It MUST NOT leak any subscription data (email, phone, surgery date, weeks).
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
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        // Project only the active flag — never select PII through a token-only check.
        const { data, error } = await supabaseAdmin
          .from("reminder_subscriptions")
          .select("active")
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
          { ok: true, status: data.active ? "active" : "already_unsubscribed" },
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
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // Atomically deactivate AND rotate the token so the link cannot be replayed.
        // generate_unsubscribe_token() returns a fresh 256-bit URL-safe base64 string.
        const { data, error } = await supabaseAdmin.rpc(
          "deactivate_and_rotate_subscription",
          { _token: parsed.data }
        );
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
        return Response.json(
          { ok: true, status: "unsubscribed" },
          { headers: corsHeaders() }
        );
      },
    },
  },
});
