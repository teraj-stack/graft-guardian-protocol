import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type ReportSendStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "bounced"
  | "rejected"
  | "opened"
  | "confirmed"
  | "failed";

export interface ReportSendRow {
  id: string;
  recipient_email: string;
  week: number;
  template_version: string;
  document_hash: string | null;
  status: ReportSendStatus;
  provider_message_id: string | null;
  error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  confirmed_at: string | null;
  created_at: string;
}

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Pacjent: pobranie własnej historii wysyłek na podstawie tokena subskrypcji. */
export const getMyReportSends = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) =>
    z.object({ token: z.string().min(10).max(200) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ email: string; sends: ReportSendRow[] } | null> => {
    const supabase = adminClient();
    const { data: sub, error: subErr } = await supabase
      .from("reminder_subscriptions")
      .select("id, email")
      .eq("unsubscribe_token", data.token)
      .maybeSingle();
    if (subErr || !sub) return null;

    const { data: sends, error } = await supabase
      .from("report_sends")
      .select(
        "id, recipient_email, week, template_version, document_hash, status, provider_message_id, error, sent_at, delivered_at, opened_at, confirmed_at, created_at",
      )
      .eq("recipient_email", sub.email)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { email: sub.email, sends: (sends ?? []) as ReportSendRow[] };
  });

/** Zespół (admin): pełna lista ostatnich wysyłek z opcjonalnym filtrem statusu / e-maila. */
export const getAllReportSends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; email?: string }) =>
    z
      .object({
        status: z.string().optional(),
        email: z.string().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<ReportSendRow[]> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    let q = context.supabase
      .from("report_sends")
      .select(
        "id, recipient_email, week, template_version, document_hash, status, provider_message_id, error, sent_at, delivered_at, opened_at, confirmed_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.email) q = q.ilike("recipient_email", `%${data.email}%`);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as ReportSendRow[];
  });
