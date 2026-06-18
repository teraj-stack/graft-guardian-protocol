// Server-only: email & SMS senders for reminders.
// Email: Lovable internal mailer via fetch. SMS: Twilio connector gateway.
// Both gracefully degrade if not configured.

import { MATERIALS, materialsForWeek, type Material } from "@/lib/materials";

interface SendResult {
  status: "sent" | "skipped" | "error" | "provider_missing";
  providerMessageId?: string;
  error?: string;
}

function siteOrigin(): string {
  return process.env.PUBLIC_SITE_ORIGIN || "https://graft-guardian-protocol.lovable.app";
}

function buildEmailHtml(args: {
  week: number;
  materials: Material[];
  unsubscribeUrl: string;
  panelUrl: string;
}): string {
  const items = args.materials
    .map(
      (m) => `
      <li style="margin:0 0 18px 0;padding:14px 16px;border:1px solid #e5e1d8;border-radius:4px;">
        <div style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#8a7e6a;margin-bottom:6px;">${m.type} · ${m.minutes} min · ${m.category}</div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;line-height:1.25;color:#1c1a17;margin-bottom:6px;">${m.title}</div>
        <div style="font-size:14px;line-height:1.5;color:#48433a;">${m.description}</div>
      </li>`
    )
    .join("");

  return `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf7f1;font-family:Inter,Arial,sans-serif;color:#1c1a17;">
  <div style="max-width:620px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#8a7e6a;margin-bottom:8px;">Tydzień ${args.week} po zabiegu</div>
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;font-size:32px;line-height:1.15;margin:0 0 18px 0;">Materiały na ten tydzień</h1>
    <p style="font-size:15px;line-height:1.6;color:#48433a;margin:0 0 26px 0;">Poniżej zestaw materiałów dopasowanych do Twojego etapu rekonwalescencji. Wszystkie dostępne także w panelu pacjenta.</p>
    <ul style="list-style:none;margin:0;padding:0;">${items}</ul>
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e1d8;">
      <a href="${args.panelUrl}" style="display:inline-block;background:#1c1a17;color:#faf7f1;text-decoration:none;padding:12px 22px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;">Otwórz panel pacjenta</a>
    </div>
    <p style="margin-top:32px;font-size:11px;line-height:1.6;color:#8a7e6a;">Otrzymujesz tę wiadomość, ponieważ zapisałeś/aś się na automatyczne przypomnienia o materiałach pozabiegowych. <a href="${args.unsubscribeUrl}" style="color:#8a7e6a;">Wypisz się jednym kliknięciem</a>.</p>
  </div>
</body></html>`;
}

function buildSmsText(args: { week: number; count: number; panelUrl: string }): string {
  // Keep under 160 chars where possible.
  return `Tydzień ${args.week} po zabiegu: ${args.count} nowych materiałów w panelu — ${args.panelUrl} Wypisz: odpowiedz STOP`;
}

export async function sendEmailReminder(args: {
  to: string;
  week: number;
  unsubscribeToken: string;
}): Promise<SendResult> {
  const materials = materialsForWeek(args.week);
  if (materials.length === 0) {
    return { status: "skipped", error: "no_materials_for_week" };
  }
  const origin = siteOrigin();
  const panelUrl = `${origin}/panel?week=${args.week}`;
  const unsubscribeUrl = `${origin}/przypomnienia/wypisz?token=${args.unsubscribeToken}`;
  const html = buildEmailHtml({ week: args.week, materials, unsubscribeUrl, panelUrl });
  const subject = `Tydzień ${args.week} po zabiegu — ${materials.length} materiałów dla Ciebie`;

  // Resend connector gateway (uses LOVABLE_API_KEY + RESEND_API_KEY).
  const resendKey = process.env.RESEND_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!resendKey || !lovableKey) {
    return { status: "provider_missing", error: "RESEND_API_KEY_or_LOVABLE_API_KEY_missing" };
  }
  const fromAddress = process.env.REMINDER_FROM_EMAIL || "onboarding@resend.dev";
  try {
    const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: `Klinika Protokół <${fromAddress}>`,
        to: [args.to],
        subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    const text = await resp.text();
    if (!resp.ok) {
      return { status: "error", error: `resend_${resp.status}_${text.slice(0, 200)}` };
    }
    let id: string | undefined;
    try {
      id = (JSON.parse(text) as { id?: string }).id;
    } catch {
      /* ignore parse */
    }
    return { status: "sent", providerMessageId: id };
  } catch (e) {
    return { status: "error", error: `fetch_failed_${(e as Error).message}` };
  }
}

export async function sendSmsReminder(args: {
  to: string;
  week: number;
  unsubscribeToken: string;
}): Promise<SendResult> {
  const materials = materialsForWeek(args.week);
  if (materials.length === 0) {
    return { status: "skipped", error: "no_materials_for_week" };
  }
  const twilioKey = process.env.TWILIO_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!twilioKey || !lovableKey || !fromNumber) {
    return {
      status: "provider_missing",
      error: "TWILIO_API_KEY_or_TWILIO_FROM_NUMBER_missing",
    };
  }
  const origin = siteOrigin();
  const panelUrl = `${origin}/panel?week=${args.week}`;
  const body = buildSmsText({ week: args.week, count: materials.length, panelUrl });
  try {
    const resp = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": twilioKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: args.to, From: fromNumber, Body: body }),
    });
    const text = await resp.text();
    if (!resp.ok) {
      return { status: "error", error: `twilio_${resp.status}_${text.slice(0, 200)}` };
    }
    let sid: string | undefined;
    try {
      sid = (JSON.parse(text) as { sid?: string }).sid;
    } catch {
      /* ignore */
    }
    return { status: "sent", providerMessageId: sid };
  } catch (e) {
    return { status: "error", error: `fetch_failed_${(e as Error).message}` };
  }
}

export const __debug = { MATERIALS };
