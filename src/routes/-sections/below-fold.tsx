import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode, type FormEvent } from "react";
import { PRICING } from "@/lib/pricing-data";
import { FAQ } from "@/lib/faq-data";
import { validateReferences, type RefValidation } from "@/lib/references.functions";
import { Section, SectionHeader, Card, Mech } from "@/components/section-primitives";

/* ---------- Microbiome ---------- */

export function Microbiome() {
  return (
    <Section id="mikrobiom" eyebrow="06 — Mikrobiom i strefa dawcza">
      <SectionHeader
        title="Antyseptyka, która nie uszkadza graftu."
        lead="Klasyczne antyseptyki (chlorheksydyna, octenidyna w wyższych stężeniach, jodopowidon) wykazują cytotoksyczność wobec keratynocytów i fibroblastów in vitro. Na świeżej ranie pozabiegowej to nie jest neutralne."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="HOCI — kwas podchlorawy" badge="0,01–0,02%">
          <p>
            HOCI to ten sam związek, który neutrofile produkują podczas
            fagocytozy. W stężeniach 0,01–0,02% działa bakteriobójczo
            (w tym na MRSA i biofilmy <em>S. aureus</em>) oraz
            grzybobójczo wobec <em>Malassezia</em>, nie wykazując
            cytotoksyczności wobec graftów. Stosowany jako bezdotykowy
            spray do mycia skóry głowy od doby 2.
          </p>
        </Card>
        <div className="flex flex-col gap-6">
          <Card title="Botaniczne formuły pozabiegowe" badge="Arnica · Centella">
            <p>
              Sterylne żele bez konserwantów na bazie wyciągów z
              <em> Arnica montana</em> (helenalina, dihydrohelenalina —
              redukcja erytemy) oraz <em>Centella asiatica</em>
              (madekasozyd, asiatykozyd — stymulacja syntezy kolagenu I,
              redukcja stanu zapalnego). Zastosowanie nad strefą dawczą,
              która po DHI przypomina rozległe otarcie.
            </p>
            <Mech>
              Niekontrolowane namnażanie <em>Malassezia</em> i
              patogennych szczepów gronkowca wokół mikroran sprzyja
              włóknieniu bliznowatemu i utracie graftów.
            </Mech>
          </Card>
        </div>
      </div>
    </Section>
  );
}

/* ---------- Timeline ---------- */

export function Timeline() {
  const phases: { tag: string; title: string; bullets: string[] }[] = [
    {
      tag: "Podczas zabiegu",
      title: "Faza Ex Vivo — prewencja uszkodzeń",
      bullets: [
        "Pobieranie graftów bezpośrednio do HypoThermosol FRS + ATP-v, schłodzonego do 4 °C",
        "Kąpiel graftów w autologicznym PRP 10–20 min przed implantacją",
        "Minimalizacja czasu ex vivo: target < 4 h dla najgłębszych graftów",
      ],
    },
    {
      tag: "Doba 0–3",
      title: "Faza ostrego zapalenia — walka z niedokrwieniem i obrzękiem",
      bullets: [
        "PBM 650 + 830 nm, 20 min, bezpośrednio po zabiegu, dalej co 24 h",
        "HBOT 1,5–2,0 ATA: sesja 1. (doba 0), sesja 2. (doba 1)",
        "Strefa dawcza zabezpieczona maścią barierową bez konserwantów",
        "Bezdotykowe spłukiwanie obszaru biorczego HOCI od 48 h",
        "Spanie w pozycji półsiedzącej (≥30°) przez 5 dni",
      ],
    },
    {
      tag: "Doba 4–14",
      title: "Faza proliferacji — zarządzanie mikrobiomem",
      bullets: [
        "Mycie skóry głowy HOCI lub szamponem pH 5,5 bez SLS, bez tarcia",
        "Domowa fototerapia LLLT (hełm) 3–4×/tydz., 20 min na sesję",
        "Od 8. doby: miękki masaż usuwający strupy + botaniki (arnika, centella)",
        "Optycznie: ocena erytemy, ewentualna sesja CAP nad strefą dawczą",
      ],
    },
    {
      tag: "Miesiąc 1+",
      title: "Wsparcie systemowe — stymulacja anagenu",
      bullets: [
        "Minoksydyl miejscowo 5% lub doustnie w mikrodawkach 0,25–2,5 mg (off-label, po kwalifikacji)",
        "Mezoterapia PRP: sesje w miesiącu 1, 2, 4",
        "LADD z laserem tulowym 1927 nm + minoksydyl/PRP — od 4–6 tygodnia",
        "Kontrolne PBM 1–2×/tydzień przez 12 tygodni",
        "Trichoskopia kontrolna: miesiąc 3, 6, 12",
      ],
    },
  ];

  return (
    <Section id="protokol" eyebrow="07 — Oś czasu 14 dni i dalej">
      <SectionHeader title="Chronologiczny protokół, krok po kroku." />
      <ol className="space-y-12">
        {phases.map((p, i) => (
          <li
            key={p.tag}
            className="grid gap-6 border-t border-border pt-8 md:grid-cols-12"
          >
            <div className="md:col-span-3">
              <div className="text-xs uppercase tracking-[0.2em] text-accent">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-2 font-display text-3xl">{p.tag}</div>
            </div>
            <div className="md:col-span-9">
              <h3 className="font-display text-2xl">{p.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {p.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mt-2 inline-block h-px w-4 shrink-0 bg-accent" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ---------- Patient journey ---------- */

export function Journey() {
  return (
    <Section id="journey" eyebrow="08 — Patient Journey">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-7">
          <h2 className="font-display text-4xl md:text-5xl">
            Pacjent wyedukowany, to pacjent współpracujący.
          </h2>
          <p className="mt-6 text-muted-foreground">
            Pacjent opuszczający klinikę z zakrwawioną głową, bez planu,
            bez kontaktu — to nie tylko złe doświadczenie. Kortyzol w
            stresie pozabiegowym upośledza krążenie skórne. Lęk realnie
            pogarsza perfuzję skóry głowy i zwiększa ryzyko mechanicznej
            utraty graftów (drapanie, niewłaściwe mycie, zdejmowanie
            strupów przed czasem).
          </p>
          <p className="mt-4 text-muted-foreground">
            Każdy pacjent po zalogowaniu na Naszą stronę ma dostęp do
            materiałów dostępnych online (pełna dokumentacja oraz
            najnowsze trendy w medycynie regeneracyjnej, anti-aging) oraz
            e-book &bdquo;Patient Journey&rdquo; z instrukcjami na każdy z
            pierwszych 14 dni — co robić rano, wieczorem, czego nie
            robić, kiedy się niepokoić. Dodatkowo: bezpośredni kontakt do
            prowadzącego przez pierwsze 30 dni.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/panel"
              className="inline-flex items-center rounded-sm border border-foreground/80 bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
            >
              Wejdź do panelu pacjenta →
            </Link>
            <Link
              to="/przypomnienia"
              className="inline-flex items-center rounded-sm border border-foreground/80 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              Ustaw przypomnienia e-mail/SMS
            </Link>
          </div>
        </div>
        <aside className="md:col-span-5">
          <div className="rounded-sm border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              W e-booku
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>· Checklist na każdy z 14 dni</li>
              <li>· Lista zakupowa preparatów (HOCI, szampon pH 5,5, maść)</li>
              <li>· Diagramy: pozycja spania, technika mycia, kąt natrysku</li>
              <li>· Czerwone flagi wymagające kontaktu z kliniką</li>
              <li>· Plan reintrodukcji aktywności (sport, sauna, basen, słońce)</li>
            </ul>
          </div>
        </aside>
      </div>
    </Section>
  );
}

/* ---------- Day 0–3 Quick Guide ---------- */

export function DayZeroToThree() {
  return (
    <Section id="dzien-0-3" eyebrow="08a — Twój plan: Dzień 0–3">
      <SectionHeader
        title="Pierwsze 72 h decydują o przeżywalności graftów."
        lead="Instrukcje wzięte bezpośrednio z e-booka Patient Journey. Wykonuj krok po kroku — nie improwizuj."
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Dzień 0" badge="Bezpośrednio po zabiegu">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-accent">✓</span> Spanie w pozycji pół-siedzącej (30–45°)</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> PBM 650/830 nm, 4–6 J/cm², bezpośrednio po zabiegu</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> Pierwsza sesja HBOT 1,5–2,0 ATA w ciągu 6 h</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> Lód na czoło (nie na strefę biorczą)</li>
          </ul>
          <Mech>Zero dotykania, drapania, mycia strefy biorczej.</Mech>
        </Card>
        <Card title="Dni 1–2" badge="Krytyczne okno">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-accent">✓</span> Druga sesja HBOT (24 h po pierwszej)</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> PBM co 24 h, 20–30 min</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> Spray HOCl 0,01–0,02% na strefę dawczą</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> Spanie z głową uniesioną na 2 poduszkach</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> Nawodnienie ≥ 2,5 l wody / dobę</li>
          </ul>
          <Mech>Alkohol, palenie i kofeina obniżają perfuzję — absolutnie zakazane.</Mech>
        </Card>
        <Card title="Dni 3–4" badge="Pierwsze mycie">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-accent">✓</span> Pierwsze mycie wg instrukcji koordynatora (pH 5,5, bez SLS)</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> Spray HOCl 2× dziennie</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> Żele z arniką / centellą na strefę dawczą</li>
            <li className="flex gap-2"><span className="text-accent">✓</span> Kontynuacja PBM co 24 h</li>
          </ul>
          <Mech>Nie zrywaj strupków — myj delikatnie, bez tarcia.</Mech>
        </Card>
      </div>
      <div className="mt-10 rounded-sm border border-border bg-card p-6">
        <h3 className="font-display text-xl">Checklista „czego unikać” — Dzień 0–14</h3>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <div className="space-y-2">
            <p><span className="text-red-400">✗</span> Alkohol, palenie (vasokonstrykcja)</p>
            <p><span className="text-red-400">✗</span> Aspiryna, ibuprofen (pierwsze 48 h)</p>
            <p><span className="text-red-400">✗</span> Sauna, basen, słońce</p>
            <p><span className="text-red-400">✗</span> Intensywny trening, podnoszenie ciężarów</p>
          </div>
          <div className="space-y-2">
            <p><span className="text-red-400">✗</span> Czapki, kaski, hełmy ściskające skórę głowy</p>
            <p><span className="text-red-400">✗</span> Drapanie, zrywanie strupków</p>
            <p><span className="text-emerald-400">✓</span> Dieta bogata w białko, żelazo, cynk, witaminy B</p>
            <p><span className="text-emerald-400">✓</span> Regularny kontakt z koordynatorem</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- Evidence Basement Medicine ---------- */

type EvidenceLevel = "direct" | "indirect" | "interpretive";

type EvidenceClaim = {
  id: string;
  metric: string;
  value: string;
  timeframe: string;
  population: string;
  refs: string[];
  level: EvidenceLevel;
  rationale: string;
  gaps: string[];
};

const CLAIMS: EvidenceClaim[] = [
  {
    id: "c-survival",
    metric: "Przeżywalność graftów (baseline)",
    value: "90–95%",
    timeframe: "12 miesięcy po zabiegu",
    population: "Nowoczesne FU / DHI w renomowanych klinikach",
    refs: ["[1]"],
    level: "direct",
    rationale: "Zakres bezpośrednio raportowany w przeglądzie Parsley & Perez-Meza 2010 dla techniki FU.",
    gaps: ["Brak współczesnego head-to-head RCT porównującego DHI vs. FUE z zaślepioną oceną przeżywalności."],
  },
  {
    id: "c-llt-ex-vivo",
    metric: "Zysk przeżywalności po LLLT ex vivo",
    value: "5–8%",
    timeframe: "Ocena gęstości 4–6 miesięcy po zabiegu",
    population: "Split-scalp RCT (Tabaie 2016, n=10)",
    refs: ["[2]"],
    level: "interpretive",
    rationale: "Pojedynczy mały RCT split-scalp; wartość 5–8% to konserwatywna interpretacja kierunkowa, nie liczba z abstraktu.",
    gaps: [
      "Brak replikacji w niezależnym ośrodku.",
      "n=10 — moc statystyczna niska, szerokie przedziały ufności.",
      "Brak head-to-head dla DHI (oryginał: FUT/FUE).",
    ],
  },
  {
    id: "c-anagen",
    metric: "Przyspieszenie wejścia w anagen",
    value: "3–4 tygodnie wcześniej",
    timeframe: "Pierwsze 3–4 miesiące po zabiegu",
    population: "Pacjenci AGA leczeni 655 nm (Lanzafame 2013)",
    refs: ["[3]"],
    level: "interpretive",
    rationale: "Lanzafame 2013 raportuje +35% liczby włosów vs. sham w 16 tyg.; „3–4 tyg. szybciej w anagenie” to wnioskowanie z krzywej wzrostu, nie punkt końcowy badania.",
    gaps: [
      "Brak bezpośredniego pomiaru momentu wejścia w anagen w cytowanym RCT.",
      "Populacja AGA, nie pacjenci po DHI.",
    ],
  },
  {
    id: "c-shock-loss",
    metric: "Redukcja shock loss w okolicy biorczej",
    value: "20–30%",
    timeframe: "Tygodnie 2–8 po zabiegu",
    population: "Ekstrapolacja z RCT PBM w AGA (Lanzafame 2013; Jimenez 2014)",
    refs: ["[3]", "[4]"],
    level: "interpretive",
    rationale: "Brak pierwotnego RCT mierzącego „shock loss” po DHI z PBM; wartość 20–30% to ostrożna ekstrapolacja z efektu PBM na utrzymanie włosa w anagenie w AGA.",
    gaps: [
      "Brak head-to-head RCT: DHI + PBM vs. DHI + sham z punktem końcowym „shock loss”.",
      "Brak standaryzowanej definicji „shock loss” w cytowanych pracach.",
    ],
  },
  {
    id: "c-erythema",
    metric: "Szybsza redukcja rumienia pozabiegowego",
    value: "30–40%",
    timeframe: "Pierwsze 14 dni po zabiegu",
    population: "Split-face RCT po ablacji frakcyjnej (Couto 2024)",
    refs: ["[5]"],
    level: "direct",
    rationale: "Couto 2024 raportuje istotnie szybszą redukcję rumienia po PBM (red+blue+NIR) w pierwszych dniach gojenia po urazie ablacyjnym.",
    gaps: [
      "Model: ablacja frakcyjna skóry twarzy, nie nakłucia DHI skóry głowy — podobna kaskada zapalna, ale nieidentyczna.",
      "Brak replikacji w populacji po przeszczepie włosów.",
    ],
  },
  {
    id: "c-diameter",
    metric: "Przyrost średnicy łodygi włosa",
    value: "10–15%",
    timeframe: "12 miesięcy ciągłej terapii",
    population: "RCT PBM w AGA (Lanzafame 2013; Jimenez 2014)",
    refs: ["[3]", "[4]"],
    level: "indirect",
    rationale: "Cytowane RCT mierzyły gęstość/liczbę włosów; przyrost średnicy 10–15% to dolny zakres metaanaliz PBM w AGA.",
    gaps: [
      "Brak pomiaru średnicy łodygi w protokole pierwotnym Jimenez 2014 (punkt końcowy: hair count).",
      "Brak danych ≥24 mies. dla utrzymania efektu po odstawieniu PBM.",
    ],
  },
  {
    id: "c-dosing",
    metric: "Parametry dawkowania PBM",
    value: "630–680 nm · 3–5 J/cm² · 2–3×/tydz.",
    timeframe: "15–20 min/sesja, kuracja ≥6 mies.",
    population: "Przegląd Pillai & Mysore 2021",
    refs: ["[6]"],
    level: "direct",
    rationale: "Zakres parametrów bezpośrednio rekomendowany w przeglądzie roli LLLT w AGA.",
    gaps: ["Brak konsensusu między urządzeniami (czapki vs. lampy panelowe) co do dawki na cm² docierającej do brodawki włosa."],
  },
];

export function EvidenceBasement() {
  const [audit, setAudit] = useState(false);
  return (
    <Section id="evidence" eyebrow="09 — Evidence Basement Medicine">
      <SectionHeader title="Udokumentowana fotobiomodulacja jako terapia wspomagająca." />
      <div className="mb-6 flex items-center justify-end gap-3 text-xs">
        <span className="text-muted-foreground">Tryb audytu dowodów</span>
        <button
          type="button"
          onClick={() => setAudit((v) => !v)}
          aria-pressed={audit}
          className={`rounded-sm border px-2 py-0.5 uppercase tracking-wide ${audit ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent"}`}
        >
          {audit ? "Włączony" : "Wyłączony"}
        </button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Przeżywalność graftów">
          <p>
            Zabiegi przeszczepu włosów (szczególnie w renomowanych klinikach) cechują się naturalnie wysoką przeżywalnością na poziomie{" "}
            <strong className="text-foreground">90–95%</strong>
            <sup className="ml-0.5 text-accent">[1]</sup>.
          </p>
          <p className="mt-4">
            Badania RCT wykazują, że stosowanie PBM (650 nm) nie zwiększa w spektakularny sposób samej przeżywalności w liczbach bezwzględnych (trudno przekroczyć granicę 95%), ale dramatycznie ratuje grafty narażone na niedokrwienie (ischemia-reperfusion injury), co statystycznie daje zysk na poziomie{" "}
            <strong className="text-foreground">5–8%</strong>
            <sup className="ml-0.5 text-accent">[2]</sup> większej całkowitej liczby przyjętych jednostek w porównaniu do grupy placebo.
          </p>
        </Card>
        <Card title="Przyspieszenie anagenu i gojenia">
          <p>
            Normalnie, przeflancowane włosy wchodzą w fazę telogenu i wypadają po 2–4 tygodniach, a nowy anagen zaczyna się w 3–4 miesiącu.
          </p>
          <p className="mt-4">
            Według badań, u pacjentów naświetlanych falą 655 nm obserwowano wczesne wejście w anagen o średnio 3–4 tygodnie szybciej<sup className="ml-0.5 text-accent">[3]</sup>. Zmniejszeniu ulega również zjawisko „shock loss" (pooperacyjnego łysienia telogenowego) w okolicy biorczej, redukując jego skalę o około{" "}
            <strong className="text-foreground">20–30%</strong>
            <sup className="ml-0.5 text-accent">[3,4]</sup>.
          </p>
          <p className="mt-4">
            Stosowanie mieszanego światła (np. 633 nm + 830 nm) tuż po zabiegu prowadzi do szybszego odpadania strupów o około 3–5 dni. Zauważalna obiektywnie (pomiar spektrofotometryczny) redukcja rumienia pozabiegowego jest o{" "}
            <strong className="text-foreground">30–40%</strong>
            <sup className="ml-0.5 text-accent">[5]</sup> szybsza w pierwszych 14 dniach.
          </p>
        </Card>
        <Card title="Ostateczna gęstość i grubość włosa">
          <p>
            Rok po zabiegu, w grupach stosujących fototerapię (650 nm, 3× w tygodniu po 15–20 min), badania RCT odnotowują zwiększenie średnicy łodygi włosa średnio o{" "}
            <strong className="text-foreground">10–15%</strong>
            <sup className="ml-0.5 text-accent">[3,4]</sup> oraz ogólną wyższą gęstość obszaru (nie tylko dzięki graftom, ale stymulacji zminiaturyzowanych włosów natywnych wokół strefy biorczej).
          </p>
        </Card>
        <SourcesCard />
        {audit && <EvidenceAuditCard />}
      </div>
    </Section>
  );
}

function EvidenceAuditCard() {
  const summary = CLAIMS.reduce(
    (acc, c) => {
      acc[c.level] += 1;
      return acc;
    },
    { direct: 0, indirect: 0, interpretive: 0 } as Record<EvidenceLevel, number>,
  );
  const levelStyle: Record<EvidenceLevel, string> = {
    direct: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    indirect: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    interpretive: "border-red-500/40 bg-red-500/10 text-red-300",
  };
  const levelLabel: Record<EvidenceLevel, string> = {
    direct: "Bezpośrednie",
    indirect: "Pośrednie",
    interpretive: "Interpretacyjne",
  };
  const exportCSV = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = ["ID", "Metryka", "Wartość", "Okres", "Populacja", "Źródła", "Poziom dowodu", "Uzasadnienie", "Luki"];
    const rows = CLAIMS.map((c) =>
      [c.id, c.metric, c.value, c.timeframe, c.population, c.refs.join(" "), levelLabel[c.level], c.rationale, c.gaps.join(" | ")].map(esc).join(","),
    );
    const csv = "\uFEFF" + [header.map(esc).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audyt-dowodow-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const exportPDF = () => {
    const date = new Date().toLocaleString("pl-PL");
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const rowsHtml = CLAIMS.map(
      (c) => `
        <tr>
          <td><strong>${esc(c.value)}</strong><br/><span class="muted">${esc(c.metric)}</span></td>
          <td>${esc(c.timeframe)}</td>
          <td>${esc(c.population)}</td>
          <td>${esc(c.refs.join(", "))}</td>
          <td><span class="lvl ${c.level}">${levelLabel[c.level]}</span></td>
          <td>${esc(c.rationale)}<ul>${c.gaps.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></td>
        </tr>`,
    ).join("");
    const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"/>
<title>Audyt dowodów — Graftgen</title>
<style>
  *{box-sizing:border-box}body{font-family:-apple-system,Segoe UI,Inter,sans-serif;color:#111;margin:32px;font-size:11px;line-height:1.45}
  h1{font-size:18px;margin:0 0 4px}.meta{color:#666;font-size:10px;margin-bottom:16px}
  .summary{display:flex;gap:8px;margin:8px 0 16px}.chip{border:1px solid #ccc;padding:2px 8px;border-radius:3px;font-size:10px;text-transform:uppercase}
  .chip.direct{border-color:#059669;color:#059669;background:#ecfdf5}
  .chip.indirect{border-color:#d97706;color:#d97706;background:#fffbeb}
  .chip.interpretive{border-color:#dc2626;color:#dc2626;background:#fef2f2}
  table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;text-align:left;vertical-align:top}
  th{background:#f5f5f5;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
  .lvl{padding:2px 6px;border:1px solid;border-radius:3px;font-size:10px;text-transform:uppercase;white-space:nowrap}
  .lvl.direct{border-color:#059669;color:#059669;background:#ecfdf5}
  .lvl.indirect{border-color:#d97706;color:#d97706;background:#fffbeb}
  .lvl.interpretive{border-color:#dc2626;color:#dc2626;background:#fef2f2}
  ul{margin:6px 0 0 16px;padding:0;color:#92400e}.muted{color:#666}
  .gap-note{margin-top:18px;padding:10px;border:1px solid #f59e0b;background:#fffbeb;font-size:10px;color:#78350f}
  @media print{body{margin:14mm}}
</style></head><body>
<h1>Audyt dowodów — Evidence Basement Medicine</h1>
<div class="meta">Graftgen · Wygenerowano: ${esc(date)}</div>
<div class="summary">
  <span class="chip direct">Bezpośrednie: ${summary.direct}</span>
  <span class="chip indirect">Pośrednie: ${summary.indirect}</span>
  <span class="chip interpretive">Interpretacyjne: ${summary.interpretive}</span>
</div>
<table><thead><tr><th>Wartość / metryka</th><th>Okres</th><th>Populacja</th><th>Źródła</th><th>Poziom</th><th>Uzasadnienie i luki</th></tr></thead>
<tbody>${rowsHtml}</tbody></table>
<div class="gap-note"><strong>Kluczowa luka systemowa:</strong> Brak prospektywnego, head-to-head RCT „DHI + PBM/HBOT/LADD” vs. „DHI + standardowa opieka” z zaślepioną oceną przeżywalności graftów, czasu ustępowania rumienia i shock loss.</div>
<script>window.addEventListener("load",()=>{setTimeout(()=>window.print(),250)});</script>
</body></html>`;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };
  const exportJSON = () => {
    const payload = {
      meta: {
        title: "Audyt dowodów — Evidence Basement Medicine",
        generatedBy: "Graftgen",
        generatedAt: new Date().toISOString(),
        version: "1.0",
      },
      summary: {
        direct: summary.direct,
        indirect: summary.indirect,
        interpretive: summary.interpretive,
        total: CLAIMS.length,
      },
      claims: CLAIMS.map((c) => ({
        id: c.id,
        metric: c.metric,
        value: c.value,
        timeframe: c.timeframe,
        population: c.population,
        refs: c.refs,
        level: c.level,
        levelLabel: levelLabel[c.level],
        rationale: c.rationale,
        gaps: c.gaps,
      })),
      systemGap:
        "Brak prospektywnego, head-to-head RCT „DHI + PBM/HBOT/LADD” vs. „DHI + standardowa opieka” z zaślepioną oceną przeżywalności graftów, czasu ustępowania rumienia i shock loss.",
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audyt-dowodow-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Card title="Audyt dowodów — mapowanie liczb na źródła i luki">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-xs italic text-muted-foreground">
          Każda wartość procentowa i okres czasu z sekcji wyżej została zmapowana do konkretnego źródła oraz oznaczona poziomem dowodu:
          <strong className="ml-1 text-emerald-300">Bezpośredni</strong> (liczba z wyniku),
          <strong className="ml-1 text-amber-300">Pośredni</strong> (ekstrapolacja z pokrewnego punktu końcowego),
          <strong className="ml-1 text-red-300">Interpretacyjny</strong> (wnioskowanie kliniczne — wymaga replikacji).
        </p>
        <div className="flex shrink-0 gap-2 text-[10px] uppercase tracking-wide">
          <button type="button" onClick={exportCSV} className="rounded-sm border border-border px-2 py-1 hover:border-accent hover:text-accent">
            Eksport CSV
          </button>
          <button type="button" onClick={exportPDF} className="rounded-sm border border-accent bg-accent/10 px-2 py-1 text-accent hover:bg-accent/20">
            Eksport PDF
          </button>
          <button type="button" onClick={exportJSON} className="rounded-sm border border-border px-2 py-1 hover:border-accent hover:text-accent">
            Eksport JSON
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide">
        <span className="rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">Bezpośrednie: {summary.direct}</span>
        <span className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-300">Pośrednie: {summary.indirect}</span>
        <span className="rounded-sm border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-red-300">Interpretacyjne: {summary.interpretive}</span>
      </div>

      <ol className="mt-4 space-y-4 text-xs">
        {CLAIMS.map((c) => (
          <li key={c.id} className="border-l-2 border-border pl-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <strong className="text-foreground">{c.value}</strong>
              <span className="text-muted-foreground">— {c.metric}</span>
              <span className={`ml-auto rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${levelStyle[c.level]}`}>
                {levelLabel[c.level]}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Okres: {c.timeframe} · Populacja: {c.population} · Źródła: <span className="text-accent">{c.refs.join(", ")}</span>
            </div>
            <div className="mt-1.5">{c.rationale}</div>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-amber-300/90">
              {c.gaps.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <div className="mt-5 rounded-sm border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-200/90">
        <strong className="block text-amber-300">Kluczowa luka systemowa:</strong>
        Brak prospektywnego, head-to-head RCT „DHI + PBM/HBOT/LADD” vs. „DHI + standardowa opieka” z zaślepioną oceną przeżywalności graftów, czasu ustępowania rumienia i shock loss. Większość liczb prezentowanych powyżej to synteza z populacji AGA i okołozabiegowego gojenia po ablacji frakcyjnej. Komunikujemy je z pełną świadomością tego ograniczenia.
      </div>
    </Card>
  );
}

type RefEntry = {
  id: string;
  num: string;
  citation: ReactNode;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  note: ReactNode;
};

const REFERENCES: RefEntry[] = [
  {
    id: "ref-1",
    num: "[1]",
    citation: (
      <>
        Parsley WM, Perez-Meza D. Review of Factors Affecting the Growth and Survival of Follicular Grafts. <em>J Cutan Aesthet Surg</em>. 2010;3(2):69–75.
      </>
    ),
    doi: "10.4103/0974-2077.69014",
    pmid: "21031062",
    pmcid: "PMC2956960",
    note: <>Wspiera: <strong>90–95%</strong> przeżywalności graftów (zakres raportowany w przeglądzie dla nowoczesnej techniki FU).</>,
  },
  {
    id: "ref-2",
    num: "[2]",
    citation: (
      <>
        Tabaie SM, Berenji Ardestani H, Azizjalali MH. The Effect of One Session Low Level Laser Therapy of Extracted Follicular Units on the Outcome of Hair Transplantation. <em>J Lasers Med Sci</em>. 2016;7(1):26–29.
      </>
    ),
    doi: "10.15171/jlms.2016.06",
    pmcid: "PMC4908985",
    note: <>Wspiera: kierunkowo <strong>5–8%</strong> zysku przeżywalności po LLLT ex vivo (RCT split-scalp, n=10; ostrożna interpretacja, nie cytat z abstraktu).</>,
  },
  {
    id: "ref-3",
    num: "[3]",
    citation: (
      <>
        Lanzafame RJ, Blanche RR, Bodian AB i wsp. The growth of human scalp hair mediated by visible red light laser and LED sources in males. <em>Lasers Surg Med</em>. 2013;45(8):487–495.
      </>
    ),
    doi: "10.1002/lsm.22173",
    pmid: "24078483",
    note: <>Wspiera: przyspieszenie anagenu (3–4 tyg.) oraz <strong>10–15%</strong> przyrostu średnicy/gęstości (RCT 655 nm: +35% liczby włosów vs. sham).</>,
  },
  {
    id: "ref-4",
    num: "[4]",
    citation: (
      <>
        Jimenez JJ, Wikramanayake TC, Bergfeld W i wsp. Efficacy and Safety of a Low-level Laser Device in the Treatment of Male and Female Pattern Hair Loss: A Multicenter, Randomized, Sham Device-controlled, Double-blind Study. <em>Am J Clin Dermatol</em>. 2014;15(2):115–127.
      </>
    ),
    doi: "10.1007/s40257-013-0060-6",
    pmid: "24474647",
    note: <>Wspiera: <strong>20–30%</strong> redukcji „shock loss" oraz <strong>10–15%</strong> przyrostu gęstości (wieloośrodkowy RCT, n=128/141, sham-controlled).</>,
  },
  {
    id: "ref-5",
    num: "[5]",
    citation: (
      <>
        Couto MR, Gomes A, Nogueira A i wsp. The effect of combined red, blue, and near-infrared LED photobiomodulation therapy on speed of wound healing after superficial ablative fractional resurfacing. <em>Lasers Med Sci</em>. 2024;39:108.
      </>
    ),
    doi: "10.1007/s10103-024-04042-x",
    pmid: "38532146",
    note: <>Wspiera: <strong>30–40%</strong> szybsza redukcja rumienia w pierwszych 14 dniach (RCT split-face po ablacji frakcyjnej).</>,
  },
  {
    id: "ref-6",
    num: "[6]",
    citation: (
      <>
        Pillai JK, Mysore V. Role of Low-Level Light Therapy (LLLT) in Androgenetic Alopecia. <em>J Cutan Aesthet Surg</em>. 2021;14(4):385–391.
      </>
    ),
    doi: "10.4103/JCAS.JCAS_218_20",
    pmcid: "PMC8906269",
    note: <>Tło dawkowania: 630–680 nm, 3–5 J/cm², 2–3×/tydz., 15–20 min — parametry zgodne z naszym protokołem.</>,
  },
  {
    id: "ref-7",
    num: "[7]",
    citation: (
      <>
        Avci P, Gupta GK, Clark J, Wikonkal N, Hamblin MR. Low-level laser (light) therapy (LLLT) for treatment of hair loss. <em>Lasers Surg Med</em>. 2014;46(2):144–151.
      </>
    ),
    doi: "10.1002/lsm.22170",
    pmid: "23970445",
    note: <>Mechanizm: cytochrom c oksydaza, ATP, NO — biologiczna podstawa wszystkich powyższych efektów.</>,
  },
];

function StatusBadge({ status, label, value, source, message }: { status: "ok" | "not_found" | "error" | "loading" | "skipped"; label: string; value: string; source: string; message?: string }) {
  const styles: Record<string, string> = {
    ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    not_found: "border-red-500/40 bg-red-500/10 text-red-300",
    error: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    loading: "border-muted-foreground/30 bg-muted/20 text-muted-foreground",
    skipped: "border-muted-foreground/30 bg-muted/20 text-muted-foreground",
  };
  const icon = status === "ok" ? "✓" : status === "not_found" ? "✗" : status === "error" ? "!" : "…";
  const title =
    status === "ok"
      ? `Zweryfikowano w ${source}`
      : status === "not_found"
        ? `Nie znaleziono w ${source}`
        : status === "error"
          ? `Błąd weryfikacji (${source})${message ? `: ${message}` : ""}`
          : `Weryfikacja w ${source}…`;
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[status]}`}
    >
      <span aria-hidden>{icon}</span>
      <span>
        {label}: {value}
      </span>
    </span>
  );
}

function SourcesCard() {
  const validate = useServerFn(validateReferences);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["ref-validation", REFERENCES.map((r) => r.id).join(",")],
    queryFn: () =>
      validate({
        data: {
          refs: REFERENCES.map(({ id, doi, pmid, pmcid }) => ({ id, doi, pmid, pmcid })),
        },
      }),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  const byId = new Map<string, RefValidation>((data ?? []).map((d) => [d.id, d]));
  const allOk = data && data.every((d) => [d.doi, d.pmid, d.pmcid].every((c) => !c || c.status === "ok"));

  return (
    <Card title="Źródła (RCT i przeglądy) — z automatyczną weryfikacją identyfikatorów">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs italic text-muted-foreground">
          Każdy DOI sprawdzamy w Crossref, PMID i PMCID w NCBI E-utilities. Status pokazujemy obok każdej pozycji.
        </p>
        <div className="flex items-center gap-2 text-xs">
          {isLoading || isFetching ? (
            <span className="text-muted-foreground">Weryfikacja…</span>
          ) : isError ? (
            <span className="text-amber-300">Błąd weryfikacji</span>
          ) : allOk ? (
            <span className="text-emerald-300">Wszystkie identyfikatory poprawne</span>
          ) : (
            <span className="text-amber-300">Część identyfikatorów wymaga uwagi</span>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-sm border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide hover:border-accent disabled:opacity-50"
          >
            Sprawdź ponownie
          </button>
        </div>
      </div>
      <ol className="mt-4 space-y-4 text-xs">
        {REFERENCES.map((r) => {
          const v = byId.get(r.id);
          const status = (k: "doi" | "pmid" | "pmcid") => {
            if (isLoading || !v) return "loading" as const;
            const c = v[k];
            return c ? c.status : null;
          };
          return (
            <li key={r.id}>
              <span className="text-accent">{r.num}</span> {r.citation}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {r.doi && (
                  <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noopener noreferrer">
                    <StatusBadge status={status("doi") ?? "error"} label="DOI" value={r.doi} source="Crossref" message={v?.doi?.message} />
                  </a>
                )}
                {r.pmid && (
                  <a href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`} target="_blank" rel="noopener noreferrer">
                    <StatusBadge status={status("pmid") ?? "error"} label="PMID" value={r.pmid} source="NCBI PubMed" message={v?.pmid?.message} />
                  </a>
                )}
                {r.pmcid && (
                  <a href={`https://www.ncbi.nlm.nih.gov/pmc/articles/${r.pmcid}/`} target="_blank" rel="noopener noreferrer">
                    <StatusBadge status={status("pmcid") ?? "error"} label="PMCID" value={r.pmcid} source="NCBI PMC" message={v?.pmcid?.message} />
                  </a>
                )}
              </div>
              <div className="mt-1 text-muted-foreground">{r.note}</div>
            </li>
          );
        })}
      </ol>
      {data && (
        <p className="mt-4 text-[10px] italic text-muted-foreground">
          Ostatnia weryfikacja: {new Date(data[0]?.checkedAt ?? Date.now()).toLocaleString("pl-PL")} · Crossref REST API · NCBI E-utilities (esummary).
        </p>
      )}
    </Card>
  );
}

/* ---------- FAQ ---------- */

export function FAQSection() {
  return (
    <Section id="faq" eyebrow="09 — Pytania pacjentów">
      <SectionHeader title="To, o co pytacie najczęściej." />
      <div className="divide-y divide-border border-y border-border">
        {FAQ.map((f) => (
          <details key={f.q} className="group py-6">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
              <h3 className="font-display text-xl break-words md:text-2xl">{f.q}</h3>
              <span className="mt-2 shrink-0 font-display text-2xl text-accent transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Pricing ---------- */

export function Pricing() {
  return (
    <Section id="cennik" eyebrow="10 — Cennik / Sklep">
      <SectionHeader
        title="Pełny cennik i zakup pakietów — w sklepie."
        lead={
          <>
            Cennik zabiegów wspierających przeniesiony do <strong>sklepu Graftgen.</strong>.
            Pakiety 1 / 5 / 10 / 20 sesji z natychmiastową rezerwacją, bezpieczna płatność
            online, faktura VAT.&nbsp;
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PRICING.map((p) => (
          <Link
            key={p.code}
            to="/product/$handle"
            params={{ handle: p.handle }}
            className="group flex flex-col rounded-sm border border-border bg-card p-6 transition hover:border-accent/60"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent">
              {p.code}
            </span>
            <h3 className="mt-3 font-display text-xl break-words md:text-2xl">{p.name}</h3>
            <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
              {p.params}
            </p>
            <div className="mt-6 flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">od</span>
              <span className="font-display text-2xl text-foreground">{p.single.price}</span>
            </div>
            <p className="mt-1 text-right text-[11px] text-muted-foreground">
              pakiet 20: {p.packs[2].unitPrice}/sesja
            </p>
            <span className="mt-6 inline-flex items-center text-sm text-accent transition group-hover:translate-x-1">
              Zobacz w sklepie →
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Pełne opisy pakietów, kalkulator czasu terapii, FAQ rozliczeniowe oraz koszyk
          z płatnością online znajdziesz na stronie sklepu.
        </p>
        <Link
          to="/sklep"
          className="inline-flex items-center rounded-sm border border-foreground/80 bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
        >
          Przejdź do sklepu →
        </Link>
      </div>
    </Section>
  );
}

/* ---------- CTA ---------- */

/* ---------- E-book "Patient Journey" lead magnet ---------- */

type EbookStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; accessUrl: string }
  | { kind: "error"; message: string };

export function EbookLeadMagnet() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<EbookStatus>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) {
      setStatus({ kind: "error", message: "Zaznacz zgodę, aby otrzymać e-book." });
      return;
    }
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/public/ebook-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, website }),
      });
      const data = await res.json();
      if (!res.ok || !data?.accessUrl) {
        throw new Error(data?.error ?? "request_failed");
      }
      setStatus({ kind: "success", accessUrl: data.accessUrl });
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          (err as Error).message === "validation_failed"
            ? "Sprawdź poprawność adresu e-mail."
            : "Nie udało się wysłać formularza. Spróbuj ponownie.",
      });
    }
  }

  return (
    <Section id="ebook" eyebrow="08 — Patient Journey">
      <div className="grid gap-12 md:grid-cols-12 md:items-start">
        <div className="md:col-span-7">
          <SectionHeader
            title={'Pobierz e-book „Patient Journey" — pierwsze 14 dni po zabiegu DHI.'}
            lead="Konkretny protokół dzień-po-dniu: HBOT, PBM, mikrobiom, mycie, sen, dieta, czego unikać. Bez lania wody — same instrukcje i twarde parametry."
          />
          <ul className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <li>· 8 rozdziałów (Dzień 0 → Dzień 14)</li>
            <li>· Parametry kliniczne (nm, J/cm², ATA)</li>
            <li>· Checklista: czego unikać 14 dni</li>
            <li>· Wersja do druku / PDF</li>
          </ul>
        </div>

        <div className="md:col-span-5">
          {status.kind === "success" ? (
            <div className="rounded-sm border border-accent/40 bg-accent/5 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-accent">
                Dostęp przyznany
              </p>
              <h3 className="mt-2 font-display text-2xl">
                E-book jest gotowy.
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Twój prywatny link dostępu — zachowaj go, aby wrócić do treści.
              </p>
              <a
                href={status.accessUrl}
                className="mt-5 inline-flex w-full items-center justify-center rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background hover:bg-foreground/90"
              >
                Otwórz e-book →
              </a>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-sm border border-border bg-card p-6"
            >
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Adres e-mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ty@przyklad.pl"
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              {/* honeypot */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />

              <label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                  required
                />
                <span>
                  Wyrażam zgodę na przetwarzanie adresu e-mail w celu
                  udostępnienia e-booka „Patient Journey" (
                  <Link to="/prywatnosc" className="underline">
                    polityka prywatności
                  </Link>
                  ).
                </span>
              </label>

              {status.kind === "error" && (
                <p className="mt-3 rounded-sm border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={status.kind === "submitting"}
                className="mt-5 inline-flex w-full items-center justify-center rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:opacity-50"
              >
                {status.kind === "submitting"
                  ? "Wysyłanie…"
                  : "Pobierz e-book →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}

export function CTA() {
  return (
    <section
      id="konsultacja"
      className="border-t border-border bg-primary text-primary-foreground"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="text-xs uppercase tracking-[0.25em] text-accent">
              Konsultacja kwalifikacyjna
            </p>
            <h2 className="mt-4 font-display text-4xl md:text-6xl">
              Sprawdźmy, które elementy protokołu mają sens w Twoim
              przypadku.
            </h2>
            <p className="mt-6 max-w-2xl text-primary-foreground/70">
              Konsultacja obejmuje trichoskopię, ocenę strefy dawczej,
              przegląd przeciwwskazań do HBOT i farmakoterapii oraz
              indywidualny plan na 90 dni. Czas: 45–60 minut.
            </p>
          </div>
          <div className="md:col-span-4">
            <a
              href="mailto:kontakt@protokol.example"
              className="flex w-full items-center justify-center rounded-sm bg-accent px-6 py-4 text-base font-medium text-accent-foreground transition hover:opacity-90"
            >
              Umów konsultację →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Contact ---------- */

type SmsNotify = { status: string; attempts: number };
type NotifySummary = {
  email: string;
  sms: SmsNotify[];
};

type ContactStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; receivedAt: string; notifications?: NotifySummary }
  | { kind: "error"; message: string };

export function Contact() {
  const [status, setStatus] = useState<ContactStatus>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setStatus({ kind: "submitting" });
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      topic: String(fd.get("topic") ?? ""),
      message: String(fd.get("message") ?? ""),
      consent: fd.get("consent") === "on",
      website: String(fd.get("website") ?? ""),
    };

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.error === "validation_failed" && data?.details?.fieldErrors) {
          const errs: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.details.fieldErrors)) {
            if (Array.isArray(v) && v[0]) errs[k] = String(v[0]);
          }
          setFieldErrors(errs);
          setStatus({ kind: "error", message: "Sprawdź zaznaczone pola." });
          return;
        }
        setStatus({ kind: "error", message: "Nie udało się wysłać wiadomości. Spróbuj ponownie." });
        return;
      }
      form.reset();
      setStatus({
        kind: "success",
        receivedAt: data.receivedAt ?? new Date().toISOString(),
        notifications: data.notifications,
      });
    } catch {
      setStatus({ kind: "error", message: "Błąd połączenia. Spróbuj ponownie." });
    }
  }

  return (
    <Section id="kontakt" eyebrow="11 — Kontakt">
      <SectionHeader
        title="Napisz do nas"
        lead={
          <>
            Masz pytanie o protokół, kwalifikację do HBOT lub LADD, albo chcesz
            zaprosić nas do współpracy? Wyślij wiadomość — odpowiadamy w ciągu
            2 dni roboczych.
          </>
        }
      />
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-7">
          {status.kind === "success" ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-sm border border-accent/40 bg-secondary/40 p-6 md:p-8"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-accent">
                Wiadomość wysłana
              </p>
              <h3 className="mt-3 font-display text-2xl md:text-3xl">
                Dziękujemy — odezwiemy się.
              </h3>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                Potwierdzenie przyjęcia: {new Date(status.receivedAt).toLocaleString("pl-PL")}.
                Sprawdź skrzynkę e-mail (również SPAM) w ciągu 2 dni roboczych.
              </p>

              {status.notifications && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  {status.notifications.sms.map((s, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 ${
                        s.status === "sent"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                          : s.status === "skipped"
                            ? "border-muted-foreground/30 bg-secondary/50 text-muted-foreground"
                            : "border-destructive/40 bg-destructive/10 text-destructive"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          s.status === "sent" ? "bg-emerald-400" : s.status === "skipped" ? "bg-muted-foreground" : "bg-destructive"
                        }`}
                      />
                      SMS {s.status === "sent" ? "wysłano" : s.status === "skipped" ? "pominięto" : "błąd"}
                      {s.attempts > 0 && (
                        <span className="ml-1 opacity-70">· {s.attempts} {s.attempts === 1 ? "próba" : s.attempts < 5 ? "próby" : "prób"}</span>
                      )}
                    </span>
                  ))}

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 ${
                      status.notifications.email === "sent"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : status.notifications.email === "skipped"
                          ? "border-muted-foreground/30 bg-secondary/50 text-muted-foreground"
                          : "border-destructive/40 bg-destructive/10 text-destructive"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        status.notifications.email === "sent"
                          ? "bg-emerald-400"
                          : status.notifications.email === "skipped"
                            ? "bg-muted-foreground"
                            : "bg-destructive"
                      }`}
                    />
                    E-mail {status.notifications.email === "sent" ? "wysłano" : status.notifications.email === "skipped" ? "pominięto" : "błąd"}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setStatus({ kind: "idle" })}
                className="mt-6 inline-flex items-center rounded-sm border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground transition hover:bg-secondary"
              >
                Wyślij kolejną wiadomość
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              {/* Honeypot */}
              <div className="hidden" aria-hidden="true">
                <label>
                  Strona WWW
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <Field label="Imię i nazwisko" name="name" error={fieldErrors.name}>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  maxLength={100}
                  autoComplete="name"
                  className="w-full rounded-sm border border-border bg-background px-4 py-3 text-base text-foreground outline-none focus:border-accent"
                />
              </Field>

              <Field label="E-mail" name="email" error={fieldErrors.email}>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="email"
                  className="w-full rounded-sm border border-border bg-background px-4 py-3 text-base text-foreground outline-none focus:border-accent"
                />
              </Field>

              <Field label="Temat" name="topic" error={fieldErrors.topic}>
                <select
                  id="contact-topic"
                  name="topic"
                  required
                  defaultValue=""
                  className="w-full rounded-sm border border-border bg-background px-4 py-3 text-base text-foreground outline-none focus:border-accent"
                >
                  <option value="" disabled>
                    Wybierz temat…
                  </option>
                  <option value="konsultacja">Konsultacja</option>
                  <option value="zabieg">Zabieg</option>
                  <option value="ladd_prp">LADD / PRP + minoksydyl</option>
                  <option value="inne">Inne</option>
                </select>
              </Field>

              <Field label="Wiadomość" name="message" error={fieldErrors.message}>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={6}
                  className="w-full rounded-sm border border-border bg-background px-4 py-3 text-base text-foreground outline-none focus:border-accent"
                />
              </Field>

              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  className="mt-1 h-4 w-4 rounded-sm border-border accent-[color:var(--accent)]"
                />
                <span>
                  Wyrażam zgodę na przetwarzanie moich danych w celu odpowiedzi na
                  zapytanie zgodnie z{" "}
                  <Link to="/prywatnosc" className="underline underline-offset-2 hover:text-foreground">
                    Polityką prywatności
                  </Link>
                  .
                </span>
              </label>
              {fieldErrors.consent && (
                <p className="text-xs text-destructive">{fieldErrors.consent}</p>
              )}

              {status.kind === "error" && (
                <p role="alert" className="text-sm text-destructive">
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={status.kind === "submitting"}
                className="inline-flex items-center rounded-sm bg-accent px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {status.kind === "submitting" ? "Wysyłanie…" : "Wyślij wiadomość"}
              </button>
            </form>
          )}
        </div>

        <aside className="md:col-span-5">
          <div className="rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-editorial)] md:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Kontakt bezpośredni
            </p>
            <p className="mt-4 font-display text-2xl">Medical Lasers and STEM Cells Solutions Sp. z o.o.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              ul. Kard. Bolesława Kominka 44<br />
              44-217 Rybnik
            </p>
            <dl className="mt-6 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">E-mail</dt>
                <dd className="mt-1">
                  <a href="mailto:mila.skrzynska@gmail.com" className="underline underline-offset-2">
                    mila.skrzynska@gmail.com
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Telefon</dt>
                <dd className="mt-1">
                  <a href="tel:+48510432361" className="underline underline-offset-2">
                    +48 510 432 361
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">WhatsApp</dt>
                <dd className="mt-1">
                  <a
                    href="https://wa.me/48510432361"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm bg-emerald-600 px-3 py-2 text-xs font-medium uppercase tracking-[0.15em] text-white transition hover:bg-emerald-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Napisz na WhatsApp
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Czas odpowiedzi</dt>
                <dd className="mt-1 text-muted-foreground">do 2 dni roboczych</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </Section>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`contact-${name}`} className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      {children}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
