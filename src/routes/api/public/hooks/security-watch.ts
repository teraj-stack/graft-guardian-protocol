import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";

type Findings = {
  tables_without_rls: string[];
  tables_rls_no_policy: string[];
  extensions_in_public: string[];
  checked_at: string;
};

const SLACK_GATEWAY = "https://connector-gateway.lovable.dev/slack/api";

function diff(curr: string[], prev: string[]): string[] {
  const prevSet = new Set(prev);
  return curr.filter((x) => !prevSet.has(x));
}

async function postSlack(text: string, blocks?: unknown[]) {
  const channel = process.env.SLACK_ALERT_CHANNEL;
  const lovableKey = process.env.LOVABLE_API_KEY;
  const slackKey = process.env.SLACK_API_KEY;
  if (!channel || !lovableKey || !slackKey) {
    console.warn("[security-watch] Slack not configured", {
      channel: !!channel,
      lovableKey: !!lovableKey,
      slackKey: !!slackKey,
    });
    return { ok: false, skipped: true };
  }
  const res = await fetch(`${SLACK_GATEWAY}/chat.postMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": slackKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, text, blocks }),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok && (body as { ok?: boolean }).ok, body };
}

export const Route = createFileRoute("/api/public/hooks/security-watch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = request.headers.get("x-cron-secret");
        const expected = process.env.CRON_SECRET;
        if (!expected || !cronSecret || cronSecret !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // 1. Run SQL audit
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
          "security_watch_check" as never
        );
        if (rpcError) {
          console.error("[security-watch] rpc error", rpcError);
          return Response.json(
            { success: false, error: rpcError.message },
            { status: 500 }
          );
        }
        const findings = rpcData as unknown as Findings;

        // 2. Env-level checks
        const envIssues: string[] = [];
        if (!process.env.CRON_SECRET) envIssues.push("CRON_SECRET missing");
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
          envIssues.push("SUPABASE_SERVICE_ROLE_KEY missing");

        const fullFindings = { ...findings, env_issues: envIssues };

        // 3. Fingerprint (excluding checked_at)
        const fpInput = JSON.stringify({
          a: findings.tables_without_rls,
          b: findings.tables_rls_no_policy,
          c: findings.extensions_in_public,
          d: envIssues,
        });
        const fingerprint = createHash("sha256").update(fpInput).digest("hex");

        // 4. Load previous snapshot
        const { data: prev } = await supabaseAdmin
          .from("security_watch_snapshots" as never)
          .select("findings,fingerprint")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const prevFindings = (prev?.findings ?? null) as Findings & {
          env_issues?: string[];
        } | null;
        const changed = !prev || prev.fingerprint !== fingerprint;

        // 5. Compute regressions (new items compared to previous)
        const regressions = {
          tables_without_rls: prevFindings
            ? diff(findings.tables_without_rls, prevFindings.tables_without_rls)
            : findings.tables_without_rls,
          tables_rls_no_policy: prevFindings
            ? diff(
                findings.tables_rls_no_policy,
                prevFindings.tables_rls_no_policy
              )
            : findings.tables_rls_no_policy,
          extensions_in_public: prevFindings
            ? diff(
                findings.extensions_in_public,
                prevFindings.extensions_in_public
              )
            : findings.extensions_in_public,
          env_issues: prevFindings
            ? diff(envIssues, prevFindings.env_issues ?? [])
            : envIssues,
        };

        const hasRegression =
          regressions.tables_without_rls.length > 0 ||
          regressions.tables_rls_no_policy.length > 0 ||
          regressions.extensions_in_public.length > 0 ||
          regressions.env_issues.length > 0;

        // 6. Alert
        let slackResult: unknown = { skipped: true };
        if (hasRegression) {
          const lines: string[] = [
            ":rotating_light: *Security regression detected*",
          ];
          if (regressions.tables_without_rls.length)
            lines.push(
              `• Tables without RLS: ${regressions.tables_without_rls.join(", ")}`
            );
          if (regressions.tables_rls_no_policy.length)
            lines.push(
              `• Tables with RLS but no policy: ${regressions.tables_rls_no_policy.join(", ")}`
            );
          if (regressions.extensions_in_public.length)
            lines.push(
              `• Extensions in public schema: ${regressions.extensions_in_public.join(", ")}`
            );
          if (regressions.env_issues.length)
            lines.push(`• Env: ${regressions.env_issues.join(", ")}`);
          slackResult = await postSlack(lines.join("\n"));
        }

        // 7. Persist snapshot if changed (keep history compact)
        if (changed) {
          await supabaseAdmin
            .from("security_watch_snapshots" as never)
            .insert({ findings: fullFindings, fingerprint });
        }

        return Response.json({
          success: true,
          changed,
          regression: hasRegression,
          findings: fullFindings,
          regressions,
          slack: slackResult,
        });
      },
    },
  },
});
