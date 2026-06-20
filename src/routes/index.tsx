import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, useEffect, useRef, useState } from "react";
import mscLogo from "@/assets/msc-logo.jpeg.asset.json";
import bujokLogo from "@/assets/bujok-medical.jpg.asset.json";
import mabelLogo from "@/assets/mabel-hair.png.asset.json";
import graftgenLogo from "@/assets/graftgen-logo.jpg.asset.json";
import drBujok from "@/assets/dr-bujok.jpg.asset.json";

import laddVideo from "@/assets/ladd.mp4.asset.json";
import laddPoster from "@/assets/ladd-poster.jpg";
import { CartDrawer } from "@/components/CartDrawer";
import { LazyMount } from "@/components/LazyMount";
import { Section, SectionHeader, Para, Card, Mech } from "@/components/section-primitives";
import {
  MicrobiomeSkeleton,
  TimelineSkeleton,
  JourneySkeleton,
  DayZeroToThreeSkeleton,
  EvidenceBasementSkeleton,
  PricingSkeleton,
  FAQSkeleton,
  CTASkeleton,
  ContactSkeleton,
} from "@/components/section-skeletons";
import { FAQ } from "@/lib/faq-data";

/* ---------- Code-split heavy below-the-fold sections ----------
   Each lazy() resolves to a separate chunk that is fetched only when
   the corresponding LazyMount intersects the viewport. */
const Microbiome = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.Microbiome })),
);
const Timeline = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.Timeline })),
);
const InteractiveSchedule = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.InteractiveSchedule })),
);

const Journey = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.Journey })),
);
const EvidenceBasement = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.EvidenceBasement })),
);
const Pricing = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.Pricing })),
);
const FAQSection = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.FAQSection })),
);
const EbookLeadMagnet = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.EbookLeadMagnet })),
);
const DayZeroToThree = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.DayZeroToThree })),
);
const CTA = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.CTA })),
);
const RisksAndContraindications = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.RisksAndContraindications })),
);
const Contact = lazy(() =>
  import("./-sections/below-fold").then((m) => ({ default: m.Contact })),
);

const TITLE = "Protokół po przeszczepie DHI — PBM, HBOT, LADD";
const DESCRIPTION =
  "Zintegrowany protokół po przeszczepie włosów DHI: ochrona ex vivo, fotobiomodulacja, HBOT i LADD. Zwiększ przeżywalność graftów dzięki metodom EBM.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "https://graftgen.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://graftgen.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: "pl",
          about: {
            "@type": "MedicalProcedure",
            name: "Protokół pozabiegowy po przeszczepie włosów metodą DHI",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Index,
});

const heroFaq = [
  {
    q: "Kiedy zaczyna się fototerapia po przeszczepie DHI?",
    a: "Pierwsza sesja PBM (630–680 + 830 nm) odbywa się w Doba „Zero” — bezpośrednio po założeniu opatrunku, jeśli nie występuje czynne krwawienie. W pierwszych 7 dniach wykonujemy sesje codziennie lub co drugi dzień, a potem 2–3 razy w tygodniu do końca tygodnia 4.",
  },
  {
    q: "Kiedy rozpoczynam hiperbarykę po zabiegu?",
    a: "Sesja HBOT zaczyna się najpóźniej w Doba „Zero” (dzień zabiegu). Optymalny schemat: 2 sesje w dobie 0. i 1. (ciśnienie 1,5–3,0 ATA, 60–90 min), a następnie 3–5 sesji w tygodniach 1–2. Im wcześniej dotlenimy hipoksyjną tkankę, tym więcej graftów przejdzie krytyczne okno niedokrwienia.",
  },
  {
    q: "Czy protokół jest obowiązkowy po każdym przeszczepie?",
    a: "Nie jest obowiązkowy, ale każdy jego element ma wsparcie w randomizowanych badaniach (RCT). Zalecamy go szczególnie przy liczbie graftów >2500, gęstej strefie biorczej lub wcześniejszych niepowodzeniach transplantacji.",
  },
  {
    q: "Czy mogę wybrać tylko jedną terapię zamiast całego pakietu?",
    a: "Tak, ale pełny efekt synergetyczny osiąga się przy połączeniu PBM + HBOT + LADD + pielęgnacji skórnym. Każda metoda działa na innym etapie: ochrona metaboliczna (ex vivo), dotlenienie (HBOT), regeneracja mitochondrialna (PBM) i wnikanie aktywnych składników (LADD).",
  },
  {
    q: "Ile trwa intensywna faza protokołu?",
    a: "Faza intensywna to 14 dni — Ten okres warunkuje i jakość rewaskularyzacji. Po niej przechodzimy w fazę wspomagającą (LADD z PRP/minoksydylem, raporty biomedyczne), która trwa do 3–6 miesięcy.",
  },
  {
    q: "Czy muszę przebywać w Warszawie lub Gdańsku przez cały protokół?",
    a: "Nie. PBM i LADD wykonujemy w klinice Graftgen.com; HBOT w certyfikowanym ośrodku partnerskim. Możliwy jest też model hybrydowy — zabieg w Twojej klinice, a protokół pozabiegowy realizowany zdalnie z naszym koordynatorem i tygodniowymi raportami biomedycznymi.",
  },
];

function Index() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Nav />
      <main className="relative z-10">
        <Hero />
        <HeroFAQ />
        <Creator />
        <LazyMount minHeight={900} fallback={<DayZeroToThreeSkeleton />}><DayZeroToThree /></LazyMount>
        <Why />
        <ExVivo />
        <PBM />
        <HBOT />
        <LADD />
        <LazyMount minHeight={900} fallback={<MicrobiomeSkeleton />}><Microbiome /></LazyMount>
        <LazyMount minHeight={1300} fallback={<TimelineSkeleton />}><Timeline /></LazyMount>
        <LazyMount minHeight={900} fallback={<div style={{ minHeight: 900 }} />}><InteractiveSchedule /></LazyMount>

        <LazyMount minHeight={780} fallback={<JourneySkeleton />}><Journey /></LazyMount>
        <LazyMount minHeight={2100} fallback={<EvidenceBasementSkeleton />}><EvidenceBasement /></LazyMount>
        <LazyMount minHeight={1000} fallback={<PricingSkeleton />}><Pricing /></LazyMount>
        <LazyMount minHeight={1200} fallback={<FAQSkeleton />}><FAQSection /></LazyMount>
        <LazyMount minHeight={900} fallback={<div style={{ minHeight: 900 }} />}><RisksAndContraindications /></LazyMount>
        <LazyMount minHeight={620} fallback={<div style={{ minHeight: 620 }} />}><EbookLeadMagnet /></LazyMount>
        <LazyMount minHeight={520} fallback={<CTASkeleton />}><CTA /></LazyMount>
        <LazyMount minHeight={1080} fallback={<ContactSkeleton />}><Contact /></LazyMount>
      </main>
      <Footer />
    </div>
  );
}

/* ---------- Nav ---------- */

function Nav() {
  const [open, setOpen] = useState(false);
  const navLinks = [
    { href: "#ex-vivo", label: "Ex Vivo" },
    { href: "#pbm", label: "PBM" },
    { href: "#hbot", label: "HBOT" },
    { href: "#ladd", label: "LADD" },
    { href: "#protokol", label: "14 dni" },
    { to: "/sklep", label: "Sklep" },
    { to: "/panel", label: "Panel pacjenta" },
    { to: "/przypomnienia", label: "Przypomnienia" },
    { href: "#faq", label: "FAQ" },
    { href: "#kontakt", label: "Kontakt" },
  ] as const;

  return (
    <header className="relative z-20 border-b border-border/60">
      <div className="mx-auto flex h-20 md:h-24 max-w-6xl items-stretch justify-between px-6">
        <a href="#" className="flex items-stretch py-1.5" aria-label="Graftgen.com">
          <span
            className="block h-full overflow-hidden rounded-lg bg-background"
            style={{ aspectRatio: "414 / 430", width: "auto" }}
          >
            <img
              src={graftgenLogo.url}
              alt="Graftgen.com"
              width={414}
              height={430}
              decoding="async"
              fetchPriority="high"
              className="block h-full w-auto"
            />
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {navLinks.map((l) =>
            "to" in l ? (
              <Link key={l.to} to={l.to} className="hover:text-foreground">{l.label}</Link>
            ) : (
              <a key={l.href} href={l.href} className="hover:text-foreground">{l.label}</a>
            )
          )}
        </nav>

        <div className="flex items-center gap-3 self-center">
          <CartDrawer />
          <a
            href="#konsultacja"
            className="hidden md:inline-flex items-center rounded-sm border border-foreground/80 bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            Umów konsultację
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border/60 text-foreground md:hidden"
            aria-label={open ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={open}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background px-6 py-4 md:hidden">
          <div className="mb-4 flex justify-center">
            <img
              src={graftgenLogo.url}
              alt="Graftgen.com"
              width={414}
              height={430}
              decoding="async"
              className="h-[73px] w-auto"
            />
          </div>
          <nav className="flex flex-col gap-4 text-sm text-muted-foreground">
            {navLinks.map((l) =>
              "to" in l ? (
                <Link key={l.to} to={l.to} className="hover:text-foreground" onClick={() => setOpen(false)}>{l.label}</Link>
              ) : (
                <a key={l.href} href={l.href} className="hover:text-foreground" onClick={() => setOpen(false)}>{l.label}</a>
              )
            )}
            <a
              href="#konsultacja"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-sm bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90"
            >
              Umów konsultację
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ---------- Hero FAQ ---------- */

function HeroFAQ() {
  return (
    <section id="hero-faq" className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <p className="mb-6 text-xs uppercase tracking-[0.25em] text-accent">
          Najczęstsze pytania
        </p>
        <h2 className="font-display text-3xl leading-[1.05] md:text-4xl">
          Co pacjenci pytają najczęściej przed protokołem
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {heroFaq.map((item) => (
            <div key={item.q} className="border-l-2 border-accent pl-5">
              <h3 className="text-base font-medium leading-snug">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-12 md:py-28">
        <div className="md:col-span-8">
          <p className="mb-6 text-xs uppercase tracking-[0.25em] text-accent">
            Protokół kliniczny · DHI · evidence-based
          </p>
          <h1 className="font-display text-4xl leading-[1.02] break-words sm:text-5xl md:text-7xl">
            Protokół pozabiegowy oparty na ochronie metabolicznej graftów,
            fotobiomodulacji, <em className="text-accent">HBOT</em> i LADD.
          </h1>
          <p className="mt-8 max-w-2xl text-base text-muted-foreground md:text-lg">
            Pierwsze 48 godzin decyduje o przeżywalności graftów. Zamiast soli
            fizjologicznej i pasywnego gojenia — zintegrowany plan oparty
            na transplantologicznych płynach ochronnych, fotobiomodulacji
            650/830 nm, tlenoterapii hiperbarycznej 1,5–3,0 ATA oraz
            laserowo wspomaganym dostarczaniu leków (LADD).
          </p>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground/70">
            48 godzin = krytyczne okno przeżywalności graftów. Pełną
            rekonwalescencję prowadzimy systematycznie przez pierwsze 14 dni.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#konsultacja"
              className="inline-flex items-center rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
            >
              Umów konsultację
            </a>
            <a
              href="#protokol"
              className="inline-flex items-center rounded-sm border border-border px-5 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              Zobacz oś czasu 14 dni →
            </a>
          </div>
        </div>
        <aside className="md:col-span-4">
          <div className="rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-editorial)]">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Twarde liczby
            </p>
            <dl className="mt-6 space-y-5">
              <Stat k="650 / 830 nm" v="długości fal PBM stosowane bezpośrednio po zabiegu" />
              <Stat k="1,5–3,0 ATA" v="ciśnienie sesji HBOT w dobie 0. i 1." />
              <Stat k="4 °C" v="docelowa temperatura roztworu HypoThermosol + ATP-v" />
              <Stat k="48–72 h" v="okno krytycznego niedokrwienia graftu przed rewaskularyzacją" />
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-l-2 border-accent pl-4">
      <dt className="font-display text-2xl">{k}</dt>
      <dd className="mt-1 text-sm text-muted-foreground">{v}</dd>
    </div>
  );
}

/* ---------- Creator ---------- */

function Creator() {
  return (
    <section className="border-b border-border/60" aria-labelledby="creator-heading">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="mb-6 text-xs uppercase tracking-[0.25em] text-accent" aria-hidden="true">
          TWÓRCA PROJEKTU
        </p>
        <div className="grid items-start gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="overflow-hidden rounded-sm border border-border/60">
              <img
                src={drBujok.url}
                alt="Dr Bujok — twórca protokołu Graftgen.com"
                width={600}
                height={800}
                decoding="async"
                loading="lazy"
                className="block h-auto w-full object-cover"
              />
            </div>
          </div>
          <div className="md:col-span-8">
            <h2 id="creator-heading" className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-5xl">

              Specjalista chirurgii ogólnej, którego zawodową pasją są
              nowoczesne technologie stosowane w medycynie.
            </h2>
            <ul className="mt-8 list-disc space-y-5 pl-6 text-muted-foreground md:text-lg">
              <li>
                Twórca MySkinCode.pl — aplikacji MedTech SaaS wykorzystującej
                autorski AI engine do budowania złożonych protokołów
                zabiegowych z użyciem różnych technologii laserowych,
                rewitalizujących i Anti-Aging
              </li>
              <li>
                Twórca Projektu Mazowieckie Centrum Medycyny Laserowej — łączy
                doświadczenie chirurgiczne z potrzebami pacjenta, budując nowy
                model wczesnej opieki pooperacyjnej.
              </li>
              <li>
                Prowadzi autorskie szkolenia dla lekarzy z zakresu technologii
                laserowych w zabiegach mało inwazyjnych i rozwiązań skracających
                rekonwalescencję.
              </li>
              <li>
                Tworzy protokoły oparte na hiperbarii, laserobarii, polu
                magnetycznym, fototerapii i fotobiomodulacji. Zawsze podkreśla, że
                najlepsza technologia jest bezwartościowa bez empatii i partnerskiej relacji z pacjentem.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Why ---------- */

function Why() {
  return (
    <Section id="dlaczego" eyebrow="01 — DLACZEGO PIERWSZE 48 GODZIN?">
      <SectionHeader title="Okno, w którym decyduje się los każdego przeszczepionego włosa." />
      <div className="grid gap-8 md:grid-cols-3">
        <Para>
          Po ekstrakcji metodą DHI graft jest tkanką niedokrwioną. Od momentu
          pobrania do rewaskularyzacji w łożysku biorczym przeżywa wyłącznie
          dzięki dyfuzji tlenu z osocza otaczającego miejsce przeszczepu.
          Pierwsze naczynia włosowate dochodzą do brodawki włosa zwykle między
          48 - 96godz. Dla niedotlenionej cebulki włosa to krytyczny okres,
          który determinuje przyjęcie ostateczny efekt zabiegu.
        </Para>
        <Para>
          W tym czasie komórki macierzyste wybrzuszenia (bulge) i komórki
          brodawki włosowej (DPC) zużywają zapasy ATP. Po ich wyczerpaniu
          uruchamia się apoptoza. Każda godzina niedotlenienia to mierzalny
          spadek puli żywych mieszków.
        </Para>
        <Para>
          Kortyzol pacjenta w stresie pozabiegowym jest wazokonstryktorem.
          Lęk, ból i dezinformacja realnie pogarszają perfuzję skóry głowy
          — dlatego koordynacja opieki pozabiegowej nie jest dodatkiem,
          tylko parametrem klinicznym.
        </Para>
      </div>
    </Section>
  );
}

/* ---------- Ex Vivo ---------- */

function ExVivo() {
  return (
    <Section id="ex-vivo" eyebrow="02 — FAZA EX VIVO">
      <SectionHeader
        title="Ochrona metaboliczna graftów od momentu ekstrakcji."
        lead="Standardem w wielu klinikach wciąż jest 0,9% NaCl lub płyn Ringera. Z punktu widzenia transplantologii są to roztwory podtrzymujące osmolarność, nie chroniące metabolizmu komórki. W naszym protokole grafty trafiają do roztworów stosowanych w przechowywaniu narządów do przeszczepu."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="HypoThermosol FRS + liposomalny ATP (ATP-v)" badge="4 °C">
          <p>
            HypoThermosol FRS to buforowany roztwór hipotermiczny zawierający
            HEPES, mannitol, adenozynę, glutation, dekstran. Utrzymuje
            homeostazę jonową komórki w 2–8 °C ponad 24 h. Dodatek
            liposomalnego ATP dostarcza energii bezpośrednio do cytozolu
            — pompy Na⁺/K⁺-ATPazy działają, ciśnienie osmotyczne nie pęka,
            apoptoza zostaje wyciszona.
          </p>
          <Mech>
            0,9% NaCl: ATP wyczerpane w 2–4 h. HypoThermosol + ATP-v:
            żywotność komórek &gt; 90% po 12 h ex vivo.
          </Mech>
        </Card>
        <Card title="Kąpiel graftów w PRP przed implantacją" badge="VEGF · PDGF">
          <p>
            Autologiczne osocze bogatopłytkowe (1,5–6× koncentracji płytek
            bazowych) inkubuje grafty 10–20 min przed implantacją.
            Czynniki wzrostu (VEGF, PDGF-BB, EGF, IGF-1, TGF-β) wysycają
            mieszek jeszcze przed wszczepieniem, co skraca okno
            niedokrwienia i przyspiesza angiogenezę.
          </p>
          <Mech>
            VEGF → proliferacja komórek śródbłonka; PDGF → migracja
            pericytów; IGF-1 → utrzymanie anagenu komórek macierzystych
            bulge.
          </Mech>
        </Card>
      </div>
    </Section>
  );
}

/* ---------- PBM ---------- */

function PBM() {
  return (
    <Section id="pbm" eyebrow="03 — FOTOBIOMODULACJA (PBM / LLLT)">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          title="Światło 650 i 830 nm jako narzędzie bioenergetyczne."
          lead="Fotony o długości fali w oknie optycznym skóry (600–1100 nm) są absorbowane przez oksydazę c-cytochromową — kompleks IV mitochondrialnego łańcucha oddechowego. Efekt: wzrost produkcji ATP, krótkotrwała generacja RONS jako sygnał redoks, modulacja ekspresji genów odpowiedzialnych za przejście telogen → anagen."
        />
        <img
          src={graftgenLogo.url}
          alt="Graftgen.com"
          width={415}
          height={531}
          decoding="async"
          loading="lazy"
          className="mt-2 h-10 w-auto shrink-0 opacity-80 md:mt-0 md:h-12"
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Parametry sesji pozabiegowej" badge="20 min">
          <ul className="space-y-2 text-sm">
            <li>• 650 nm (czerwone) — penetracja 1–2 mm, naskórek i brodawka włosa</li>
            <li>• 830 nm (NIR) — penetracja 3–5 mm, głębokie brodawki, łożysko biorcze</li>
            <li>• Dawka 4–6 J/cm² na sesję (próg biostymulacji wg krzywej Arndta-Schulza)</li>
            <li>• Naświetlanie obszaru biorczego i dawczego bezpośrednio po zabiegu</li>
            <li>• Sesje kontynuowane co 24–48 h przez 14 dni</li>
          </ul>
        </Card>
        <Card title="Sprzęt w gabinecie" badge="3 lampy LED">
          <p>
            Dysponujemy trzema lampami LED o zweryfikowanym spektrum emisji
            (czerwone 630–660 nm oraz NIR 810–840 nm). Pomiar spektralny
            potwierdza zgodność z zakresem terapeutycznym opisanym w
            literaturze (m.in. Avci et al. 2014, Hamblin 2016). Sesja
            gabinetowa jest kontynuowana w domu przez pacjenta hełmem LLLT
            2x dziennie/tydz. przez 12 tygodni.
          </p>
          <Mech>
            PBM aktywuje również ścieżkę Wnt/β-katenina w komórkach
            brodawki włosa — kluczową dla wejścia w fazę anagenu.
          </Mech>
        </Card>
      </div>
    </Section>
  );
}

/* ---------- HBOT ---------- */

function HBOT() {
  return (
    <Section id="hbot" eyebrow="04 — TLENOTERAPIA HIPERBARYCZNA (HBOT)">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          title="Tlen dociera tam, gdzie krwinki czerwone jeszcze nie mogą dotrzeć."
          lead="Pod ciśnieniem 1,5–3,0 ATA przy oddychaniu 100% O₂ ciśnienie parcjalne tlenu we krwi tętniczej rośnie z ~100 mmHg do ~1100 mmHg. Tlen rozpuszczony fizycznie w surowicy krwi (prawo Henry'ego) dyfunduje do przeszczepionych cebulek zanim zostanie odtworzona ich sieć kapilarna."
        />
        <img
          src={graftgenLogo.url}
          alt="Graftgen.com"
          width={415}
          height={531}
          decoding="async"
          loading="lazy"
          className="mt-2 h-10 w-auto shrink-0 opacity-80 md:mt-0 md:h-12"
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Protokół sesji" badge="1,5–3,0 ATA">
          <ul className="space-y-2 text-sm">
            <li>• Sesja 1: Doba "Zero" po zabiegu, 60–90 min, 1,5–3,0 ATA</li>
            <li>• Sesja 2: doba 1 po zabiegu, 60–90 min</li>
            <li>• Opcjonalne sesje uzupełniające: doba 4 i 7</li>
            <li>• Kwalifikacja: brak czynnej infekcji ucha, brak nieleczonej odmy, brak ciężkiej POChP</li>
          </ul>
        </Card>
        <Card title="Mechanizm działania" badge="pO₂ ×10">
          <p>
            Przesycenie tlenem redukuje ryzyko martwicy graftu w oknie
            niedokrwienia, hamuje aktywację HIF-1α związaną z hipoksją,
            mobilizuje progenitorowe komórki śródbłonka ze szpiku
            (angiogeneza), działa bakteriostatycznie na bakterie
            beztlenowe.
          </p>
          <Mech>
            Współpracujemy z certyfikowanym ośrodkiem terapii
            hiperbarycznej.
          </Mech>
        </Card>
      </div>
    </Section>
  );
}

/* ---------- LADD ---------- */

function LADD() {
  const videoRef = useRef<HTMLVideoElement>(null);
  

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <Section id="ladd" eyebrow="05 — LADD: LASER-ASSISTED DRUG DELIVERY">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 flex-col">
          <SectionHeader
            title="Mikrokanały zamiast wcierania."
            lead={
              <>
                <strong className="font-bold">Laser-Assisted Drug Delivery</strong> to kontrolowane utworzenie pionowych mikrokanałów w warstwie rogowej, umożliwiających dostarczenie aktywnej substancji (minoksydyl, PRP, peptydy, eksosomy) na głębokość brodawki włosa. Skuteczność penetracji rośnie kilkukrotnie w porównaniu z aplikacją topową.
                <br />
                -----------------------------------------------------
                <br />
                Klasyczna <strong className="font-bold">mezoterapia igłowa</strong> zwiększa ryzyko odrzucenia graftu cebulki włosa, ponieważ depozyt leku może uciskać pączkujące naczynia, zaburzać neowaskularyzacj. Wielu pacjentów rezygnuje z zabiegów uzupełniających z obawy przed bólem. <strong className="font-bold">Protokoły laserowe LADD</strong> opracowano we współpracy z MySkinCode.pl
              </>
            }
          />
          <div className="mt-auto grid grid-cols-2 gap-3 pt-8 md:grid-cols-4">
            {[
              { src: mscLogo.url, alt: "MSC", w: 1920, h: 1920 },
              { src: bujokLogo.url, alt: "Medical Lasers and STEM Cells Solutions", w: 1024, h: 1024 },
              { src: mabelLogo.url, alt: "Mabel Hair Clinic", w: 372, h: 370 },
              { src: graftgenLogo.url, alt: "Graftgen.com — Post-Transplant Care", w: 414, h: 430 },
            ].map((logo) => (
              <div
                key={logo.alt}
                className="flex aspect-square items-center justify-center rounded-sm border border-border/60 bg-card p-3"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.w}
                  height={logo.h}
                  loading="lazy"
                  decoding="async"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
        <video
          ref={videoRef}
          src={laddVideo.url}
          poster={laddPoster}
          muted
          loop
          playsInline
          preload="none"
          className="w-full max-w-xs shrink-0 rounded-sm border border-border/60 shadow-lg md:max-w-sm"
        />
      </div>


      <div className="mt-8 overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-medium">Parametr</th>
              <th className="px-5 py-4 font-medium">Laser tulowy 1927 nm</th>
              <th className="px-5 py-4 font-medium">Zimna plazma atmosferyczna (CAP)</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-border [&>tr:last-child]:border-b-0">
            <Row label="Mechanizm" a="Ablacja frakcyjna H₂O" b="Nietermiczna jonizacja, RONS" />
            <Row label="Głębokość mikrokanałów" a="150–300 µm" b="50–100 µm" />
            <Row label="Downtime" a="24–72 h rumień, łuszczenie" b="Brak / minimalny" />
            <Row label="Bezpieczeństwo nad świeżym graftem" a="Od doby 14+" b="Możliwe od doby 7" />
            <Row label="Penetracja minoksydylu" a="Wysoka (×4–8)" b="Umiarkowana (×2–3)" />
            <Row label="Działanie antybakteryjne" a="Pośrednie" b="Bezpośrednie (RONS na biofilm)" />
            <Row label="Czas zabiegu" a="15–25 min" b="10–15 min" />
          </tbody>
        </table>
      </div>

    </Section>
  );
}

function Row({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <tr>
      <td className="px-5 py-4 font-medium text-foreground">{label}</td>
      <td className="px-5 py-4 text-muted-foreground">{a}</td>
      <td className="px-5 py-4 text-muted-foreground">{b}</td>
    </tr>
  );
}

/* ---------- Footer ---------- */

function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="font-display text-2xl">Protokół po przeszczepie</p>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Materiał edukacyjny dla pacjentów po przeszczepie włosów
              metodą DHI. Treści mają charakter informacyjny i nie
              zastępują indywidualnej konsultacji lekarskiej. Decyzje
              terapeutyczne podejmuje lekarz na podstawie pełnego wywiadu
              i badania.
            </p>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Sekcje
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#ex-vivo" className="hover:text-accent">Faza Ex Vivo</a></li>
              <li><a href="#pbm" className="hover:text-accent">Fotobiomodulacja</a></li>
              <li><a href="#hbot" className="hover:text-accent">HBOT</a></li>
              <li><a href="#ladd" className="hover:text-accent">LADD</a></li>
              <li><a href="#protokol" className="hover:text-accent">Oś czasu 14 dni</a></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Zastrzeżenia
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Brak gwarancji wyniku terapii</li>
              <li>Minoksydyl doustny — off-label</li>
              <li>HBOT — wskazanie komercyjne, nierefundowane</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Współtwórcy projektu
          </p>
          <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-3">
            <div className="flex items-center justify-center rounded-md bg-white p-4 h-24">
              <img src={mscLogo.url} alt="MySkinCode — Technical Support MedTech SaaS" width={1920} height={1920} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
            </div>
            <div className="flex items-center justify-center rounded-md bg-black p-4 h-24">
              <img src={bujokLogo.url} alt="Medical Lasers and STEM Cells Solutions" width={1024} height={1024} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
            </div>
            <div className="flex items-center justify-center rounded-md bg-[#3f4a73] p-4 h-24">
              <img src={mabelLogo.url} alt="Mabel Hair — Hair Transplant Clinic" width={372} height={370} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Protokół po przeszczepie. Wszystkie prawa zastrzeżone.</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/prywatnosc" className="hover:text-accent">Polityka prywatności i RODO</Link>
            <Link to="/cookies" className="hover:text-accent">Polityka cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
