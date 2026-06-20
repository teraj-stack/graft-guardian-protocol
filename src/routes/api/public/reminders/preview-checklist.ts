import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { render } from "@react-email/components";
import { z } from "zod";
import { TEMPLATES } from "@/lib/email-templates/registry";

const TEMPLATE_NAME = "reminders-day-0-14";

const schema = z.object({
  surgeryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data w formacie RRRR-MM-DD"),
});

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const Route = createFileRoute("/api/public/reminders/preview-checklist")({
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
        const { surgeryDate } = parsed.data;
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
          typeof tpl.subject === "function"
            ? tpl.subject({ surgeryDate })
            : tpl.subject;
        return Response.json(
          { ok: true, html, text, subject },
          { headers: corsHeaders() },
        );
      },
    },
  },
});
