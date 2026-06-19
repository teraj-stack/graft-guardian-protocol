// Pure dispatcher core, extracted from the route handler so tests can drive it
// against a real Supabase service-role client without going through HTTP.
//
// Side-effects: reads reminder_subscriptions + reminder_sends, calls injected
// senders, writes reminder_sends. No HTTP, no env reads, no clock side effects.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sendEmailReminder as defaultEmailSender,
  sendSmsReminder as defaultSmsSender,
} from "@/lib/reminders/sender.server";
import { daysBetween, dueWeeksForDay } from "@/lib/reminders/schedule";

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

export interface SendResult {
  status: "sent" | "skipped" | "error" | "provider_missing";
  providerMessageId?: string;
  error?: string;
}

export interface ReminderSenders {
  sendEmailReminder: (args: {
    to: string;
    week: number;
    unsubscribeToken: string;
  }) => Promise<SendResult>;
  sendSmsReminder: (args: {
    to: string;
    week: number;
    unsubscribeToken: string;
  }) => Promise<SendResult>;
}

export interface DispatchInput {
  // A Supabase client with privileges to read subscriptions and write
  // reminder_sends (service role in production, same client in integration tests).
  supabase: SupabaseClient<any>;
  now: Date;
  senders?: ReminderSenders;
  // Optional filter to scope dispatch to a single subscription id — used by
  // integration tests to avoid touching unrelated rows.
  onlySubscriptionId?: string;
}

export interface DispatchResult {
  ok: boolean;
  processed: number;
  sent: number;
  inserted: number;
  error?: string;
}

export async function runDispatch({
  supabase,
  now,
  senders,
  onlySubscriptionId,
}: DispatchInput): Promise<DispatchResult> {
  const send: ReminderSenders = senders ?? {
    sendEmailReminder: defaultEmailSender,
    sendSmsReminder: defaultSmsSender,
  };

  const earliest = new Date(now);
  earliest.setUTCDate(earliest.getUTCDate() - 12 * 7);
  const latest = new Date(now);
  latest.setUTCDate(latest.getUTCDate() - 7);
  const earliestIso = earliest.toISOString().slice(0, 10);
  const latestIso = latest.toISOString().slice(0, 10);

  let subsQuery = supabase
    .from("reminder_subscriptions")
    .select(
      "id, email, phone, surgery_date, channel_email, channel_sms, selected_weeks, unsubscribe_token"
    )
    .eq("active", true)
    .gte("surgery_date", earliestIso)
    .lte("surgery_date", latestIso);
  if (onlySubscriptionId) {
    subsQuery = subsQuery.eq("id", onlySubscriptionId);
  }

  const { data: subs, error: subsErr } = await subsQuery;
  if (subsErr) {
    console.error("[reminders.dispatch] load subs failed", subsErr);
    return { ok: false, processed: 0, sent: 0, inserted: 0, error: subsErr.message };
  }

  const subscriptions = (subs ?? []) as Subscription[];
  if (subscriptions.length === 0) {
    return { ok: true, processed: 0, sent: 0, inserted: 0 };
  }

  const subIds = subscriptions.map((s) => s.id);
  const { data: sent } = await supabase
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
    const dueWeeks = dueWeeksForDay(day).filter((w) =>
      sub.selected_weeks.includes(w)
    );
    if (dueWeeks.length === 0) continue;

    for (const week of dueWeeks) {
      const channels: Array<"email" | "sms"> = [];
      if (sub.channel_email) channels.push("email");
      if (sub.channel_sms && sub.phone) channels.push("sms");

      for (const channel of channels) {
        const key = `${sub.id}:${week}:${channel}`;
        if (sentKeys.has(key)) continue;
        processed += 1;
        const result =
          channel === "email"
            ? await send.sendEmailReminder({
                to: sub.email,
                week,
                unsubscribeToken: sub.unsubscribe_token,
              })
            : await send.sendSmsReminder({
                to: sub.phone!,
                week,
                unsubscribeToken: sub.unsubscribe_token,
              });
        if (result.status === "sent") sentCount += 1;
        // Reserve the (sub,week,channel) slot immediately so a duplicate
        // due-week in the same run can't double-send.
        sentKeys.add(key);
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
  }

  let inserted = 0;
  if (logRows.length > 0) {
    const { error: logErr, data: insertedRows } = await supabase
      .from("reminder_sends")
      .insert(logRows)
      .select("id");
    if (logErr) {
      console.error("[reminders.dispatch] log insert failed", logErr);
      return {
        ok: false,
        processed,
        sent: sentCount,
        inserted: 0,
        error: logErr.message,
      };
    }
    inserted = (insertedRows ?? []).length;
  }

  return { ok: true, processed, sent: sentCount, inserted };
}
