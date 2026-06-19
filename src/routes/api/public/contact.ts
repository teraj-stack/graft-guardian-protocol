import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Imię jest za krótkie").max(100),
  email: z.string().trim().email("Nieprawidłowy adres e-mail").max(255),
  message: z.string().trim().min(10, "Wiadomość jest za krótka").max(2000),
  consent: z.literal(true, { message: "Zgoda jest wymagana" }),
  // Honeypot — must remain empty
  website: z.string().max(0).optional().default(""),
});

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const Route = createFileRoute("/api/public/contact")({
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
        const parsed = contactSchema.safeParse(payload);
        if (!parsed.success) {
          return Response.json(
            { error: "validation_failed", details: parsed.error.flatten() },
            { status: 400, headers: corsHeaders() }
          );
        }
        const { name, email, message, website } = parsed.data;
        // Honeypot tripped → silently accept
        if (website && website.length > 0) {
          return Response.json({ ok: true }, { headers: corsHeaders() });
        }

        const receivedAt = new Date().toISOString();
        console.log("[contact] new message", {
          receivedAt,
          name,
          email,
          messageLength: message.length,
        });

        // Fire-and-await clinic notification, but don't block patient on provider errors.
        try {
          const { notifyClinicOfContact } = await import(
            "@/lib/contact-notify.server"
          );
          const result = await notifyClinicOfContact({
            name,
            email,
            message,
            receivedAt,
          });
          if (result.status !== "sent") {
            console.warn("[contact] clinic notification not sent", result);
          }
        } catch (e) {
          console.error("[contact] notify exception", (e as Error).message);
        }

        return Response.json(
          { ok: true, receivedAt },
          { status: 200, headers: corsHeaders() }
        );

      },
    },
  },
});
