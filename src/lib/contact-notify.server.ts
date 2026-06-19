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
  attempts?: number;
  to?: string;
}


export const CONTACT_TOPICS = {
  konsultacja: {
    label: "Konsultacja",
    envKey: "CONTACT_NOTIFY_TO_KONSULTACJA",
  },
  zabieg: {
    label: "Zabieg",
    envKey: "CONTACT_NOTIFY_TO_ZABIEG",
  },
  ladd_prp: {
    label: "LADD / PRP + minoksydyl",
    envKey: "CONTACT_NOTIFY_TO_LADD",
  },
  inne: {
    label: "Inne",
    envKey: "CONTACT_NOTIFY_TO_INNE",
  },
} as const;

export type ContactTopic = keyof typeof CONTACT_TOPICS;

function resolveRecipients(topic: ContactTopic | undefined): string[] {
  const fallback = process.env.CONTACT_NOTIFY_TO || "kontakt@bujokmedical.pl";
  const topicEnv = topic ? process.env[CONTACT_TOPICS[topic].envKey] : undefined;
  const raw = (topicEnv && topicEnv.trim().length > 0) ? topicEnv : fallback;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function notifyClinicOfContact(args: {
  name: string;
  email: string;
  message: string;
  receivedAt: string;
  topic?: ContactTopic;
}): Promise<NotifyResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  const recipients = resolveRecipients(args.topic);
  const topicLabel = args.topic ? CONTACT_TOPICS[args.topic].label : "—";
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

  const subject = `[${topicLabel}] Nowa wiadomość — ${args.name}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0c121b">
      <h2 style="margin:0 0 16px;font-family:'Cormorant Garamond',serif;font-weight:500">Nowa wiadomość z formularza kontaktowego</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#6b7280">Temat</td><td style="padding:6px 0"><strong>${escapeHtml(topicLabel)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Imię</td><td style="padding:6px 0"><strong>${escapeHtml(args.name)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">E-mail</td><td style="padding:6px 0"><a href="mailto:${escapeHtml(args.email)}">${escapeHtml(args.email)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Otrzymano</td><td style="padding:6px 0">${escapeHtml(args.receivedAt)}</td></tr>
      </table>
      <h3 style="margin:20px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280">Wiadomość</h3>
      <div style="white-space:pre-wrap;padding:16px;background:#f7f5f0;border-left:3px solid #c9a876;font-size:15px;line-height:1.55">${escapeHtml(args.message)}</div>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af">Aby odpowiedzieć pacjentowi, kliknij Reply — adres zwrotny jest ustawiony na e-mail pacjenta.</p>
    </div>
  `;
  const text = `Nowa wiadomość z formularza\n\nTemat: ${topicLabel}\nImię: ${args.name}\nE-mail: ${args.email}\nOtrzymano: ${args.receivedAt}\n\n${args.message}`;


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

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

export async function smsNotifyClinicOfContact(args: {
  name: string;
  email: string;
  message: string;
}): Promise<NotifyResult[]> {
  const twilioKey = process.env.TWILIO_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const toRaw = process.env.CONTACT_NOTIFY_SMS_TO || "";
  const recipients = toRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (recipients.length === 0) {
    return [{ status: "skipped", error: "no_recipients" }];
  }
  if (!twilioKey || !lovableKey || !fromNumber) {
    return [
      {
        status: "provider_missing",
        error: "TWILIO_API_KEY_or_TWILIO_FROM_NUMBER_missing",
      },
    ];
  }

  const body = truncate(
    `Nowa wiadomosc (Protokol): ${args.name} <${args.email}> — ${args.message}`,
    320
  );

  const MAX_ATTEMPTS = Number(process.env.SMS_MAX_ATTEMPTS || 3);
  const BASE_DELAY_MS = Number(process.env.SMS_RETRY_BASE_MS || 400);
  const isRetriableStatus = (s: number) => s === 408 || s === 429 || s >= 500;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const sendOne = async (to: string): Promise<NotifyResult> => {
    let lastError = "unknown";
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const resp = await fetch(
          "https://connector-gateway.lovable.dev/twilio/Messages.json",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": twilioKey,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
          }
        );
        const text = await resp.text();
        if (resp.ok) {
          let sid: string | undefined;
          try {
            sid = (JSON.parse(text) as { sid?: string }).sid;
          } catch {
            /* ignore */
          }
          return {
            status: "sent",
            providerMessageId: sid,
            attempts: attempt,
            to,
          };
        }
        lastError = `twilio_${resp.status}_${text.slice(0, 200)}`;
        if (!isRetriableStatus(resp.status) || attempt === MAX_ATTEMPTS) {
          return { status: "error", error: lastError, attempts: attempt, to };
        }
      } catch (e) {
        lastError = `fetch_failed_${(e as Error).message}`;
        if (attempt === MAX_ATTEMPTS) {
          return { status: "error", error: lastError, attempts: attempt, to };
        }
      }
      // Exponential backoff with jitter
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 100;
      await sleep(delay);
    }
    return { status: "error", error: lastError, attempts: MAX_ATTEMPTS, to };
  };

  const results: NotifyResult[] = [];
  for (const to of recipients) {
    results.push(await sendOne(to));
  }
  return results;
}


