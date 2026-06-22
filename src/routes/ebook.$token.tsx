import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPublishedChapters,
  verifyEbookAccess,
  type EbookChapter,
} from "@/lib/ebook.functions";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteFooter } from "@/components/SiteFooter";


const TITLE = "Patient Journey — przewodnik po pierwszych 14 dniach";

const chaptersQuery = queryOptions({
  queryKey: ["ebook", "chapters"],
  queryFn: () => getPublishedChapters(),
});

export const Route = createFileRoute("/ebook/$token")({
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content:
          "Przewodnik po pierwszych 14 dniach po przeszczepie włosów — dzień po dniu instrukcje, checklisty i objawy alarmowe.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async ({ params }) => {
    const res = await verifyEbookAccess({ data: { token: params.token } });
    if (!res.valid) throw notFound();
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(chaptersQuery),
  errorComponent: () => (
    <ErrorState message="Nie udało się załadować e-booka. Odśwież stronę." />
  ),
  notFoundComponent: () => (
    <ErrorState
      message="Link wygasł lub jest nieprawidłowy. Wypełnij formularz ponownie, aby otrzymać nowy link."
    />
  ),
  component: EbookPage,
});

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">Patient Journey</h1>
      <p className="mt-4 text-muted-foreground">{message}</p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm hover:bg-secondary"
      >
        ← Wróć na stronę główną
      </Link>
    </div>
  );
}

/* ---------- Tiny markdown renderer (bold, lists, paragraphs) ---------- */

type Block =
  | { kind: "list"; items: string[] }
  | { kind: "para"; text: string };

function parseMarkdown(md: string): Block[] {
  const lines = md.split(/\r?\n/);
  const blocks: Block[] = [];
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push({ kind: "list", items: listBuffer });
    listBuffer = [];
  };
  const flushPara = () => {
    if (paraBuffer.length === 0) return;
    blocks.push({ kind: "para", text: paraBuffer.join(" ") });
    paraBuffer = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^[-•] /.test(line)) {
      flushPara();
      listBuffer.push(line.replace(/^[-•] /, ""));
    } else if (line.trim() === "") {
      flushList();
      flushPara();
    } else {
      flushList();
      paraBuffer.push(line);
    }
  }
  flushList();
  flushPara();
  return blocks;
}

function renderInline(text: string): React.ReactNode {
  // **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ---------- Checklist state (localStorage) ---------- */

const STORAGE_KEY = "ebook-checklist-v1";

type ChecklistState = Record<string, boolean>; // key = `${slug}:${idx}`

function useChecklist() {
  const [state, setState] = useState<ChecklistState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const toggle = useCallback((key: string) => {
    setState((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next[key]) delete next[key];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState({});
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { state, hydrated, toggle, reset };
}

const ALARM_PARA_RE = /alarm|natychmiast|zgłoś|niepokoj|pilnie|wezwij/i;

function ChapterBody({
  slug,
  body,
  state,
  onToggle,
}: {
  slug: string;
  body: string;
  state: ChecklistState;
  onToggle: (key: string) => void;
}) {
  const blocks = useMemo(() => parseMarkdown(body), [body]);
  let itemCounter = 0;
  let lastParaText = "";
  return (
    <>
      {blocks.map((block, bi) => {
        if (block.kind === "para") {
          lastParaText = block.text;
          return (
            <p
              key={`p-${bi}`}
              className="my-3 text-sm leading-relaxed md:text-base"
            >
              {renderInline(block.text)}
            </p>
          );
        }
        const isAlarmList = ALARM_PARA_RE.test(lastParaText);
        return (
          <ul
            key={`ul-${bi}`}
            className={
              isAlarmList
                ? "my-4 space-y-2 rounded-sm border border-destructive/40 bg-destructive/5 p-4 print:border-black"
                : "my-4 space-y-2"
            }
          >
            {isAlarmList && (
              <li className="-mt-1 mb-2 text-[11px] uppercase tracking-[0.2em] text-destructive print:text-black">
                ⚠ Sygnały alarmowe — zaznacz objaw, by zobaczyć instrukcję
              </li>
            )}
            {block.items.map((item) => {
              const idx = itemCounter++;
              const key = `${slug}:${idx}`;
              const checked = !!state[key];
              return (
                <li key={idx} className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-start gap-3 print:cursor-default">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(key)}
                      className={`mt-1 h-4 w-4 shrink-0 cursor-pointer print:hidden ${
                        isAlarmList ? "accent-destructive" : "accent-accent"
                      }`}
                      aria-label={`${isAlarmList ? "Zgłoś objaw" : "Odhacz krok"}: ${item.replace(/\*\*/g, "")}`}
                    />
                    <span
                      aria-hidden="true"
                      className="mt-1 hidden h-4 w-4 shrink-0 items-center justify-center border border-current text-[10px] print:inline-flex"
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span
                      className={
                        checked && !isAlarmList
                          ? "text-sm text-muted-foreground line-through md:text-base"
                          : isAlarmList
                            ? "text-sm font-medium text-foreground md:text-base"
                            : "text-sm md:text-base"
                      }
                    >
                      {renderInline(item)}
                    </span>
                  </label>
                  {isAlarmList && checked && (
                    <AlarmCallout
                      symptom={item.replace(/\*\*/g, "")}
                      level={classifyUrgency(item)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        );
      })}
    </>
  );
}

const CLINIC_PHONE_DISPLAY = "+48 510 432 361";
const CLINIC_PHONE_TEL = "+48510432361";
const CLINIC_WHATSAPP = "https://wa.me/48510432361";

type UrgencyLevel = "emergency" | "urgent" | "routine";

const EMERGENCY_RE =
  /duszność|duszności|omdlen|utrata przytomn|silny ból w klatc|krwotok|tętnicz|anafilaks|obrzęk twarzy|obrzęk języka|drgawk|udar|zawał/i;
const URGENT_RE =
  /gorączk|>?\s*38|ropn|ropa|cuchnąc|narastając(y|a) (obrzęk|ból|rumień)|silny ból|krwawien|martwic|czarn(y|e) strup|cellulit|zakażen|infekcj|wyciek\s+(ropn|surowicz)/i;

function classifyUrgency(text: string): UrgencyLevel {
  if (EMERGENCY_RE.test(text)) return "emergency";
  if (URGENT_RE.test(text)) return "urgent";
  return "routine";
}

const LEVEL_META: Record<
  UrgencyLevel,
  {
    label: string;
    badge: string;
    channel: string;
    timing: string;
    steps: string[];
    primary: { label: string; href: string };
    secondary?: { label: string; href: string };
    tone: string;
    badgeTone: string;
  }
> = {
  emergency: {
    label: "STAN NAGŁY — 112 / SOR",
    badge: "Pilność: krytyczna",
    channel:
      "Zadzwoń pod 112 lub jedź na SOR. Klinikę poinformuj w drugiej kolejności.",
    timing: "Działaj natychmiast — nie czekaj na odpowiedź kliniki.",
    steps: [
      "Zadzwoń pod 112 lub poproś osobę towarzyszącą o wezwanie pomocy.",
      "Nie jedź samodzielnie, jeśli masz duszność, zaburzenia świadomości lub silny ból w klatce.",
      "Jeśli to możliwe, zrób zdjęcie zmiany — pokażesz je w SOR.",
      "Po stabilizacji powiadom klinikę o zdarzeniu i hospitalizacji.",
    ],
    primary: { label: "📞 Zadzwoń 112", href: "tel:112" },
    secondary: {
      label: `Poinformuj klinikę ${CLINIC_PHONE_DISPLAY}`,
      href: `tel:${CLINIC_PHONE_TEL}`,
    },
    tone: "border-destructive bg-destructive/15",
    badgeTone: "bg-destructive text-destructive-foreground",
  },
  urgent: {
    label: "PILNE — kontakt telefoniczny",
    badge: "Pilność: wysoka",
    channel:
      "Zadzwoń do kliniki teraz. W razie braku kontaktu w 30 min — zgłoś się na SOR.",
    timing: "Reakcja w ciągu 1–2 godzin.",
    steps: [
      "Nie dotykaj, nie naciskaj i nie przemywaj strefy biorczej środkami innymi niż HOCl.",
      "Zmierz temperaturę i zapisz wynik.",
      "Zrób zdjęcie zmiany w dobrym świetle (z linijką lub palcem jako skalą).",
      "Zadzwoń do kliniki — przygotuj numer pacjenta i datę zabiegu.",
      "Jeśli nie uzyskasz kontaktu w ciągu 30 minut — zgłoś się na SOR.",
    ],
    primary: {
      label: `📞 Zadzwoń ${CLINIC_PHONE_DISPLAY}`,
      href: `tel:${CLINIC_PHONE_TEL}`,
    },
    secondary: { label: "WhatsApp (dodatkowo)", href: CLINIC_WHATSAPP },
    tone: "border-destructive/60 bg-destructive/10",
    badgeTone: "bg-destructive/80 text-destructive-foreground",
  },
  routine: {
    label: "NIEPILNE — konsultacja WhatsApp",
    badge: "Pilność: niska",
    channel:
      "Napisz na WhatsApp — odpowiadamy 8:00–20:00 (zwykle do 2 godzin).",
    timing: "Reakcja w ciągu doby roboczej.",
    steps: [
      "Zrób zdjęcie zmiany w dobrym świetle (z linijką lub palcem jako skalą).",
      "Opisz: kiedy zauważyłeś objaw, czy się nasila, czy towarzyszy mu ból/świąd/gorączka.",
      "Wyślij wiadomość na WhatsApp wraz ze zdjęciem.",
      "Do czasu odpowiedzi kontynuuj standardowy protokół pielęgnacji.",
    ],
    primary: { label: "WhatsApp do kliniki", href: CLINIC_WHATSAPP },
    secondary: {
      label: `Telefon ${CLINIC_PHONE_DISPLAY}`,
      href: `tel:${CLINIC_PHONE_TEL}`,
    },
    tone: "border-amber-500/60 bg-amber-500/10",
    badgeTone: "bg-amber-500 text-black",
  },
};

function AlarmCallout({
  symptom,
  level,
}: {
  symptom: string;
  level: UrgencyLevel;
}) {
  const meta = LEVEL_META[level];
  const isExternal = (href: string) => href.startsWith("http");
  return (
    <div
      role="alert"
      className={`ml-7 rounded-sm border p-4 text-sm print:hidden ${meta.tone}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-sm px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${meta.badgeTone}`}
        >
          {meta.badge}
        </span>
        <p className="font-semibold text-foreground">{meta.label}</p>
      </div>
      <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
        Zgłoszony objaw: {symptom}
      </p>
      <p className="mt-2 text-sm text-foreground">{meta.channel}</p>
      <p className="mt-1 text-xs text-muted-foreground">{meta.timing}</p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-foreground">
        {meta.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={meta.primary.href}
          target={isExternal(meta.primary.href) ? "_blank" : undefined}
          rel={isExternal(meta.primary.href) ? "noreferrer" : undefined}
          className="inline-flex items-center rounded-sm bg-foreground px-3 py-2 text-xs font-medium text-background hover:opacity-90"
        >
          {meta.primary.label}
        </a>
        {meta.secondary && (
          <a
            href={meta.secondary.href}
            target={isExternal(meta.secondary.href) ? "_blank" : undefined}
            rel={isExternal(meta.secondary.href) ? "noreferrer" : undefined}
            className="inline-flex items-center rounded-sm border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
          >
            {meta.secondary.label}
          </a>
        )}
      </div>
    </div>
  );
}


function countItems(md: string): number {
  return parseMarkdown(md).reduce(
    (n, b) => n + (b.kind === "list" ? b.items.length : 0),
    0,
  );
}

function chapterProgress(slug: string, total: number, state: ChecklistState) {
  if (total === 0) return { done: 0, total: 0, pct: 0 };
  let done = 0;
  for (let i = 0; i < total; i++) if (state[`${slug}:${i}`]) done++;
  return { done, total, pct: Math.round((done / total) * 100) };
}


function EbookPage() {
  const { data: chapters } = useSuspenseQuery(chaptersQuery);
  const { state, hydrated, toggle, reset } = useChecklist();

  const totals = useMemo(() => {
    const perChapter = new Map<string, number>();
    let grand = 0;
    for (const c of chapters) {
      const n = countItems(c.body_md);
      perChapter.set(c.slug, n);
      grand += n;
    }
    return { perChapter, grand };
  }, [chapters]);

  const doneCount = hydrated
    ? Object.values(state).filter(Boolean).length
    : 0;
  const overallPct =
    totals.grand === 0 ? 0 : Math.round((doneCount / totals.grand) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header — hidden on print */}
      <header className="border-b border-border/60 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <Link to="/" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
            ← Strona główna
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm("Wyzerować całą checklistę?")) reset();
              }}
              className="rounded-sm border border-border px-3 py-2 text-xs uppercase tracking-wider hover:bg-secondary"
            >
              Reset checklisty
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
            >
              Pobierz / Drukuj PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 md:py-20 print:py-6">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">
          Patient Journey — Graftgen.com
        </p>
        <h1 className="mt-4 font-display text-4xl md:text-6xl">
          Przewodnik po pierwszych 14 dniach po przeszczepie włosów metodą DHI
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground">
          Protokół kliniczny oparty na EBM. Wersja {new Date().toISOString().slice(0, 10)}.
        </p>

        {/* Overall progress */}
        <div className="mt-8 rounded-sm border border-border/60 bg-card/30 p-5 print:hidden">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span>Twój postęp — Dzień 0–14</span>
            <span className="text-accent">
              {doneCount} / {totals.grand} kroków · {overallPct}%
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full bg-accent transition-[width] duration-300"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Postęp zapisuje się lokalnie w tej przeglądarce. Odhaczaj kroki w trakcie dnia — ⚠️ ostrzeżenia („Czego unikać", „Sygnały alarmowe") także można zaznaczyć jako przeczytane.
          </p>
        </div>

        <div className="mt-12 space-y-12">
          {chapters.map((c: EbookChapter) => {
            const total = totals.perChapter.get(c.slug) ?? 0;
            const prog = chapterProgress(c.slug, total, state);
            return (
              <article
                key={c.id}
                id={c.slug}
                className="break-inside-avoid border-t border-border/60 pt-8 print:pt-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-accent">
                    {c.day_label}
                  </p>
                  {total > 0 && (
                    <p className="text-xs text-muted-foreground print:hidden">
                      {prog.done}/{prog.total} · {prog.pct}%
                    </p>
                  )}
                </div>
                <h2 className="mt-2 font-display text-2xl md:text-3xl">
                  {c.title}
                </h2>
                <div className="mt-4 text-muted-foreground">
                  <ChapterBody
                    slug={c.slug}
                    body={c.body_md}
                    state={state}
                    onToggle={toggle}
                  />
                </div>
              </article>
            );
          })}
        </div>

        <footer className="mt-16 border-t border-border/60 pt-8 text-xs text-muted-foreground print:mt-8">
          © {new Date().getFullYear()} Graftgen.com. Materiał edukacyjny — nie zastępuje konsultacji lekarskiej.
        </footer>
      </main>


      <style>{`
        @media print {
          @page { margin: 18mm; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}
