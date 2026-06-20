import { createFileRoute, Link } from "@tanstack/react-router";

const URL_CANON = "https://graftgen.com/koszt-przeszczepu-wlosow";
const TITLE = "Ile kosztuje przeszczep włosów w Polsce? Cennik 2026 + ochrona inwestycji";
const DESC =
  "Aktualne ceny przeszczepu włosów w Polsce (DHI, FUE, safirowe ostrza) — od 8 000 do 25 000 zł. Sprawdź, co realnie wpływa na koszt i jak protokół PBM + HBOT chroni Twoją inwestycję w pierwszych 48 godzinach.";

export const Route = createFileRoute("/koszt-przeszczepu-wlosow")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "index,follow" },
      { name: "keywords", content: "przeszczep włosów cena, ile kosztuje przeszczep włosów w polsce, cena przeszczepu włosów DHI, koszt przeszczepu włosów Polska, cennik przeszczepu włosów" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL_CANON },
      { property: "og:type", content: "article" },
      { property: "og:locale", content: "pl_PL" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      {
        name: "script:ld+json",
        content: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESC,
          inLanguage: "pl-PL",
          mainEntityOfPage: URL_CANON,
          author: { "@type": "Organization", name: "Graftgen.com" },
          publisher: { "@type": "Organization", name: "Graftgen.com" },
          datePublished: "2026-06-20",
          dateModified: "2026-06-20",
        }),
      },
      {
        name: "script:ld+json",
        content: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Ile kosztuje przeszczep włosów w Polsce w 2026 roku?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Cena przeszczepu włosów w Polsce w 2026 roku waha się od ok. 8 000 zł (mniejsze zabiegi FUE, ok. 1500 graftów) do 25 000–35 000 zł (zaawansowane DHI, 3500+ graftów w renomowanej klinice). Średni koszt sesji DHI to 15 000–22 000 zł.",
              },
            },
            {
              "@type": "Question",
              name: "Od czego zależy cena przeszczepu włosów?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Cena zależy od metody (DHI vs FUE), liczby graftów, doświadczenia operatora, użytych narzędzi (implantery Choi, safirowe ostrza) oraz zakresu opieki pozabiegowej (PBM, HBOT, PRP, follow-up). Sama liczba graftów to tylko ok. 40% wartości — reszta to jakość ekstrakcji i przeżywalność mieszków w pierwszych 48 h.",
              },
            },
            {
              "@type": "Question",
              name: "Czy warto dopłacać do protokołu pozabiegowego PBM i HBOT?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Tak. Inwestycja 1 500–3 000 zł w protokół PBM (fototerapia czerwoną/bliską podczerwienią) i HBOT (1,5–3,0 ATA) w pierwszych 48 godzinach chroni 10 000–25 000 zł zainwestowane w sam zabieg. Niedotleniony graft umiera nieodwracalnie — nie da się go ponownie 'wszczepić'.",
              },
            },
            {
              "@type": "Question",
              name: "Czy NFZ refunduje przeszczep włosów?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Nie. NFZ nie refunduje przeszczepów włosów uznawanych za zabiegi estetyczne. Refundacja jest możliwa tylko w wyjątkowych przypadkach pourazowych lub pooparzeniowych, na podstawie indywidualnej decyzji.",
              },
            },
          ],
        }),
      },
    ],
    links: [{ rel: "canonical", href: URL_CANON }],
  }),
  component: CostGuidePage,
});

function CostGuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24 text-foreground/85">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
          Przewodnik cenowy · aktualizacja czerwiec 2026
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-6">
          Ile kosztuje przeszczep włosów w Polsce?
        </h1>
        <p className="text-lg text-foreground/75 leading-relaxed">
          Pełen rozkład cen przeszczepu włosów w Polsce w 2026 roku — od czego realnie zależy
          koszt, czego nie widać w cenniku i dlaczego pierwsze <strong>48 godzin</strong> po
          zabiegu decyduje o tym, czy zainwestowane 10–25 tys. zł zaprocentuje.
        </p>
      </header>

      <nav aria-label="Spis treści" className="mb-12 rounded-lg border border-border/40 p-5 text-sm">
        <p className="uppercase tracking-wider text-xs text-muted-foreground mb-3">W tym artykule</p>
        <ol className="space-y-1.5 list-decimal list-inside text-foreground/80">
          <li><a href="#cennik" className="hover:text-primary">Cennik 2026 — widełki cen w Polsce</a></li>
          <li><a href="#metody" className="hover:text-primary">DHI vs FUE — różnice w cenie i efekcie</a></li>
          <li><a href="#czynniki" className="hover:text-primary">7 czynników, które wpływają na cenę</a></li>
          <li><a href="#ukryte" className="hover:text-primary">Ukryte koszty, o których kliniki nie mówią</a></li>
          <li><a href="#ochrona" className="hover:text-primary">Ochrona inwestycji: protokół PBM + HBOT</a></li>
          <li><a href="#porownanie" className="hover:text-primary">Porównanie: tani zabieg vs zabieg + protokół</a></li>
          <li><a href="#faq" className="hover:text-primary">FAQ — najczęstsze pytania o ceny</a></li>
        </ol>
      </nav>

      <section id="cennik" className="border-t border-border/40 pt-10 pb-12">
        <h2 className="font-serif text-3xl text-foreground mb-6">1. Cennik 2026 — widełki cen w Polsce</h2>
        <p className="mb-6 leading-relaxed">
          Ceny przeszczepu włosów w Polsce w 2026 roku zależą głównie od liczby graftów (mieszków
          włosowych) oraz wybranej metody. Poniższa tabela pokazuje realne stawki w renomowanych
          klinikach w Warszawie, Krakowie, Wrocławiu i Katowicach:
        </p>

        <div className="overflow-x-auto rounded-lg border border-border/40 mb-6">
          <table className="w-full text-sm">
            <thead className="bg-card/50">
              <tr className="text-left">
                <th className="p-3 font-medium">Zakres zabiegu</th>
                <th className="p-3 font-medium">Liczba graftów</th>
                <th className="p-3 font-medium">FUE (zł)</th>
                <th className="p-3 font-medium">DHI (zł)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr><td className="p-3">Mały (zakola, broda)</td><td className="p-3">800–1500</td><td className="p-3">8 000 – 12 000</td><td className="p-3">11 000 – 15 000</td></tr>
              <tr><td className="p-3">Średni (czubek głowy)</td><td className="p-3">1500–2500</td><td className="p-3">11 000 – 16 000</td><td className="p-3">14 000 – 20 000</td></tr>
              <tr><td className="p-3">Duży (cała linia)</td><td className="p-3">2500–3500</td><td className="p-3">15 000 – 22 000</td><td className="p-3">18 000 – 26 000</td></tr>
              <tr><td className="p-3">Bardzo duży / mega-sesja</td><td className="p-3">3500–5000+</td><td className="p-3">20 000 – 28 000</td><td className="p-3">24 000 – 35 000</td></tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground italic">
          Źródło: analiza cenników 18 klinik trychologicznych w Polsce (II kw. 2026). Ceny nie
          obejmują kosztów dojazdu, noclegu ani protokołu opieki pozabiegowej.
        </p>
      </section>

      <section id="metody" className="border-t border-border/40 pt-10 pb-12">
        <h2 className="font-serif text-3xl text-foreground mb-6">2. DHI vs FUE — różnice w cenie i efekcie</h2>
        <p className="mb-4 leading-relaxed">
          <strong>FUE (Follicular Unit Extraction)</strong> i <strong>DHI (Direct Hair Implantation)</strong> to
          dwie najpopularniejsze metody. Różnica nie sprowadza się tylko do ceny — to różne
          poziomy kontroli nad kątem, kierunkiem i głębokością implantacji każdego mieszka.
        </p>
        <ul className="space-y-3 mb-4">
          <li><strong>FUE</strong> — ekstrakcja mikropunczem, potem implantacja w wcześniej zrobione nacięcia. Tańsza, szybsza, dobra przy dużych powierzchniach.</li>
          <li><strong>DHI</strong> — ekstrakcja + implantacja jednym implanterem Choi (bez wcześniejszych nacięć). Droższa o 20–30%, ale daje większą gęstość, lepszą kontrolę kąta i krótszą ekspozycję graftu poza skórą głowy (kluczowe dla przeżywalności).</li>
        </ul>
        <p className="leading-relaxed">
          Z punktu widzenia <em>ochrony inwestycji</em> DHI ma przewagę: graft spędza mniej
          czasu <strong>ex vivo</strong> (poza ciałem), więc straci mniej energii ATP zanim trafi w
          docelowe miejsce.
        </p>
      </section>

      <section id="czynniki" className="border-t border-border/40 pt-10 pb-12">
        <h2 className="font-serif text-3xl text-foreground mb-6">3. Siedem czynników, które wpływają na cenę</h2>
        <ol className="space-y-3 list-decimal list-inside leading-relaxed">
          <li><strong>Liczba graftów</strong> — bazowy mnożnik, ok. 6–10 zł/graft.</li>
          <li><strong>Doświadczenie operatora</strong> — chirurg z 10+ letnim stażem to +30–50% do ceny, ale niższa krzywa ryzyka.</li>
          <li><strong>Narzędzia</strong> — implantery Choi, safirowe ostrza, mikrosilnik (vs. tańsze odpowiedniki).</li>
          <li><strong>Skład zespołu</strong> — czy ekstrakcję i implantację robi lekarz, czy technicy.</li>
          <li><strong>Lokalizacja</strong> — Warszawa/Kraków są o 15–25% droższe niż Śląsk.</li>
          <li><strong>Opieka pozabiegowa</strong> — czy klinika oferuje PRP, PBM, HBOT, czy zostawia pacjenta z ulotką.</li>
          <li><strong>Rękojmia/follow-up</strong> — kliniki premium oferują gwarancję wszczepienia (re-touch po 12 mies. bez dopłaty).</li>
        </ol>
      </section>

      <section id="ukryte" className="border-t border-border/40 pt-10 pb-12">
        <h2 className="font-serif text-3xl text-foreground mb-6">4. Ukryte koszty, o których kliniki nie mówią</h2>
        <ul className="space-y-3 leading-relaxed">
          <li><strong>Konsultacja kontrolna po 6 i 12 miesiącach</strong> — często 300–500 zł każda.</li>
          <li><strong>PRP/PRF</strong> — 500–1 200 zł za sesję, zwykle zalecane 3–4 razy w pierwszym roku.</li>
          <li><strong>Minoksydyl + finasteryd</strong> — 80–150 zł/miesiąc, terapia ciągła przez 1–2 lata.</li>
          <li><strong>Specjalistyczne szampony i serum</strong> — 200–400 zł/miesiąc w pierwszych 3 miesiącach.</li>
          <li><strong>Re-touch</strong> przy złej przeżywalności graftów — drugi zabieg to drugi rachunek 8–20 tys. zł.</li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Suma „ukrytych" kosztów w pierwszych 12 miesiącach to <strong>3 000–6 000 zł</strong> —
          warto wpisać je do budżetu jeszcze przed wyborem kliniki.
        </p>
      </section>

      <section id="ochrona" className="border-t border-border/40 pt-10 pb-12">
        <h2 className="font-serif text-3xl text-foreground mb-6">5. Ochrona inwestycji: protokół PBM + HBOT</h2>
        <p className="mb-4 leading-relaxed">
          Klucz finansowy: <strong>graft przeżywa lub umiera w pierwszych 48 godzinach po implantacji</strong>.
          Po tym oknie nie da się go „naprawić" — niedotleniony mieszek nie odrasta. Każdy
          stracony graft to średnio <strong>7–10 zł</strong> bezpowrotnie wyrzucone z budżetu.
        </p>
        <p className="mb-4 leading-relaxed">
          Protokół Graftgen — <strong>PBM (fototerapia 633/660/810 nm)</strong> + <strong>HBOT (1,5–3,0 ATA)</strong> + zarządzanie mikrobiomem —
          adresuje dokładnie ten moment: zwiększa biodostępność tlenu w skórze głowy, redukuje stan
          zapalny i wspiera produkcję ATP w niedotlenionych mieszkach.
        </p>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 my-6">
          <p className="text-sm leading-relaxed">
            <strong>Matematyka inwestycji:</strong> jeśli zabieg za 18 000 zł ma standardową
            przeżywalność 85%, tracisz średnio <strong>2 700 zł</strong> w „martwych graftach".
            Protokół pozabiegowy podnoszący przeżywalność do 95% kosztuje ~1 500–2 500 zł i
            zwraca się dosłownie w pierwszym miesiącu.
          </p>
        </div>
      </section>

      <section id="porownanie" className="border-t border-border/40 pt-10 pb-12">
        <h2 className="font-serif text-3xl text-foreground mb-6">6. Porównanie: tani zabieg vs zabieg + protokół</h2>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-card/50">
              <tr className="text-left">
                <th className="p-3 font-medium">Pozycja</th>
                <th className="p-3 font-medium">Wariant „tani"</th>
                <th className="p-3 font-medium">Wariant „z ochroną"</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr><td className="p-3">Sam zabieg DHI (2500 graftów)</td><td className="p-3">14 000 zł</td><td className="p-3">18 000 zł</td></tr>
              <tr><td className="p-3">Protokół PBM (10 dni)</td><td className="p-3">—</td><td className="p-3">1 500 zł</td></tr>
              <tr><td className="p-3">HBOT (3 sesje)</td><td className="p-3">—</td><td className="p-3">900 zł</td></tr>
              <tr><td className="p-3">Re-touch po 12 mies. (ryzyko)</td><td className="p-3">~6 000 zł (60% ryzyka)</td><td className="p-3">~0 zł (10% ryzyka)</td></tr>
              <tr className="font-medium bg-card/30"><td className="p-3">Łączny koszt 12-miesięczny</td><td className="p-3">~17 600 zł (ważone)</td><td className="p-3">20 400 zł (przewidywalne)</td></tr>
              <tr><td className="p-3">Przewidywalność efektu</td><td className="p-3">Niska</td><td className="p-3">Wysoka</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="faq" className="border-t border-border/40 pt-10 pb-12">
        <h2 className="font-serif text-3xl text-foreground mb-6">7. FAQ — najczęstsze pytania o ceny</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-foreground mb-2">Ile kosztuje przeszczep włosów w Polsce w 2026?</h3>
            <p className="leading-relaxed">Od ok. 8 000 zł (małe FUE, 1500 graftów) do 25 000–35 000 zł (duże DHI 3500+ graftów). Średnia sesja DHI to 15 000–22 000 zł.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">Dlaczego ceny tak się różnią?</h3>
            <p className="leading-relaxed">Bo „graft" w cenniku tańszej kliniki i w cenniku premium to nie ten sam produkt — różni je czas ex vivo, kąt implantacji, jakość ekstrakcji i opieka pozabiegowa.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">Czy NFZ refunduje przeszczep włosów?</h3>
            <p className="leading-relaxed">Nie, poza przypadkami pourazowymi i pooparzeniowymi rozpatrywanymi indywidualnie.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">Czy warto jechać na zabieg do Turcji za 5 000 zł?</h3>
            <p className="leading-relaxed">Cena jest atrakcyjna, ale ryzyko niskiej przeżywalności i braku opieki pozabiegowej oznacza, że re-touch w Polsce często „zjada" oszczędności. Wariant „Turcja + polski protokół pozabiegowy" jest popularnym kompromisem.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">Czy mogę rozłożyć płatność na raty?</h3>
            <p className="leading-relaxed">Większość renomowanych klinik oferuje raty 0% przez 6–24 miesięcy we współpracy z bankami partnerskimi.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 pt-10 pb-4">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
          <h2 className="font-serif text-2xl text-foreground mb-3">Chroń swoją inwestycję od Doby Zero</h2>
          <p className="mb-5 leading-relaxed">
            Sprawdź gotowe pakiety protokołu pozabiegowego Graftgen — PBM, HBOT i wsparcie
            mikrobiomu w jednym 14-dniowym planie. Zobacz cennik i dostępność.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/sklep" className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Zobacz pakiety w Sklepie
            </Link>
            <Link to="/" className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-card/50">
              Wróć do strony głównej
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
