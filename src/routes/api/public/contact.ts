import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Imię jest za krótkie").max(100),
  email: z.string().trim().email("Nieprawidłowy adres e-mail").max(255),
  topic: z.enum(["konsultacja", "zabieg", "ladd_prp", "inne"], {
    message: "Wybierz temat",
  }),
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
        const { name, email, message, topic, website } = parsed.data;
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

        // Fire-and-await clinic notifications (email + SMS); don't block patient on provider errors.
        let emailResult: { status: string } | undefined;
        let smsResults:
          | { status: string; attempts?: number; to?: string; error?: string }[]
          | undefined;
        try {
          const { notifyClinicOfContact, smsNotifyClinicOfContact } =
            await import("@/lib/contact-notify.server");
          [emailResult, smsResults] = await Promise.all([
            notifyClinicOfContact({ name, email, message, topic, receivedAt }),
            smsNotifyClinicOfContact({ name, email, message, topic }),

          ]);
          if (emailResult.status !== "sent") {
            console.warn("[contact] email notification not sent", emailResult);
          }
          for (const r of smsResults) {
            if (r.status !== "sent") {
              console.warn("[contact] sms notification not sent", r);
            }
          }
        } catch (e) {
          console.error("[contact] notify exception", (e as Error).message);
        }

        return Response.json(
          {
            ok: true,
            receivedAt,
            notifications: {
              email: emailResult?.status ?? "unknown",
              sms:
                smsResults?.map((r) => ({
                  status: r.status,
                  attempts: r.attempts ?? 0,
                })) ?? [],
            },
          },
          { status: 200, headers: corsHeaders() }
        );


      },
    },
  },
});
