import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { formatMoney } from "@/lib/utils";
import { Clock, Package, CheckCircle, Calculator, Info } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import mscLogo from "@/assets/msc-logo.jpeg.asset.json";
import graftgenLogo from "@/assets/graftgen-logo.jpg.asset.json";
import {
  STOREFRONT_PRODUCT_BY_HANDLE_QUERY,
  storefrontApiRequest,
} from "@/lib/shopify";

export const Route = createFileRoute("/product/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} — Sklep Graftgen.com` },
      { name: "description", content: "Produkt sklepu Graftgen.com — pielęgnacja po przeszczepie." },
    ],
  }),
  component: ProductPage,
});

async function fetchProduct(handle: string) {
  const data = await storefrontApiRequest(STOREFRONT_PRODUCT_BY_HANDLE_QUERY, { handle });
  return data?.data?.product ?? null;
}

function productPlaceholder(product: any) {
  const t = (product.title ?? "").toLowerCase();
  if (t.includes("hiperbaryczn") || t.includes("hbot") || t.includes("fototerap") || t.includes("pbm") || t.includes("lllt")) {
    return { src: graftgenLogo.url, alt: "Graftgen.com" };
  }
  if (t.includes("ladd") || t.includes("plazm") || t.includes("cap") || t.includes("tul")) {
    return { src: mscLogo.url, alt: "MSC" };
  }
  return { src: graftgenLogo.url, alt: "Graftgen.com" };
}

function ProductPage() {
  const { handle } = useParams({ from: "/product/$handle" });
  const { data: product, isLoading } = useQuery({
    queryKey: ["shopify", "product", handle],
    queryFn: () => fetchProduct(handle),
  });

  const addItem = useCartStore((s) => s.addItem);
  const isAdding = useCartStore((s) => s.isLoading);
  const [variantId, setVariantId] = useState<string | null>(null);

  const variants = product?.variants?.edges ?? [];
  const currentVariant = useMemo(() => {
    if (!variants.length) return null;
    return (variants.find((v: { node: { id: string } }) => v.node.id === variantId) ?? variants[0]).node;
  }, [variants, variantId]);

  const onAdd = async () => {
    if (!currentVariant || !product) return;
    await addItem({
      product: { node: product },
      variantId: currentVariant.id,
      variantTitle: currentVariant.title,
      price: currentVariant.price,
      quantity: 1,
      selectedOptions: currentVariant.selectedOptions ?? [],
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/sklep" className="font-serif text-lg">← Sklep</Link>
          <CartDrawer />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {isLoading && <p className="text-sm text-muted-foreground">Ładowanie…</p>}
        {!isLoading && !product && (
          <p className="text-sm text-muted-foreground">Produkt nie został znaleziony.</p>
        )}
        {product && (
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="overflow-hidden rounded-sm bg-secondary/30">
              {product.images?.edges?.[0]?.node?.url ? (
                <img
                  src={product.images.edges[0].node.url}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                (() => {
                  const ph = product ? productPlaceholder(product) : { src: graftgenLogo.url, alt: "Graftgen.com" };
                  return (
                    <div className="flex aspect-square items-center justify-center p-12">
                      <img src={ph.src} alt={ph.alt} className="max-h-full max-w-full object-contain opacity-90" loading="lazy" />
                    </div>
                  );
                })()
              )}
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl">{product.title}</h1>
              {(() => {
                const price = currentVariant?.price ?? product.priceRange.minVariantPrice;
                const compare = currentVariant?.compareAtPrice;
                const priceN = parseFloat(price.amount);
                const compareN = compare ? parseFloat(compare.amount) : 0;
                const hasDiscount = compareN > priceN;
                const pct = hasDiscount ? Math.round((1 - priceN / compareN) * 100) : 0;
                const sessions = parseInt(currentVariant?.title?.match(/\d+/)?.[0] ?? "0", 10);
                const perSession = sessions > 0 ? priceN / sessions : 0;
                return (
                  <div className="mt-4 flex flex-wrap items-baseline gap-3">
                    <span className="text-xl font-semibold">
                      {formatMoney(priceN)} {price.currencyCode}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-base text-muted-foreground line-through">
                          {formatMoney(compareN)} {compare!.currencyCode}
                        </span>
                        <span className="rounded-sm bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                          −{pct}% • oszczędzasz {formatMoney(compareN - priceN)} {price.currencyCode}
                        </span>
                      </>
                    )}
                    {sessions > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{formatMoney(perSession)} {price.currencyCode}</span> / sesja
                        <span title={`Cena za 1 sesję = cena pakietu (${formatMoney(priceN)} ${price.currencyCode}) ÷ ${sessions} sesji`}>
                          <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground/70" />
                        </span>
                      </span>
                    )}
                  </div>
                );
              })()}
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>

              {variants.length > 1 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Wariant</p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v: { node: { id: string; title: string; availableForSale: boolean; price: { amount: string; currencyCode: string }; compareAtPrice?: { amount: string; currencyCode: string } | null } }) => {
                      const active = (currentVariant?.id ?? variants[0].node.id) === v.node.id;
                      const p = parseFloat(v.node.price.amount);
                      const c = v.node.compareAtPrice ? parseFloat(v.node.compareAtPrice.amount) : 0;
                      const pct = c > p ? Math.round((1 - p / c) * 100) : 0;
                      const vSessions = parseInt(v.node.title.match(/\d+/)?.[0] ?? "0", 10);
                      const vPerSession = vSessions > 0 ? p / vSessions : 0;
                      return (
                        <button
                          key={v.node.id}
                          onClick={() => setVariantId(v.node.id)}
                          disabled={!v.node.availableForSale}
                          className={`flex flex-col items-start gap-0.5 rounded-sm border px-3 py-2 text-sm transition ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border/60 text-foreground hover:border-accent"
                          } ${!v.node.availableForSale ? "opacity-40" : ""}`}
                        >
                          <span className="flex items-center gap-2">
                            {v.node.title}
                            {pct > 0 && (
                              <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${active ? "bg-background/15 text-background" : "bg-accent/15 text-accent"}`}>
                                −{pct}%
                              </span>
                            )}
                          </span>
                          <span className={`text-xs ${active ? "text-background/80" : "text-muted-foreground"}`}>
                            {formatMoney(p)} {v.node.price.currencyCode}
                            {pct > 0 && <span className="ml-1 line-through opacity-70">{formatMoney(c)}</span>}
                            {vSessions > 0 && (
                              <span className={`ml-1.5 inline-flex items-center gap-0.5 text-[10px] ${active ? "text-background/70" : "text-muted-foreground/70"}`}>
                                ({formatMoney(vPerSession)}/sesja)
                                <span title={`Cena za 1 sesję = cena pakietu (${formatMoney(p)} ${v.node.price.currencyCode}) ÷ ${vSessions} sesji`}>
                                  <Info className="h-3 w-3 cursor-help opacity-70" />
                                </span>
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={onAdd}
                disabled={!currentVariant?.availableForSale || isAdding}
                className="mt-8 inline-flex w-full items-center justify-center rounded-sm bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:opacity-50 sm:w-auto"
              >
                {isAdding ? "Dodaję…" : currentVariant?.availableForSale ? "Dodaj do koszyka" : "Niedostępny"}
              </button>
            </div>
          </div>
        )}
      </section>

      {product && currentVariant && (
        <TherapyCalculator product={product} currentVariant={currentVariant} />
      )}
      {product && <SessionPlans product={product} currentVariant={currentVariant} />}
    </div>
  );
}

function getProtocolCalcData(title: string): { sessionDurationMin: number; plans: SessionPlan[] } {
  const base = getProtocolData(title);
  const t = title.toLowerCase();
  let sessionDurationMin = 60;
  if (t.includes("hiperbaryczn") || t.includes("hbot")) sessionDurationMin = 90;
  else if (t.includes("plazm") || t.includes("cap") || t.includes("cold plasma")) sessionDurationMin = 45;
  else if (t.includes("fototerap") || t.includes("pbm") || t.includes("lllt") || t.includes("led")) sessionDurationMin = 30;
  return { sessionDurationMin, plans: base.plans };
}

function TherapyCalculator({ product, currentVariant }: { product: any; currentVariant: any }) {
  const sessions = parseInt(currentVariant?.title?.match(/\d+/)?.[0] ?? "0", 10);
  const { sessionDurationMin, plans } = useMemo(() => getProtocolCalcData(product.title ?? ""), [product.title]);

  const plan = plans.find((p) => p.sessions === sessions);
  const totalHours = sessions * (sessionDurationMin / 60);

  const weeks = useMemo(() => {
    if (!plan) return 0;
    const t = plan.timeline.toLowerCase();
    const matchMies = t.match(/(\d+(?:[\s\-]+\d+)?)\s*miesi[ąęa]/);
    if (matchMies) {
      const parts = matchMies[1].split(/[\s\-]+/);
      const avg = parts.length > 1 ? (parseInt(parts[0]) + parseInt(parts[1])) / 2 : parseInt(parts[0]);
      return Math.round(avg * 4.345);
    }
    const matchTyg = t.match(/(\d+(?:[\s\-]+\d+)?)\s*tygodn/);
    if (matchTyg) {
      const parts = matchTyg[1].split(/[\s\-]+/);
      return parts.length > 1 ? Math.round((parseInt(parts[0]) + parseInt(parts[1])) / 2) : parseInt(parts[0]);
    }
    return 0;
  }, [plan]);

  if (!sessions || !plan) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-6">
      <div className="rounded-sm border border-border/60 bg-card p-5 md:p-6">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-accent" />
          <h3 className="font-serif text-lg md:text-xl">Kalkulator czasu terapii</h3>
        </div>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          Szacunkowy czas dla wybranego wariantu. Rzeczywisty czas może się różnić w zależności od kwalifikacji i protokołu.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-sm border border-border/40 bg-secondary/30 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Liczba tygodni</p>
            <p className="mt-1 font-serif text-2xl">{weeks > 0 ? `~${weeks}` : "—"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{plan.timeline}</p>
          </div>
          <div className="rounded-sm border border-border/40 bg-secondary/30 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Liczba godzin</p>
            <p className="mt-1 font-serif text-2xl">{totalHours.toFixed(1).replace(/\.0$/, "")} h</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {sessions} × {sessionDurationMin} min
            </p>
          </div>
          <div className="rounded-sm border border-border/40 bg-secondary/30 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Częstotliwość</p>
            <p className="mt-1 font-serif text-2xl">{plan.frequency}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Plan terapeutyczny</p>
          </div>
        </div>

        <WeeklySchedule sessions={sessions} frequency={plan.frequency} />
      </div>
    </section>
  );
}

const DAY_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

function parseFrequency(freq: string): { mode: "interval" | "perWeek"; value: number } {
  const f = freq.toLowerCase();
  const perWeek = f.match(/(\d+)(?:\s*[–\-]\s*(\d+))?\s*×\s*\/\s*tydzie/);
  if (perWeek) {
    const a = parseInt(perWeek[1]);
    const b = perWeek[2] ? parseInt(perWeek[2]) : a;
    return { mode: "perWeek", value: Math.round((a + b) / 2) };
  }
  const everyWeeks = f.match(/\/\s*(\d+)(?:\s*[–\-]\s*(\d+))?\s*tygodn/);
  if (everyWeeks) {
    const a = parseInt(everyWeeks[1]);
    const b = everyWeeks[2] ? parseInt(everyWeeks[2]) : a;
    return { mode: "interval", value: Math.round(((a + b) / 2) * 7) };
  }
  if (/\/\s*dzie/.test(f)) return { mode: "interval", value: 1 };
  const everyDays = f.match(/\/\s*(\d+)(?:\s*[–\-]\s*(\d+))?\s*dni/);
  if (everyDays) {
    const a = parseInt(everyDays[1]);
    const b = everyDays[2] ? parseInt(everyDays[2]) : a;
    return { mode: "interval", value: Math.round((a + b) / 2) };
  }
  return { mode: "interval", value: 7 };
}

function buildSchedule(sessions: number, freq: string, startDay: number) {
  const parsed = parseFrequency(freq);
  const out: { week: number; day: number }[] = [];
  if (parsed.mode === "perWeek") {
    const patterns: Record<number, number[]> = {
      1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6],
    };
    const pattern = patterns[Math.min(7, Math.max(1, parsed.value))];
    let count = 0;
    for (let w = 0; count < sessions && w < 400; w++) {
      for (const offset of pattern) {
        if (count >= sessions) break;
        const totalDay = w * 7 + offset;
        out.push({ week: w + 1, day: (startDay + totalDay) % 7 });
        count++;
      }
    }
  } else {
    const interval = Math.max(1, parsed.value);
    for (let i = 0; i < sessions; i++) {
      const totalDay = i * interval;
      out.push({ week: Math.floor(totalDay / 7) + 1, day: (startDay + totalDay) % 7 });
    }
  }
  return out;
}

function WeeklySchedule({ sessions, frequency }: { sessions: number; frequency: string }) {
  const [startDay, setStartDay] = useState(0);
  const [defaultTime, setDefaultTime] = useState("09:00");
  const [perDayEnabled, setPerDayEnabled] = useState(false);
  const [perDayTimes, setPerDayTimes] = useState<Record<number, string>>({});
  const schedule = useMemo(() => buildSchedule(sessions, frequency, startDay), [sessions, frequency, startDay]);
  const weeks = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const s of schedule) {
      if (!map.has(s.week)) map.set(s.week, []);
      map.get(s.week)!.push(s.day);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [schedule]);

  const activeDays = useMemo(() => Array.from(new Set(schedule.map((s) => s.day))).sort(), [schedule]);
  const timeForDay = (day: number) => (perDayEnabled ? perDayTimes[day] || defaultTime : defaultTime);

  return (
    <div className="mt-5 rounded-sm border border-border/40 bg-secondary/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Harmonogram tygodniowy</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Start:
            <select
              value={startDay}
              onChange={(e) => setStartDay(parseInt(e.target.value))}
              className="rounded-sm border border-border/60 bg-background px-2 py-1 text-xs"
            >
              {DAY_LABELS.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Godzina:
            <input
              type="time"
              value={defaultTime}
              onChange={(e) => setDefaultTime(e.target.value)}
              className="rounded-sm border border-border/60 bg-background px-2 py-1 text-xs"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={perDayEnabled}
              onChange={(e) => setPerDayEnabled(e.target.checked)}
              className="h-3 w-3"
            />
            Różne godziny dla dni
          </label>
        </div>
      </div>

      {perDayEnabled && activeDays.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 rounded-sm border border-border/30 bg-background/40 p-3">
          {activeDays.map((day) => (
            <label key={day} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-8 uppercase tracking-wider">{DAY_LABELS[day]}</span>
              <input
                type="time"
                value={perDayTimes[day] || defaultTime}
                onChange={(e) => setPerDayTimes((prev) => ({ ...prev, [day]: e.target.value }))}
                className="rounded-sm border border-border/60 bg-background px-1.5 py-0.5 text-[11px]"
              />
            </label>
          ))}
        </div>
      )}

      <div className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
        {weeks.map(([week, days]) => (
          <div key={week} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">Tydz. {week}</span>
            <div className="flex flex-1 gap-1">
              {DAY_LABELS.map((label, i) => {
                const active = days.includes(i);
                return (
                  <div
                    key={i}
                    className={`flex h-10 flex-1 flex-col items-center justify-center rounded-sm text-[10px] uppercase tracking-wider ${
                      active
                        ? "border border-accent/40 bg-accent/20 text-accent"
                        : "border border-border/30 text-muted-foreground/40"
                    }`}
                  >
                    <span>{label}</span>
                    {active && <span className="mt-0.5 text-[9px] tracking-normal opacity-80">{timeForDay(i)}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Łącznie {schedule.length} sesji w {weeks.length} {weeks.length === 1 ? "tygodniu" : "tygodniach"}. Harmonogram orientacyjny — finalne terminy ustala lekarz.
      </p>
    </div>
  );
}


interface SessionPlan {
  sessions: number;
  label: string;
  frequency: string;
  timeline: string;
  bestFor: string;
}

function getProtocolData(title: string): { plans: SessionPlan[]; note: string } {
  const t = title.toLowerCase();
  if (t.includes("hiperbaryczn") || t.includes("hbot")) {
    return {
      plans: [
        { sessions: 5, label: "Pakiet startowy", frequency: "1 sesja / 2–3 dni", timeline: "Ok. 2 tygodnie", bestFor: "Małe–średnie przeszczepy, profilaktyka" },
        { sessions: 10, label: "Pakiet standardowy", frequency: "1 sesja / 2 dni", timeline: "Ok. 3 tygodnie", bestFor: "Standardowa regeneracja po DHI" },
        { sessions: 20, label: "Pakiet intensywny", frequency: "1 sesja / dzień", timeline: "4 tygodnie", bestFor: "Duże przeszczepy (>3000 graftów), palacze, cukrzyca" },
      ],
      note: "Pierwsza sesja najlepiej w oknie 24–48 h po zabiegu. Kwalifikacja lekarska wymagana.",
    };
  }
  if (t.includes("plazm") || t.includes("cap") || t.includes("cold plasma")) {
    return {
      plans: [
        { sessions: 5, label: "Seria wstępna", frequency: "1 sesja / 2–3 tygodnie", timeline: "3 miesiące", bestFor: "Ostrożne wprowadzenie, skóra wrażliwa" },
        { sessions: 10, label: "Seria pełna", frequency: "1 sesja / 2 tygodnie", timeline: "5 miesięcy", bestFor: "Standardowy protokół po DHI z CAP" },
        { sessions: 20, label: "Seria intensywna", frequency: "1 sesja / 1–2 tygodnie", timeline: "6–8 miesięcy", bestFor: "Zaawansowana regeneracja, wcześniejsze nieudane próby" },
      ],
      note: "Pierwsza sesja optymalnie 3–4 tygodnie po przeszczepie. Konieczna kwalifikacja trychologiczna.",
    };
  }
  if (t.includes("fototerap") || t.includes("pbm") || t.includes("lllt") || t.includes("led")) {
    return {
      plans: [
        { sessions: 5, label: "Pakiet próbny", frequency: "2–3× / tydzień", timeline: "2 tygodnie", bestFor: "Weryfikacja tolerancji światła" },
        { sessions: 10, label: "Pakiet startowy", frequency: "2–3× / tydzień", timeline: "1 miesiąc", bestFor: "Wczesna faza po DHI (od 7. dnia)" },
        { sessions: 20, label: "Pakiet pełny", frequency: "2–3× / tydzień", timeline: "2 miesiące", bestFor: "Standardowy cykl 12–16 tygodni (zachowane do uzupełnienia)" },
      ],
      note: "PBM to terapia wspomagająca — efekty widoczne zazwyczaj po 12–16 tygodniach regularnej ekspozycji.",
    };
  }
  // Default: LADD tulowy / laser
  return {
    plans: [
      { sessions: 5, label: "Seria wstępna", frequency: "1 sesja / 3–4 tygodnie", timeline: "5 miesięcy", bestFor: "Profilaktyka, skóra bez istotnych zmian" },
      { sessions: 10, label: "Seria pełna", frequency: "1 sesja / 3–4 tygodnie", timeline: "9–10 miesięcy", bestFor: "Standardowy protokół po DHI z LADD/PRP" },
      { sessions: 20, label: "Seria intensywna", frequency: "1 sesja / 3 tygodnie", timeline: "14 miesięcy", bestFor: "Wieloetapowa regeneracja, przewlekłe wypadanie" },
    ],
    note: "Optymalne okno: 4–6 tygodni po przeszczepie. Seria 4–6 sesji to minimum; 10–20 to pełny cykl.",
  };
}

function SessionPlans({ product, currentVariant }: { product: any; currentVariant: any }) {
  const { plans, note } = getProtocolData(product.title ?? "");

  const variants = useMemo(() => {
    const list = product?.variants?.edges ?? [];
    return list.map((v: any) => v.node).sort((a: any, b: any) => {
      const na = parseInt(a.title.match(/\d+/)?.[0] ?? "0", 10);
      const nb = parseInt(b.title.match(/\d+/)?.[0] ?? "0", 10);
      return na - nb;
    });
  }, [product]);

  const variantMap = useMemo(() => {
    const map: Record<number, any> = {};
    for (const v of variants) {
      const n = parseInt(v.title.match(/\d+/)?.[0] ?? "0", 10);
      if (n) map[n] = v;
    }
    return map;
  }, [variants]);

  const pricePerSession = (variant: any) => {
    const n = parseInt(variant.title.match(/\d+/)?.[0] ?? "1", 10);
    const amount = parseFloat(variant.price.amount);
    return formatMoney(amount / n);
  };

  const priceRange = useMemo(() => {
    const prices = variants.map((v: any) => parseFloat(v.price.amount));
    if (!prices.length) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min: formatMoney(min), max: formatMoney(max), currency: variants[0]?.price?.currencyCode ?? "PLN" };
  }, [variants]);

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="rounded-sm border border-border/60 bg-card p-6 md:p-10">
        <h2 className="font-serif text-2xl md:text-3xl">Ile sesji zwykle potrzeba?</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Poniżej przykładowe plany terapeutyczne oparte na protokole Graftgen. Wybór zależy od zakresu przeszczepu, historii medycznej i celu.
        </p>

        {priceRange && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-sm bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            Przedział cenowy: {priceRange.min} – {priceRange.max} {priceRange.currency}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const variant = variantMap[plan.sessions];
            const isSelected = currentVariant?.id === variant?.id;
            return (
              <div
                key={plan.sessions}
                className={`relative flex flex-col rounded-sm border p-5 transition ${
                  isSelected ? "border-foreground bg-foreground/5" : "border-border/60 bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-3xl">{plan.sessions}</span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">{plan.label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">sesji</p>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{plan.frequency}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{plan.timeline}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{plan.bestFor}</span>
                  </div>
                </div>

                {variant && (
                  <div className="mt-5 border-t border-border/40 pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">
                        {formatMoney(parseFloat(variant.price.amount))} {variant.price.currencyCode}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ~{pricePerSession(variant)} {variant.price.currencyCode} / sesja
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          {note}
        </p>
      </div>
    </section>
  );
}


