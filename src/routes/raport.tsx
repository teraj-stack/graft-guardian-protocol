import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  DEFAULT_COORDINATOR,
  REPORT_TEMPLATE_CHANGELOG,
  REPORT_TEMPLATE_RELEASED,
  REPORT_TEMPLATE_VERSION,
} from "@/lib/report-template";

const TITLE = "Przykładowy cotygodniowy raport postępu — Tydzień 3";
const DESCRIPTION =
  "Szablon raportu cotygodniowego dla pacjenta po przeszczepie włosów DHI. Parametry biometryczne, tolerancja skóry, trend gojenia i zalecenia kliniczne.";

const REPORT_ID = "GGP-2026-0615-0042-W03";
const DOCUMENT_HASH = "sha256:8f4a…2c91";

export const Route = createFileRoute("/raport")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "/raport" }],
  }),
  component: RaportPage,
});

function RaportPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-light leading-none tracking-wide">Protokół</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">raport przykładowy</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center rounded-sm border border-border px-4 py-2 text-sm text-foreground transition hover:bg-secondary"
          >
            ← Strona główna
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 md:py-20">
        {/* Header block */}
        <div className="flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Cotygodniowy raport postępu</p>
            <h1 className="mt-2 font-display text-4xl leading-[1.05] md:text-5xl">Tydzień 3 po zabiegu DHI</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Okres raportowania: 15–21 czerwca 2026 · Wygenerowano: 22 czerwca 2026
            </p>
          </div>
          <div className="rounded-sm border border-border bg-card px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">ID pacjenta</p>
            <p className="mt-1 font-mono text-sm tracking-wide text-foreground">GGP-2026-0615-0042</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Pakiet</p>
            <p className="mt-1 text-sm text-foreground">20 sesji — intensywny program</p>
          </div>
        </div>

        {/* Sessions this week */}
        <section className="mt-10">
          <h2 className="font-display text-2xl md:text-3xl">Sesje wykonane w tym tygodniu</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SessionCard
              modality="HBOT"
              name="Tlenoterapia hiperbaryczna"
              detail="2,2 ATA · 90 min · 100% O₂"
              date="17 czerwca"
              count="Sesja 2 z 6"
            />
            <SessionCard
              modality="PBM"
              name="Fotobiomodulacja"
              detail="635 nm · 25 min · 5 J/cm²"
              date="19 czerwca"
              count="Sesja 3 z 10"
            />
            <SessionCard
              modality="Pielęgnacja"
              name="Kontrola koordynatora"
              detail="Ocena skóry · kalibracja dawek"
              date="20 czerwca"
              count="Wizyta 1 z 4"
            />
          </div>
        </section>

        {/* Biometrics */}
        <section className="mt-14">
          <h2 className="font-display text-2xl md:text-3xl">Parametry biometryczne</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Dane z trichoskopii cyfrowej (FotoFinder Dermoscope). Baseline = pomiar wykonany przed zabiegiem DHI.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <BiometricCard
              label="Mieszki w fazie anagen"
              unit="%"
              current={87}
              baseline={82}
              target={90}
              interpretation="Prawidłowy wzrost aktywacji cyklu wzrostowego."
            />
            <BiometricCard
              label="Grubość włosa"
              unit="µm"
              current={68}
              baseline={64}
              target={72}
              interpretation="Włos pogrubia się — efekt biostymulacji i poprawy ukrwienia."
            />
            <BiometricCard
              label="Gęstość graftów"
              unit="grafty/cm²"
              current={42}
              baseline={38}
              target={45}
              interpretation="Stabilizacja mikrokrążenia w strefie biorcy."
            />
          </div>
        </section>

        {/* Skin tolerance */}
        <section className="mt-14">
          <h2 className="font-display text-2xl md:text-3xl">Tolerancja skóry</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Skala 1–5: 1 = brak objawów, 5 = intensywne objawy wymagające interwencji. Ocena wykonywana przez koordynatora przy każdej wizycie.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <ToleranceCard label="Erytema (zaczerwienienie)" value={2} max={5} note="Umiarkowane, lokalne. W normie dla fazy gojenia." />
            <ToleranceCard label="Łuszczenie" value={1} max={5} note="Minimalne — pojedyncze suchie okręgi w strefie biorcy." />
            <ToleranceCard label="Nawilżenie" value={4} max={5} note="Dobre — pH skóry w normie, bariera lipidowa odbudowana." />
          </div>
        </section>

        {/* Trend chart (visual bars) */}
        <section className="mt-14 rounded-sm border border-border bg-card p-6 md:p-8">
          <h2 className="font-display text-2xl md:text-3xl">Trend wzrostowy vs baseline</h2>
          <div className="mt-8 space-y-6">
            <TrendBar label="Anagen %" baseline={82} current={87} target={90} unit="%" />
            <TrendBar label="Grubość włosa" baseline={64} current={68} target={72} unit="µm" />
            <TrendBar label="Gęstość graftów" baseline={38} current={42} target={45} unit="/cm²" />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Wszystkie trzy parametry rosną zgodnie z zakładaną krzywą gojenia. Brak odchyleń wymagających korekty protokołu.
          </p>
        </section>

        {/* Recommendations */}
        <section className="mt-14">
          <h2 className="font-display text-2xl md:text-3xl">Zalecenia na tydzień 4</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <RecCard icon="01" title="Kontynuacja HBOT" desc="2 sesje w komorze (2,2 ATA, 90 min). Nie modyfikujemy parametrów — odpowiedź tlenowa jest optymalna." />
            <RecCard icon="02" title="PBM — korekta dawki" desc="Zwiększ częstotliwość do 4×/tydzień (dotychczas 3×). Dawka 5 J/cm² bez zmian. Monitoruj temperaturę skóry." />
            <RecCard icon="03" title="Pielęgnacja domowa" desc="Wprowadź szampon z kwasem salicylowym 2×/tydzień (dotychczas 1×). Unikaj retinoidów do tygodnia 6." />
            <RecCard icon="04" title="Aktywność fizyczna" desc="Dozwolony powrót do biegania i siłowni (bez kontaktu z uchwytami bezpośrednio nad głową). Sauna IR — dopiero od tygodnia 5." />
          </div>
        </section>

        {/* Clinical interpretation */}
        <section className="mt-14 rounded-sm border border-border bg-card p-6 md:p-8">
          <h2 className="font-display text-2xl md:text-3xl">Interpretacja kliniczna dla pacjenta</h2>
          <div className="mt-6 space-y-4 text-foreground/90">
            <p>
              Wyniki tygodnia 3 są <strong className="text-accent">zgodne z oczekiwanym tempem rekonwalescencji</strong> po przeszczepie metodą DHI. Wzrost odsetka mieszków w fazie anagen o 5 pkt proc. (z 82% do 87%) oraz grubości włosa o 4 µm (z 64 µm do 68 µm) wskazuje na prawidłową aktywację cyklu wzrostowego pod wpływem protokołu HBOT + PBM.
            </p>
            <p>
              Gęstość graftów wzrosła o 4 jednostki na cm² — to oznacza, że mikrokrążenie w strefie biorcy stabilizuje się i nowo przeszczepione jednostki follicularne uzyskują wystarczające unaczynienie. <strong className="text-accent">Nie obserwujemy oznak opóźnionej angiogenezy</strong> ani przewlekłego stanu zapalnego.
            </p>
            <p>
              Tolerancja skóry jest bardzo dobra. Minimalne łuszczenie (1/5) i umiarkowane zaczerwienienie (2/5) to <strong className="text-accent">normalna fizjologiczna reakcja w tej fazie gojenia</strong> — nie wymagają interwencji farmakologicznej. Poziom nawilżenia (4/5) potwierdza prawidłową regenerację bariery naskórkowej.
            </p>
            <p className="rounded-sm border border-accent/20 bg-accent/10 p-4 text-sm">
              <strong className="text-accent">Rekomendacja końcowa:</strong> kontynuuj obecny protokół bez modyfikacji lekowych. W tygodniu 4 planujemy wstępną kwalifikację do pierwszej sesji LADD (laser-assisted drug delivery) — jeśli tolerancja skóry pozostanie na tym samym poziomie, możliwe jest rozpoczęcie ablacji w tygodniu 5 lub 6.
            </p>
          </div>
        </section>

        {/* Footer note */}
        <div className="mt-12 border-t border-border pt-8 text-xs text-muted-foreground">
          <p>
            Raport ma charakter edukacyjny i przykładowy. Rzeczywiste dane pacjenta są przechowywane w zabezpieczonym panelu klinicznym i udostępniane wyłącznie upoważnionemu personelowi medycznemu. Powyższy szablon nie zastępuje konsultacji lekarskiej.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ─── Subcomponents ─── */

function SessionCard({ modality, name, detail, date, count }: {
  modality: string;
  name: string;
  detail: string;
  date: string;
  count: string;
}) {
  const badgeColor = modality === "HBOT"
    ? "border-sky-400/40 text-sky-300"
    : modality === "PBM"
      ? "border-amber-400/40 text-amber-300"
      : "border-emerald-400/40 text-emerald-300";

  return (
    <div className="rounded-sm border border-border bg-card p-5 transition hover:border-accent/30">
      <div className="flex items-center justify-between">
        <span className={`rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-wider ${badgeColor}`}>{modality}</span>
        <span className="text-[10px] text-muted-foreground">{date}</span>
      </div>
      <p className="mt-3 font-display text-lg">{name}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      <p className="mt-3 text-xs text-accent">{count}</p>
    </div>
  );
}

function BiometricCard({ label, unit, current, baseline, target, interpretation }: {
  label: string;
  unit: string;
  current: number;
  baseline: number;
  target: number;
  interpretation: string;
}) {
  const change = current - baseline;
  const changePct = ((change / baseline) * 100).toFixed(1);
  const toTarget = target - current;

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-4xl text-accent">{current}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">Baseline: {baseline} {unit}</span>
        <span className="rounded-sm bg-accent/10 px-1.5 py-0.5 text-accent">+{change} ({changePct}%)</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${Math.min(100, ((current - baseline) / (target - baseline)) * 100)}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{interpretation}</p>
      <p className="mt-1 text-[10px] text-muted-foreground/70">Do celu: {toTarget > 0 ? `+${toTarget}` : toTarget} {unit}</p>
    </div>
  );
}

function ToleranceCard({ label, value, max, note }: {
  label: string;
  value: number;
  max: number;
  note: string;
}) {
  const dots = Array.from({ length: max }, (_, i) => i < value);
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <div className="mt-3 flex gap-1.5">
        {dots.map((filled, i) => (
          <span
            key={i}
            className={`inline-block h-2.5 w-2.5 rounded-full ${filled ? "bg-accent" : "bg-secondary"}`}
          />
        ))}
      </div>
      <p className="mt-2 font-display text-2xl">{value}<span className="text-base text-muted-foreground">/{max}</span></p>
      <p className="mt-3 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function TrendBar({ label, baseline, current, target, unit }: {
  label: string;
  baseline: number;
  current: number;
  target: number;
  unit: string;
}) {
  const range = target - baseline;
  const baselinePct = 0;
  const currentPct = ((current - baseline) / range) * 100;
  const targetPct = 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">
          <span className="text-muted-foreground line-through">{baseline} {unit}</span>
          <span className="mx-2 text-accent">→</span>
          <strong>{current} {unit}</strong>
          <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">cel: {target} {unit}</span>
        </span>
      </div>
      <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-secondary">
        {/* target marker */}
        <div
          className="absolute top-0 h-full w-px bg-muted-foreground/40"
          style={{ left: `${targetPct}%` }}
        />
        {/* current bar */}
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${Math.min(100, Math.max(0, currentPct))}%` }}
        />
      </div>
    </div>
  );
}

function RecCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 rounded-sm border border-border bg-card p-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/30 text-xs font-medium text-accent">
        {icon}
      </span>
      <div>
        <p className="font-display text-lg">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
