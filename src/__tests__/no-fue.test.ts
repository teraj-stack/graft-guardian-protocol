import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

describe("terminologia DHI", () => {
  it("nie zawiera wystąpień „FUE" w repo", () => {
    const out = execSync("node scripts/check-no-fue.mjs --json", {
      encoding: "utf8",
    });
    const report = JSON.parse(out);
    expect(report, `Wystąpienia FUE:\n${JSON.stringify(report.hits, null, 2)}`).toMatchObject({ ok: true });
  });
});
