import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  adminListChapters,
  adminUpsertChapter,
  adminDeleteChapter,
  type EbookChapter,
} from "@/lib/ebook.functions";

export const Route = createFileRoute("/_authenticated/ebook")({
  head: () => ({
    meta: [
      { title: "Edytor e-booka — Patient Journey" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EbookAdminPage,
});

type Draft = Omit<EbookChapter, "id" | "updated_at"> & { id?: string };

const EMPTY: Draft = {
  slug: "",
  title: "",
  day_label: "",
  day_from: 0,
  day_to: 0,
  body_md: "",
  order_idx: 0,
  published: true,
};

function EbookAdminPage() {
  const qc = useQueryClient();
  const [forbidden, setForbidden] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);

  const { data: chapters, isLoading, error } = useQuery({
    queryKey: ["admin", "ebook-chapters"],
    queryFn: () => adminListChapters(),
    retry: false,
  });

  useEffect(() => {
    if (error && /Forbidden/i.test(String((error as Error).message))) {
      setForbidden(true);
    }
  }, [error]);

  const upsert = useMutation({
    mutationFn: (d: Draft) => adminUpsertChapter({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "ebook-chapters"] });
      setEditing(null);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteChapter({ data: { id } }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "ebook-chapters"] }),
  });

  if (forbidden) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">Brak dostępu</h1>
        <p className="mt-4 text-muted-foreground">
          Edytor e-booka jest dostępny tylko dla administratorów.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Panel administracyjny
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Edytor e-booka „Patient Journey"
          </h1>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex items-center rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        >
          + Nowy rozdział
        </button>
      </header>

      {isLoading && <p className="text-muted-foreground">Ładowanie…</p>}

      {chapters && (
        <ul className="divide-y divide-border/60 rounded-sm border border-border">
          {chapters.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-accent">
                  {c.day_label} · #{c.order_idx}
                  {!c.published && " · DRAFT"}
                </p>
                <p className="mt-1 font-display text-lg">{c.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  /{c.slug}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing({ ...c })}
                  className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-secondary"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Usunąć rozdział „${c.title}"?`)) {
                      del.mutate(c.id);
                    }
                  }}
                  className="rounded-sm border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                >
                  Usuń
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ChapterEditor
          draft={editing}
          onCancel={() => setEditing(null)}
          onSave={(d) => upsert.mutate(d)}
          saving={upsert.isPending}
          error={upsert.error ? String((upsert.error as Error).message) : null}
        />
      )}
    </div>
  );
}

function ChapterEditor({
  draft,
  onCancel,
  onSave,
  saving,
  error,
}: {
  draft: Draft;
  onCancel: () => void;
  onSave: (d: Draft) => void;
  saving: boolean;
  error: string | null;
}) {
  const [d, setD] = useState<Draft>(draft);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-sm border border-border bg-card p-6">
        <h2 className="font-display text-2xl">
          {d.id ? "Edycja rozdziału" : "Nowy rozdział"}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Slug (URL)">
            <input
              value={d.slug}
              onChange={(e) => setD({ ...d, slug: e.target.value })}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label={'Etykieta dnia (np. „Dni 1–2")'}>
            <input
              value={d.day_label}
              onChange={(e) => setD({ ...d, day_label: e.target.value })}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Tytuł">
            <input
              value={d.title}
              onChange={(e) => setD({ ...d, title: e.target.value })}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Kolejność">
            <input
              type="number"
              value={d.order_idx}
              onChange={(e) =>
                setD({ ...d, order_idx: Number(e.target.value) || 0 })
              }
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Dzień od">
            <input
              type="number"
              value={d.day_from}
              onChange={(e) =>
                setD({ ...d, day_from: Number(e.target.value) || 0 })
              }
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Dzień do">
            <input
              type="number"
              value={d.day_to}
              onChange={(e) =>
                setD({ ...d, day_to: Number(e.target.value) || 0 })
              }
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <Field label="Treść (markdown: **pogrubienie**, - lista)">
          <textarea
            value={d.body_md}
            onChange={(e) => setD({ ...d, body_md: e.target.value })}
            rows={14}
            className="w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-xs"
          />
        </Field>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={d.published}
            onChange={(e) => setD({ ...d, published: e.target.checked })}
          />
          Opublikowany (widoczny w e-booku)
        </label>

        {error && (
          <p className="mt-4 rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-sm border border-border px-4 py-2 text-sm hover:bg-secondary"
          >
            Anuluj
          </button>
          <button
            onClick={() => onSave(d)}
            disabled={saving}
            className="rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50"
          >
            {saving ? "Zapisywanie…" : "Zapisz"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
