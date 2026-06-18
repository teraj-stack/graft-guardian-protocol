import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";
import { usePanelProgress } from "@/hooks/use-panel-progress";

const TITLE = "Panel pacjenta — biblioteka materiałów pozabiegowych";
const DESCRIPTION =
  "Biblioteka materiałów edukacyjnych po przeszczepie włosów: pełna dokumentacja protokołu, instrukcje na każdy tydzień rekonwalescencji, najnowsze trendy w medycynie regeneracyjnej i anti-aging.";

const CATEGORIES = ["Pielęgnacja", "HBOT", "PBM", "LADD", "Dieta", "Anti-aging"] as const;
const TYPES = ["Artykuł", "Wideo", "PDF", "Checklist"] as const;
const WEEKS = [1, 2, 3, 4, 6, 8, 12] as const;

type Category = (typeof CATEGORIES)[number];
type MatType = (typeof TYPES)[number];

interface Material {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: MatType;
  weeks: number[];
  minutes: number;
}

const MATERIALS: Material[] = [
  {
    id: "m01",
    title: "Mycie głowy krok po kroku: doba 1–7",
    description:
      "Diagram natrysku, kąt strumienia, temperatura wody (max 32 °C), bezdotykowe spłukiwanie HOCI. Co robić, czego absolutnie nie robić w pierwszym tygodniu.",
    category: "Pielęgnacja",
    type: "Wideo",
    weeks: [1],
    minutes: 6,
  },
  {
    id: "m02",
    title: "Checklist dnia 0–14",
    description:
      "Codzienna lista zadań rano i wieczorem: PBM, sól fizjologiczna, sprej HOCI, pozycja spania, aktywność.",
    category: "Pielęgnacja",
    type: "Checklist",
    weeks: [1, 2],
    minutes: 3,
  },
  {
    id: "m03",
    title: "Protokół HBOT 1,5–2,0 ATA — pełna dokumentacja",
    description:
      "Sesje 1–4, kwalifikacja, przeciwwskazania (odma, ucho środkowe, POChP), wyrównywanie ciśnienia, co zabrać do komory.",
    category: "HBOT",
    type: "PDF",
    weeks: [1, 2],
    minutes: 12,
  },
  {
    id: "m04",
    title: "Fotobiomodulacja w domu — hełm 650/830 nm",
    description:
      "Jak ustawić sesje 20 min, częstotliwość 3–4×/tydzień, dawki J/cm², krzywa Arndta-Schulza i dlaczego więcej nie znaczy lepiej.",
    category: "PBM",
    type: "Artykuł",
    weeks: [2, 3, 4, 6, 8, 12],
    minutes: 8,
  },
  {
    id: "m05",
    title: "Shock loss — dlaczego włosy wypadają w tygodniu 2–6",
    description:
      "Mechanizm fizjologiczny, oś czasu, kiedy się nie martwić, kiedy zadzwonić do kliniki. Z odniesieniami do literatury.",
    category: "Pielęgnacja",
    type: "Artykuł",
    weeks: [2, 3, 4, 6],
    minutes: 9,
  },
  {
    id: "m06",
    title: "Dieta pozabiegowa — białko, żelazo, biotyna, omega-3",
    description:
      "Konkretne dzienne dawki, lista zakupowa, posiłki przykładowe na 14 dni. Co ogranicza neowaskularyzację (alkohol, nikotyna, cukier prosty).",
    category: "Dieta",
    type: "PDF",
    weeks: [1, 2, 3, 4],
    minutes: 15,
  },
  {
    id: "m07",
    title: "LADD z PRP i minoksydylem — przygotowanie do sesji",
    description:
      "Co odstawić, jak myć głowę przed wizytą, czego się spodziewać, downtime, pielęgnacja po. Protokół tulowy 1927 nm vs CAP.",
    category: "LADD",
    type: "Wideo",
    weeks: [4, 6, 8],
    minutes: 11,
  },
  {
    id: "m08",
    title: "Reintrodukcja aktywności: sport, sauna, basen, słońce",
    description:
      "Tabela tydzień po tygodniu — kiedy można wrócić do siłowni, biegania, sauny IR, kąpieli w morzu, ekspozycji UV.",
    category: "Pielęgnacja",
    type: "Checklist",
    weeks: [2, 3, 4, 6, 8],
    minutes: 4,
  },
  {
    id: "m09",
    title: "Minoksydyl doustny w mikrodawkach — off-label",
    description:
      "Dawkowanie 0,25–2,5 mg, monitoring ciśnienia, działania niepożądane, kwalifikacja kardiologiczna. Sinclair 2018, Randolph & Tosti 2021.",
    category: "LADD",
    type: "Artykuł",
    weeks: [4, 6, 8, 12],
    minutes: 10,
  },
  {
    id: "m10",
    title: "Egzosomy, peptydy biomimetyczne, GHK-Cu — trendy 2026",
    description:
      "Najnowsze doniesienia z medycyny regeneracyjnej: egzosomy z komórek macierzystych, peptydy sygnalne, miedź-peptyd jako adjuwant LADD.",
    category: "Anti-aging",
    type: "Artykuł",
    weeks: [8, 12],
    minutes: 13,
  },
  {
    id: "m11",
    title: "Czerwone flagi — kiedy natychmiast skontaktować się z kliniką",
    description:
      "Gorączka >38,5 °C, ropny wysięk, asymetryczny obrzęk, ból nieustępujący po lekach, krwawienie >15 min. Zdjęcia referencyjne.",
    category: "Pielęgnacja",
    type: "Checklist",
    weeks: [1, 2, 3],
    minutes: 5,
  },
  {
    id: "m12",
    title: "Komora hiperbaryczna od środka — wideo z sesji",
    description:
      "Pełen przebieg 90-minutowej sesji 2,0 ATA. Wyrównywanie uszu, oddychanie maską, rytm pracy operatora.",
    category: "HBOT",
    type: "Wideo",
    weeks: [1, 2],
    minutes: 8,
  },
  {
    id: "m13",
    title: "Mikrobiom skóry głowy po FUE — co stosować, czego unikać",
    description:
      "Szampony pH 5,5 bez SLS, prebiotyki topowe, dlaczego chlorheksydyna i jodyna szkodzą po dobie 3. Lista preparatów z neutralnym mikrobiomem.",
    category: "Pielęgnacja",
    type: "PDF",
    weeks: [2, 3, 4],
    minutes: 9,
  },
  {
    id: "m14",
    title: "Anti-aging skóry głowy — strategia na 12 miesięcy",
    description:
      "Cykl roczny: PBM podtrzymujące, mezoterapia rewitalizująca, retinoidy topowe, suplementacja systemowa. Plan synchronizowany z fazami anagenu.",
    category: "Anti-aging",
    type: "PDF",
    weeks: [12],
    minutes: 18,
  },
  {
    id: "m15",
    title: "Pozycja spania i poduszka podróżna — pierwsze 10 nocy",
    description:
      "Dlaczego kąt 45° redukuje obrzęk i ryzyko mechanicznej utraty graftów. Wybór poduszki, ułożenie, pierwsza noc po zabiegu.",
    category: "Pielęgnacja",
    type: "Wideo",
    weeks: [1],
    minutes: 4,
  },
];

const searchSchema = z.object({
  week: fallback(z.union([z.literal("all"), z.coerce.number().int()]), "all").default("all"),
  cat: fallback(z.enum(["all", ...CATEGORIES]), "all").default("all"),
  type: fallback(z.enum(["all", ...TYPES]), "all").default("all"),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/panel")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "/panel" }],
  }),
  component: PanelPage,
});

function PanelPage() {
  const { week, cat, type, q } = Route.useSearch();
  const { progress, hydrated, toggleMaterial, toggleWeek, reset, isMaterialDone, isWeekDone } =
    usePanelProgress();
  const [hideDone, setHideDone] = useState(false);

  const baseFiltered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return MATERIALS.filter((m) => {
      if (week !== "all" && !m.weeks.includes(week)) return false;
      if (cat !== "all" && m.category !== cat) return false;
      if (type !== "all" && m.type !== type) return false;
      if (needle && !(m.title.toLowerCase().includes(needle) || m.description.toLowerCase().includes(needle))) {
        return false;
      }
      return true;
    });
  }, [week, cat, type, q]);

  const filtered = useMemo(
    () => (hideDone ? baseFiltered.filter((m) => !isMaterialDone(m.id)) : baseFiltered),
    [baseFiltered, hideDone, isMaterialDone]
  );

  const doneCount = progress.materials.length;
  const totalCount = MATERIALS.length;
  const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-light leading-none tracking-wide">Protokół</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">panel pacjenta</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm text-foreground transition hover:bg-secondary"
          >
            ← Strona główna
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.25em] text-accent">Biblioteka materiałów</p>
        <h1 className="font-display text-4xl leading-[1.05] md:text-6xl">
          Pełna dokumentacja protokołu i&nbsp;najnowsze trendy w&nbsp;medycynie regeneracyjnej.
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          Materiały dostępne wyłącznie dla pacjentów Kliniki. Filtruj po tygodniu po zabiegu,
          kategorii i&nbsp;formacie. Postęp zapisuje się lokalnie w&nbsp;Twojej przeglądarce.
        </p>

        <ProgressPanel
          hydrated={hydrated}
          doneCount={doneCount}
          totalCount={totalCount}
          pct={pct}
          weeks={WEEKS as readonly number[]}
          isWeekDone={isWeekDone}
          toggleWeek={toggleWeek}
          reset={reset}
          hideDone={hideDone}
          setHideDone={setHideDone}
        />

        <Filters week={week} cat={cat} type={type} q={q} total={filtered.length} />

        {filtered.length === 0 ? (
          <div className="mt-12 rounded-sm border border-dashed border-border bg-card p-10 text-center">
            <p className="font-display text-2xl">Brak materiałów dla wybranych filtrów.</p>
            <p className="mt-2 text-sm text-muted-foreground">Zmień zakres tygodnia lub odznacz „ukryj ukończone”.</p>
          </div>
        ) : (
          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <MaterialCard
                key={m.id}
                material={m}
                done={isMaterialDone(m.id)}
                onToggle={() => toggleMaterial(m.id)}
              />
            ))}
          </ul>
        )}
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-10 text-xs text-muted-foreground">
          Materiały edukacyjne. Nie zastępują indywidualnej konsultacji lekarskiej.
          Postęp przechowywany lokalnie (localStorage) — nie synchronizuje się między urządzeniami.
        </div>
      </footer>
    </div>
  );
}

function ProgressPanel({
  hydrated,
  doneCount,
  totalCount,
  pct,
  weeks,
  isWeekDone,
  toggleWeek,
  reset,
  hideDone,
  setHideDone,
}: {
  hydrated: boolean;
  doneCount: number;
  totalCount: number;
  pct: number;
  weeks: readonly number[];
  isWeekDone: (w: number) => boolean;
  toggleWeek: (w: number) => void;
  reset: () => void;
  hideDone: boolean;
  setHideDone: (v: boolean) => void;
}) {
  return (
    <section className="mt-12 rounded-sm border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Twój postęp</p>
          <p className="mt-2 font-display text-3xl">
            {hydrated ? `${doneCount} / ${totalCount}` : "— / —"}
            <span className="ml-3 text-base text-muted-foreground">ukończonych materiałów</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setHideDone(!hideDone)}
            className={
              "inline-flex items-center rounded-sm border px-3 py-1.5 text-xs uppercase tracking-wider transition " +
              (hideDone
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground")
            }
          >
            {hideDone ? "✓ Ukryj ukończone" : "Ukryj ukończone"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Wyczyścić cały zapisany postęp?")) reset();
            }}
            className="inline-flex items-center rounded-sm border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground transition hover:border-destructive hover:text-destructive"
          >
            Wyczyść postęp
          </button>
        </div>
      </div>

      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${hydrated ? pct : 0}%` }}
        />
      </div>

      <div className="mt-6 border-t border-border/50 pt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Ukończone tygodnie protokołu
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {weeks.map((w) => {
            const done = hydrated && isWeekDone(w);
            return (
              <button
                key={w}
                type="button"
                onClick={() => toggleWeek(w)}
                className={
                  "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs uppercase tracking-wider transition " +
                  (done
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground")
                }
                aria-pressed={done}
              >
                <span>{done ? "✓" : "○"}</span>
                <span>Tydzień {w}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Filters({
  week,
  cat,
  type,
  q,
  total,
}: {
  week: number | "all";
  cat: string;
  type: string;
  q: string;
  total: number;
}) {
  return (
    <section className="mt-12 rounded-sm border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex-1">
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Szukaj</label>
          <SearchBox value={q} />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {total} {total === 1 ? "materiał" : total >= 2 && total <= 4 ? "materiały" : "materiałów"}
        </p>
      </div>

      <FilterRow label="Tydzień po zabiegu" paramKey="week" current={String(week)} options={[
        { value: "all", label: "Wszystkie" },
        ...WEEKS.map((w) => ({ value: String(w), label: `T${w}` })),
      ]} />

      <FilterRow label="Kategoria" paramKey="cat" current={cat} options={[
        { value: "all", label: "Wszystkie" },
        ...CATEGORIES.map((c) => ({ value: c, label: c })),
      ]} />

      <FilterRow label="Typ materiału" paramKey="type" current={type} options={[
        { value: "all", label: "Wszystkie" },
        ...TYPES.map((t) => ({ value: t, label: t })),
      ]} />
    </section>
  );
}

function SearchBox({ value }: { value: string }) {
  return (
    <form
      method="get"
      action="/panel"
      className="mt-2 flex w-full max-w-md items-center gap-2"
    >
      <input
        type="text"
        name="q"
        defaultValue={value}
        placeholder="np. mycie, HBOT, dieta…"
        className="flex-1 rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
      >
        Szukaj
      </button>
    </form>
  );
}

function FilterRow({
  label,
  paramKey,
  current,
  options,
}: {
  label: string;
  paramKey: "week" | "cat" | "type";
  current: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="mt-5 border-t border-border/50 pt-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = current === o.value;
          return (
            <Link
              key={o.value}
              from="/panel"
              search={(prev: Record<string, unknown>) => {
                const next: Record<string, unknown> = { ...prev };
                if (o.value === "all") {
                  delete next[paramKey];
                } else if (paramKey === "week") {
                  next.week = Number(o.value);
                } else {
                  next[paramKey] = o.value;
                }
                return next as never;
              }}
              className={
                "inline-flex items-center rounded-sm border px-3 py-1.5 text-xs uppercase tracking-wider transition " +
                (active
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground")
              }
            >
              {o.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MaterialCard({
  material,
  done,
  onToggle,
}: {
  material: Material;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <li
      className={
        "flex flex-col rounded-sm border bg-card p-5 shadow-[var(--shadow-editorial)] transition " +
        (done ? "border-accent/70 opacity-80" : "border-border hover:border-accent/60")
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-sm border border-accent/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
          {material.type}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {material.minutes} min
        </span>
      </div>
      <h2 className="mt-4 font-display text-xl leading-snug">{material.title}</h2>
      <p className="mt-3 flex-1 text-sm text-muted-foreground">{material.description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{material.category}</span>
        <span className="text-muted-foreground/40">·</span>
        {material.weeks.map((w) => (
          <span
            key={w}
            className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            T{w}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        className={
          "mt-4 inline-flex items-center justify-center gap-2 rounded-sm border px-3 py-2 text-xs uppercase tracking-wider transition " +
          (done
            ? "border-accent bg-accent text-accent-foreground hover:opacity-90"
            : "border-border text-foreground hover:border-accent hover:text-accent")
        }
      >
        <span>{done ? "✓" : "○"}</span>
        <span>{done ? "Ukończone" : "Oznacz jako ukończone"}</span>
      </button>
    </li>
  );
}
