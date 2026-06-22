import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ALL_WEEKS, WEEK_PRESETS, materialsForWeek } from "@/lib/materials";
import { EMAIL_REGEX, PHONE_REGEX } from "@/lib/reminders/schema";

const TITLE = "Przypomnienia po przeszczepie — e-mail i SMS";
const DESCRIPTION =
  "Zapisz się na przypomnienia e-mail i SMS o materiałach na każdy tydzień po przeszczepie włosów. Bez spamu, wypis jednym kliknięciem.";

export const Route = createFileRoute("/przypomnienia")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "https://graftgen.com/przypomnienia" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://graftgen.com/przypomnienia" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: "https://graftgen.com/przypomnienia",
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
            { "@type": "ListItem", position: 2, name: "Przypomnienia", item: "https://graftgen.com/przypomnienia" },
          ],
        }),
      },
    ],
  }),

  component: RemindersPage,
});

type FieldErrors = Partial<Record<string, string>>;

function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function RemindersPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [surgeryDate, setSurgeryDate] = useState(todayIso());
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelSms, setChannelSms] = useState(false);
  const [weeks, setWeeks] = useState<number[]>(WEEK_PRESETS.key);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState<{ unsubscribeToken: string } | null>(null);

  function toggleWeek(w: number) {
    setWeeks((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort((a, b) => a - b)
    );
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!EMAIL_REGEX.test(email.trim())) e.email = "Nieprawidłowy e-mail.";
    if (phone.trim() && !PHONE_REGEX.test(phone.trim()))
      e.phone = "Telefon w formacie międzynarodowym, np. +48512345678.";
    if (!surgeryDate) e.surgeryDate = "Wybierz datę zabiegu.";
    if (!channelEmail && !channelSms) e.channelEmail = "Wybierz co najmniej jeden kanał.";
    if (channelSms && !phone.trim()) e.phone = "SMS wymaga numeru telefonu.";
    if (weeks.length === 0) e.weeks = "Wybierz co najmniej jeden tydzień.";
    if (!consent) e.consent = "Wymagana zgoda na otrzymywanie wiadomości.";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    setSubmitting(true);
    try {
      const resp = await fetch("/api/public/reminders/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          surgeryDate,
          channelEmail,
          channelSms,
          selectedWeeks: weeks,
          consent: true,
        }),
      });
      const json = (await resp.json()) as { ok?: boolean; unsubscribeToken?: string; error?: string };
      if (!resp.ok || !json.ok) {
        setErrors({ form: json.error || "Nie udało się zapisać. Spróbuj ponownie." });
        return;
      }
      setDone({ unsubscribeToken: json.unsubscribeToken ?? "" });
    } catch {
      setErrors({ form: "Błąd sieci. Spróbuj ponownie." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-light leading-none tracking-wide">Protokół</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">przypomnienia</span>
          </Link>
          <div className="flex gap-2">
            <Link
              to="/panel"
              className="inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm text-foreground transition hover:bg-secondary"
            >
              Panel pacjenta
            </Link>
            <Link
              to="/"
              className="inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm text-foreground transition hover:bg-secondary"
            >
              ← Strona główna
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <p className="mb-4 text-xs uppercase tracking-[0.25em] text-accent">Automatyczne przypomnienia</p>
        <h1 className="font-display text-4xl leading-[1.05] md:text-6xl">
          Dostajesz materiał wtedy, kiedy go faktycznie potrzebujesz.
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          W każdym wybranym tygodniu po zabiegu wyślemy Ci krótką wiadomość z materiałami zaplanowanymi dokładnie
          na ten etap rekonwalescencji. Bez spamu. Jedno kliknięcie i&nbsp;rezygnujesz.
        </p>

        {done ? (
          <section className="mt-12 rounded-sm border border-accent/60 bg-card p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Zapisano</p>
            <h2 className="mt-3 font-display text-3xl">Dziękujemy. Pierwsze przypomnienie przyjdzie w tygodniu 1.</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Jeśli kiedykolwiek zechcesz przestać otrzymywać te wiadomości — link „Wypisz się” jest w każdej z nich,
              albo zachowaj poniższy link:
            </p>
            <code className="mt-3 block break-all rounded-sm border border-border bg-secondary px-3 py-2 text-xs">
              /przypomnienia/wypisz?token={done.unsubscribeToken}
            </code>
            <Link
              to="/panel"
              className="mt-6 inline-flex items-center rounded-sm bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90"
            >
              Przejdź do panelu pacjenta
            </Link>
          </section>
        ) : (
          <form onSubmit={onSubmit} className="mt-12 grid gap-8">
            <section className="rounded-sm border border-border bg-card p-6">
              <h2 className="font-display text-2xl">Twój kontakt</h2>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <Field label="E-mail" error={errors.email} required>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ty@przyklad.pl"
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </Field>
                <Field label="Telefon (z kierunkowym)" error={errors.phone} hint="np. +48512345678">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={16}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+48512345678"
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </Field>
                <Field label="Data zabiegu" error={errors.surgeryDate} required>
                  <input
                    type="date"
                    required
                    value={surgeryDate}
                    onChange={(e) => setSurgeryDate(e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-sm border border-border bg-card p-6">
              <h2 className="font-display text-2xl">Kanały</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Wybierz, jak mamy się z Tobą kontaktować. Możesz wybrać oba.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ChannelToggle
                  label="E-mail"
                  description="Pełny materiał z linkami do PDF, wideo i checklist."
                  checked={channelEmail}
                  onChange={setChannelEmail}
                />
                <ChannelToggle
                  label="SMS"
                  description="Krótki komunikat z linkiem do panelu. Wymaga numeru telefonu."
                  checked={channelSms}
                  onChange={setChannelSms}
                />
              </div>
              {errors.channelEmail ? (
                <p className="mt-3 text-xs text-destructive">{errors.channelEmail}</p>
              ) : null}
            </section>

            <section className="rounded-sm border border-border bg-card p-6">
              <h2 className="font-display text-2xl">Harmonogram</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Wybierz tygodnie, w których chcesz dostać przypomnienie. Pokazujemy ile materiałów jest
                zaplanowanych na każdy z nich.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PresetButton label="Kluczowe momenty" onClick={() => setWeeks(WEEK_PRESETS.key)} />
                <PresetButton label="Wczesne (T1–T4)" onClick={() => setWeeks(WEEK_PRESETS.early)} />
                <PresetButton label="Wszystkie tygodnie" onClick={() => setWeeks(WEEK_PRESETS.all)} />
                <PresetButton label="Wyczyść" onClick={() => setWeeks([])} variant="ghost" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {ALL_WEEKS.map((w) => {
                  const active = weeks.includes(w);
                  const count = materialsForWeek(w).length;
                  return (
                    <button
                      key={w}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleWeek(w)}
                      className={
                        "rounded-sm border px-3 py-2 text-left text-xs transition " +
                        (active
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground")
                      }
                    >
                      <div className="text-sm font-medium">T{w}</div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider opacity-80">
                        {count} {count === 1 ? "materiał" : count >= 2 && count <= 4 ? "materiały" : "materiałów"}
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.weeks ? <p className="mt-3 text-xs text-destructive">{errors.weeks}</p> : null}
            </section>

            <section className="rounded-sm border border-border bg-card p-6">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-accent"
                />
                <span className="text-muted-foreground">
                  Wyrażam zgodę na otrzymywanie automatycznych przypomnień edukacyjnych e-mail i/lub SMS, zgodnie z
                  wybranymi powyżej ustawieniami. Zgodę mogę cofnąć w dowolnym momencie, klikając „Wypisz się” w
                  wiadomości. Materiały mają charakter edukacyjny i nie zastępują konsultacji lekarskiej.
                </span>
              </label>
              {errors.consent ? <p className="mt-3 text-xs text-destructive">{errors.consent}</p> : null}
            </section>

            {errors.form ? (
              <div className="rounded-sm border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errors.form}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center rounded-sm bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-wider text-background transition hover:bg-foreground/90 disabled:opacity-50"
              >
                {submitting ? "Zapisywanie…" : "Zapisz mnie na przypomnienia"}
              </button>
              <p className="text-xs text-muted-foreground">
                Pierwsza wiadomość przyjdzie najwcześniej po 7 dniach od daty zabiegu.
              </p>
            </div>
          </form>
        )}
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-10 text-xs text-muted-foreground">
          Dane kontaktowe przechowywane są wyłącznie w celu wysyłki przypomnień. Nie udostępniamy ich osobom trzecim.
        </div>
      </footer>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </span>
      <div className="mt-2">{children}</div>
      {hint && !error ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
      {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : null}
    </label>
  );
}

function ChannelToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={
        "flex cursor-pointer items-start gap-3 rounded-sm border p-4 transition " +
        (checked ? "border-accent bg-accent/5" : "border-border hover:border-foreground/40")
      }
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-accent"
      />
      <span>
        <span className="block font-display text-lg">{label}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function PresetButton({
  label,
  onClick,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-sm border px-3 py-1.5 text-xs uppercase tracking-wider transition " +
        (variant === "ghost"
          ? "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
          : "border-border text-foreground hover:border-accent hover:text-accent")
      }
    >
      {label}
    </button>
  );
}
