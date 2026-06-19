// Integration test for the reminders dispatcher catch-up path.
//
// Drives runDispatch against the real Supabase database using the
// service-role key, exercising real reminder_subscriptions and
// reminder_sends rows. Skips automatically when the server-side Supabase
// env vars are not present (e.g. plain `vitest run` in a dev sandbox
// without secrets), so the unit-test suite stays green.
//
// What we verify end-to-end against the DB:
//   1. A subscription whose cron was silent for 30 days gets exactly
//      one reminder_sends row per missed selected week on the next run
//      (catch-up).
//   2. Re-running the dispatcher on the same simulated day inserts
//      zero additional rows (idempotency via the (sub, week, channel)
//      key already in reminder_sends).
//   3. Pre-existing reminder_sends rows are honored — a week already
//      logged before the dispatcher runs is never re-sent.
//
// Cleanup uses the same service-role client and runs in a finally
// block so the DB is left exactly as we found it even on failure.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runDispatch, type ReminderSenders } from "./dispatcher.server";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

// Mock senders: never touch network. Return "sent" so the dispatcher
// still records a real reminder_sends row, which is what we want to assert.
const noopSenders: ReminderSenders = {
  sendEmailReminder: async () => ({ status: "sent", providerMessageId: "test-email" }),
  sendSmsReminder: async () => ({ status: "sent", providerMessageId: "test-sms" }),
};

function daysAgoIso(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

describe.skipIf(!hasEnv)("reminders dispatcher (DB integration)", () => {
  let supabase: SupabaseClient<any>;
  const createdSubIds: string[] = [];
  const testRunTag = `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
  });

  afterAll(async () => {
    if (createdSubIds.length === 0) return;
    // FK from reminder_sends.subscription_id → reminder_subscriptions.id has
    // ON DELETE CASCADE in production, but be defensive: clear sends first.
    await supabase.from("reminder_sends").delete().in("subscription_id", createdSubIds);
    await supabase.from("reminder_subscriptions").delete().in("id", createdSubIds);
  });

  async function createSubscription(opts: {
    surgeryDaysAgo: number;
    selectedWeeks: number[];
    email: boolean;
    sms?: boolean;
    phone?: string | null;
  }): Promise<string> {
    const email = `${testRunTag}+${createdSubIds.length}@graftgen.test`;
    const { data, error } = await supabase
      .from("reminder_subscriptions")
      .insert({
        email,
        phone: opts.phone ?? null,
        surgery_date: daysAgoIso(opts.surgeryDaysAgo),
        channel_email: opts.email,
        channel_sms: opts.sms ?? false,
        selected_weeks: opts.selectedWeeks,
        active: true,
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    createdSubIds.push(data!.id as string);
    return data!.id as string;
  }

  async function loadSends(subId: string) {
    const { data, error } = await supabase
      .from("reminder_sends")
      .select("week, channel, status")
      .eq("subscription_id", subId)
      .order("week", { ascending: true });
    expect(error).toBeNull();
    return (data ?? []) as Array<{ week: number; channel: string; status: string }>;
  }

  it("catch-up: delayed cron sends every missed selected week exactly once", async () => {
    // Surgery 30 days ago, selected [1,2,4,8,12]. Day 30 → weeks 1..4 passed,
    // intersect selected → [1, 2, 4]. Email only.
    const subId = await createSubscription({
      surgeryDaysAgo: 30,
      selectedWeeks: [1, 2, 4, 8, 12],
      email: true,
    });
    const now = new Date();

    const firstRun = await runDispatch({
      supabase,
      now,
      senders: noopSenders,
      onlySubscriptionId: subId,
    });
    expect(firstRun.ok).toBe(true);
    expect(firstRun.inserted).toBe(3);
    expect(firstRun.sent).toBe(3);

    const afterFirst = await loadSends(subId);
    expect(afterFirst.map((r) => r.week)).toEqual([1, 2, 4]);
    expect(afterFirst.every((r) => r.channel === "email")).toBe(true);
    expect(afterFirst.every((r) => r.status === "sent")).toBe(true);

    // Second run on the same simulated day: idempotent, zero new rows.
    const secondRun = await runDispatch({
      supabase,
      now,
      senders: noopSenders,
      onlySubscriptionId: subId,
    });
    expect(secondRun.ok).toBe(true);
    expect(secondRun.inserted).toBe(0);
    expect(secondRun.sent).toBe(0);
    expect(secondRun.processed).toBe(0);

    const afterSecond = await loadSends(subId);
    expect(afterSecond).toHaveLength(3);
    expect(afterSecond.map((r) => r.week)).toEqual([1, 2, 4]);
  });

  it("honors pre-existing reminder_sends: a logged week is never re-sent", async () => {
    const subId = await createSubscription({
      surgeryDaysAgo: 30,
      selectedWeeks: [1, 2, 4, 8, 12],
      email: true,
    });
    // Simulate "week 1 was already sent on time by an earlier cron run".
    const { error: preErr } = await supabase.from("reminder_sends").insert({
      subscription_id: subId,
      week: 1,
      channel: "email",
      status: "sent",
      provider_message_id: "pre-existing",
    });
    expect(preErr).toBeNull();

    const result = await runDispatch({
      supabase,
      now: new Date(),
      senders: noopSenders,
      onlySubscriptionId: subId,
    });
    expect(result.ok).toBe(true);
    // Week 1 already there → only 2 and 4 should be inserted now.
    expect(result.inserted).toBe(2);

    const rows = await loadSends(subId);
    // Exactly one row per (sub, week) — no duplicate for week 1.
    expect(rows.map((r) => r.week)).toEqual([1, 2, 4]);
    const week1 = rows.filter((r) => r.week === 1);
    expect(week1).toHaveLength(1);
    expect(week1[0].status).toBe("sent");
  });

  it("does nothing for a subscription that has not yet reached day 7", async () => {
    const subId = await createSubscription({
      surgeryDaysAgo: 3,
      selectedWeeks: [1, 2, 4, 8, 12],
      email: true,
    });
    // surgeryDaysAgo=3 is outside the dispatcher's [latest = now-7d] window,
    // so subs query returns nothing — that itself is a valid "no-op" signal.
    const result = await runDispatch({
      supabase,
      now: new Date(),
      senders: noopSenders,
      onlySubscriptionId: subId,
    });
    expect(result.ok).toBe(true);
    expect(result.inserted).toBe(0);
    expect(await loadSends(subId)).toEqual([]);
  });

  it("atomicity: sender throw mid-batch leaves zero rows in reminder_sends", async () => {
    // Day-30 sub with selected [1,2,4,8,12] → catch-up wants weeks 1, 2, 4.
    // Week 1 succeeds, week 2 throws. Without the abort guarantee, week 1's
    // row would land while week 2+ would not — a partial state. With the
    // guarantee, the whole batch aborts before INSERT and the table is empty.
    const subId = await createSubscription({
      surgeryDaysAgo: 30,
      selectedWeeks: [1, 2, 4, 8, 12],
      email: true,
    });

    const calls: number[] = [];
    const flakySenders: ReminderSenders = {
      sendEmailReminder: async ({ week }) => {
        calls.push(week);
        if (week === 2) throw new Error("simulated SMTP 500");
        return { status: "sent", providerMessageId: `ok-${week}` };
      },
      sendSmsReminder: async () => ({ status: "skipped" }),
    };

    const result = await runDispatch({
      supabase,
      now: new Date(),
      senders: flakySenders,
      onlySubscriptionId: subId,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/simulated SMTP 500/);
    expect(result.inserted).toBe(0);
    // Sender was actually invoked up to the throw — proves the loop ran.
    expect(calls).toEqual([1, 2]);

    // Hard DB check: zero reminder_sends rows for this subscription.
    expect(await loadSends(subId)).toEqual([]);

    // The next dispatcher run with a working sender must still see all
    // three weeks as due (nothing was logged) — the "abort → safe to retry"
    // half of the contract.
    const retry = await runDispatch({
      supabase,
      now: new Date(),
      senders: noopSenders,
      onlySubscriptionId: subId,
    });
    expect(retry.ok).toBe(true);
    expect(retry.inserted).toBe(3);
    expect((await loadSends(subId)).map((r) => r.week)).toEqual([1, 2, 4]);
  });

  it("atomicity: a failed batch INSERT leaves zero rows (single-statement rollback)", async () => {
    // Route reminder_sends INSERTs through a wrapper that returns a DB error,
    // simulating a constraint/permission failure at write time. The dispatcher
    // must surface ok:false and the table must be unchanged (no partial rows).
    const subId = await createSubscription({
      surgeryDaysAgo: 14,
      selectedWeeks: [1, 2],
      email: true,
    });

    const wrapped = new Proxy(supabase, {
      get(target, prop, receiver) {
        if (prop === "from") {
          return (table: string) => {
            const builder = (target as any).from(table);
            if (table !== "reminder_sends") return builder;
            return new Proxy(builder, {
              get(b: any, p: string | symbol) {
                if (p === "insert") {
                  // .insert(...).select(...) is awaited; make the awaited
                  // value resolve to a Supabase-shaped error response.
                  return () => ({
                    select: () => Promise.resolve({
                      data: null,
                      error: { message: "simulated insert failure" },
                    }),
                  });
                }
                return b[p];
              },
            });
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as typeof supabase;

    const result = await runDispatch({
      supabase: wrapped,
      now: new Date(),
      senders: noopSenders,
      onlySubscriptionId: subId,
    });

    expect(result.ok).toBe(false);
    expect(result.inserted).toBe(0);
    expect(result.error).toMatch(/simulated insert failure/);

    // Real DB (via the unwrapped client) shows no rows landed.
    expect(await loadSends(subId)).toEqual([]);
  });

  it("post-failure re-dispatch: no duplicate reminder_sends for the same weeks", async () => {
    // End-to-end retry contract:
    //   run #1 — sender throws on week 2 → atomic abort, zero rows
    //   run #2 — healthy sender → inserts weeks [1, 2, 4] exactly once
    //   run #3 — same day, healthy sender → zero new rows (idempotent)
    // Final state: exactly one reminder_sends row per (sub, week, channel),
    // no duplicates introduced by retrying after a controlled failure.
    const subId = await createSubscription({
      surgeryDaysAgo: 30,
      selectedWeeks: [1, 2, 4, 8, 12],
      email: true,
    });
    const now = new Date();

    const flakySenders: ReminderSenders = {
      sendEmailReminder: async ({ week }) => {
        if (week === 2) throw new Error("controlled SMTP outage");
        return { status: "sent", providerMessageId: `ok-${week}` };
      },
      sendSmsReminder: async () => ({ status: "skipped" }),
    };

    // Run #1: controlled failure mid-batch.
    const failed = await runDispatch({
      supabase,
      now,
      senders: flakySenders,
      onlySubscriptionId: subId,
    });
    expect(failed.ok).toBe(false);
    expect(failed.inserted).toBe(0);
    expect(await loadSends(subId)).toEqual([]);

    // Run #2: recovery — sender healthy, catch-up should land all weeks.
    const recovered = await runDispatch({
      supabase,
      now,
      senders: noopSenders,
      onlySubscriptionId: subId,
    });
    expect(recovered.ok).toBe(true);
    expect(recovered.inserted).toBe(3);

    const afterRecovery = await loadSends(subId);
    expect(afterRecovery.map((r) => r.week)).toEqual([1, 2, 4]);

    // Run #3: immediate re-dispatch on same day — must not duplicate.
    const replay = await runDispatch({
      supabase,
      now,
      senders: noopSenders,
      onlySubscriptionId: subId,
    });
    expect(replay.ok).toBe(true);
    expect(replay.processed).toBe(0);
    expect(replay.inserted).toBe(0);

    // Final hard check: exactly one row per (week, channel) — zero duplicates.
    const finalRows = await loadSends(subId);
    expect(finalRows).toHaveLength(3);
    const keys = finalRows.map((r) => `${r.week}:${r.channel}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.sort()).toEqual(["1:email", "2:email", "4:email"]);
  });
});
