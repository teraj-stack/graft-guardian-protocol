import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCookieConsent } from "@/lib/cookie-consent";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Polityka cookies — Protokół Po Przeszczepie" },
      { name: "description", content: "Kategorie plików cookies używanych w serwisie, podstawy prawne (RODO/ePrivacy) oraz panel zarządzania zgodami." },
      { property: "og:title", content: "Polityka cookies — Protokół Po Przeszczepie" },
      { property: "og:description", content: "Kategorie plików cookies, podstawy prawne i panel wycofania zgód." },
      { property: "og:url", content: "https://graft-guardian-protocol.lovable.app/cookies" },
    ],
    links: [{ rel: "canonical", href: "https://graft-guardian-protocol.lovable.app/cookies" }],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-accent">
          ← Powrót
        </Link>
        <h1 className="mt-6 font-serif text-4xl md:text-5xl text-foreground">Polityka cookies</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ostatnia aktualizacja: {new Date().toLocaleDateString("pl-PL")}
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="font-serif text-2xl">1. Czym są pliki cookies</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pliki cookies to niewielkie pliki tekstowe zapisywane w przeglądarce użytkownika. W naszym serwisie wykorzystujemy również technologie pokrewne (localStorage, sessionStorage) do przechowywania preferencji zgód oraz postępu edukacyjnego pacjenta.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-serif text-2xl">2. Podstawy prawne</h2>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-2">
            <li>Art. 173 ustawy Prawo telekomunikacyjne — zgoda na cookies inne niż niezbędne.</li>
            <li>Art. 6 ust. 1 lit. a RODO — zgoda na przetwarzanie danych z cookies analitycznych, funkcjonalnych i marketingowych.</li>
            <li>Art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes dla cookies niezbędnych (bezpieczeństwo, sesja).</li>
            <li>Dyrektywa 2002/58/WE (ePrivacy).</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-serif text-2xl">3. Kategorie cookies używane w serwisie</h2>
          <div className="space-y-4">
            <CategoryCard
              title="Niezbędne"
              required
              purpose="Bezpieczne działanie serwisu, ochrona przed CSRF, przechowywanie wyboru zgód."
              examples="cookie-consent-v1 (localStorage), nagłówki bezpieczeństwa sesji."
              retention="12 miesięcy lub do usunięcia przez użytkownika."
              provider="Administrator (first-party)."
            />
            <CategoryCard
              title="Analityczne"
              purpose="Anonimowe statystyki ruchu i jakości treści (zagregowane, bez identyfikacji pacjenta)."
              examples="Liczniki wizyt sekcji protokołu (aktywowane wyłącznie po zgodzie)."
              retention="Do 14 miesięcy."
              provider="First-party; w razie wdrożenia narzędzi zewnętrznych — informacja zostanie zaktualizowana."
            />
            <CategoryCard
              title="Funkcjonalne"
              purpose="Zapamiętywanie postępu materiałów edukacyjnych w panelu pacjenta i preferencji interfejsu."
              examples="panel-progress (localStorage)."
              retention="Do wycofania zgody lub czyszczenia przeglądarki."
              provider="Administrator (first-party)."
            />
            <CategoryCard
              title="Marketingowe"
              purpose="Pomiar skuteczności kampanii edukacyjnych. Ładowane wyłącznie po wyrażeniu zgody; po jej wycofaniu skrypty są usuwane, a powiązane cookies czyszczone."
              examples="Meta Pixel (fbevents.js, cookies _fbp, _fbc) — aktywny tylko gdy skonfigurowany przez administratora."
              retention="_fbp: 90 dni, _fbc: 90 dni. Usuwane natychmiast po wycofaniu zgody."
              provider="Meta Platforms Ireland Ltd. (transfer do USA na podstawie SCC + DPF)."
            />
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-serif text-2xl">4. Zarządzanie zgodami</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Zgody opcjonalne (analityczne, funkcjonalne, marketingowe) możesz w każdej chwili wycofać lub zmienić. Wycofanie nie wpływa na zgodność z prawem przetwarzania dokonanego przed wycofaniem.
          </p>
          <ConsentManager />
          <p className="text-xs text-muted-foreground">
            Możesz też zarządzać cookies bezpośrednio w przeglądarce (Chrome, Firefox, Safari, Edge — dokumentacja producenta).
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-serif text-2xl">5. Administrator i kontakt IOD</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Administratorem jest Bujok Medical Sp. z o.o., ul. Kard. Bolesława Kominka 44, 44-217 Rybnik (KRS 0000791172, NIP 6423218241, REGON 383695904). Kontakt w sprawach RODO i cookies:{" "}
            <a href="mailto:mila.skrzynska@gmail.com" className="underline hover:text-accent">mila.skrzynska@gmail.com</a>.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pełna informacja o przetwarzaniu danych: <Link to="/prywatnosc" className="underline hover:text-accent">Polityka prywatności i RODO</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}

function CategoryCard({
  title,
  purpose,
  examples,
  retention,
  provider,
  required,
}: {
  title: string;
  purpose: string;
  examples: string;
  retention: string;
  provider: string;
  required?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-xl text-foreground">{title}</h3>
        <span className={`rounded px-2 py-1 text-xs ${required ? "bg-muted text-foreground" : "bg-muted/60 text-muted-foreground"}`}>
          {required ? "Zawsze aktywne" : "Opcjonalne — wymagana zgoda"}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        <Field label="Cel" value={purpose} />
        <Field label="Przykłady" value={examples} />
        <Field label="Okres przechowywania" value={retention} />
        <Field label="Dostawca" value={provider} />
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function ConsentManager() {
  const { consent, hydrated, accept, acceptAll, rejectAll, revoke } = useCookieConsent();
  const [prefs, setPrefs] = useState({
    analytics: consent?.analytics ?? false,
    functional: consent?.functional ?? false,
    marketing: consent?.marketing ?? false,
  });

  if (!hydrated) return null;

  return (
    <div className="rounded-lg border border-border p-5">
      <p className="text-sm text-foreground font-medium">Panel zgód</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {consent
          ? `Twój wybór z ${new Date(consent.timestamp).toLocaleString("pl-PL")}.`
          : "Nie zapisano jeszcze preferencji."}
      </p>

      <ul className="mt-4 space-y-2">
        <Toggle label="Niezbędne" description="Zawsze aktywne." disabled checked />
        <Toggle
          label="Analityczne"
          description="Anonimowe statystyki."
          checked={prefs.analytics}
          onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
        />
        <Toggle
          label="Funkcjonalne"
          description="Postęp materiałów i preferencje UI."
          checked={prefs.functional}
          onChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
        />
        <Toggle
          label="Marketingowe"
          description="Pomiar kampanii edukacyjnych."
          checked={prefs.marketing}
          onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
        />
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => accept(prefs)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Zapisz wybór
        </button>
        <button onClick={acceptAll} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          Akceptuj wszystkie
        </button>
        <button onClick={rejectAll} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          Tylko niezbędne
        </button>
        <button onClick={revoke} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          Wycofaj wszystkie zgody
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <li className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="h-4 w-4 mt-1"
        aria-label={label}
      />
    </li>
  );
}
