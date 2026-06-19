// Cron-triggered dispatcher. Called by pg_cron with a dedicated CRON_SECRET
// in the `x-cron-secret` header. The /api/public/* prefix bypasses edge auth,
// so this server-only secret is the sole gate against public abuse.
// Do NOT fall back to the Supabase anon/publishable key — it ships in the
// client bundle and is therefore not a secret.

import { createFileRoute } from "@tanstack/react-router";
import {
  sendEmailReminder,
  sendSmsReminder,
} from "@/lib/reminders/sender.server";

interface Subscription {
  id: string;
  email: string;
  phone: string | null;
  surgery_date: string;
  channel_email: boolean;
  channel_sms: boolean;
  selected_weeks: number[];
  unsubscribe_token: string;
}

interface AlreadySent {
  subscription_id: string;
  week: number;
  channel: string;
}

function daysBetween(today: Date, surgery: string): number {
  const s = new Date(surgery + "T00:00:00Z");
  const t = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  return Math.floor((t.getTime() - s.getTime()) / 86_400_000);
}

// Map day-since-surgery to the matching week trigger (only the FIRST day of each week sends).
function weekTriggeredOnDay(day: number): number | null {
  if (day < 7 || day > 12 * 7) return null;
  if (day % 7 !== 0) return null;
  return day / 7; // day 7 -> week 1, day 14 -> week 2, …, day 84 -> week 12
}

export const Route = createFileRoute("/api/public/reminders/dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = request.headers.get("x-cron-secret");
        const expected = process.env.CRON_SECRET;
        if (!expected || !cronSecret || cronSecret !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const now = new Date();
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // Pull active subscriptions with surgery_date in the relevant window.
        const earliest = new Date(now);
        earliest.setUTCDate(earliest.getUTCDate() - 12 * 7);
        const latest = new Date(now);
        latest.setUTCDate(latest.getUTCDate() - 7);
        const earliestIso = earliest.toISOString().slice(0, 10);
        const latestIso = latest.toISOString().slice(0, 10);

        const { data: subs, error: subsErr } = await supabaseAdmin
          .from("reminder_subscriptions")
          .select(
            "id, email, phone, surgery_date, channel_email, channel_sms, selected_weeks, unsubscribe_token"
          )
          .eq("active", true)
          .gte("surgery_date", earliestIso)
          .lte("surgery_date", latestIso);

        if (subsErr) {
          console.error("[reminders.dispatch] load subs failed", subsErr);
          return Response.json(
            { ok: false, error: subsErr.message },
            { status: 500 }
          );
        }

        const subscriptions = (subs ?? []) as Subscription[];
        if (subscriptions.length === 0) {
          return Response.json({ ok: true, processed: 0, sent: 0 });
        }

        // Pull already-sent log entries for these subs.
        const subIds = subscriptions.map((s) => s.id);
        const { data: sent } = await supabaseAdmin
          .from("reminder_sends")
          .select("subscription_id, week, channel")
          .in("subscription_id", subIds);
        const sentKeys = new Set(
          ((sent ?? []) as AlreadySent[]).map(
            (r) => `${r.subscription_id}:${r.week}:${r.channel}`
          )
        );

        let processed = 0;
        let sentCount = 0;
        const logRows: Array<{
          subscription_id: string;
          week: number;
          channel: "email" | "sms";
          status: string;
          provider_message_id: string | null;
          error: string | null;
        }> = [];

        for (const sub of subscriptions) {
          const day = daysBetween(now, sub.surgery_date);
          const week = weekTriggeredOnDay(day);
          if (week === null) continue;
          if (!sub.selected_weeks.includes(week)) continue;

          const channels: Array<"email" | "sms"> = [];
          if (sub.channel_email) channels.push("email");
          if (sub.channel_sms && sub.phone) channels.push("sms");

          for (const channel of channels) {
            const key = `${sub.id}:${week}:${channel}`;
            if (sentKeys.has(key)) continue;
            processed += 1;
            const result =
              channel === "email"
                ? await sendEmailReminder({
                    to: sub.email,
                    week,
                    unsubscribeToken: sub.unsubscribe_token,
                  })
                : await sendSmsReminder({
                    to: sub.phone!,
                    week,
                    unsubscribeToken: sub.unsubscribe_token,
                  });
            if (result.status === "sent") sentCount += 1;
            logRows.push({
              subscription_id: sub.id,
              week,
              channel,
              status: result.status,
              provider_message_id: result.providerMessageId ?? null,
              error: result.error ?? null,
            });
          }
        }

        if (logRows.length > 0) {
          const { error: logErr } = await supabaseAdmin
            .from("reminder_sends")
            .insert(logRows);
          if (logErr) {
            console.error("[reminders.dispatch] log insert failed", logErr);
          }
        }

        return Response.json({ ok: true, processed, sent: sentCount });
      },
    },
  },
});
