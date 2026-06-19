import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { randomBytes } from "crypto";

const schema = z.object({
  email: z.string().trim().email("Nieprawidłowy adres e-mail").max(255),
  consent: z.literal(true, { message: "Zgoda jest wymagana" }),
  website: z.string().max(0).optional().default(""),
});

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const Route = createFileRoute("/api/public/ebook-request")({
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
        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
          return Response.json(
            { error: "validation_failed", details: parsed.error.flatten() },
            { status: 400, headers: corsHeaders() }
          );
        }
        // Honeypot: silently succeed
        if (parsed.data.website && parsed.data.website.length > 0) {
          return Response.json(
            { ok: true, accessUrl: "/" },
            { headers: corsHeaders() }
          );
        }

        const { email, consent } = parsed.data;
        const ip =
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          null;
        const userAgent = request.headers.get("user-agent") ?? null;
        const accessToken = randomBytes(32).toString("base64url");

        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { error } = await supabaseAdmin.from("ebook_leads").insert({
            email: email.toLowerCase(),
            consent,
            access_token: accessToken,
            ip,
            user_agent: userAgent,
          });
          if (error) {
            console.error("[ebook-request] insert error", error);
            return Response.json(
              { error: "storage_failed" },
              { status: 500, headers: corsHeaders() }
            );
          }
        } catch (e) {
          console.error("[ebook-request] exception", (e as Error).message);
          return Response.json(
            { error: "storage_failed" },
            { status: 500, headers: corsHeaders() }
          );
        }

        return Response.json(
          {
            ok: true,
            accessUrl: `/ebook/${accessToken}`,
          },
          { status: 200, headers: corsHeaders() }
        );
      },
    },
  },
});
