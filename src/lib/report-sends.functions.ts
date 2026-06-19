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

/** Zespół (admin): pełna lista ostatnich wysyłek z opcjonalnym filtrem statusu / e-maila / zakresu dat. */
export const getAllReportSends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; email?: string; from?: string; to?: string }) =>
    z
      .object({
        status: z.string().optional(),
        email: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
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
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as ReportSendRow[];
  });

/** Zespół (admin): eksport CSV historii wysyłek (status + zakres dat + e-mail). Limit 10 000 wierszy. */
export const exportReportSendsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; email?: string; from?: string; to?: string }) =>
    z
      .object({
        status: z.string().optional(),
        email: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ filename: string; csv: string; count: number }> => {
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
      .limit(10000);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.email) q = q.ilike("recipient_email", `%${data.email}%`);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const headers = [
      "id",
      "recipient_email",
      "week",
      "status",
      "template_version",
      "document_hash",
      "provider_message_id",
      "error",
      "created_at",
      "sent_at",
      "delivered_at",
      "opened_at",
      "confirmed_at",
    ];
    const esc = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(",")];
    for (const r of (rows ?? []) as ReportSendRow[]) {
      lines.push(
        [
          r.id,
          r.recipient_email,
          r.week,
          r.status,
          r.template_version,
          r.document_hash,
          r.provider_message_id,
          r.error,
          r.created_at,
          r.sent_at,
          r.delivered_at,
          r.opened_at,
          r.confirmed_at,
        ]
          .map(esc)
          .join(","),
      );
    }
    const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return { filename: `report-sends_${stamp}.csv`, csv, count: rows?.length ?? 0 };
  });

/** Zespół (admin): eksport XLSX historii wysyłek. Zwraca base64. Limit 10 000 wierszy. */
export const exportReportSendsXlsx = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; email?: string; from?: string; to?: string }) =>
    z
      .object({
        status: z.string().optional(),
        email: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ filename: string; base64: string; count: number }> => {
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
      .limit(10000);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.email) q = q.ilike("recipient_email", `%${data.email}%`);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const XLSX = await import("xlsx");
    const headers = [
      "id",
      "recipient_email",
      "week",
      "status",
      "template_version",
      "document_hash",
      "provider_message_id",
      "error",
      "created_at",
      "sent_at",
      "delivered_at",
      "opened_at",
      "confirmed_at",
    ];
    const aoa: unknown[][] = [headers];
    for (const r of (rows ?? []) as ReportSendRow[]) {
      aoa.push([
        r.id,
        r.recipient_email,
        r.week,
        r.status,
        r.template_version,
        r.document_hash,
        r.provider_message_id,
        r.error,
        r.created_at,
        r.sent_at,
        r.delivered_at,
        r.opened_at,
        r.confirmed_at,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(12, h.length + 2) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Wysyłki raportów");
    const buf = XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return { filename: `report-sends_${stamp}.xlsx`, base64: buf, count: rows?.length ?? 0 };
  });
