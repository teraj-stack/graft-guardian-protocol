import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminListPricingOverrides,
  adminUpsertPricingOverride,
  adminDeletePricingOverride,
  type AdminPricingOverride,
} from "@/lib/admin-pricing.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel administracyjny — Cennik" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

// Katalog pozycji w cenniku (musi pokrywać się z kodami w src/routes/index.tsx)
const PRICING_CATALOG: { code: string; name: string }[] = [
  { code: "HBOT", name: "Tlenoterapia hiperbaryczna" },
  { code: "LADD", name: "LADD: PRP + minoksydyl (laser tulowy)" },
  { code: "LADD-CP", name: "LADD: PRP + minoksydyl — zimna plazma" },
  { code: "PBM", name: "Fototerapia (PBM / LLLT)" },
];

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // yyyy-MM-ddTHH:mm for datetime-local
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatHuman(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" });
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [forbidden, setForbidden] = useState(false);
  const [undo, setUndo] = useState<
    | { code: string; name: string; snapshot: AdminPricingOverride; remaining: number }
    | null
  >(null);

  const { data: overrides, isLoading, error } = useQuery({
    queryKey: ["admin-pricing-overrides"],
    queryFn: () => adminListPricingOverrides(),
    retry: false,
  });

  useEffect(() => {
    if (error && /Forbidden/i.test(String((error as Error).message))) {
      setForbidden(true);
    }
  }, [error]);

  // 10-sekundowy countdown dla bannera Cofnij
  useEffect(() => {
    if (!undo) return;
    if (undo.remaining <= 0) {
      setUndo(null);
      return;
    }
    const t = setTimeout(() => {
      setUndo((u) => (u ? { ...u, remaining: u.remaining - 1 } : null));
    }, 1000);
    return () => clearTimeout(t);
  }, [undo]);

  const upsert = useMutation({
    mutationFn: (input: { code: string; hidden: boolean; restore_at: string | null }) =>
      adminUpsertPricingOverride({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["pricing-overrides"] });
    },
  });

  const del = useMutation({
    mutationFn: (vars: { code: string; name: string; snapshot: AdminPricingOverride }) =>
      adminDeletePricingOverride({ data: { code: vars.code } }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["pricing-overrides"] });
      setUndo({ code: vars.code, name: vars.name, snapshot: vars.snapshot, remaining: 10 });
    },
  });

  function handleUndo() {
    if (!undo) return;
    upsert.mutate({
      code: undo.snapshot.code,
      hidden: undo.snapshot.hidden,
      restore_at: undo.snapshot.restore_at,
    });
    setUndo(null);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }


  if (forbidden) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-serif text-foreground">Brak uprawnień</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Twoje konto nie posiada roli <code>admin</code>. Skontaktuj się z administratorem
            systemu, aby uzyskać dostęp do panelu zarządzania cennikiem.
          </p>
          <button
            onClick={signOut}
            className="mt-6 rounded-sm border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
          >
            Wyloguj
          </button>
        </div>
      </main>
    );
  }

  const overrideMap = new Map<string, AdminPricingOverride>(
    (overrides ?? []).map((o) => [o.code, o]),
  );

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Panel administracyjny
            </p>
            <h1 className="mt-2 text-3xl font-serif text-foreground">Zarządzanie cennikiem</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ręcznie ukryj pozycję na stronie głównej. Opcjonalnie ustaw datę, w której
              pozycja zostanie automatycznie przywrócona.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link
              to="/"
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              ← Strona główna
            </Link>
            <button
              onClick={signOut}
              className="rounded-sm border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted"
            >
              Wyloguj
            </button>
          </div>
        </header>

        {isLoading && <p className="mt-8 text-sm text-muted-foreground">Ładowanie…</p>}

        {error && !forbidden && (
          <div className="mt-6 rounded-sm border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Błąd: {(error as Error).message}
          </div>
        )}

        <ul className="mt-8 space-y-4">
          {PRICING_CATALOG.map((item) => {
            const current = overrideMap.get(item.code);
            return (
              <PricingRow
                key={item.code}
                code={item.code}
                name={item.name}
                current={current}
                onSave={(payload) => upsert.mutate(payload)}
                onClear={() =>
                  current && del.mutate({ code: item.code, name: item.name, snapshot: current })
                }
                saving={upsert.isPending && upsert.variables?.code === item.code}
                clearing={del.isPending && del.variables?.code === item.code}
              />
            );
          })}
        </ul>

        <p className="mt-10 text-xs text-muted-foreground">
          Pozycje bez wpisu w bazie używają domyślnej widoczności zdefiniowanej w kodzie.
          Skasowanie wpisu (przycisk <em>Usuń override</em>) przywraca domyślne zachowanie.
        </p>
      </div>

      {undo && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-4 rounded-sm border border-border bg-card px-4 py-3 text-sm shadow-[var(--shadow-editorial)]"
        >
          <span className="text-foreground">
            Usunięto wpis <strong>{undo.name}</strong>.
          </span>
          <button
            onClick={handleUndo}
            className="rounded-sm border border-foreground bg-foreground px-3 py-1.5 text-xs text-background hover:bg-foreground/90"
          >
            Cofnij ({undo.remaining}s)
          </button>
          <button
            onClick={() => setUndo(null)}
            aria-label="Zamknij"
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}


function PricingRow({
  code,
  name,
  current,
  onSave,
  onClear,
  saving,
  clearing,
}: {
  code: string;
  name: string;
  current?: AdminPricingOverride;
  onSave: (input: { code: string; hidden: boolean; restore_at: string | null }) => void;
  onClear: () => void;
  saving: boolean;
  clearing: boolean;
}) {
  const [hidden, setHidden] = useState<boolean>(current?.hidden ?? false);
  const [restoreAt, setRestoreAt] = useState<string>(toDateInputValue(current?.restore_at ?? null));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setHidden(current?.hidden ?? false);
    setRestoreAt(toDateInputValue(current?.restore_at ?? null));
    setValidationError(null);
  }, [current?.hidden, current?.restore_at]);

  return (
    <li className="rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-editorial)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{code}</p>
          <h2 className="mt-1 text-lg font-medium text-foreground">{name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Status w bazie:{" "}
            {current
              ? `${current.hidden ? "ukryte" : "widoczne"} · przywrócenie: ${formatHuman(current.restore_at)}`
              : "brak override (widoczne)"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr_auto]">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={hidden}
            onChange={(e) => setHidden(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Ukryj w cenniku
        </label>

        <label className="flex flex-col text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">Auto-przywrócenie</span>
          <input
            type="datetime-local"
            value={restoreAt}
            onChange={(e) => setRestoreAt(e.target.value)}
            disabled={!hidden}
            className="mt-1 rounded-sm border border-border bg-background px-2 py-1.5 text-sm text-foreground disabled:opacity-50"
          />
          {validationError && (
            <span className="mt-1 text-xs text-destructive">{validationError}</span>
          )}
        </label>

        <div className="flex items-end gap-2">
          <button
            onClick={() => {
              setValidationError(null);
              if (hidden) {
                if (!restoreAt) {
                  setValidationError("Ustaw datę auto-przywrócenia.");
                  return;
                }
                const d = new Date(restoreAt);
                if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
                  setValidationError("Data auto-przywrócenia musi być w przyszłości.");
                  return;
                }
              }
              onSave({
                code,
                hidden,
                restore_at: hidden ? fromDateInputValue(restoreAt) : null,
              });
            }}
            disabled={saving}
            className="rounded-sm border border-foreground bg-foreground px-3 py-1.5 text-sm text-background hover:bg-foreground/90 disabled:opacity-50"
          >
            {saving ? "Zapisywanie…" : "Zapisz"}
          </button>
          {current && (
            <button
              onClick={onClear}
              disabled={clearing}
              className="rounded-sm border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
              title="Usuń wpis z bazy — wraca do domyślnego stanu z kodu"
            >
              {clearing ? "…" : "Usuń override"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
