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
        // RFC 8058 one-click: mail providers POST with body
        // "List-Unsubscribe=One-Click" and the token in the URL query.
        // The in-app confirmation page POSTs JSON { token }. Accept both.
        const url = new URL(request.url);
        let tokenRaw = url.searchParams.get("token") ?? "";
        if (!tokenRaw) {
          try {
            const ct = request.headers.get("content-type") ?? "";
            if (ct.includes("application/json")) {
              const body = (await request.json()) as { token?: unknown };
              tokenRaw = String(body?.token ?? "");
            } else {
              const form = await request.formData();
              tokenRaw = String(form.get("token") ?? "");
            }
          } catch {
            /* tokenRaw stays "" — handled by validation below */
          }
        }
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
