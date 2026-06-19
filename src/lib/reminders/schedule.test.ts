import { describe, expect, it } from "vitest";
import {
  computeDueItems,
  daysBetween,
  dueWeeksForDay,
} from "./schedule";

const SURGERY = "2026-01-01";
// helper: build a Date N days after surgery, in UTC
function dayAfter(n: number): Date {
  return new Date(Date.UTC(2026, 0, 1 + n));
}

describe("daysBetween", () => {
  it("returns 0 on surgery day", () => {
    expect(daysBetween(dayAfter(0), SURGERY)).toBe(0);
  });
  it("returns the integer day delta in UTC", () => {
    expect(daysBetween(dayAfter(7), SURGERY)).toBe(7);
    expect(daysBetween(dayAfter(84), SURGERY)).toBe(84);
  });
  it("ignores intra-day hours (cron firing late in the day)", () => {
    const late = new Date("2026-01-08T23:59:00Z");
    expect(daysBetween(late, SURGERY)).toBe(7);
  });
});

describe("dueWeeksForDay", () => {
  it("emits nothing before day 7", () => {
    expect(dueWeeksForDay(0)).toEqual([]);
    expect(dueWeeksForDay(6)).toEqual([]);
  });
  it("emits week N exactly at day 7N", () => {
    expect(dueWeeksForDay(7)).toEqual([1]);
    expect(dueWeeksForDay(14)).toEqual([1, 2]);
  });
  it("includes every passed week (catch-up after missed runs)", () => {
    // Cron silent from day 7 through day 27, first run on day 28:
    // weeks 1..4 must all become due in a single run.
    expect(dueWeeksForDay(28)).toEqual([1, 2, 3, 4]);
  });
  it("caps at week 12 even far into the future", () => {
    expect(dueWeeksForDay(7 * 50)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });
});

describe("computeDueItems catch-up + idempotency", () => {
  const sub = {
    id: "sub-1",
    surgery_date: SURGERY,
    selected_weeks: [1, 2, 4, 8, 12],
  };

  it("returns no items before the first trigger day", () => {
    expect(computeDueItems(dayAfter(6), [sub], new Set())).toEqual([]);
  });

  it("returns the single due week when cron runs on time at day 7", () => {
    expect(computeDueItems(dayAfter(7), [sub], new Set())).toEqual([
      { subscriptionId: "sub-1", week: 1 },
    ]);
  });

  it("emits every missed selected week when cron is delayed", () => {
    // Cron has not run since surgery, finally runs on day 30.
    // Selected weeks <= 4 (since floor(30/7)=4) → [1, 2, 4].
    expect(computeDueItems(dayAfter(30), [sub], new Set())).toEqual([
      { subscriptionId: "sub-1", week: 1 },
      { subscriptionId: "sub-1", week: 2 },
      { subscriptionId: "sub-1", week: 4 },
    ]);
  });

  it("never re-sends a week that is already logged in reminder_sends", () => {
    // Simulate: week 1 was sent on time. Cron then missed week 2. The
    // following day's run must send week 2 once, and must NOT re-send week 1.
    const sent = new Set(["sub-1:1"]);
    const day15 = computeDueItems(dayAfter(15), [sub], sent);
    expect(day15).toEqual([{ subscriptionId: "sub-1", week: 2 }]);
  });

  it("is idempotent: re-running the same day after persisting sends yields nothing", () => {
    const sent = new Set<string>();
    const first = computeDueItems(dayAfter(30), [sub], sent);
    // Persist what we just "sent".
    for (const item of first) sent.add(`${item.subscriptionId}:${item.week}`);
    const second = computeDueItems(dayAfter(30), [sub], sent);
    expect(second).toEqual([]);
  });

  it("respects selected_weeks (week 3 is never due if not selected, even after catch-up)", () => {
    // day 30 → weeks 1..4 passed, but selected_weeks has no 3.
    const items = computeDueItems(dayAfter(30), [sub], new Set());
    expect(items.map((i) => i.week)).not.toContain(3);
  });

  it("handles multiple subscriptions independently", () => {
    const subA = { id: "a", surgery_date: SURGERY, selected_weeks: [1, 2] };
    const subB = {
      id: "b",
      // surgery 21 days earlier than subA → on dayAfter(7) subB is at day 28
      surgery_date: "2025-12-11",
      selected_weeks: [1, 2, 3, 4],
    };
    const items = computeDueItems(dayAfter(7), [subA, subB], new Set());
    expect(items).toEqual([
      { subscriptionId: "a", week: 1 },
      { subscriptionId: "b", week: 1 },
      { subscriptionId: "b", week: 2 },
      { subscriptionId: "b", week: 3 },
      { subscriptionId: "b", week: 4 },
    ]);
  });

  it("caps catch-up at week 12 for very late surgeries", () => {
    const old = {
      id: "old",
      surgery_date: "2025-01-01", // ~1 year before dayAfter(0)
      selected_weeks: [1, 2, 4, 8, 12],
    };
    const items = computeDueItems(dayAfter(0), [old], new Set());
    expect(items.map((i) => i.week)).toEqual([1, 2, 4, 8, 12]);
  });

  it("regression: cron skipped on day 7 still delivers week 1 on day 8 (catch-up)", () => {
    // Exact regression for the QA finding "A missed scheduler run silently
    // drops that week's reminder forever". Previously the dispatcher only
    // matched when `day % 7 === 0`, so a cron outage on day 7 would skip
    // week 1 permanently. With dueWeeksForDay catch-up, day 8 must still
    // emit week 1 — and only week 1 — because nothing was logged on day 7.
    const sent = new Set<string>(); // empty: cron never ran on day 7

    // Day 7 itself: under healthy scheduling this is when week 1 fires.
    const onTime = computeDueItems(dayAfter(7), [sub], new Set());
    expect(onTime).toEqual([{ subscriptionId: "sub-1", week: 1 }]);

    // Simulate the outage: cron did NOT run on day 7 → nothing persisted.
    // Next run is on day 8, day count has moved past 7. Week 1 must still
    // be due (the modulo-7 gate would have dropped it).
    const dayEight = computeDueItems(dayAfter(8), [sub], sent);
    expect(dayEight).toEqual([{ subscriptionId: "sub-1", week: 1 }]);

    // After persisting the catch-up send, the very next run on day 8
    // (or any later day before day 14) must not re-emit week 1.
    sent.add("sub-1:1");
    expect(computeDueItems(dayAfter(8), [sub], sent)).toEqual([]);
    expect(computeDueItems(dayAfter(13), [sub], sent)).toEqual([]);

    // And week 2 still fires correctly when its own trigger day arrives.
    expect(computeDueItems(dayAfter(14), [sub], sent)).toEqual([
      { subscriptionId: "sub-1", week: 2 },
    ]);
  });

  it("regression: cron silent for 3 weeks delivers weeks 1–3 in one run, then is idempotent", () => {
    // QA finding scenario taken to the limit: scheduler down from day 7
    // through day 21, first successful run on day 22. All three weekly
    // triggers (1, 2, 3) must fire in this single catch-up pass, and any
    // subsequent run on the same or later day (before day 28) must not
    // duplicate them — reminder_sends idempotency in action.
    const triWeekSub = {
      id: "sub-3w",
      surgery_date: SURGERY,
      selected_weeks: [1, 2, 3, 4],
    };
    const sent = new Set<string>(); // cron never ran during the outage

    // Day 22 catch-up: floor(22/7) = 3 → weeks 1, 2, 3 all due at once.
    const catchUp = computeDueItems(dayAfter(22), [triWeekSub], sent);
    expect(catchUp).toEqual([
      { subscriptionId: "sub-3w", week: 1 },
      { subscriptionId: "sub-3w", week: 2 },
      { subscriptionId: "sub-3w", week: 3 },
    ]);

    // Persist the catch-up sends (what dispatcher writes to reminder_sends).
    for (const item of catchUp) sent.add(`${item.subscriptionId}:${item.week}`);

    // Idempotency: re-running on the same day yields nothing — no duplicates.
    expect(computeDueItems(dayAfter(22), [triWeekSub], sent)).toEqual([]);
    // Idempotency holds across the rest of the gap until week 4 day.
    expect(computeDueItems(dayAfter(23), [triWeekSub], sent)).toEqual([]);
    expect(computeDueItems(dayAfter(27), [triWeekSub], sent)).toEqual([]);

    // Week 4 still fires correctly when its own trigger day arrives, and
    // the previously-sent weeks 1–3 are not re-emitted.
    expect(computeDueItems(dayAfter(28), [triWeekSub], sent)).toEqual([
      { subscriptionId: "sub-3w", week: 4 },
    ]);
  });
});
