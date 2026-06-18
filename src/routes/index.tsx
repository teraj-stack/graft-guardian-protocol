import { createFileRoute } from "@tanstack/react-router";

const TITLE = "Protokół po przeszczepie włosów — FUE, PBM, HBOT, LADD";
const DESCRIPTION =
  "Zintegrowany, oparty na dowodach protokół wspomagający przeżywalność graftów po FUE: ochrona ex vivo (HypoThermosol + ATP-v), fotobiomodulacja 650/830 nm, HBOT 1,5–2,0 ATA, LADD z PRP i minoksydylem.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "/" }],
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
            name: "Protokół pozabiegowy po przeszczepie włosów metodą FUE",
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
    q: "Kiedy mogę umyć głowę po FUE?",
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
        <FAQSection />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

/* ---------- Nav ---------- */

function Nav() {
  return (
    <header className="relative z-20 border-b border-border/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="#" className="flex items-baseline gap-2">
          <span className="font-display text-2xl leading-none">Protokół</span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            po przeszczepie
          </span>
        </a>
        <nav className="hidden gap-7 text-sm text-muted-foreground md:flex">
          <a href="#ex-vivo" className="hover:text-foreground">Ex Vivo</a>
          <a href="#pbm" className="hover:text-foreground">PBM</a>
          <a href="#hbot" className="hover:text-foreground">HBOT</a>
          <a href="#ladd" className="hover:text-foreground">LADD</a>
          <a href="#protokol" className="hover:text-foreground">14 dni</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <a
          href="#konsultacja"
          className="inline-flex items-center rounded-sm border border-foreground/80 bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
        >
          Umów konsultację
        </a>
      </div>
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
            Protokół kliniczny · FUE · evidence-based
          </p>
          <h1 className="font-display text-5xl leading-[1.02] md:text-7xl">
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
          Po ekstrakcji metodą FUE graft jest tkanką niedokrwioną. Od momentu
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
        title="Tlen rozpuszczony w plazmie dociera tam, gdzie krwinki czerwone jeszcze nie."
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
            hiperbarycznej. Kwalifikację prowadzi lekarz medycyny
            hiperbarycznej.
          </Mech>
        </Card>
      </div>
    </Section>
  );
}

/* ---------- LADD ---------- */

function LADD() {
  return (
    <Section id="ladd" eyebrow="05 — LADD: Laser-Assisted Drug Delivery">
      <SectionHeader
        title="Mikrokanały zamiast wcierania."
        lead="Laser-Assisted Drug Delivery to kontrolowane utworzenie pionowych mikrokanałów w warstwie rogowej, umożliwiających dostarczenie aktywnej substancji (minoksydyl, PRP, peptydy, eksosomy) na głębokość brodawki włosa. Skuteczność penetracji rośnie kilkukrotnie w porównaniu z aplikacją topową."
      />

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

      <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
        Rozważamy rozszerzenie protokołu o oba urządzenia: laser tulowy do
        sesji LADD od 4–6 tygodnia (głęboka penetracja minoksydylu i PRP)
        oraz zimną plazmę do wczesnej fazy gojenia (kontrola mikrobiomu,
        delikatna stymulacja, brak downtime).
      </p>
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
        <Card title="Botaniczne formuły pozabiegowe" badge="Arnica · Centella">
          <p>
            Sterylne żele bez konserwantów na bazie wyciągów z
            <em> Arnica montana</em> (helenalina, dihydrohelenalina —
            redukcja erytemy) oraz <em>Centella asiatica</em>
            (madekasozyd, asiatykozyd — stymulacja syntezy kolagenu I,
            redukcja stanu zapalnego). Zastosowanie nad strefą dawczą,
            która po FUE przypomina rozległe otarcie.
          </p>
          <Mech>
            Niekontrolowane namnażanie <em>Malassezia</em> i
            patogennych szczepów gronkowca wokół mikroran sprzyja
            włóknieniu bliznowatemu i utracie graftów.
          </Mech>
        </Card>
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
            Znieczulenie wiedzą jako parametr kliniczny.
          </h2>
          <p className="mt-6 text-muted-foreground">
            Pacjent opuszczający klinikę z zakrwawioną głową, bez planu,
            bez kontaktu — to nie tylko problem doświadczenia. Kortyzol w
            stresie pozabiegowym jest wazokonstryktorem. Lęk realnie
            pogarsza perfuzję skóry głowy i zwiększa ryzyko mechanicznej
            utraty graftów (drapanie, niewłaściwe mycie, zdejmowanie
            strupów przed czasem).
          </p>
          <p className="mt-4 text-muted-foreground">
            Każdy pacjent otrzymuje precyzyjny e-book &bdquo;Patient
            Journey&rdquo; z instrukcjami na każdy z pierwszych 14 dni —
            co robić rano, wieczorem, czego nie robić, kiedy się
            niepokoić. Dodatkowo: bezpośredni kontakt do prowadzącego
            przez pierwsze 30 dni.
          </p>
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

/* ---------- FAQ ---------- */

function FAQSection() {
  return (
    <Section id="faq" eyebrow="09 — Pytania pacjentów">
      <SectionHeader title="To, o co pytacie najczęściej." />
      <div className="divide-y divide-border border-y border-border">
        {FAQ.map((f) => (
          <details key={f.q} className="group py-6">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
              <h3 className="font-display text-xl md:text-2xl">{f.q}</h3>
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
              className="inline-flex w-full items-center justify-center rounded-sm bg-accent px-6 py-4 text-base font-medium text-accent-foreground transition hover:opacity-90"
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
              metodą FUE. Treści mają charakter informacyjny i nie
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
        <div className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Protokół po przeszczepie. Wszystkie prawa zastrzeżone.
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

function SectionHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-12 max-w-3xl">
      <h2 className="font-display text-4xl md:text-5xl">{title}</h2>
      {lead && <p className="mt-6 text-base text-muted-foreground md:text-lg">{lead}</p>}
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
        <h3 className="font-display text-2xl md:text-3xl">{title}</h3>
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
