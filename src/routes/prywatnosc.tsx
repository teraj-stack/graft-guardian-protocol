import { createFileRoute, Link } from "@tanstack/react-router";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/prywatnosc")({
  head: () => ({
    meta: [
      { title: "Polityka prywatności — Graftgen.com" },
      {
        name: "description",
        content:
          "Polityka prywatności RODO: kto przetwarza dane, podstawy prawne, okresy retencji, prawa pacjenta oraz kontakt IOD.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Polityka prywatności — Graftgen.com" },
      {
        property: "og:description",
        content: "Pełna informacja RODO dla pacjentów korzystających z materiałów i przypomnień.",
      },
      { property: "og:url", content: "https://graftgen.com/prywatnosc" },
    ],
    links: [{ rel: "canonical", href: "https://graftgen.com/prywatnosc" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Polityka prywatności — Graftgen.com",
          description:
            "Polityka prywatności RODO: kto przetwarza dane, podstawy prawne, okresy retencji, prawa pacjenta oraz kontakt IOD.",
          url: "https://graftgen.com/prywatnosc",
          inLanguage: "pl-PL",
          isPartOf: { "@id": "https://graftgen.com/#website" },
          publisher: { "@id": "https://graftgen.com/#organization" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://graftgen.com/" },
            { "@type": "ListItem", position: 2, name: "Polityka prywatności", item: "https://graftgen.com/prywatnosc" },
          ],
        }),
      },
    ],
  }),

  component: PrivacyPage,
});

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-border/40 py-10">
      <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">{title}</h2>
      <div className="prose prose-invert max-w-none text-foreground/80 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

function PrivacyPage() {
  const updated = "19 czerwca 2026";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
            ← Strona główna
          </Link>
          <LanguageSwitcher compact />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Dokument informacyjny · RODO
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
          Polityka prywatności i bezpieczeństwo danych
        </h1>
        <p className="text-sm text-muted-foreground">
          Ostatnia aktualizacja: {updated}. Niniejszy dokument opisuje, w jaki sposób
          przetwarzamy dane osobowe pacjentów korzystających z serwisu „Protokół Po
          Przeszczepie" oraz z systemu przypomnień e-mail/SMS. Strona jest utrzymywana
          przez administratora danych i nie stanowi niezależnej certyfikacji.
        </p>
      </header>

      <nav aria-label="Spis treści" className="mb-8 rounded-lg border border-border/40 p-5 text-sm">
        <p className="uppercase tracking-wider text-xs text-muted-foreground mb-3">Spis treści</p>
        <ol className="space-y-1.5 list-decimal list-inside text-foreground/80">
          <li><a href="#administrator" className="hover:text-primary">Administrator danych</a></li>
          <li><a href="#iod" className="hover:text-primary">Kontakt w sprawach RODO</a></li>
          <li><a href="#zakres" className="hover:text-primary">Zakres przetwarzanych danych</a></li>
          <li><a href="#cele" className="hover:text-primary">Cele i podstawy prawne</a></li>
          <li><a href="#retencja" className="hover:text-primary">Okresy retencji</a></li>
          <li><a href="#odbiorcy" className="hover:text-primary">Odbiorcy danych i podprocesory</a></li>
          <li><a href="#prawa" className="hover:text-primary">Prawa pacjenta</a></li>
          <li><a href="#bezpieczenstwo" className="hover:text-primary">Bezpieczeństwo danych</a></li>
          <li><a href="#cookies" className="hover:text-primary">Pliki cookies i analityka</a></li>
          <li><a href="#zmiany" className="hover:text-primary">Zmiany polityki</a></li>
        </ol>
      </nav>

      <Section id="administrator" title="1. Administrator danych">
        <p>
          Współadministratorem danych osobowych pacjentów korzystających z serwisu jest{" "}
          <strong>Medical Lasers and STEM Cells Solutions Sp. z o.o.</strong> — w pełnym zakresie operacyjnym (kwalifikacja
          medyczna, prowadzenie protokołu pozabiegowego, kontakt z pacjentem).
        </p>
        <ul className="text-sm text-muted-foreground list-none space-y-1 mt-3">
          <li>KRS: 0000791172</li>
          <li>NIP: 6423218241</li>
          <li>REGON: 383695904</li>
          <li>Adres: ul. Kard. Bolesława Kominka 44, 44-217 Rybnik</li>
        </ul>
      </Section>

      <Section id="iod" title="2. Kontakt w sprawach RODO">
        <p>
          We wszystkich sprawach dotyczących przetwarzania danych osobowych, realizacji
          praw pacjenta oraz zgłoszeń incydentów bezpieczeństwa prosimy o kontakt:
        </p>
        <p>
          E-mail:{" "}
          <a className="text-primary underline" href="mailto:mila.skrzynska@gmail.com">
            mila.skrzynska@gmail.com
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          Odpowiadamy bez zbędnej zwłoki, najpóźniej w terminie 30 dni od otrzymania
          żądania (art. 12 ust. 3 RODO).
        </p>
      </Section>

      <Section id="zakres" title="3. Zakres przetwarzanych danych">
        <p>W ramach serwisu i systemu przypomnień możemy przetwarzać:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>adres e-mail oraz/lub numer telefonu (kanał wysyłki przypomnień),</li>
          <li>datę zabiegu przeszczepu (do harmonogramu T1–T12),</li>
          <li>wybrane tygodnie i kategorie materiałów,</li>
          <li>token wypisania (generowany losowo, służy wyłącznie do anulowania subskrypcji),</li>
          <li>postęp lektury materiałów (lokalnie w przeglądarce — localStorage),</li>
          <li>logi techniczne wysyłek (status dostarczenia, znacznik czasu).</li>
        </ul>
        <p>
          Nie zbieramy w tym serwisie danych o stanie zdrowia w rozumieniu art. 9 RODO
          — dokumentacja medyczna jest prowadzona odrębnie przez klinikę wykonującą
          zabieg.
        </p>
      </Section>

      <Section id="cele" title="4. Cele i podstawy prawne przetwarzania">
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Wysyłka przypomnień edukacyjnych</strong> (e-mail/SMS) —
            art. 6 ust. 1 lit. a RODO (zgoda pacjenta, którą można wycofać w każdej chwili).
          </li>
          <li>
            <strong>Realizacja praw pacjenta i obsługa zgłoszeń</strong> —
            art. 6 ust. 1 lit. c RODO (obowiązek prawny).
          </li>
          <li>
            <strong>Bezpieczeństwo serwisu, audyt wysyłek, zapobieganie nadużyciom</strong> —
            art. 6 ust. 1 lit. f RODO (uzasadniony interes administratora).
          </li>
        </ul>
      </Section>

      <Section id="retencja" title="5. Okresy retencji">
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Subskrypcja przypomnień:</strong> do momentu wypisania się
            (jednym kliknięciem w linku) lub maksymalnie 12 tygodni po wskazanej dacie
            zabiegu — wówczas dane są automatycznie deaktywowane.
          </li>
          <li>
            <strong>Logi wysyłek (audyt):</strong> 12 miesięcy od daty wysyłki,
            wyłącznie w celu wykazania należytej staranności (art. 5 ust. 2 RODO).
          </li>
          <li>
            <strong>Zgłoszenia i korespondencja RODO:</strong> 3 lata od zakończenia
            sprawy (przedawnienie roszczeń).
          </li>
        </ul>
      </Section>

      <Section id="odbiorcy" title="6. Odbiorcy danych i podprocesory">
        <p>Dane mogą być powierzane następującym kategoriom podmiotów przetwarzających:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>dostawca infrastruktury bazodanowej i hostingu aplikacji (przetwarzanie w UE),</li>
          <li>dostawca usługi wysyłki e-mail (Resend),</li>
          <li>dostawca usługi wysyłki SMS (Twilio) — jeśli pacjent wybierze ten kanał.</li>
        </ul>
        <p>
          Każdy z podprocesorów działa na podstawie umowy powierzenia (DPA) zgodnej
          z art. 28 RODO. Nie sprzedajemy ani nie udostępniamy danych w celach
          marketingowych podmiotom trzecim.
        </p>
      </Section>

      <Section id="prawa" title="7. Prawa pacjenta">
        <p>Zgodnie z RODO przysługuje Pani/Panu prawo do:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>dostępu do danych (art. 15),</li>
          <li>sprostowania (art. 16),</li>
          <li>usunięcia danych — „prawo do bycia zapomnianym" (art. 17),</li>
          <li>ograniczenia przetwarzania (art. 18),</li>
          <li>przenoszenia danych (art. 20),</li>
          <li>sprzeciwu wobec przetwarzania (art. 21),</li>
          <li>wycofania zgody w dowolnym momencie (art. 7 ust. 3),</li>
          <li>
            wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych
            (ul. Stawki 2, 00-193 Warszawa).
          </li>
        </ul>
        <p>
          Z subskrypcji przypomnień można wypisać się jednym kliknięciem na stronie{" "}
          <a href="/przypomnienia/wypisz" rel="nofollow" className="text-primary underline">
            /przypomnienia/wypisz
          </a>{" "}
          (link znajduje się w stopce każdej wiadomości).
        </p>
      </Section>

      <Section id="bezpieczenstwo" title="8. Bezpieczeństwo danych">
        <p>
          Stosujemy środki techniczne i organizacyjne adekwatne do ryzyka (art. 32 RODO):
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>szyfrowanie transmisji TLS 1.3 dla całego ruchu aplikacji,</li>
          <li>szyfrowanie danych „at rest" po stronie dostawcy bazy danych,</li>
          <li>
            mechanizm Row-Level Security — dane subskrypcji są niedostępne z poziomu
            klienta (brak polityk SELECT/UPDATE/DELETE dla ról anon/authenticated),
          </li>
          <li>logi wysyłek dostępne wyłącznie po stronie serwera (deny-all),</li>
          <li>token wypisania generowany kryptograficznie, jednorazowy w działaniu,</li>
          <li>regularne skanowanie zależności pod kątem podatności.</li>
        </ul>
        <p>
          Incydenty bezpieczeństwa zgłaszamy organowi nadzorczemu w ciągu 72 godzin
          (art. 33 RODO) oraz informujemy osoby, których dane dotyczą, jeżeli incydent
          wiąże się z wysokim ryzykiem naruszenia ich praw (art. 34 RODO).
        </p>
      </Section>

      <Section id="cookies" title="9. Pliki cookies i analityka">
        <p>
          Serwis nie używa marketingowych plików cookies ani trackerów stron trzecich.
          Wykorzystujemy wyłącznie niezbędne pliki techniczne (utrzymanie sesji,
          zapamiętanie postępu lektury materiałów w localStorage przeglądarki — dane
          nie opuszczają urządzenia pacjenta).
        </p>
      </Section>

      <Section id="zmiany" title="10. Zmiany polityki prywatności">
        <p>
          Polityka może być aktualizowana w związku ze zmianami technicznymi lub
          prawnymi. Data ostatniej aktualizacji widnieje na początku dokumentu.
          O istotnych zmianach informujemy aktywnych subskrybentów drogą e-mail.
        </p>
      </Section>

      </main>
      <SiteFooter />
    </div>
  );
}
