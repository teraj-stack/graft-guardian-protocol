import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
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
  const [exporting, setExporting] = useState(false);
  const fetchAll = useServerFn(getAllReportSends);
  const exportCsv = useServerFn(exportReportSendsCsv);

  const toIso = (d: string, end = false) =>
    d ? new Date(d + (end ? "T23:59:59.999Z" : "T00:00:00.000Z")).toISOString() : undefined;

  const filters = {
    status,
    email: email || undefined,
    from: toIso(from),
    to: toIso(to, true),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["report-sends", status, email, from, to],
    queryFn: () => fetchAll({ data: filters }),
  });

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

  async function handleExport() {
    setExporting(true);
    try {
      const res = await exportCsv({ data: filters });
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
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
            onClick={handleExport}
            disabled={exporting}
            className="h-[38px] px-4 rounded-md bg-[#c9a96a] text-[#0c121b] text-sm font-medium hover:bg-[#d8bb7c] disabled:opacity-50"
          >
            {exporting ? "Eksport…" : "Eksportuj CSV"}
          </button>
        </div>

        {isLoading ? (
          <p className="text-slate-400">Wczytuję…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
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
                {(data ?? []).length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-6 text-center text-slate-500">Brak wyników.</td></tr>
                )}
                {(data ?? []).map((r) => (
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
