import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useState } from "react";

const searchSchema = z.object({
  token: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/przypomnienia/wypisz")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Wypisanie z przypomnień — Protokół" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UnsubscribePage,
});

type State =
  | { kind: "loading" }
  | { kind: "active"; emailHint?: string }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "not_found" }
  | { kind: "error"; message?: string }
  | { kind: "done" };

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!token) {
        setState({ kind: "invalid" });
        return;
      }
      try {
        const r = await fetch(
          `/api/public/reminders/unsubscribe?token=${encodeURIComponent(token)}`
        );
        const j = (await r.json()) as {
          ok: boolean;
          status: string;
          emailHint?: string;
        };
        if (cancelled) return;
        if (!r.ok || !j.ok) {
          if (j.status === "not_found") setState({ kind: "not_found" });
          else if (j.status === "invalid_token") setState({ kind: "invalid" });
          else setState({ kind: "error" });
          return;
        }
        if (j.status === "already_unsubscribed") setState({ kind: "already" });
        else setState({ kind: "active", emailHint: j.emailHint });
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function confirm() {
    setSubmitting(true);
    try {
      const r = await fetch(`/api/public/reminders/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const j = (await r.json()) as { ok: boolean; status: string; message?: string };
      if (!r.ok || !j.ok) {
        setState({ kind: "error", message: j.message });
        return;
      }
      setState({ kind: "done" });
    } catch {
      setState({ kind: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-lg rounded-sm border border-border bg-card p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Przypomnienia</p>
        <h1 className="mt-3 font-display text-3xl md:text-4xl">Wypisanie z wiadomości</h1>

        {state.kind === "loading" && (
          <p className="mt-6 text-sm text-muted-foreground">Sprawdzam Twój link…</p>
        )}

        {state.kind === "invalid" && (
          <p className="mt-6 text-sm text-destructive">Link jest nieprawidłowy lub niekompletny.</p>
        )}

        {state.kind === "not_found" && (
          <p className="mt-6 text-sm text-destructive">
            Nie znaleźliśmy subskrypcji powiązanej z tym linkiem.
          </p>
        )}

        {state.kind === "error" && (
          <p className="mt-6 text-sm text-destructive">
            Coś poszło nie tak{state.message ? `: ${state.message}` : ""}. Spróbuj ponownie za chwilę.
          </p>
        )}

        {state.kind === "already" && (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              Ten adres jest już wypisany z przypomnień. Nie wyślemy żadnych kolejnych wiadomości.
            </p>
            <Link
              to="/przypomnienia"
              className="mt-6 inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm transition hover:bg-secondary"
            >
              Zapisz się ponownie
            </Link>
          </>
        )}

        {state.kind === "active" && (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              Czy na pewno chcesz przestać otrzymywać przypomnienia
              {state.emailHint ? ` wysyłane na ${state.emailHint}` : ""}? Tej decyzji nie da się cofnąć
              automatycznie — będzie trzeba zapisać się ponownie.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={confirm}
                disabled={submitting}
                className="inline-flex items-center rounded-sm bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Wypisywanie…" : "Tak, wypisz mnie"}
              </button>
              <Link
                to="/"
                className="inline-flex items-center rounded-sm border border-border px-5 py-2.5 text-sm transition hover:bg-secondary"
              >
                Anuluj
              </Link>
            </div>
          </>
        )}

        {state.kind === "done" && (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              Gotowe. Wypisaliśmy Twój adres z listy przypomnień. Dziękujemy za czas spędzony z naszymi materiałami.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm transition hover:bg-secondary"
            >
              Wróć na stronę główną
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
