import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { render } from "@react-email/components";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "graft-guardian-protocol";
const SENDER_DOMAIN = "notify.graftgen.com";
const FROM_DOMAIN = "graftgen.com";
const TEMPLATE_NAME = "reminders-day-0-14";
const THROTTLE_MINUTES = 5;

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Nieprawidłowy adres e-mail").max(254),
  surgeryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data w formacie RRRR-MM-DD"),
  consent: z.literal(true, { message: "Zgoda jest wymagana" }),
  // Honeypot
  website: z.string().max(0).optional().default(""),
});

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function genToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/public/reminders/send-checklist")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders() }),
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
          console.error("[send-checklist] missing env");
          return Response.json(
            { error: "server_misconfigured" },
            { status: 500, headers: corsHeaders() },
          );
        }

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json(
            { error: "invalid_json" },
            { status: 400, headers: corsHeaders() },
          );
        }
        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
          return Response.json(
            { error: "validation_failed", details: parsed.error.flatten() },
            { status: 400, headers: corsHeaders() },
          );
        }
        const { email, surgeryDate, website } = parsed.data;
        if (website && website.length > 0) {
          return Response.json({ ok: true }, { headers: corsHeaders() });
        }

        const supabase = createClient(supabaseUrl, serviceKey);

        // Suppression check
        const { data: suppressed } = await supabase
          .from("suppressed_emails")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (suppressed) {
          return Response.json(
            { ok: false, reason: "email_suppressed" },
            { headers: corsHeaders() },
          );
        }

        // Rate-limit: max 1 send per email per THROTTLE_MINUTES for this template
        const since = new Date(Date.now() - THROTTLE_MINUTES * 60_000).toISOString();
        const { data: recent } = await supabase
          .from("email_send_log")
          .select("id")
          .eq("recipient_email", email)
          .eq("template_name", TEMPLATE_NAME)
          .gte("created_at", since)
          .limit(1);
        if (recent && recent.length > 0) {
          return Response.json(
            { ok: false, reason: "rate_limited", retryAfterMinutes: THROTTLE_MINUTES },
            { status: 429, headers: corsHeaders() },
          );
        }

        // Unsubscribe token (reuse or create)
        let unsubscribeToken: string;
        const { data: existing } = await supabase
          .from("email_unsubscribe_tokens")
          .select("token, used_at")
          .eq("email", email)
          .maybeSingle();
        if (existing?.token && !existing.used_at) {
          unsubscribeToken = existing.token;
        } else {
          unsubscribeToken = genToken();
          await supabase
            .from("email_unsubscribe_tokens")
            .upsert(
              { token: unsubscribeToken, email },
              { onConflict: "email", ignoreDuplicates: true },
            );
          const { data: stored } = await supabase
            .from("email_unsubscribe_tokens")
            .select("token")
            .eq("email", email)
            .maybeSingle();
          if (stored?.token) unsubscribeToken = stored.token;
        }

        const tpl = TEMPLATES[TEMPLATE_NAME];
        if (!tpl) {
          return Response.json(
            { error: "template_missing" },
            { status: 500, headers: corsHeaders() },
          );
        }
        const element = React.createElement(tpl.component, { surgeryDate });
        const html = await render(element);
        const text = await render(element, { plainText: true });
        const subject =
          typeof tpl.subject === "function" ? tpl.subject({ surgeryDate }) : tpl.subject;

        const messageId = crypto.randomUUID();
        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: TEMPLATE_NAME,
          recipient_email: email,
          status: "pending",
        });

        const { error: enqueueError } = await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: email,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text,
            purpose: "transactional",
            label: TEMPLATE_NAME,
            idempotency_key: `${TEMPLATE_NAME}-${email}-${surgeryDate}-${messageId}`,
            unsubscribe_token: unsubscribeToken,
            queued_at: new Date().toISOString(),
          },
        });

        if (enqueueError) {
          console.error("[send-checklist] enqueue failed", enqueueError);
          await supabase.from("email_send_log").insert({
            message_id: messageId,
            template_name: TEMPLATE_NAME,
            recipient_email: email,
            status: "failed",
            error_message: "enqueue failed",
          });
          return Response.json(
            { error: "enqueue_failed" },
            { status: 500, headers: corsHeaders() },
          );
        }

        return Response.json(
          { ok: true, queued: true },
          { headers: corsHeaders() },
        );
      },
    },
  },
});
