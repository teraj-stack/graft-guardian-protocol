import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useCookieConsent } from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const { consent, hydrated, acceptAll, rejectAll, accept } = useCookieConsent();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, functional: false, marketing: false });

  if (!hydrated || consent) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Zgoda na pliki cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur"
    >
      <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
        {!open ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground md:max-w-2xl">
              <p className="text-foreground font-medium mb-1">Pliki cookies i prywatność</p>
              <p>
                Używamy plików cookies niezbędnych do działania serwisu oraz — za Twoją zgodą — cookies analitycznych, funkcjonalnych i marketingowych. Szczegóły w{" "}
                <Link to="/cookies" className="underline hover:text-accent">Polityce cookies</Link>{" "}
                i{" "}
                <Link to="/prywatnosc" className="underline hover:text-accent">Polityce prywatności (RODO)</Link>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={rejectAll}
                className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
              >
                Tylko niezbędne
              </button>
              <button
                onClick={() => setOpen(true)}
                className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
              >
                Ustawienia
              </button>
              <button
                onClick={acceptAll}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Akceptuj wszystkie
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-foreground font-medium">Twoje preferencje</p>
              <p className="text-sm text-muted-foreground">
                Zgody możesz w każdej chwili zmienić lub wycofać na stronie{" "}
                <Link to="/cookies" className="underline hover:text-accent">Polityki cookies</Link>.
              </p>
            </div>
            <ul className="space-y-3">
              <ConsentRow label="Niezbędne" required description="Wymagane do bezpiecznego działania serwisu (sesja, CSRF, preferencje zgód)." />
              <ConsentRow
                label="Analityczne"
                description="Anonimowe statystyki ruchu, by ulepszać treści protokołu."
                checked={prefs.analytics}
                onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
              />
              <ConsentRow
                label="Funkcjonalne"
                description="Zapamiętywanie postępu materiałów edukacyjnych i preferencji UI."
                checked={prefs.functional}
                onChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
              />
              <ConsentRow
                label="Marketingowe"
                description="Pomiar skuteczności kampanii edukacyjnych. Obecnie nieaktywne."
                checked={prefs.marketing}
                onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
              />
            </ul>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={rejectAll}
                className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
              >
                Odrzuć opcjonalne
              </button>
              <button
                onClick={() => accept(prefs)}
                className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
              >
                Zapisz wybór
              </button>
              <button
                onClick={acceptAll}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Akceptuj wszystkie
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConsentRow({
  label,
  description,
  checked,
  onChange,
  required,
}: {
  label: string;
  description: string;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  required?: boolean;
}) {
  return (
    <li className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <label className="shrink-0 inline-flex items-center gap-2 text-xs text-muted-foreground">
        {required ? (
          <span className="rounded bg-muted px-2 py-1 text-foreground">Zawsze aktywne</span>
        ) : (
          <input
            type="checkbox"
            checked={!!checked}
            onChange={(e) => onChange?.(e.target.checked)}
            className="h-4 w-4"
            aria-label={label}
          />
        )}
      </label>
    </li>
  );
}
