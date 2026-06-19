import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { getAllReportSends, exportReportSendsCsv, exportReportSendsXlsx, type ReportSendStatus } from "@/lib/report-sends.functions";
import { ReportStatusBadge } from "@/components/ReportStatusBadge";

export const Route = createFileRoute("/_authenticated/raporty")({
  head: () => ({
    meta: [
      { title: "Wysyłka raportów — zespół" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TeamReportStatus,
});

const STATUSES: { value: string; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "sent", label: "Wysłano" },
  { value: "delivered", label: "Dostarczono" },
  { value: "opened", label: "Otwarto" },
  { value: "confirmed", label: "Potwierdzono" },
  { value: "bounced", label: "Odbicie" },
  { value: "rejected", label: "Odrzucono" },
  { value: "failed", label: "Błąd" },
  { value: "queued", label: "W kolejce" },
];

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

function TeamReportStatus() {
  const [status, setStatus] = useState<string>("all");
  const [email, setEmail] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState<null | "csv" | "xlsx">(null);
  const fetchAll = useServerFn(getAllReportSends);
  const exportCsv = useServerFn(exportReportSendsCsv);
  const exportXlsx = useServerFn(exportReportSendsXlsx);

  const toIso = (d: string, end = false) =>
    d ? new Date(d + (end ? "T23:59:59.999Z" : "T00:00:00.000Z")).toISOString() : undefined;

  const filters = {
    status,
    email: email || undefined,
    from: toIso(from),
    to: toIso(to, true),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["report-sends", status, email, from, to],
    queryFn: () => fetchAll({ data: filters }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [status, email, from, to, pageSize]);

  const stats = useMemo(() => {
    const rows = data ?? [];
    const by = (s: ReportSendStatus) => rows.filter((r) => r.status === s).length;
    return {
      total: rows.length,
      sent: by("sent") + by("delivered") + by("opened") + by("confirmed"),
      delivered: by("delivered") + by("opened") + by("confirmed"),
      opened: by("opened") + by("confirmed"),
      confirmed: by("confirmed"),
      failed: by("bounced") + by("rejected") + by("failed"),
    };
  }, [data]);

  const rows = data ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize],
  );
  const rangeStart = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(rows.length, safePage * pageSize);

  function resetFilters() {
    setStatus("all");
    setEmail("");
    setFrom("");
    setTo("");
  }

  async function handleExport(format: "csv" | "xlsx") {
    setExporting(format);
    try {
      if (format === "csv") {
        const res = await exportCsv({ data: filters });
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
        triggerDownload(blob, res.filename);
      } else {
        const res = await exportXlsx({ data: filters });
        const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        triggerDownload(blob, res.filename);
      }
    } finally {
      setExporting(null);
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#0c121b] text-slate-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-sm text-[#c9a96a] hover:underline">← Strona główna</Link>
          <Link to="/admin" className="text-sm text-slate-400 hover:text-slate-200">Cennik →</Link>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2">Wysyłka cotygodniowych raportów</h1>
        <p className="text-slate-400 mb-8">Pulpit zespołu: statusy ostatnich 500 wysyłek raportów PDF.</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Łącznie" value={stats.total} />
          <StatCard label="Wysłano" value={stats.sent} accent="text-blue-300" />
          <StatCard label="Dostarczono" value={stats.delivered} accent="text-emerald-300" />
          <StatCard label="Otwarto" value={stats.opened} accent="text-teal-300" />
          <StatCard label="Błędy" value={stats.failed} accent="text-red-300" />
        </div>

        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">Od</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">Do</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col flex-1 min-w-[220px]">
            <label className="text-xs text-slate-500 mb-1">E-mail</label>
            <input
              type="search"
              placeholder="Filtruj po e-mailu…"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="h-[38px] px-4 rounded-md border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800"
          >
            Resetuj filtry
          </button>
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={exporting !== null}
            className="h-[38px] px-4 rounded-md bg-[#c9a96a] text-[#0c121b] text-sm font-medium hover:bg-[#d8bb7c] disabled:opacity-50"
          >
            {exporting === "csv" ? "Eksport…" : "Eksportuj CSV"}
          </button>
          <button
            type="button"
            onClick={() => handleExport("xlsx")}
            disabled={exporting !== null}
            className="h-[38px] px-4 rounded-md border border-[#c9a96a] text-[#c9a96a] text-sm font-medium hover:bg-[#c9a96a]/10 disabled:opacity-50"
          >
            {exporting === "xlsx" ? "Eksport…" : "Eksportuj XLSX"}
          </button>
        </div>

        {isLoading ? (
          <p className="text-slate-400">Wczytuję…</p>
        ) : (
          <>
            <div className={`overflow-x-auto rounded-lg border border-slate-800 transition-opacity ${isFetching ? "opacity-70" : "opacity-100"}`}>
              <table className="w-full text-sm">
                <thead className="bg-slate-900/60 text-slate-400">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Odbiorca</th>
                    <th className="text-left px-3 py-2 font-medium">Tydz.</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-left px-3 py-2 font-medium">Wysłano</th>
                    <th className="text-left px-3 py-2 font-medium">Dostarczono</th>
                    <th className="text-left px-3 py-2 font-medium">Otwarto</th>
                    <th className="text-left px-3 py-2 font-medium">Potwierdzono</th>
                    <th className="text-left px-3 py-2 font-medium">Wersja</th>
                    <th className="text-left px-3 py-2 font-medium">Msg ID / Błąd</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 && (
                    <tr><td colSpan={9} className="px-3 py-6 text-center text-slate-500">Brak wyników.</td></tr>
                  )}
                  {pageRows.map((r) => (
                    <tr key={r.id} className="border-t border-slate-800/80 hover:bg-slate-900/40">
                      <td className="px-3 py-2">{r.recipient_email}</td>
                      <td className="px-3 py-2 font-medium">T{r.week}</td>
                      <td className="px-3 py-2"><ReportStatusBadge status={r.status} /></td>
                      <td className="px-3 py-2 text-slate-400">{fmt(r.sent_at)}</td>
                      <td className="px-3 py-2 text-slate-400">{fmt(r.delivered_at)}</td>
                      <td className="px-3 py-2 text-slate-400">{fmt(r.opened_at)}</td>
                      <td className="px-3 py-2 text-slate-400">{fmt(r.confirmed_at)}</td>
                      <td className="px-3 py-2 text-slate-500 text-xs">v{r.template_version}</td>
                      <td className="px-3 py-2 text-xs text-slate-500 max-w-[260px] truncate" title={r.error ?? r.provider_message_id ?? ""}>
                        {r.error ? <span className="text-red-300">{r.error}</span> : r.provider_message_id ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
              <div>
                {rows.length === 0
                  ? "0 wyników"
                  : <>Pokazuję <span className="text-slate-200">{rangeStart}–{rangeEnd}</span> z <span className="text-slate-200">{rows.length}</span></>}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Na stronę</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-sm"
                >
                  {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="ml-3 flex items-center gap-1">
                  <PagerBtn onClick={() => setPage(1)} disabled={safePage === 1}>« Pierwsza</PagerBtn>
                  <PagerBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>‹ Poprzednia</PagerBtn>
                  <span className="px-2 text-slate-300">{safePage} / {totalPages}</span>
                  <PagerBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Następna ›</PagerBtn>
                  <PagerBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>Ostatnia »</PagerBtn>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, accent = "text-slate-100" }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-2xl font-serif mt-1 ${accent}`}>{value}</div>
    </div>
  );
}

function PagerBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-2 py-1 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-xs"
    >
      {children}
    </button>
  );
}
