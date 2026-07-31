import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePanelProgress } from "@/hooks/use-panel-progress";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteFooter } from "@/components/SiteFooter";

const TITLE = "Panel pacjenta — biblioteka materiałów pozabiegowych";
const DESCRIPTION =
  "Biblioteka materiałów po przeszczepie włosów: protokół, instrukcje na każdy tydzień rekonwalescencji i trendy w medycynie regeneracyjnej.";

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
    title: "Protokół HBOT 1,5–3,0 ATA — pełna dokumentacja",
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
      "Jak ustawić sesje 20 min, częstotliwość 2x dziennie/tydz., dawki J/cm², krzywa Arndta-Schulza i dlaczego więcej nie znaczy lepiej.",
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
      'Pełen przebieg 90-minutowej sesji 1,5–3,0 ATA (Doba „Zero"). Wyrównywanie uszu, oddychanie maską, rytm pracy operatora.',
    category: "HBOT",
    type: "Wideo",
    weeks: [1, 2],
    minutes: 8,
  },
  {
    id: "m13",
    title: "Mikrobiom skóry głowy po DHI — co stosować, czego unikać",
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
      { property: "og:url", content: "https://graftgen.com/panel" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://graftgen.com/panel" }],
  }),
  component: PanelPage,
});

function PanelPage() {
  const { week, cat, type, q } = Route.useSearch();
  const { t } = useTranslation();
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
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <Link
              to="/przypomnienia"
              className="inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm text-foreground transition hover:bg-secondary"
            >
              Przypomnienia
            </Link>
            <Link
              to="/"
              className="inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm text-foreground transition hover:bg-secondary"
            >
              ← Strona główna
            </Link>
          </div>
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
          <section
            aria-labelledby="panel-empty-heading"
            className="mt-12 rounded-sm border border-dashed border-border bg-card p-10 text-center"
          >
            <h2 id="panel-empty-heading" className="font-display text-2xl">
              {t("panel.empty.title")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("panel.empty.hint")}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/panel"
                search={() => ({})}
                className="inline-flex items-center rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
              >
                {t("panel.empty.clearFilters")}
              </Link>
            </div>
          </section>
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

      <SiteFooter />
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
  const { t } = useTranslation();
  const pctRounded = hydrated ? Math.round(pct) : 0;
  return (
    <section
      aria-labelledby="progress-heading"
      className="mt-12 rounded-sm border border-border bg-card p-5 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="progress-heading" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("panel.progress.heading")}
          </h2>
          <p className="mt-2 font-display text-3xl" aria-live="polite" id="progress-summary">
            {hydrated ? `${doneCount} / ${totalCount}` : "— / —"}
            <span className="ml-3 text-base text-muted-foreground">
              {t("panel.progress.completedMaterials")}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setHideDone(!hideDone)}
            aria-pressed={hideDone}
            aria-label={`${t("panel.progress.hideDone")} — ${
              hideDone ? t("panel.progress.stateOn") : t("panel.progress.stateOff")
            }`}
            className={
              "inline-flex items-center rounded-sm border px-3 py-1.5 text-xs uppercase tracking-wider transition " +
              (hideDone
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground")
            }
          >
            {hideDone ? `✓ ${t("panel.progress.hideDone")}` : t("panel.progress.hideDone")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t("panel.progress.resetConfirm"))) reset();
            }}
            aria-describedby="progress-summary"
            className="inline-flex items-center rounded-sm border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground transition hover:border-destructive hover:text-destructive"
          >
            {t("panel.progress.reset")}
          </button>
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pctRounded}
        aria-valuetext={t("panel.progress.valueText", { pct: pctRounded })}
        aria-labelledby="progress-heading"
        className="mt-5 h-2 w-full overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${hydrated ? pct : 0}%` }}
        />
      </div>

      <div className="mt-6 border-t border-border/50 pt-4">
        <p id="weeks-heading" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {t("panel.progress.weeksHeading")}
        </p>
        <p id="weeks-hint" className="sr-only">
          {t("panel.progress.weeksHint")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="weeks-heading">
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
                aria-describedby="weeks-hint"
                aria-label={t("panel.progress.weekAria", {
                  week: w,
                  status: done
                    ? t("panel.progress.weekDone")
                    : t("panel.progress.weekNotDone"),
                })}
              >
                <span aria-hidden="true">{done ? "✓" : "○"}</span>
                <span aria-hidden="true">{t("panel.progress.week", { week: w })}</span>
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
  const { t } = useTranslation();
  const countLabel =
    total === 1
      ? t("panel.filters.resultsOne")
      : total >= 2 && total <= 4
        ? t("panel.filters.resultsFew")
        : t("panel.filters.resultsMany");
  const hasActiveFilters = week !== "all" || cat !== "all" || type !== "all" || q.trim() !== "";

  const [liveMessage, setLiveMessage] = useState("");
  const isFirstRender = useRef(true);
  const prevParams = useRef({ week, cat, type, q });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevParams.current = { week, cat, type, q };
      return;
    }
    const changed =
      week !== prevParams.current.week ||
      cat !== prevParams.current.cat ||
      type !== prevParams.current.type ||
      q !== prevParams.current.q;
    if (changed) {
      const message =
        total === 0
          ? t("panel.filters.liveUpdateZero")
          : t("panel.filters.liveUpdate", { count: total, label: countLabel });
      setLiveMessage(message);
      const timer = setTimeout(() => setLiveMessage(""), 1500);
      prevParams.current = { week, cat, type, q };
      return () => clearTimeout(timer);
    }
  }, [week, cat, type, q, total, t, countLabel]);

  return (
    <section
      aria-labelledby="filters-heading"
      className="mt-12 rounded-sm border border-border bg-card p-5 md:p-6"
    >
      <h2 id="filters-heading" className="sr-only">
        {t("panel.filters.heading")}
      </h2>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage || " "}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex-1">
          <label htmlFor="panel-search" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("panel.filters.searchLabel")}
          </label>
          <SearchBox value={q} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p aria-live="polite" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {total} {countLabel}
          </p>
          {hasActiveFilters ? (
            <Link
              to="/panel"
              search={() => ({})}
              aria-label={t("panel.filters.resetAria")}
              className="inline-flex items-center rounded-sm border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
            >
              {t("panel.filters.reset")}
            </Link>
          ) : null}
        </div>
      </div>


      <FilterRow label={t("panel.filters.week")} paramKey="week" current={String(week)} options={[
        { value: "all", label: t("panel.filters.all") },
        ...WEEKS.map((w) => ({ value: String(w), label: `T${w}` })),
      ]} />

      <FilterRow label={t("panel.filters.category")} paramKey="cat" current={cat} options={[
        { value: "all", label: t("panel.filters.all") },
        ...CATEGORIES.map((c) => ({ value: c, label: t(`panel.filters.categories.${c}`) })),
      ]} />

      <FilterRow label={t("panel.filters.type")} paramKey="type" current={type} options={[
        { value: "all", label: t("panel.filters.all") },
        ...TYPES.map((ty) => ({ value: ty, label: t(`panel.filters.types.${ty}`) })),
      ]} />
    </section>
  );
}

function SearchBox({ value }: { value: string }) {
  const { t } = useTranslation();
  return (
    <form
      method="get"
      action="/panel"
      className="mt-2 flex w-full max-w-md items-center gap-2"
    >
      <input
        id="panel-search"
        type="search"
        name="q"
        aria-describedby="panel-search-hint"
        defaultValue={value}
        placeholder={t("panel.filters.searchPlaceholder")}
        className="flex-1 rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none"
      />
      <span id="panel-search-hint" className="sr-only">
        {t("panel.filters.searchHint")}
      </span>
      <button
        type="submit"
        className="rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
      >
        {t("panel.filters.searchSubmit")}
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
  const { t } = useTranslation();
  return (
    <div className="mt-5 border-t border-border/50 pt-4">
      <p id={`filter-${paramKey}-label`} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby={`filter-${paramKey}-label`}>
        {options.map((o) => {
          const active = current === o.value;
          return (
            <Link
              key={o.value}
              from="/panel"
              aria-current={active ? "true" : undefined}
              aria-label={`${label}: ${o.label}${active ? ` — ${t("panel.filters.activeSuffix")}` : ""}`}
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
              <span aria-hidden="true">{active ? "✓ " : ""}{o.label}</span>
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
