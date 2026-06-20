import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { sendTestEmail, type PreflightResult } from '@/lib/email-test.functions'

export const Route = createFileRoute('/_authenticated/email-test')({
  head: () => ({
    meta: [
      { title: 'Test e-maila — Graftgen.com' },
      { name: 'description', content: 'Wyślij testowy e-mail z preflight (format, MX, suppression, historia).' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: EmailTestPage,
})

function statusBadge(s: 'ok' | 'fail' | 'warn' | 'skip') {
  const map = {
    ok: { label: 'OK', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    fail: { label: 'FAIL', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    warn: { label: 'WARN', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    skip: { label: 'SKIP', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  }[s]
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-mono ${map.cls}`}>
      {map.label}
    </span>
  )
}

function EmailTestPage() {
  const send = useServerFn(sendTestEmail)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [force, setForce] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PreflightResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await send({ data: { email: email.trim(), force } })
      setResult(res)
    } catch (err: any) {
      setError(err?.message ?? 'Błąd serwera')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-slate-100">
      <button
        onClick={() => router.navigate({ to: '/' })}
        className="mb-6 text-sm text-slate-400 hover:text-slate-200"
      >
        ← Strona główna
      </button>

      <h1 className="text-2xl font-serif mb-2">Test e-maila</h1>
      <p className="text-sm text-slate-400 mb-6">
        Preflight: format → MX → suppression → historia bounce. Po sukcesie wiadomość trafia do kolejki transakcyjnej.
      </p>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-5">
        <label className="block">
          <span className="text-sm text-slate-300">Adres odbiorcy</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ktos@example.com"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono outline-none focus:border-amber-500/60"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
          Wymuś (omiń suppression/historia — format i MX nadal obowiązują)
        </label>

        <button
          type="submit"
          disabled={loading || !email}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? 'Sprawdzam i wysyłam…' : 'Wyślij'}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {result && (
        <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Wynik preflight</h2>
            <span
              className={`rounded px-2 py-0.5 text-xs font-mono ${
                result.ok
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {result.ok ? 'WYSŁANO' : 'ZATRZYMANO'}
            </span>
          </div>

          <ul className="space-y-2">
            {result.steps.map((s, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 rounded border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-200">{s.name}</div>
                  {s.detail && <div className="text-xs text-slate-400 mt-0.5">{s.detail}</div>}
                </div>
                <div className="shrink-0">{statusBadge(s.status)}</div>
              </li>
            ))}
          </ul>

          {result.messageId && (
            <p className="mt-4 text-xs text-slate-500 font-mono break-all">
              message_id: {result.messageId}
            </p>
          )}
        </section>
      )}
    </main>
  )
}
