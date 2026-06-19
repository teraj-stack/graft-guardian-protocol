function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface NotifyResult {
  status: "sent" | "skipped" | "error" | "provider_missing";
  providerMessageId?: string;
  error?: string;
}

export async function notifyClinicOfContact(args: {
  name: string;
  email: string;
  message: string;
  receivedAt: string;
}): Promise<NotifyResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  const toRaw = process.env.CONTACT_NOTIFY_TO || "kontakt@bujokmedical.pl";
  const recipients = toRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (recipients.length === 0) {
    return { status: "skipped", error: "no_recipients" };
  }
  if (!resendKey || !lovableKey) {
    return {
      status: "provider_missing",
      error: "RESEND_API_KEY_or_LOVABLE_API_KEY_missing",
    };
  }
  const fromAddress =
    process.env.REMINDER_FROM_EMAIL || "onboarding@resend.dev";

  const subject = `Nowa wiadomość z formularza — ${args.name}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0c121b">
      <h2 style="margin:0 0 16px;font-family:'Cormorant Garamond',serif;font-weight:500">Nowa wiadomość z formularza kontaktowego</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#6b7280">Imię</td><td style="padding:6px 0"><strong>${escapeHtml(args.name)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">E-mail</td><td style="padding:6px 0"><a href="mailto:${escapeHtml(args.email)}">${escapeHtml(args.email)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Otrzymano</td><td style="padding:6px 0">${escapeHtml(args.receivedAt)}</td></tr>
      </table>
      <h3 style="margin:20px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280">Wiadomość</h3>
      <div style="white-space:pre-wrap;padding:16px;background:#f7f5f0;border-left:3px solid #c9a876;font-size:15px;line-height:1.55">${escapeHtml(args.message)}</div>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af">Aby odpowiedzieć pacjentowi, kliknij Reply — adres zwrotny jest ustawiony na e-mail pacjenta.</p>
    </div>
  `;
  const text = `Nowa wiadomość z formularza\n\nImię: ${args.name}\nE-mail: ${args.email}\nOtrzymano: ${args.receivedAt}\n\n${args.message}`;

  try {
    const resp = await fetch(
      "https://connector-gateway.lovable.dev/resend/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": resendKey,
        },
        body: JSON.stringify({
          from: `Formularz Protokół <${fromAddress}>`,
          to: recipients,
          reply_to: args.email,
          subject,
          html,
          text,
        }),
      }
    );
    const body = await resp.text();
    if (!resp.ok) {
      return {
        status: "error",
        error: `resend_${resp.status}_${body.slice(0, 200)}`,
      };
    }
    let id: string | undefined;
    try {
      id = (JSON.parse(body) as { id?: string }).id;
    } catch {
      /* ignore */
    }
    return { status: "sent", providerMessageId: id };
  } catch (e) {
    return { status: "error", error: `fetch_failed_${(e as Error).message}` };
  }
}
