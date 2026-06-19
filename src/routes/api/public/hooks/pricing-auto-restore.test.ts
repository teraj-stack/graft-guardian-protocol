import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const updateCalls: Array<{ values: unknown; lteCol: string; lteVal: string }> =
  [];
let updateError: { message: string } | null = null;

vi.mock("@/integrations/supabase/client.server", () => {
  return {
    supabaseAdmin: {
      from: (_table: string) => ({
        update: (values: unknown) => ({
          lte: (col: string, val: string) => {
            updateCalls.push({ values, lteCol: col, lteVal: val });
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
