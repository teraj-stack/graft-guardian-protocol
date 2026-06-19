import type { ReportSendStatus } from "@/lib/report-sends.functions";

const MAP: Record<ReportSendStatus, { label: string; cls: string }> = {
  queued:    { label: "W kolejce",  cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  sent:      { label: "Wysłano",    cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  delivered: { label: "Dostarczono",cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  opened:    { label: "Otwarto",    cls: "bg-teal-500/15 text-teal-300 border-teal-500/30" },
  confirmed: { label: "Potwierdzono",cls:"bg-[#c9a96a]/15 text-[#c9a96a] border-[#c9a96a]/40" },
  bounced:   { label: "Odbicie",    cls: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  rejected:  { label: "Odrzucono",  cls: "bg-red-500/15 text-red-300 border-red-500/40" },
  failed:    { label: "Błąd",       cls: "bg-red-500/15 text-red-300 border-red-500/40" },
};

export function ReportStatusBadge({ status }: { status: ReportSendStatus }) {
  const s = MAP[status] ?? MAP.queued;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {s.label}
    </span>
  );
}
