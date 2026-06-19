// Pure scheduling helpers for the reminders dispatcher.
// Kept dependency-free so they can be unit-tested without DB/network.

export function daysBetween(today: Date, surgery: string): number {
  const s = new Date(surgery + "T00:00:00Z");
  const t = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  return Math.floor((t.getTime() - s.getTime()) / 86_400_000);
}

// Return every week (1..12) whose trigger day (7*N) has already passed.
// Catch-up: if cron missed day 7N, week N still fires the first time we run
// after that day. The reminder_sends idempotency check prevents double sends.
export function dueWeeksForDay(day: number): number[] {
  if (day < 7) return [];
  const maxWeek = Math.min(12, Math.floor(day / 7));
  const weeks: number[] = [];
  for (let w = 1; w <= maxWeek; w++) weeks.push(w);
  return weeks;
}

// Compute which (subscription, week) pairs a dispatcher run should send,
// given the set of already-sent (subscription_id:week) keys. Pure function:
// no DB, no clock side effects — the caller passes `now` and the sent set.
export interface ScheduleSubscription {
  id: string;
  surgery_date: string;
  selected_weeks: number[];
}

export interface DueItem {
  subscriptionId: string;
  week: number;
}

export function computeDueItems(
  now: Date,
  subscriptions: ScheduleSubscription[],
  alreadySentWeekKeys: Set<string>
): DueItem[] {
  const out: DueItem[] = [];
  for (const sub of subscriptions) {
    const day = daysBetween(now, sub.surgery_date);
    const due = dueWeeksForDay(day).filter((w) =>
      sub.selected_weeks.includes(w)
    );
    for (const week of due) {
      if (alreadySentWeekKeys.has(`${sub.id}:${week}`)) continue;
      out.push({ subscriptionId: sub.id, week });
    }
  }
  return out;
}
