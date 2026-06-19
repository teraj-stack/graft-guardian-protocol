import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { validateReferences, type RefValidation } from "@/lib/references.functions";
import { useEffect, useRef, useState } from "react";
import { getPricingOverrides } from "@/lib/pricing.functions";
import mscLogo from "@/assets/msc-logo.jpeg.asset.json";
import bujokLogo from "@/assets/bujok-medical.jpg.asset.json";
import mabelLogo from "@/assets/mabel-hair.png.asset.json";
import graftgenLogo from "@/assets/graftgen-logo.jpeg.asset.json";

import laddVideo from "@/assets/ladd.mp4.asset.json";
import laddPoster from "@/assets/ladd-poster.jpg";
import { CartDrawer } from "@/components/CartDrawer";

const TITLE = "Protokół po przeszczepie włosów — DHI, PBM, HBOT, LADD";
const DESCRIPTION =
  "Zintegrowany protokół po przeszczepie włosów DHI: ochrona ex vivo, fotobiomodulacja, HBOT i LADD. Zwiększ przeżywalność graftów dzięki metodom EBM.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "https://graft-guardian-protocol.lovable.app/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://graft-guardian-protocol.lovable.app/" }],
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
          mainEntity: faqJsonLd(),
        }),
      },
    ],
  }),
  component: Index,
});

function faqJsonLd() {
  return FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  }));
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "Czym różni się 650 nm od 830 nm w fotobiomodulacji skóry głowy?",
    a: "650 nm (czerwone) penetruje do 1–2 mm i działa głównie na poziomie naskórka, skóry właściwej oraz brodawki włosa. 830 nm (bliska podczerwień) sięga 3–5 mm, dociera do brodawek głębiej osadzonych mieszków i obrzękniętej tkanki podskórnej. Oba zakresy aktywują oksydazę c-cytochromową (kompleks IV łańcucha oddechowego), zwiększając produkcję ATP mitochondrialnego.",
  },
  {
    q: "Kiedy mogę umyć głowę po DHI?",
    a: "Pierwsze delikatne, bezdotykowe spłukiwanie obszaru biorczego solą fizjologiczną lub HOCI — od 48 godziny. Pełne mycie szamponem o pH 5,5 bez SLS — od doby 4. Tarcie i zdejmowanie strupów wyłącznie po 8. dobie. Wcześniejsze tarcie to najczęstsza mechaniczna przyczyna utraty graftów.",
  },
  {
    q: "Czy HBOT po przeszczepie włosów jest refundowany przez NFZ?",
    a: "Nie. Wskazania refundowane to m.in. zatrucia CO, choroba dekompresyjna, martwica radiacyjna, stopa cukrzycowa. Zastosowanie HBOT w transplantologii włosów to procedura komercyjna w ośrodkach prywatnych.",
  },
  {
    q: "Czy minoksydyl doustny w mikrodawkach jest bezpieczny?",
    a: "W dawkach 0,25–2,5 mg/dobę profil bezpieczeństwa u zdrowych dorosłych jest dobrze udokumentowany (m.in. Sinclair 2018, Randolph & Tosti 2021). Wymaga kwalifikacji lekarskiej, oceny ciśnienia tętniczego i wykluczenia przeciwwskazań kardiologicznych. Nie jest zarejestrowany w tym wskazaniu — stosowanie off-label.",
  },
  {
    q: "Po co PRP w roztworze przechowującym grafty?",
    a: "Osocze bogatopłytkowe zawiera VEGF, PDGF, EGF, IGF-1, TGF-β. Inkubacja graftów w PRP przed implantacją wysyca je czynnikami wzrostu, co przyspiesza angiogenezę i skraca okno niedokrwienia w pierwszych 48–72 godzinach po implantacji.",
  },
  {
    q: "Czym HypoThermosol różni się od soli fizjologicznej?",
    a: "0,9% NaCl ma osmolarność ~308 mOsm/L i nie zawiera żadnego buforu energetycznego — komórki przechowywane w niej w temperaturze 4°C wyczerpują ATP w ciągu 2–4 godzin. HypoThermosol FRS jest buforowanym roztworem hipotermicznym (zawiera HEPES, mannitol, adenozynę, glutation) zaprojektowanym dla narządów do transplantacji, utrzymującym homeostazę jonową przy 2–8°C nawet ponad 24 h.",
  },
  {
    q: "Laser tulowy 1927 nm czy zimna plazma — co wybrać do LADD?",
    a: "Laser tulowy frakcyjny 1927 nm to standard w LADD: kontrolowane mikrokanały głębokości 150–300 µm, krótki downtime, szeroko udokumentowana penetracja minoksydylu i peptydów. Zimna plazma atmosferyczna (CAP) działa nietermicznie — generuje RONS, zwiększa przepuszczalność warstwy rogowej bez ablacji, ale głębokość drug delivery jest mniejsza (~50–100 µm). Tulowy: większa penetracja, więcej energii w tkance. CAP: bezpieczniejszy bezpośrednio nad świeżymi graftami.",
  },
  {
    q: "Czy mogę pić alkohol i palić po zabiegu?",
    a: "Nikotyna powoduje skurcz naczyń obwodowych do 90 minut po każdej dawce — w oknie rewaskularyzacji (doba 0–7) zwiększa ryzyko martwicy graftów. Alkohol upośledza hemostazę i zwiększa obrzęk. Zalecane wstrzymanie obu używek minimum 14 dni.",
  },
  {
    q: "Kiedy zobaczę finalny efekt?",
    a: "Shock loss przeszczepionych włosów: tydzień 2–6. Wejście w anagen: miesiąc 3–4. Pierwsze widoczne zagęszczenie: miesiąc 6. Efekt końcowy: 12–15 miesięcy od zabiegu.",
  },
];

function Index() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Nav />
      <main className="relative z-10">
        <Hero />
        <Why />
        <ExVivo />
        <PBM />
        <HBOT />
        <LADD />
        <Microbiome />
        <Timeline />
        <Journey />
        <EvidenceBasement />
        <Pricing />
        <FAQSection />
        <CTA />
        <Contact />
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
    { href: "#cennik", label: "Cennik" },
    { to: "/sklep", label: "Sklep" },
    { to: "/panel", label: "Panel pacjenta" },
    { to: "/przypomnienia", label: "Przypomnienia" },
    { href: "#faq", label: "FAQ" },
    { href: "#kontakt", label: "Kontakt" },
  ] as const;

  return (
    <header className="relative z-20 border-b border-border/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="#" className="flex items-center gap-3" aria-label="Graftgen.com">
          <img src={graftgenLogo.url} alt="Graftgen.com" className="h-10 w-auto md:h-12" />
        </a>

        <nav className="hidden gap-7 text-sm text-muted-foreground md:flex">
          {navLinks.map((l) =>
            "to" in l ? (
              <Link key={l.to} to={l.to} className="hover:text-foreground">{l.label}</Link>
            ) : (
              <a key={l.href} href={l.href} className="hover:text-foreground">{l.label}</a>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
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
            Pierwsze 14 dni decyduje o przeżywalności graftów. Zamiast soli
            fizjologicznej i pasywnego gojenia — zintegrowany plan oparty
            na transplantologicznych płynach ochronnych, fotobiomodulacji
            650/830 nm, tlenoterapii hiperbarycznej 1,5–2,0 ATA oraz
            laserowo wspomaganym dostarczaniu leków (LADD).
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
              <Stat k="1,5–2,0 ATA" v="ciśnienie sesji HBOT w dobie 1. i 2." />
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

/* ---------- Why ---------- */

function Why() {
  return (
    <Section id="dlaczego" eyebrow="01 — Dlaczego pierwsze 14 dni">
      <SectionHeader title="Okno, w którym decyduje się los każdego graftu." />
      <div className="grid gap-8 md:grid-cols-3">
        <Para>
          Po ekstrakcji metodą DHI graft jest tkanką niedokrwioną. Od momentu
          pobrania do rewaskularyzacji w łożysku biorczym przeżywa wyłącznie
          dzięki dyfuzji z osocza otaczającego mikroranę. Pierwsze
          naczynia włosowate dochodzą do brodawki włosa zwykle między
          48. a 96. godziną.
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
          — dlatego &bdquo;znieczulenie wiedzą&rdquo; nie jest miękkim
          dodatkiem, tylko parametrem klinicznym.
        </Para>
      </div>
    </Section>
  );
}

/* ---------- Ex Vivo ---------- */

function ExVivo() {
  return (
    <Section id="ex-vivo" eyebrow="02 — Faza Ex Vivo">
      <SectionHeader
        title="Ochrona metaboliczna graftu od sekundy ekstrakcji."
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
    <Section id="pbm" eyebrow="03 — Fotobiomodulacja (PBM / LLLT)">
      <SectionHeader
        title="Światło 650 i 830 nm jako narzędzie bioenergetyczne."
        lead="Fotony o długości fali w oknie optycznym skóry (600–1100 nm) są absorbowane przez oksydazę c-cytochromową — kompleks IV mitochondrialnego łańcucha oddechowego. Efekt: wzrost produkcji ATP, krótkotrwała generacja RONS jako sygnał redoks, modulacja ekspresji genów odpowiedzialnych za przejście telogen → anagen."
      />
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
            3–4× w tygodniu przez 12 tygodni.
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
    <Section id="hbot" eyebrow="04 — Tlenoterapia hiperbaryczna (HBOT)">
      <SectionHeader
        title="Tlen dociera tam, gdzie krwinki czerwone jeszcze nie mogą dotrzeć."
        lead="Pod ciśnieniem 1,5–2,0 ATA przy oddychaniu 100% O₂ ciśnienie parcjalne tlenu we krwi tętniczej rośnie z ~100 mmHg do ~1100 mmHg. Tlen rozpuszczony fizycznie w plazmie (prawo Henry'ego) dyfunduje do graftów zanim zostanie odtworzona ich sieć kapilarna."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Protokół sesji" badge="1,5–2,0 ATA">
          <ul className="space-y-2 text-sm">
            <li>• Sesja 1: doba 1 po zabiegu, 60–90 min, 1,5–2,0 ATA</li>
            <li>• Sesja 2: doba 2 po zabiegu, 60–90 min</li>
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
  const [showDeleted, setShowDeleted] = useState(false);

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
    <Section id="ladd" eyebrow="05 — LADD: Laser-Assisted Drug Delivery">
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
                Klasyczna <strong className="font-bold">mezoterapia igłowa</strong> zwiększa ryzyko odrzucenia graftu cebulki włosa, ponieważ depozyt leku może uciskać pączkujące naczynia, zaburzać neowaskularyzacj. Wielu pacjentów rezygnuje z zabiegów uzupełniających z obawy przed bólem. Proponowane rozwiązania powstały dzięki współpracy z MySkinCode.pl
              </>
            }
          />
          <div className="mt-auto flex flex-wrap items-end gap-3 pt-8">
            {[
              { src: mscLogo.url, alt: "MySkinCode" },
              { src: bujokLogo.url, alt: "Medical Lasers and STEM Cells Solutions" },
              { src: mabelLogo.url, alt: "Mabel Hair Clinic" },
            ].map((logo) => (
              <div
                key={logo.alt}
                className="flex h-20 w-20 items-center justify-center rounded-sm border border-border/60 bg-card p-2 md:h-24 md:w-24"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  loading="lazy"
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

      {showDeleted ? (
        <div className="mt-6 rounded-sm border border-border/60 bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Rozważamy rozszerzenie protokołu o oba urządzenia: laser tulowy do sesji LADD od 4–6 tygodnia (głęboka penetracja minoksydylu i PRP) oraz zimną plazmę do wczesnej fazy gojenia (kontrola mikrobiomu, delikatna stymulacja, brak downtime).
            </p>
            <button
              onClick={() => setShowDeleted(false)}
              className="shrink-0 rounded-sm border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              type="button"
            >
              Usuń
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowDeleted(true)}
          className="mt-6 flex items-center gap-2 rounded-sm border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 13"/></svg>
          Przywróć usunięty akapit
        </button>
      )}

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

/* ---------- Microbiome ---------- */

function Microbiome() {
  return (
    <Section id="mikrobiom" eyebrow="06 — Mikrobiom i strefa dawcza">
      <SectionHeader
        title="Antyseptyka, która nie zabija graftu."
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

function Timeline() {
  const phases: { tag: string; title: string; bullets: string[] }[] = [
    {
      tag: "Śródzabiegowo",
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
        "HBOT 1,5–2,0 ATA: sesja 1. (doba 1), sesja 2. (doba 2)",
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

function Journey() {
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

/* ---------- Evidence Basement Medicine ---------- */

function EvidenceBasement() {
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

/* ---------- Evidence audit: claims ↔ sources mapping with gap analysis ---------- */

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

/* ---------- Sources with live DOI/PMID/PMCID validation ---------- */

type RefEntry = {
  id: string;
  num: string;
  citation: React.ReactNode;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  note: React.ReactNode;
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

function FAQSection() {
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

const PRICING: PricingItem[] = [
  {
    code: "HBOT",
    name: "Tlenoterapia hiperbaryczna",
    params: "60–90 min · 2,0–2,4 ATA · 100% O₂",
    single: { price: "420 zł", label: "Sesja pojedyncza" },
    packs: [
      { sessions: 5, price: "1 995 zł", unitPrice: "399 zł", saving: "5%" },
      { sessions: 10, price: "3 800 zł", unitPrice: "380 zł", saving: "10%" },
      { sessions: 20, price: "7 140 zł", unitPrice: "357 zł", saving: "15%" },
    ],
    scope: [
      "Kwalifikacja lekarska przed pierwszą sesją (medycyna hiperbaryczna).",
      "Sesja w komorze wieloosobowej lub monoplace: 60–90 min przy 2,0–2,4 ATA.",
      "Tlen 100% pod maską lub kaskiem przez cały czas ekspozycji.",
      "Pomiar ciśnienia tętniczego przed i po sesji.",
      "Raport końcowy z rekomendacją liczby sesji w cyklu.",
    ],
    note: "Średnia z najwyższych stawek ośrodków premium w Warszawie i Gdańsku (ATAmed, Vimed, Komora-Hiperbaryczna, Regeneracja Gdańsk).",
  },
  {
    code: "LADD",
    name: "LADD: PRP + minoksydyl",

    params: "Er:YAG / tul · PRP (Magellan/Arthrex) · minoksydyl topowo",
    single: { price: "2 400 zł", label: "Sesja pojedyncza" },
    packs: [
      { sessions: 5, price: "11 400 zł", unitPrice: "2 280 zł", saving: "5%" },
      { sessions: 10, price: "21 600 zł", unitPrice: "2 160 zł", saving: "10%" },
      { sessions: 20, price: "40 800 zł", unitPrice: "2 040 zł", saving: "15%" },
    ],
    scope: [
      "Konsultacja trychologiczna i dobór parametrów laserowych do fototypu.",
      "Przygotowanie skóry głowy: oczyszczenie, dezynfekcja, ewentualna znieczulenie.",
      "Ablacja laserowa frakcyjna (Er:YAG lub thulium): 5–10 min, głębokość 150–300 µm.",
      "Aplikacja osocza bogatopłytkowego PRP (8–10 ml, 3–5x stężenie płytek) z minoksydylem.",
      "Instruktaż domowy: pielęgnacja 48 h po zabiegu, harmonogram następnych sesji.",
    ],
    note: "Uśrednienie najwyższych cen PRP premium oraz zabiegów laser-assisted drug delivery w klinikach trychologicznych Warszawy i Gdańska.",
  },
  {
    code: "LADD-CP",
    name: "LADD: PRP + minoksydyl — zimna plazma",
    params: "CAP / zimna plazma · PRP (Magellan/Arthrex) · minoksydyl topowo",
    single: { price: "2 200 zł", label: "Sesja pojedyncza" },
    packs: [
      { sessions: 5, price: "10 450 zł", unitPrice: "2 090 zł", saving: "5%" },
      { sessions: 10, price: "19 800 zł", unitPrice: "1 980 zł", saving: "10%" },
      { sessions: 20, price: "37 400 zł", unitPrice: "1 870 zł", saving: "15%" },
    ],
    scope: [
      "Konsultacja trychologiczna i ocena tolerancji skóry na zimną plazmę.",
      "Przygotowanie skóry głowy: oczyszczenie, dezynfekcja, bez znieczulenia miejscowego.",
      "Aplikacja zimnej plazmy atmosferycznej (CAP): 10–15 min, głębokość ~50–100 µm.",
      "Aplikacja osocza bogatopłytkowego PRP (8–10 ml, 3–5x stężenie płytek) z minoksydylem.",
      "Instruktaż domowy: pielęgnacja 48 h po zabiegu, harmonogram następnych sesji.",
    ],
    note: "Uśrednienie najwyższych cen zabiegów z zimną plazmą (CAP) w połączeniu z PRP i minoksydylem w klinikach premium Warszawy i Gdańska.",
  },
  {
    code: "PBM",
    name: "Fototerapia (PBM / LLLT)",
    params: "630–680 nm · 5 J/cm² · 20–30 min",
    single: { price: "600 zł", label: "Sesja pojedyncza" },
    packs: [
      { sessions: 5, price: "2 850 zł", unitPrice: "570 zł", saving: "5%" },
      { sessions: 10, price: "4 800 zł", unitPrice: "480 zł", saving: "20%" },
      { sessions: 20, price: "9 000 zł", unitPrice: "450 zł", saving: "25%" },
    ],
    scope: [
      "Diagnostyka skóry głowy: trichoskopia przed cyklem i co 5 sesji.",
      "Dobór parametrów świetlnych: długość fali 630–680 nm, dawka ~5 J/cm².",
      "Sesja LED/PBM: 20–30 min z podziałem na strefy dawcy i biorcy.",
      "Pomiar temperatury skóry i ewentualna korekta dawki w czasie rzeczywistym.",
      "Raport z pomiarów: liczba mieszków w fazie anagen, grubość włosa, gęstość.",
    ],
    note: "Średnia z górnego przedziału cen klinik premium (Wellclinic, Hairmitage, Trycho-Med) dla zabiegów wykonywanych w gabinecie.",
  },
];

const PRICING_FAQ: { q: string; a: string }[] = [
  {
    q: "Czym różnią się pakiety 5, 10 i 20 sesji?",
    a: "Pakiet 5 sesji to forma wprowadzająca — sprawdza się jako uzupełnienie standardowego protokołu pozabiegowego (np. 2 sesje HBOT + 3 LADD). Pakiet 10 sesji to pełny cykl optymalny dla większości pacjentów po DHI, umożliwiający systematyczną rewaskularyzację i biostymulację. Pakiet 20 sesji to program intensywny, zalecany przy dużej liczbie graftów, łączonych terapiach (HBOT + LADD + PBM) lub skłonnościach do wolniejszej angiogenezy.",
  },
  {
    q: "Czy mogę zmienić pakiet w trakcie terapii?",
    a: "Tak. Jeśli po 3–4 sesjach zdecydujesz się na wyższy pakiet, różnica jest rozliczana według ceny jednostkowej nowego pakietu z wstecznym rabatem. Nie ma kar za przeskok w górę. Przejście w dół (z 20 na 10 sesji) możliwe jest do wykorzystania 50% pierwotnego pakietu.",
  },
  {
    q: "Jak wygląda rozliczenie i płatność?",
    a: "Rozliczenie odbywa się przed pierwszą sesją (przedpłata za cały pakiet) lub w dwóch równych ratach: 50% przed startem, 50% po realizacji 50% pakietu. Nie wymagamy umów abonamentowych ani automatycznych obciążeń. Wystawiamy fakturę VAT.",
  },
  {
    q: "Czy niewykorzystane sesje przepadają?",
    a: "Nie. Sesje są ważne 12 miesięcy od daty zakupu. Możesz je zawiesić w dowolnym momencie (np. w przypadku konieczności wyjazdu) lub przekazać innemu pacjentowi po uprzednim uzgodnieniu z rejestracją.",
  },
  {
    q: "Czy pakiety łączą się między kategoriami (np. HBOT + LADD)?",
    a: "Tak. Przy jednorazowym zakupie pakietów z dwóch lub więcej kategorii stosujemy zniżkę współwystępowania 10% od sumy brutto pakietów. Dotyczy to pakietów 10 i 20 sesji. Pakiety 5 sesji kwalifikują się do zniżki wyłącznie jako dodatek do pakietu 10 lub 20 z innej kategorii.",
  },
  {
    q: "Jakie są zasady odwołania lub zwrotu?",
    a: "Do 48 h przed pierwszą sesją: zwrot 100% wartości pakietu. Po rozpoczęciu terapii: zwrot proporcjonalny do niewykorzystanych sesji (liczonych według ceny jednostkowej pakietu), pomniejszony o koszt konsultacji kwalifikacyjnej (350–500 zł). Nie pobieramy opłat administracyjnych.",
  },
  {
    q: "Jak umawiać terminy i z jakim wyprzedzeniem?",
    a: "Terminy umawiane są wyłącznie przez rejestrację kliniczną — telefonicznie, mailowo lub przez panel pacjenta. Pakiety 5 sesji: rezerwacja z 48–72 h wyprzedzenia. Pakiety 10 i 20 sesji: planowanie całego cyklu na starcie z możliwością przesuwania pojedynczych wizyt z 24-godzinnym wyprzedzeniem. W dniu zabiegu przeszczepu DHI nie umawiamy pierwszej sesji wspomagającej wcześniej niż na dobę 3.",
  },
  {
    q: "Jak wygląda harmonogram wizyt w pakietach 5, 10 i 20 sesji?",
    a: "Pakiet 5 sesji to cykl krótki — zazwyczaj 1 sesja tygodniowo przez 5 tygodni, z opcją zagęszczenia do 2 sesji/tydzień w tygodniach 2–4. Pakiet 10 sesji: standardowo 2 sesje tygodniowo przez 5 tygodni (np. poniedziałek + czwartek), z przerwą w tygodniu 3 jeśli wystąpi zaczerwienenie. Pakiet 20 sesji: intensywny rytm 2–3 sesji/tydzień przez 7–8 tygodni, z obowiązkowym tygodniem przerwy między blokami 1–10 a 11–20. Przerwy między sesjami tej samej kategorii: HBOT min. 24 h, LADD min. 72 h, PBM min. 48 h.",
  },
  {
    q: "Jaka jest polityka spóźnień na wizytę?",
    a: "Spóźnienie do 10 minut: wizyta realizowana w pełnym zakresie, ale skrócony czas na konsultację przed sesją. Spóźnienie 11–20 minut: skrócenie czasu sesji proporcjonalnie lub przesunięcie na najbliższy wolny termin — decyduje lekarz/koordynator w zależności od kolejki. Spóźnienie powyżej 20 minut: wizyta traktowana jako nieodbyta (no-show) i rozliczana z pakietu, chyba że pacjent zgłosi opóźnienie z wyprzedzeniem min. 30 min i istnieje techniczna możliwość przesunięcia.",
  },
  {
    q: "Jakie są zasady anulowania sesji w pakiecie?",
    a: "Bezpłatne anulowanie lub zmiana terminu wymaga zgłoszenia min. 24 h przed sesją (w przypadku pakietów 10 i 20 sesji) lub min. 48 h (pakiet 5 sesji). Anulowanie w krótszym terminie: sesja rozliczana z pakietu jako wykorzystana. Nieobecność bez zgłoszenia (no-show): sesja odejmowana z pakietu automatycznie. W sytuacji choroby zakaźnej lub zaburzeń krzepnięcia potwierdzonych dokumentacją lekarską — sesja zawieszana bez utraty z pakietu.",
  },
  {
    q: "Czy spóźniona osoba może dołączyć do sesji w trakcie jej trwania?",
    a: "Nie. Ze względu na protokół bezpieczeństwa i konieczność pełnej kwalifikacji przedsesyjnej, pacjent spóźniony nie może dołączyć do sesji już rozpoczętej. Jeśli spóźnienie mieści się w tolerancji 10 min, rozpoczynamy pełną sesję z opóźnieniem. W przypadku spóźnienia 11–20 min lekarz/koordynator decyduje o skróceniu czasu sesji lub przesunięciu terminu. Powyżej 20 min sesja jest traktowana jako nieodbyta (no-show).",
  },
  {
    q: "Jak skraca się czas terapii w przypadku spóźnienia?",
    a: "Przy spóźnieniu 11–20 min czas sesji skraca się proporcjonalnie do opóźnienia, z zachowaniem minimum bezpieczeństwa: HBOT min. 45 min, LADD min. 30 min, PBM min. 15 min. Skrócenie nie obejmuje konsultacji przedsesyjnej — ta jest realizowana w pełnym zakresie lub przesuwana na kolejną wizytę. Przy spóźnieniu do 10 min sesja realizowana jest w pełnym czasie.",
  },
  {
    q: "Kiedy spóźnienie traktowane jest jako no-show?",
    a: "No-show (nieobecność) rejestruje się automatycznie, gdy pacjent nie stawia się w gabinecie w ciągu 20 minut od umówionego terminu i nie zgłosił opóźnienia z wyprzedzeniem min. 30 min. Sesja w takim przypadku jest odejmowana z pakietu. Wyjątek stanowią sytuacje losowe potwierdzone dokumentacją (wypadek, nagła choroba) — wtedy sesja jest zawieszana bez utraty z pakietu.",
  },
  {
    q: "Jakie są zasady zmiany terminu wizyty w pakietach 5, 10 i 20 sesji oraz ile czasu z wyprzedzeniem mogę przesunąć sesję?",
    a: "Zmiana terminu jest bezpłatna i nie wpływa na ważność sesji, jeśli zgłoszona z wyprzedzeniem: pakiet 5 sesji — min. 48 h, pakiety 10 i 20 sesji — min. 24 h przed planowaną wizytą. Sesję można przesunąć na najbliższy wolny termin w ciągu 12 miesięcy od daty zakupu pakietu. Zgłoszenia przyjmujemy wyłącznie przez rejestrację kliniczną (telefon, e-mail lub panel pacjenta). Przy braku zgłoszenia w wymaganym czasie sesja jest rozliczana jako wykorzystana. W sytuacjach nagłych (wypadek, nagła choroba) potwierdzonych dokumentacją lekarską — zmiana jest możliwa bez utraty sesji niezależnie od wyprzedzenia.",
  },
  {
    q: "LADD: PRP + minoksydyl — zimna plazma: kto kwalifikuje się do zabiegu?",
    a: "Kwalifikacja obejmuje konsultację lekarską z oceną fototypu skóry (Fitzpatrick I–IV preferowane), badanie trichoskopowe oraz wywiad dotyczący alergii na minoksydyl, zaburzeń krzepnięcia i aktywnych infekcji skóry głowy. Zabieg jest przeznaczony dla pacjentów po przeszczepie włosów metodą DHI w okresie 4–12 tygodni od zabiegu, a także dla osób z łysieniem androgenowym jako terapia wspomagająca. Wymagana jest stabilizacja ciśnienia tętniczego i brak stosowania fotouczulających leków (tetracykliny, retinoidy) w ciągu ostatnich 4 tygodni.",
  },
  {
    q: "LADD: PRP + minoksydyl — zimna plazma: jakie są przeciwwskazania?",
    a: "Bezwzględne przeciwwskazania: aktywna infekcja bakteryjna, wirusowa lub grzybicza skóry głowy, ciąża i karmienie piersią, nowotwory skóry (łagodne i złośliwe) w obrębie pola zabiegowego, zaburzenia krzepnięcia (hemofilia, trombocytopenia < 50 000/µl), stosowanie izotretynoiny w ciągu ostatnich 6 miesięcy. Względne: nadwrażliwość na minoksydyl (test łokciowy 48 h przed zabiegiem), nieuregulowana nadczynność tarczycy, aktywna autoimmunologiczna choroba skóry (np. łuszczyca, toczeń). Lekarz podejmuje decyzję o kwalifikacji indywidualnie.",
  },
  {
    q: "LADD: PRP + minoksydyl — zimna plazma: jak przygotować się przed wizytą?",
    a: "Przed zabiegiem: umyj głowę wieczorem poprzedniego dnia delikatnym szamponem bez silikonów i SLS; nie stosuj odżywek, serum, lakierów ani produktów stylizacyjnych. W dniu zabiegu przyjdź na czczo lub z lekką przekąską 1,5–2 h przed sesją. Zaprzestań stosowania retinoidów, kwasów AHA/BHA, minoksydylu topowego i doustnego przeciwbólowych (poza paracetamolem) na 72 h przed zabiegiem. Zabierz aktualne wyniki morfologii (trombocyty) i współczynnik INR jeśli przyjmujesz leki przeciwzakrzepowe. Nie opalaj skóry głowy przez 14 dni przed zabiegiem (niebezpieczeństwo przebarwień postzapalnych).",
  },
];

interface PricingPack {
  sessions: number;
  price: string;
  unitPrice: string;
  saving: string;
}

interface PricingItem {
  code: string;
  name: string;
  params: string;
  single: { price: string; label: string };
  packs: PricingPack[];
  scope: string[];
  note: string;
  hidden?: boolean;
}


const pricingOverridesQuery = () => ({
  queryKey: ["pricing-overrides"],
  queryFn: () => getPricingOverrides(),
});

function Pricing() {
  const { data: overrides } = useQuery(pricingOverridesQuery());
  const hiddenMap = new Map((overrides ?? []).map((o) => [o.code, o.hidden]));

  const visiblePricing = PRICING.map((p) => ({
    ...p,
    hidden: hiddenMap.has(p.code) ? hiddenMap.get(p.code) : p.hidden,
  })).filter((p) => !p.hidden);

  return (
    <Section id="cennik" eyebrow="10 — Cennik">
      <SectionHeader
        title="Cennik zabiegów wspierających."
        lead={
          <>
            Ceny uśrednione na podstawie <strong>górnego przedziału stawek klinik premium</strong>{" "}
            w Warszawie i Gdańsku (stan: 2026). Ostateczna wycena ustalana jest
            indywidualnie po konsultacji kwalifikacyjnej i zależy od liczby sesji,
            powierzchni opracowania oraz protokołu łączonego.
          </>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {visiblePricing.map((p) => (
          <article
            key={p.code}
            className="flex flex-col rounded-sm border border-border bg-card shadow-[var(--shadow-editorial)]"
          >
            <div className="p-6 md:p-8">
              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent">
                {p.code}
              </span>
              <h3 className="mt-3 font-display text-2xl break-words md:text-3xl">{p.name}</h3>
              <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                {p.params}
              </p>
            </div>

            <div className="mx-6 h-px bg-border md:mx-8" />

            <div className="p-6 md:p-8">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Co obejmuje każda sesja
              </h4>
              <ul className="mt-3 space-y-2">
                {p.scope.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/90">
                    <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-accent" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mx-6 h-px bg-border md:mx-8" />

            <div className="p-6 md:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-muted-foreground">{p.single.label}</dt>
                <dd className="font-display text-2xl text-foreground">{p.single.price}</dd>
              </div>

              <div className="mt-4 space-y-3">
                {p.packs.map((pk) => (
                  <div
                    key={pk.sessions}
                    className="flex items-center justify-between gap-4 rounded-sm border border-border/60 bg-background/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[10px] font-semibold text-accent">
                        {pk.sessions}
                      </span>
                      <div className="leading-tight">
                        <span className="block text-sm font-medium">Pakiet {pk.sessions} sesji</span>
                        <span className="text-[10px] text-muted-foreground">
                          {pk.unitPrice}/sesja · rabat {pk.saving}
                        </span>
                      </div>
                    </div>
                    <span className="font-display text-xl text-accent">{pk.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto p-6 pt-0 md:p-8 md:pt-0">
              <p className="text-xs leading-relaxed text-muted-foreground">{p.note}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-10 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Metodologia: dla każdej kategorii pobrano publicznie dostępne cenniki
        klinik klasy premium w Warszawie i Gdańsku, odfiltrowano oferty
        wprowadzające i pakiety rabatowe Booksy, a następnie uśredniono najwyższy
        zakres cen (75.–100. percentyl). Ceny nie zawierają konsultacji
        kwalifikacyjnej (350–500 zł) ani preparatów dodatkowych. Niniejsze
        zestawienie ma charakter informacyjny i nie stanowi oferty w rozumieniu
        art. 66 §1 Kodeksu cywilnego.
      </p>

      <div className="mt-16">
        <h3 className="font-display text-2xl break-words md:text-3xl">Pytania o pakiety i rozliczenia</h3>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {PRICING_FAQ.map((f) => (
            <details key={f.q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                <h4 className="font-display text-xl break-words md:text-2xl">{f.q}</h4>
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
      </div>
    </Section>
  );
}

/* ---------- CTA ---------- */

function CTA() {
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
              <img src={mscLogo.url} alt="MySkinCode — Technical Support MedTech SaaS" className="max-h-full max-w-full object-contain" loading="lazy" />
            </div>
            <div className="flex items-center justify-center rounded-md bg-black p-4 h-24">
              <img src={bujokLogo.url} alt="Medical Lasers and STEM Cells Solutions" className="max-h-full max-w-full object-contain" loading="lazy" />
            </div>
            <div className="flex items-center justify-center rounded-md bg-[#3f4a73] p-4 h-24">
              <img src={mabelLogo.url} alt="Mabel Hair — Hair Transplant Clinic" className="max-h-full max-w-full object-contain" loading="lazy" />
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

/* ---------- Primitives ---------- */

function Section({
  id,
  eyebrow,
  children,
}: {
  id: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-b border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="mb-10 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {eyebrow}
        </p>
        {children}
      </div>
    </section>
  );
}

function SectionHeader({ title, lead }: { title: string; lead?: React.ReactNode }) {
  return (
    <div className="mb-12 max-w-3xl">
      <h2 className="font-display text-3xl break-words md:text-5xl">{title}</h2>
      {lead && <div className="mt-6 text-base text-muted-foreground md:text-lg">{lead}</div>}
    </div>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{children}</p>;
}

function Card({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-editorial)] md:p-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="font-display text-2xl break-words md:text-3xl">{title}</h3>
        {badge && (
          <span className="shrink-0 rounded-sm border border-accent/40 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-accent">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-4 text-sm text-muted-foreground md:text-base">{children}</div>
    </article>
  );
}

function Mech({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 border-l-2 border-accent/60 bg-secondary/40 p-3 text-xs italic text-foreground/80 md:text-sm">
      {children}
    </p>
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

function Contact() {
  const [status, setStatus] = useState<ContactStatus>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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
  children: React.ReactNode;
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
