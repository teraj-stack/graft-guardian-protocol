import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getMyReportSends } from "@/lib/report-sends.functions";
import { ReportStatusBadge } from "@/components/ReportStatusBadge";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/raporty/status")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Status wysyłki raportów — Graftgen" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Historia wysyłki cotygodniowych raportów PDF: wysłano, dostarczono, otwarto, potwierdzono." },
    ],
  }),
  component: PatientReportStatus,
});

function fmt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

function PatientReportStatus() {
  const { token } = Route.useSearch();
  const fetchSends = useServerFn(getMyReportSends);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-report-sends", token],
    queryFn: () => fetchSends({ data: { token: token! } }),
    enabled: !!token,
  });

  return (
    <main className="min-h-screen bg-[#0c121b] text-slate-100 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link to="/" className="text-sm text-[#c9a96a] hover:underline">← Strona główna</Link>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2">Status wysyłki cotygodniowych raportów</h1>
        <p className="text-slate-400 mb-8">Historia raportów PDF wysłanych na Twój adres e-mail.</p>

        {!token && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            Brak tokenu w adresie. Otwórz tę stronę z linku otrzymanego w e-mailu z raportem.
          </div>
        )}

        {token && isLoading && <p className="text-slate-400">Wczytuję…</p>}
        {token && error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
            Nie udało się pobrać historii. Spróbuj ponownie później.
          </div>
        )}

        {data === null && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
            Token nieprawidłowy lub subskrypcja została wycofana.
          </div>
        )}

        {data && (
          <>
            <p className="text-sm text-slate-400 mb-4">
              Odbiorca: <span className="text-slate-200 font-medium">{data.email}</span> · {data.sends.length} wpisów
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/60 text-slate-400">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Tydzień</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-left px-3 py-2 font-medium">Wysłano</th>
                    <th className="text-left px-3 py-2 font-medium">Dostarczono</th>
                    <th className="text-left px-3 py-2 font-medium">Otwarto</th>
                    <th className="text-left px-3 py-2 font-medium">Potwierdzono</th>
                    <th className="text-left px-3 py-2 font-medium">Wersja</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sends.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500">Brak wysyłek.</td></tr>
                  )}
                  {data.sends.map((r) => (
                    <tr key={r.id} className="border-t border-slate-800/80">
                      <td className="px-3 py-2 font-medium">T{r.week}</td>
                      <td className="px-3 py-2"><ReportStatusBadge status={r.status} /></td>
                      <td className="px-3 py-2 text-slate-400">{fmt(r.sent_at)}</td>
                      <td className="px-3 py-2 text-slate-400">{fmt(r.delivered_at)}</td>
                      <td className="px-3 py-2 text-slate-400">{fmt(r.opened_at)}</td>
                      <td className="px-3 py-2 text-slate-400">{fmt(r.confirmed_at)}</td>
                      <td className="px-3 py-2 text-slate-500 text-xs">v{r.template_version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Aktualizacja statusów następuje automatycznie na podstawie informacji zwrotnych od serwera pocztowego (delivery / bounce / open) oraz Twojego potwierdzenia odbioru.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
