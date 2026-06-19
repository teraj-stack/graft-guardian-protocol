import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const updateCalls: Array<{ values: unknown; lteCol: string; lteVal: string }> =
  [];
let updateError: { message: string } | null = null;
type Row = { code: string; hidden: boolean; restore_at: string | null };
let simulatedRows: Row[] | null = null;
const tablesTouched: string[] = [];

vi.mock("@/integrations/supabase/client.server", () => {
  return {
    supabaseAdmin: {
      from: (table: string) => ({
        update: (values: Partial<Row>) => ({
          lte: (col: string, val: string) => {
            tablesTouched.push(table);
            updateCalls.push({ values, lteCol: col, lteVal: val });
            // Simulate Postgres atomicity: if the statement errors, NO row
            // mutations are committed. Only apply mutations on success.
            if (simulatedRows && !updateError) {
              const rows: Row[] = simulatedRows;
              for (const row of rows) {
                if (row.restore_at !== null && row.restore_at <= val) {
                  Object.assign(row, values);
                }
              }
            }
            return Promise.resolve({ error: updateError });
          },
        }),
      }),
    },
  };
});


import { Route } from "./pricing-auto-restore";


const handler = (Route.options as any).server.handlers.POST as (ctx: {
  request: Request;
}) => Promise<Response>;

const ENDPOINT = "http://localhost/api/public/hooks/pricing-auto-restore";

describe("POST /api/public/hooks/pricing-auto-restore — auth", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret-value";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("rejects requests without x-cron-secret header (401)", async () => {
    const res = await handler({
      request: new Request(ENDPOINT, { method: "POST" }),
    });
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
  });

  it("rejects requests with an empty x-cron-secret header (401)", async () => {
    const res = await handler({
      request: new Request(ENDPOINT, {
        method: "POST",
        headers: { "x-cron-secret": "" },
      }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects requests with an incorrect x-cron-secret (401)", async () => {
    const res = await handler({
      request: new Request(ENDPOINT, {
        method: "POST",
        headers: { "x-cron-secret": "wrong-secret" },
      }),
    });
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
  });

  it("rejects when CRON_SECRET env is unset, even if header is sent (401)", async () => {
    delete process.env.CRON_SECRET;
    const res = await handler({
      request: new Request(ENDPOINT, {
        method: "POST",
        headers: { "x-cron-secret": "anything" },
      }),
    });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/public/hooks/pricing-auto-restore — happy path", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret-value";
    updateCalls.length = 0;
    updateError = null;
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("returns 200 with success payload when secret matches", async () => {
    const res = await handler({
      request: new Request(ENDPOINT, {
        method: "POST",
        headers: { "x-cron-secret": "test-secret-value" },
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      restored_at: string;
    };
    expect(body.success).toBe(true);
    expect(typeof body.restored_at).toBe("string");
    expect(new Date(body.restored_at).toString()).not.toBe("Invalid Date");
  });

  it("issues UPDATE hidden=false on pricing_overrides for restore_at <= now", async () => {
    const before = new Date().toISOString();
    const res = await handler({
      request: new Request(ENDPOINT, {
        method: "POST",
        headers: { "x-cron-secret": "test-secret-value" },
      }),
    });
    expect(res.status).toBe(200);

    expect(updateCalls).toHaveLength(1);
    const call = updateCalls[0];
    expect(call.values).toEqual({ hidden: false });
    expect(call.lteCol).toBe("restore_at");
    expect(call.lteVal >= before).toBe(true);
    expect(call.lteVal <= new Date().toISOString()).toBe(true);
  });

  it("ignores unrelated body content when secret is valid", async () => {
    const res = await handler({
      request: new Request(ENDPOINT, {
        method: "POST",
        headers: {
          "x-cron-secret": "test-secret-value",
          "content-type": "application/json",
        },
        body: JSON.stringify({ arbitrary: "payload" }),
      }),
    });
    expect(res.status).toBe(200);
    expect(updateCalls).toHaveLength(1);
  });

  it("returns 500 with error message when the DB update fails", async () => {
    updateError = { message: "boom" };
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await handler({
      request: new Request(ENDPOINT, {
        method: "POST",
        headers: { "x-cron-secret": "test-secret-value" },
      }),
    });

    expect(res.status).toBe(500);
    const body = (await res.json()) as { success: boolean; error: string };
    expect(body).toEqual({ success: false, error: "boom" });

    errSpy.mockRestore();
  });
});

describe("POST /api/public/hooks/pricing-auto-restore — idempotency", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret-value";
    updateCalls.length = 0;
    tablesTouched.length = 0;
    updateError = null;
  });

  afterEach(() => {
    simulatedRows = null;
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  const validRequest = () =>
    new Request(ENDPOINT, {
      method: "POST",
      headers: { "x-cron-secret": "test-secret-value" },
    });

  it("does not flip hidden=false for rows whose restore_at is still in the future", async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    simulatedRows = [
      { code: "LADD-THULIUM", hidden: true, restore_at: future },
      { code: "LADD-CAP", hidden: true, restore_at: past },
      { code: "PERMANENT-HIDDEN", hidden: true, restore_at: null },
    ];

    const res = await handler({ request: validRequest() });
    expect(res.status).toBe(200);

    const byCode = Object.fromEntries(simulatedRows.map((r) => [r.code, r]));
    // Future restore_at must remain hidden.
    expect(byCode["LADD-THULIUM"].hidden).toBe(true);
    // Past restore_at must be restored.
    expect(byCode["LADD-CAP"].hidden).toBe(false);
    // restore_at = null must NOT be touched (permanent hide).
    expect(byCode["PERMANENT-HIDDEN"].hidden).toBe(true);

    expect(tablesTouched).toEqual(["pricing_overrides"]);
  });

  it("is idempotent: repeated calls with the same payload leave the final state unchanged", async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    simulatedRows = [
      { code: "LADD-THULIUM", hidden: true, restore_at: future },
      { code: "LADD-CAP", hidden: true, restore_at: past },
      { code: "ALREADY-VISIBLE", hidden: false, restore_at: past },
      { code: "PERMANENT-HIDDEN", hidden: true, restore_at: null },
    ];

    const res1 = await handler({ request: validRequest() });
    expect(res1.status).toBe(200);
    const snapshotAfterFirst = JSON.parse(JSON.stringify(simulatedRows));

    // Second and third calls with the same payload.
    const res2 = await handler({ request: validRequest() });
    expect(res2.status).toBe(200);
    const res3 = await handler({ request: validRequest() });
    expect(res3.status).toBe(200);

    expect(simulatedRows).toEqual(snapshotAfterFirst);

    // Sanity: the expected end state.
    const byCode = Object.fromEntries(simulatedRows.map((r) => [r.code, r]));
    expect(byCode["LADD-THULIUM"].hidden).toBe(true);
    expect(byCode["LADD-CAP"].hidden).toBe(false);
    expect(byCode["ALREADY-VISIBLE"].hidden).toBe(false);
    expect(byCode["PERMANENT-HIDDEN"].hidden).toBe(true);

    // Three calls = three UPDATEs issued, but no extra rows were affected.
    expect(updateCalls).toHaveLength(3);
    for (const call of updateCalls) {
      expect(call.values).toEqual({ hidden: false });
      expect(call.lteCol).toBe("restore_at");
    }
  });
});
