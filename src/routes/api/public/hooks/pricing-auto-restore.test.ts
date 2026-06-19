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
