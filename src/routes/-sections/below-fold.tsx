import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type ReactNode, type FormEvent } from "react";
import { useTranslation, Trans } from "react-i18next";
import { PRICING } from "@/lib/pricing-data";
import { useFaq } from "@/lib/faq-data";
import type { StageKey, TopicKey } from "@/lib/faq-meta";
import { validateReferences, type RefValidation } from "@/lib/references.functions";
import { Section, SectionHeader, Card, Mech } from "@/components/section-primitives";
import { AnimatedTile } from "@/components/animated-tile";
import { evidenceLqip } from "@/components/animated-tile-lqip";
import {
  SCHEDULE,
  addDaysIso,
  buildIcs,
  buildPlainText,
  buildShortMessage,
  todayIso,
  useSchedule,
} from "@/lib/schedule-data";

/* ---------- Microbiome ---------- */

export function Microbiome() {
  const { t } = useTranslation();
  return (
    <Section id="mikrobiom" eyebrow={t("clinical.microbiome.eyebrow")}>
      <SectionHeader
        title={t("clinical.microbiome.title")}
        lead={t("clinical.microbiome.lead")}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card title={t("clinical.microbiome.card1.title")} badge={t("clinical.microbiome.card1.badge")}>
          <p dangerouslySetInnerHTML={{ __html: t("clinical.microbiome.card1.body") }} />
        </Card>
        <div className="flex flex-col gap-6">
          <Card title={t("clinical.microbiome.card2.title")} badge={t("clinical.microbiome.card2.badge")}>
            <p dangerouslySetInnerHTML={{ __html: t("clinical.microbiome.card2.body") }} />
            <Mech>
              <span dangerouslySetInnerHTML={{ __html: t("clinical.microbiome.card2.mech") }} />
            </Mech>
          </Card>
        </div>
      </div>
    </Section>
  );
}

/* ---------- Timeline ---------- */

export function Timeline() {
  const { t } = useTranslation();
  const pRaw = t("clinical.timeline.phases", { returnObjects: true, defaultValue: [] });
  const phases = (Array.isArray(pRaw) ? pRaw : []) as {
    tag: string;
    title: string;
    bullets: string[];
  }[];


  return (
    <Section id="protokol" eyebrow={t("clinical.timeline.eyebrow")}>
      <SectionHeader
        title={t("clinical.timeline.title")}
        lead={t("clinical.timeline.lead")}
      />
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


/* ---------- Interactive Day 0–14 Schedule ---------- */


const SCHEDULE_STORAGE_KEY = "graftgen.schedule.v1";

function loadProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}


export function InteractiveSchedule() {
  const { t } = useTranslation();
  const schedule = useSchedule();
  const [openDay, setOpenDay] = useState<number>(0);
  const [done, setDone] = useState<Record<string, boolean>>(() => loadProgress());
  const [surgeryDate, setSurgeryDate] = useState<string>(todayIso());
  const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "err">("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "rate_limited" | "suppressed" | "invalid" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "copied" | "err">("idle");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const smsText = useMemo(() => buildShortMessage(surgeryDate), [surgeryDate]);
  const smsStats = useMemo(() => {
    // GSM-7 default alphabet (rough): A–Z a–z 0–9 + basic punctuation.
    // Polish diacritics (ą ę ł ś ć ń ó ź ż) force UCS-2 encoding.
    const gsm7 = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅå_ÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/;
    const isGsm = gsm7.test(smsText);
    const length = [...smsText].length;
    const single = isGsm ? 160 : 70;
    const multi = isGsm ? 153 : 67;
    const segments = length === 0 ? 0 : length <= single ? 1 : Math.ceil(length / multi);
    return { length, segments, encoding: isGsm ? "GSM-7" : "UCS-2 (Unicode)", single, multi };
  }, [smsText]);
  const [emailPreview, setEmailPreview] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "ready"; html: string; subject: string }
    | { state: "error"; message: string }
  >({ state: "idle" });
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  function validateEmail(raw: string): { ok: true; value: string } | { ok: false; message: string } {
    const value = raw.trim().toLowerCase();
    if (!value) return { ok: false, message: "Podaj adres e-mail." };
    if (value.length > 254) return { ok: false, message: "Adres e-mail jest zbyt długi (max 254 znaki)." };
    if (/\s/.test(value)) return { ok: false, message: "Adres nie może zawierać spacji." };
    const at = value.indexOf("@");
    if (at < 1 || at !== value.lastIndexOf("@")) {
      return { ok: false, message: "Adres musi zawierać dokładnie jeden znak @." };
    }
    const local = value.slice(0, at);
    const domain = value.slice(at + 1);
    if (local.length > 64) return { ok: false, message: "Część przed @ jest zbyt długa (max 64 znaki)." };
    if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
      return { ok: false, message: "Niepoprawne kropki w części przed @." };
    }
    if (!/^[a-z0-9._%+\-]+$/.test(local)) {
      return { ok: false, message: "Część przed @ zawiera niedozwolone znaki." };
    }
    if (!domain.includes(".")) return { ok: false, message: "Domena musi zawierać kropkę, np. gmail.com." };
    if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
      return { ok: false, message: "Niepoprawne kropki w domenie." };
    }
    if (!/^[a-z0-9.\-]+$/.test(domain)) {
      return { ok: false, message: "Domena zawiera niedozwolone znaki." };
    }
    const tld = domain.split(".").pop() ?? "";
    if (!/^[a-z]{2,}$/.test(tld)) {
      return { ok: false, message: "Domena najwyższego poziomu jest niepoprawna." };
    }
    return { ok: true, value };
  }

  function onEmailBlur() {
    if (!email.trim()) {
      setEmailError(null);
      return;
    }
    const v = validateEmail(email);
    setEmailError(v.ok ? null : v.message);
  }

  async function openEmailPreview() {
    setShowEmailPreview(true);
    setEmailPreview({ state: "loading" });
    try {
      const resp = await fetch("/api/public/reminders/preview-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surgeryDate }),
      });
      const json = (await resp.json().catch(() => ({}))) as {
        ok?: boolean;
        html?: string;
        subject?: string;
      };
      if (resp.ok && json.ok && json.html) {
        setEmailPreview({ state: "ready", html: json.html, subject: json.subject ?? "" });
      } else {
        setEmailPreview({ state: "error", message: "Nie udało się wygenerować podglądu wiadomości. Spróbuj ponownie za chwilę." });
      }
    } catch {
      setEmailPreview({ state: "error", message: "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie." });
    }
  }

  function resetEmailForm() {
    setEmail("");
    setEmailError(null);
    setStatusMessage(null);
    setEmailStatus("idle");
  }

  function downloadIcs() {
    const ics = buildIcs(surgeryDate);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `graftgen-przypomnienia-${surgeryDate}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(buildPlainText(surgeryDate));
      setCopyStatus("ok");
    } catch {
      setCopyStatus("err");
    }
    setTimeout(() => setCopyStatus("idle"), 2500);
  }

  async function sendEmail() {
    const v = validateEmail(email);
    if (!v.ok) {
      setEmailError(v.message);
      setEmailStatus("invalid");
      setStatusMessage(v.message);
      return;
    }
    setEmailError(null);
    if (!consent) {
      setStatusMessage("Zaznacz zgodę na otrzymywanie przypomnień.");
      return;
    }
    setEmailStatus("sending");
    setStatusMessage(null);
    try {
      const resp = await fetch("/api/public/reminders/send-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: v.value,
          surgeryDate,
          consent: true,
        }),
      });
      const json = (await resp.json().catch(() => ({}))) as {
        ok?: boolean;
        reason?: string;
        error?: string;
        retryAfterMinutes?: number;
        details?: { fieldErrors?: Record<string, string[]> };
      };
      if (resp.status === 429 || json.reason === "rate_limited") {
        const mins = json.retryAfterMinutes ?? 5;
        setEmailStatus("rate_limited");
        setStatusMessage(`Wysłaliśmy już wiadomość na ten adres. Odczekaj ${mins} min i spróbuj ponownie.`);
      } else if (json.reason === "email_suppressed") {
        setEmailStatus("suppressed");
        setStatusMessage("Ten adres został wcześniej wypisany z powiadomień. Użyj innego adresu lub skontaktuj się z nami.");
      } else if (resp.status === 400 && json.error === "validation_failed") {
        const first = Object.values(json.details?.fieldErrors ?? {})[0]?.[0];
        setEmailStatus("invalid");
        setStatusMessage(first ?? "Dane formularza są niepoprawne. Sprawdź adres e-mail i datę zabiegu.");
      } else if (resp.status >= 500 || json.error === "enqueue_failed" || json.error === "server_misconfigured") {
        setEmailStatus("error");
        setStatusMessage("Serwer chwilowo nie może wysłać wiadomości. Spróbuj ponownie za kilka minut.");
      } else if (resp.ok && json.ok) {
        setEmailStatus("sent");
        setStatusMessage(`Wysłaliśmy harmonogram na ${v.value}. Sprawdź też folder Spam.`);
      } else {
        setEmailStatus("error");
        setStatusMessage("Nie udało się wysłać wiadomości. Spróbuj ponownie.");
      }
    } catch {
      setEmailStatus("error");
      setStatusMessage("Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.");
    }
  }


  async function shareToPhone() {
    const text = buildShortMessage(surgeryDate);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Graftgen — Dzień 0–14",
          text,
        });
        setShareStatus("shared");
      } catch {
        setShareStatus("idle");
        return;
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShareStatus("copied");
      } catch {
        setShareStatus("err");
      }
    }
    setTimeout(() => setShareStatus("idle"), 2500);
  }

  function whatsappHref(): string {
    const text = buildShortMessage(surgeryDate);
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  function smsHref(): string {
    const text = buildShortMessage(surgeryDate);
    const v = validatePhone(phone);
    const num = v.ok ? v.value : "";
    // iOS uses ?&body=, Android tolerates ?body=. Number is optional.
    return `sms:${num}?&body=${encodeURIComponent(text)}`;
  }

  // E.164: leading +, country code 1–9, then up to 14 digits. Total 8–15 digits.
  function validatePhone(raw: string): { ok: true; value: string } | { ok: false; message: string } {
    const value = raw.replace(/[\s\-().]/g, "").trim();
    if (!value) return { ok: false, message: "Podaj numer telefonu w formacie międzynarodowym, np. +48600100200." };
    if (!value.startsWith("+")) return { ok: false, message: "Numer musi zaczynać się od „+" + "” i kodu kraju, np. +48." };
    const digits = value.slice(1);
    if (!/^\d+$/.test(digits)) return { ok: false, message: "Numer może zawierać tylko cyfry (po znaku +)." };
    if (digits.length < 8 || digits.length > 15) {
      return { ok: false, message: "Numer powinien mieć 8–15 cyfr łącznie z kodem kraju." };
    }
    if (digits.startsWith("0")) {
      return { ok: false, message: "Po + nie wpisuj zera wiodącego — od razu kod kraju (48, 49, 44…)." };
    }
    return { ok: true, value };
  }

  function onPhoneBlur() {
    if (!phone.trim()) {
      setPhoneError(null);
      return;
    }
    const v = validatePhone(phone);
    setPhoneError(v.ok ? null : v.message);
  }




  const totalTasks = schedule.reduce((n, d) => n + d.tasks.length, 0);
  const doneCount = Object.values(done).filter(Boolean).length;
  const pct = Math.round((doneCount / totalTasks) * 100);

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }

  function resetAll() {
    setDone({});
    try {
      window.localStorage.removeItem(SCHEDULE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <Section id="harmonogram" eyebrow={t("schedule.eyebrow")}>
      <SectionHeader
        title="Twoja checklista, dzień po dniu."
        lead="Odhacz każdy krok. Postęp zapisuje się lokalnie w przeglądarce — bez konta, bez chmury."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-border bg-card/40 p-4">
        <div className="text-sm">
          Ukończono <span className="font-display text-lg text-accent">{doneCount}</span> /{" "}
          {totalTasks} kroków
        </div>
        <div className="flex flex-1 items-center gap-3 md:max-w-md">
          <div className="h-1.5 flex-1 overflow-hidden bg-border">
            <div
              className="h-full bg-accent transition-[width] duration-500"
              style={{ width: `${pct}%` }}
              aria-hidden
            />
          </div>
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
            {pct}%
          </span>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="text-xs uppercase tracking-[0.18em] text-muted-foreground transition hover:text-accent"
        >
          Resetuj postęp
        </button>
      </div>

      <div className="mb-6 border border-border bg-card/40 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Data zabiegu
            </label>
            <input
              type="date"
              value={surgeryDate}
              onChange={(e) => setSurgeryDate(e.target.value || todayIso())}
              className="mt-1 border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[14rem] text-xs text-muted-foreground">
            Wygeneruj 15 wpisów (Dzień 0–14) z zaleceniami: mycie, HOCl, PBM/LLLT,
            HBOT, strupki, sen, czerwone flagi. Każde wydarzenie ma alarm 1 h
            wcześniej.
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadIcs}
              className="inline-flex items-center border border-accent bg-accent/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-accent transition hover:bg-accent/20"
            >
              Pobierz .ics (kalendarz)
            </button>
            <button
              type="button"
              onClick={copyText}
              className="inline-flex items-center border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-foreground transition hover:border-accent hover:text-accent"
            >
              {copyStatus === "ok" ? "Skopiowano ✓" : copyStatus === "err" ? "Błąd — zaznacz ręcznie" : "Skopiuj jako tekst"}
            </button>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
            >
              {showPreview ? "Ukryj podgląd" : "Podgląd tekstu"}
            </button>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Plik .ics zaimportujesz w Google Calendar, Apple Calendar i Outlooku.
          Tekst wklej do dowolnej aplikacji notatek lub wiadomości.
        </p>
        {showPreview && (
          <textarea
            readOnly
            value={buildPlainText(surgeryDate)}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-4 h-72 w-full resize-y border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-foreground/90"
          />
        )}

        <div className="mt-5 grid gap-5 border-t border-border pt-5 md:grid-cols-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Wyślij na e-mail
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                  if (statusMessage && emailStatus !== "sent") {
                    setStatusMessage(null);
                    setEmailStatus("idle");
                  }
                }}
                onBlur={onEmailBlur}
                placeholder="ty@przyklad.pl"
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? "schedule-email-error" : statusMessage ? "schedule-email-status" : undefined}
                className={
                  "flex-1 border bg-background px-3 py-2 text-sm focus:outline-none " +
                  (emailError
                    ? "border-destructive focus:border-destructive"
                    : "border-border focus:border-accent")
                }
              />
              <button
                type="button"
                onClick={sendEmail}
                disabled={emailStatus === "sending" || !consent || email.trim().length === 0}
                className="inline-flex items-center justify-center border border-accent bg-accent/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-accent transition hover:bg-accent/20 disabled:opacity-50"
              >
                {emailStatus === "sending"
                  ? "Wysyłanie…"
                  : emailStatus === "sent"
                    ? "Wysłano ✓"
                    : "Wyślij mi e-mailem"}
              </button>
            </div>
            {emailError && (
              <p id="schedule-email-error" role="alert" className="mt-2 text-[11px] text-destructive">
                {emailError}
              </p>
            )}
            {statusMessage && !emailError && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p
                  id="schedule-email-status"
                  role={emailStatus === "sent" ? "status" : "alert"}
                  aria-live="polite"
                  className={
                    "text-[11px] " +
                    (emailStatus === "sent"
                      ? "text-accent"
                      : emailStatus === "rate_limited"
                        ? "text-amber-500"
                        : "text-destructive")
                  }
                >
                  {statusMessage}
                </p>
                {emailStatus === "error" && (
                  <>
                    <button
                      type="button"
                      onClick={sendEmail}
                      className="text-[11px] uppercase tracking-[0.18em] text-accent underline-offset-4 transition hover:underline"
                    >
                      Wyślij ponownie
                    </button>
                    <a
                      href={smsHref()}
                      onClick={() => {
                        setStatusMessage(
                          "Otworzyliśmy aplikację SMS z gotową treścią harmonogramu. Wyślij ją do siebie."
                        );
                        setEmailStatus("idle");
                      }}
                      className="text-[11px] uppercase tracking-[0.18em] text-accent underline-offset-4 transition hover:underline"
                    >
                      Wyślij przez SMS zamiast e-maila
                    </a>
                  </>
                )}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openEmailPreview}
                className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 transition hover:text-accent hover:underline"
              >
                Podgląd e-maila przed wysłaniem
              </button>
              {emailStatus === "sent" && (
                <button
                  type="button"
                  onClick={resetEmailForm}
                  className="text-[11px] uppercase tracking-[0.18em] text-accent underline-offset-4 transition hover:underline"
                >
                  Wyślij na inny adres
                </button>
              )}
            </div>

            <label className="mt-2 flex items-start gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-[hsl(var(--accent))]"
              />
              <span>
                Wyrażam zgodę na jednorazową wysyłkę przypomnień edukacyjnych
                na podany adres. Bez zapisu na listę — jeden e-mail, bez ciągu
                dalszego.
              </span>
            </label>
          </div>


          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Wyślij jako wiadomość na telefon
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={20}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError(null);
                }}
                onBlur={onPhoneBlur}
                placeholder="+48 600 100 200"
                aria-invalid={phoneError ? true : undefined}
                aria-describedby={phoneError ? "schedule-phone-error" : "schedule-phone-hint"}
                className={
                  "flex-1 border bg-background px-3 py-2 text-sm focus:outline-none " +
                  (phoneError
                    ? "border-destructive focus:border-destructive"
                    : "border-border focus:border-accent")
                }
              />
              <a
                href={smsHref()}
                onClick={(e) => {
                  if (phone.trim()) {
                    const v = validatePhone(phone);
                    if (!v.ok) {
                      e.preventDefault();
                      setPhoneError(v.message);
                    }
                  }
                }}
                className="inline-flex items-center justify-center border border-accent bg-accent/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-accent transition hover:bg-accent/20"
              >
                Wyślij SMS
              </a>
            </div>
            {phoneError ? (
              <p id="schedule-phone-error" role="alert" className="mt-2 text-[11px] text-destructive">
                {phoneError}
              </p>
            ) : (
              <p id="schedule-phone-hint" className="mt-2 text-[11px] text-muted-foreground">
                Format międzynarodowy E.164: znak <span className="font-mono">+</span>, kod kraju
                i numer bez spacji (np. <span className="font-mono">+48600100200</span>). Pole opcjonalne —
                bez numeru SMS otworzy się z pustym polem odbiorcy.
              </p>
            )}

            <div className="mt-3 rounded border border-border/60 bg-background/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span>
                  Długość wiadomości:{" "}
                  <strong className="text-foreground">{smsStats.length}</strong> znaków •{" "}
                  <strong className="text-foreground">{smsStats.segments}</strong>{" "}
                  {smsStats.segments === 1 ? "segment SMS" : "segmenty SMS"} •{" "}
                  kodowanie {smsStats.encoding} (limit{" "}
                  {smsStats.segments <= 1 ? smsStats.single : smsStats.multi} zn./segment)
                </span>
                <button
                  type="button"
                  onClick={() => setShowSmsPreview((v) => !v)}
                  className="text-[11px] uppercase tracking-[0.18em] text-accent hover:underline"
                  aria-expanded={showSmsPreview}
                  aria-controls="sms-preview-text"
                >
                  {showSmsPreview ? "Ukryj podgląd" : "Podgląd treści SMS"}
                </button>
              </div>
              {smsStats.segments > 1 ? (
                <p className="mt-1 text-[11px] text-amber-500">
                  Wiadomość przekracza limit pojedynczego SMS — zostanie wysłana jako{" "}
                  {smsStats.segments} połączone segmenty (operator może naliczyć je osobno).
                </p>
              ) : null}
              {showSmsPreview ? (
                <pre
                  id="sms-preview-text"
                  className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-background/70 p-2 text-[11px] leading-relaxed text-foreground"
                >
                  {smsText}
                </pre>
              ) : null}
            </div>



            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={shareToPhone}
                className="inline-flex items-center border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-foreground transition hover:border-accent hover:text-accent"
              >
                {shareStatus === "shared"
                  ? "Udostępniono ✓"
                  : shareStatus === "copied"
                    ? "Skopiowano ✓"
                    : shareStatus === "err"
                      ? "Błąd — skopiuj ręcznie"
                      : "Udostępnij / skopiuj"}
              </button>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-foreground transition hover:border-accent hover:text-accent"
              >
                WhatsApp
              </a>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              „Udostępnij” korzysta z systemowego okna na telefonie (Wiadomości,
              WhatsApp, Signal, Telegram). Na desktopie kopiuje skróconą wersję
              do schowka.
            </p>
          </div>
        </div>
      </div>


      <div className="mb-6 grid grid-cols-5 gap-1.5 sm:grid-cols-8 md:grid-cols-[repeat(15,minmax(0,1fr))]">

        {schedule.map((d) => {
          const dayDone = d.tasks.every((t) => done[t.id]);
          const dayPartial = !dayDone && d.tasks.some((t) => done[t.id]);
          const active = openDay === d.day;
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => setOpenDay(d.day)}
              aria-pressed={active}
              className={[
                "flex aspect-square flex-col items-center justify-center border text-xs transition",
                active
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border text-muted-foreground hover:border-accent/60 hover:text-accent",
                dayDone ? "bg-accent/10" : dayPartial ? "bg-accent/5" : "",
              ].join(" ")}
            >
              <span className="text-[10px] uppercase tracking-widest opacity-70">{t("schedule.dayLabel")}</span>
              <span className="font-display text-lg leading-none">{d.day}</span>
              {dayDone && <span className="mt-0.5 text-[10px]">✓</span>}
            </button>
          );
        })}
      </div>

      {schedule.filter((d) => d.day === openDay).map((d) => {
        const dayDoneCount = d.tasks.filter((t) => done[t.id]).length;
        return (
          <div
            key={d.day}
            className="grid gap-6 border-t border-border pt-8 md:grid-cols-12"
          >
            <div className="md:col-span-4">
              <div className="text-xs uppercase tracking-[0.2em] text-accent">
                {String(d.day).padStart(2, "0")}
              </div>
              <div className="mt-2 font-display text-3xl">{d.phase}</div>
              <p className="mt-3 text-sm text-muted-foreground">{d.focus}</p>
              <div className="mt-4 text-xs text-muted-foreground">
                {dayDoneCount}/{d.tasks.length} {t("schedule.stepsDone", { defaultValue: "kroków ukończonych" })}
              </div>
            </div>
            <ul className="space-y-2 md:col-span-8">
              {d.tasks.map((task) => {
                const checked = !!done[task.id];
                const critical = task.tone === "critical";
                return (
                  <li key={task.id}>
                    <label
                      className={[
                        "flex cursor-pointer items-start gap-3 border p-3 text-sm transition",
                        checked
                          ? "border-accent/40 bg-accent/5 text-foreground/70 line-through"
                          : critical
                            ? "border-red-500/40 bg-red-500/5 hover:border-red-500/70"
                            : "border-border hover:border-accent/60",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(task.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--accent))]"
                      />
                      <span className="flex-1">
                        {critical && !checked && (
                          <span className="mr-2 inline-block border border-red-500/60 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-red-500">
                            {t("schedule.criticalBadge")}
                          </span>
                        )}
                        {task.label}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <p className="mt-8 text-xs text-muted-foreground">
        {t("schedule.edu")}
      </p>

      {showEmailPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Podgląd wiadomości e-mail"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowEmailPreview(false)}
        >
          <div
            className="flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-border bg-card/60 px-5 py-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Podgląd e-maila
                </div>
                <div className="truncate text-sm text-foreground">
                  {emailPreview.state === "ready" ? emailPreview.subject : "Wczytywanie…"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailPreview(false)}
                className="border border-border px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-foreground transition hover:border-accent hover:text-accent"
              >
                Zamknij
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              {emailPreview.state === "loading" && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Generowanie podglądu…
                </div>
              )}
              {emailPreview.state === "error" && (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-destructive">
                  {emailPreview.message}
                </div>
              )}
              {emailPreview.state === "ready" && (
                <iframe
                  title="Podgląd wiadomości e-mail"
                  srcDoc={emailPreview.html}
                  sandbox=""
                  className="h-full w-full border-0"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}



/* ---------- Patient journey ---------- */

export function Journey() {
  const { t } = useTranslation();
  const bullets = t("journey.bullets", { returnObjects: true, defaultValue: [] }) as string[];
  return (
    <Section id="journey" eyebrow={t("journey.eyebrow")}>
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-7">
          <h2 className="font-display text-4xl md:text-5xl">{t("journey.title")}</h2>
          <p className="mt-6 text-muted-foreground">{t("journey.p1")}</p>
          <p className="mt-4 text-muted-foreground">{t("journey.p2")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/panel"
              className="inline-flex items-center rounded-sm border border-foreground/80 bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-foreground/90"
            >
              {t("journey.ctaPanel")}
            </Link>
            <Link
              to="/przypomnienia"
              className="inline-flex items-center rounded-sm border border-foreground/80 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              {t("journey.ctaReminders")}
            </Link>
          </div>
        </div>
        <aside className="md:col-span-5">
          <div className="rounded-sm border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("journey.inEbook")}
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              {bullets.map((b, i) => (
                <li key={i}>· {b}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Section>
  );
}

/* ---------- Day 0–3 Quick Guide ---------- */

export function DayZeroToThree() {
  const { t } = useTranslation();
  const cards = [
    { key: "card0", tone: "red" as const },
    { key: "card1", tone: "red" as const },
    { key: "card2", tone: undefined as undefined | "red" },
  ];
  const avoid = t("dayZeroToThree.avoid", { returnObjects: true, defaultValue: [] }) as {
    type: "bad" | "good";
    text: string;
  }[];
  const half = Math.ceil(avoid.length / 2);
  const col1 = avoid.slice(0, half);
  const col2 = avoid.slice(half);
  return (
    <Section id="dzien-0-3" eyebrow={t("schedule.eyebrow")}>
      <SectionHeader
        title={t("dayZeroToThree.title")}
        lead={t("dayZeroToThree.lead")}
      />
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((c) => {
          const items = t(`dayZeroToThree.${c.key}.items`, { returnObjects: true, defaultValue: [] }) as string[];
          return (
            <Card
              key={c.key}
              title={t(`dayZeroToThree.${c.key}.title`)}
              badge={t(`dayZeroToThree.${c.key}.badge`)}
              badgeTone={c.tone}
            >
              <ul className="space-y-2 text-sm text-muted-foreground">
                {items.map((it, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">✓</span> {it}
                  </li>
                ))}
              </ul>
              <Mech>{t(`dayZeroToThree.${c.key}.mech`)}</Mech>
            </Card>
          );
        })}
      </div>
      <div className="mt-10 rounded-sm border border-border bg-card p-6">
        <h3 className="font-display text-xl">{t("dayZeroToThree.avoidTitle")}</h3>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          {[col1, col2].map((col, ci) => (
            <div key={ci} className="space-y-2">
              {col.map((row, i) => (
                <p key={i}>
                  {row.type === "bad" ? (
                    <span className="text-red-400">✗</span>
                  ) : (
                    <span className="text-emerald-400">✓</span>
                  )}{" "}
                  {row.text}
                </p>
              ))}
            </div>
          ))}
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
  const { t } = useTranslation();
  const [audit, setAudit] = useState(false);
  return (
    <Section id="evidence" eyebrow={t("clinical.evidence.eyebrow")}>
      <SectionHeader title={t("clinical.evidence.title")} />
      <div className="mb-6 flex items-center justify-end gap-3 text-xs">
        <span className="text-muted-foreground">{t("clinical.evidence.auditLabel")}</span>
        <button
          type="button"
          onClick={() => setAudit((v) => !v)}
          aria-pressed={audit}
          className={`rounded-sm border px-2 py-0.5 uppercase tracking-wide ${audit ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent"}`}
        >
          {audit ? t("clinical.evidence.auditOn") : t("clinical.evidence.auditOff")}
        </button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title={t("clinical.evidence.card1.title")}>
          <AnimatedTile src="evidence-1" poster="/videos/evidence-1.jpg" lqip={evidenceLqip["evidence-1"]} alt={t("clinical.evidence.card1.alt")} aspect="16/9" className="mb-4" />
          <p dangerouslySetInnerHTML={{ __html: t("clinical.evidence.card1.p1") }} />
          <p className="mt-4" dangerouslySetInnerHTML={{ __html: t("clinical.evidence.card1.p2") }} />
        </Card>
        <Card title={t("clinical.evidence.card2.title")}>
          <AnimatedTile src="evidence-2" poster="/videos/evidence-2.jpg" lqip={evidenceLqip["evidence-2"]} alt={t("clinical.evidence.card2.alt")} aspect="1/1" className="mb-4" />
          <p dangerouslySetInnerHTML={{ __html: t("clinical.evidence.card2.p1") }} />
          <p className="mt-4" dangerouslySetInnerHTML={{ __html: t("clinical.evidence.card2.p2") }} />
          <p className="mt-4" dangerouslySetInnerHTML={{ __html: t("clinical.evidence.card2.p3") }} />
        </Card>
        <Card title={t("clinical.evidence.card3.title")}>
          <AnimatedTile src="evidence-3" poster="/videos/evidence-3.jpg" lqip={evidenceLqip["evidence-3"]} alt={t("clinical.evidence.card3.alt")} aspect="1/1" className="mb-4" />
          <p dangerouslySetInnerHTML={{ __html: t("clinical.evidence.card3.p1") }} />
        </Card>
        <Card title={t("clinical.evidence.card4.title")}>
          <AnimatedTile src="evidence-4" poster="/videos/evidence-4.jpg" lqip={evidenceLqip["evidence-4"]} alt={t("clinical.evidence.card4.alt")} aspect="1/1" className="mb-4" />
          <p dangerouslySetInnerHTML={{ __html: t("clinical.evidence.card4.p1") }} />
          <p className="mt-4" dangerouslySetInnerHTML={{ __html: t("clinical.evidence.card4.p2") }} />
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
<title>Audyt dowodów — Graftgen.com</title>
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
<div class="meta">Graftgen.com · Wygenerowano: ${esc(date)}</div>
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
        generatedBy: "Graftgen.com",
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
  const { t } = useTranslation();
  const { items, stages, topics, dayMatch } = useFaq();
  const dayTips = t("faq.dayTips", { returnObjects: true, defaultValue: [] }) as {
    day: number;
    label: string;
    headline: string;
    tip: string;
  }[];

  const [selectedStage, setSelectedStage] = useState<StageKey | "all">("all");
  const [selectedTopic, setSelectedTopic] = useState<TopicKey | "all">("all");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const activeDayTip = selectedDay !== null ? dayTips[selectedDay] : null;
  const activeDayRegex = selectedDay !== null ? dayMatch[selectedDay] : null;

  const filtered = items.filter((f) => {
    const stageMatch = selectedStage === "all" || f.stageKeys.includes(selectedStage);
    const topicMatch = selectedTopic === "all" || f.topicKeys.includes(selectedTopic);
    const searchMatch =
      normalizedQuery.length === 0 ||
      f.q.toLowerCase().includes(normalizedQuery) ||
      f.a.toLowerCase().includes(normalizedQuery);
    const dayOk =
      !activeDayRegex || activeDayRegex.test(f.q) || activeDayRegex.test(f.a);
    return stageMatch && topicMatch && searchMatch && dayOk;
  });

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm border px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-muted-foreground hover:border-accent/60 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Section id="faq" eyebrow={t("faq.eyebrow")}>
      <SectionHeader title={t("faq.title")} />

      <div className="mb-8 rounded-sm border border-border bg-card/40 p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="text-xs uppercase tracking-[0.25em] text-accent">
            {t("faq.timelineLabel")}
          </span>
          {activeDayTip && (
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-xs uppercase tracking-wide text-muted-foreground transition hover:text-accent"
            >
              {t("common.clear", { defaultValue: "Clear" })}
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label={t("faq.selectDay")}
          className="flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:thin]"
        >
          {dayTips.map((d, i) => {
            const active = selectedDay === i;
            return (
              <button
                key={d.day}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setSelectedDay(active ? null : i)}
                className={`flex min-w-[64px] shrink-0 flex-col items-center rounded-sm border px-3 py-2 text-center transition ${
                  active
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-accent/60 hover:text-foreground"
                }`}
              >
                <span className="text-[10px] uppercase tracking-wide opacity-70">
                  {t("faq.dayShort")}
                </span>
                <span className="font-display text-xl leading-none">{d.day}</span>
              </button>
            );
          })}
        </div>

        {activeDayTip && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl text-accent">
                {activeDayTip.label}
              </span>
              <span className="text-sm uppercase tracking-wide text-muted-foreground">
                {activeDayTip.headline}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-foreground md:text-base">
              {activeDayTip.tip}
            </p>
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              ↓ {t("faq.relatedQuestions", { count: filtered.length })}
            </p>
          </div>
        )}
      </div>

      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("faq.searchPlaceholder")}
            className="w-full max-w-md rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs uppercase tracking-wide text-muted-foreground">
            {t("faq.stageLabel")}
          </span>
          {chip(t("faq.all"), selectedStage === "all", () => setSelectedStage("all"))}
          {stages.map((s) =>
            chip(s.label, selectedStage === s.key, () => setSelectedStage(s.key)),
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs uppercase tracking-wide text-muted-foreground">
            {t("faq.topicLabel")}
          </span>
          {chip(t("faq.all"), selectedTopic === "all", () => setSelectedTopic("all"))}
          {topics.map((tp) =>
            chip(tp.label, selectedTopic === tp.key, () => setSelectedTopic(tp.key)),
          )}
        </div>
      </div>

      <div className="divide-y divide-border border-y border-border">
        {filtered.length > 0 ? (
          filtered.map((f) => (
            <details key={f.id} className="group py-6">
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
          ))
        ) : (
          <p className="py-8 text-sm text-muted-foreground">{t("faq.empty")}</p>
        )}
      </div>
    </Section>
  );
}


/* ---------- Pricing ---------- */

export function Pricing() {
  return (
    <Section id="cennik" eyebrow="11 — SKLEP">
      <SectionHeader
        title="Pełny cennik i zakup pakietów — w sklepie."
        lead={
          <>
            Cennik zabiegów wspierających przeniesiony do <strong>sklepu Graftgen.com.</strong>.
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
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<EbookStatus>({ kind: "idle" });
  const bullets = t("ebook.bullets", { returnObjects: true, defaultValue: [] }) as string[];

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) {
      setStatus({ kind: "error", message: t("ebook.errConsent") });
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
            ? t("ebook.errValidation")
            : t("ebook.errGeneric"),
      });
    }
  }

  return (
    <Section id="ebook" eyebrow={t("ebook.eyebrow")}>
      <div className="grid gap-12 md:grid-cols-12 md:items-start">
        <div className="md:col-span-7">
          <SectionHeader title={t("ebook.title")} lead={t("ebook.lead")} />
          <ul className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            {bullets.map((b, i) => (
              <li key={i}>· {b}</li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-5">
          {status.kind === "success" ? (
            <div className="rounded-sm border border-accent/40 bg-accent/5 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-accent">
                {t("ebook.successKicker")}
              </p>
              <h3 className="mt-2 font-display text-2xl">{t("ebook.successTitle")}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{t("ebook.successDesc")}</p>
              <a
                href={status.accessUrl}
                className="mt-5 inline-flex w-full items-center justify-center rounded-sm bg-foreground px-5 py-3 text-sm font-medium text-background hover:bg-foreground/90"
              >
                {t("ebook.successCta")}
              </a>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="rounded-sm border border-border bg-card p-6">
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  {t("ebook.emailLabel")}
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("ebook.emailPlaceholder")}
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
                <Trans
                  i18nKey="ebook.consent"
                  components={{
                    priv: <Link to="/prywatnosc" className="underline" />,
                  }}
                />
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
                {status.kind === "submitting" ? t("ebook.submitting") : t("ebook.submit")}
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
    <Section id="kontakt" eyebrow="14 — KONTAKT">
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

/* ---------- Risks & Contraindications ---------- */

export function RisksAndContraindications() {
  return (
    <Section id="ryzyko" eyebrow="10 — RYZYKO I PRZECIWWSKAZANIA">
      <SectionHeader
        title="Co może się zdarzyć i kiedy należy natychmiast przerwać protokół."
        lead="Każdy zabieg transplantacji włosów DHI wiąże się z naturalnymi, przewidywalnymi reakcjami organizmu. Poniżej lista typowych działań niepożądanych, przeciwwskazań oraz sygnałów alarmowych, przy których konieczny jest kontakt z kliniką."
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Działania niepożądane" badge="Częste / rzadkie" badgeTone="red">
          <ul className="list-disc space-y-2 pl-5">
            <li>Obrzęk twarzy i czoła, szczególnie między 2. a 4. dobą po zabiegu.</li>
            <li>Delikatne punktowe krwawienie z mikroran — typowe do 24–48 h.</li>
            <li>Ból, ucisk i uczucie napięcia skóry głowy w strefie dawczej i biorczej.</li>
            <li>„Shock loss" — przejściowa utrata natywnych włosów wokół nowych graftów.</li>
            <li>Zaburzenia czucia (drętwienie, mrowienie) — zazwyczaj ustępują w ciągu 3–6 miesięcy.</li>
            <li>Świąd i łuszczenie skóry głowy podczas gojenia.</li>
            <li>Zakażenie — rzadkie (&lt;1%) przy przestrzeganiu protokołu antyseptycznego.</li>
          </ul>
        </Card>
        <Card title="Przeciwwskazania" badge="Kwalifikacja" badgeTone="red">
          <ul className="list-disc space-y-2 pl-5">
            <li>Aktywne infekcje bakteryjne, wirusowe lub grzybicze skóry głowy.</li>
            <li>Zaburzenia krzepliwości krwi lub przyjmowanie leków przeciwzakrzepowych (doufnych).</li>
            <li>Nieustabilizowana cukrzyca — znacząco utrudnia gojenie.</li>
            <li>Aktywne palenie tytoniu — obniża przeżywalność graftów o 20–30%.</li>
            <li>Ciąża i karmienie piersią (przy niektórych elementach farmakologicznych protokołu).</li>
            <li>Padaczka lub historia drgawek — wymaga konsultacji przed HBOT.</li>
            <li>Choroba pęcherzykowa płuc lub nieprawidłowa odpowiedź na ciśnienie — przeciwwskazanie do hiperbarii.</li>
          </ul>
        </Card>
        <Card title="Kontakt z kliniką — alarmy" badge="Natychmiast" badgeTone="red">
          <ul className="list-disc space-y-2 pl-5">
            <li>Gorączka &gt;38 °C po 2. dobie od zabiegu.</li>
            <li>Silny, narastający ból po 3. dobie (zamiast ustępować).</li>
            <li>Zaczerwienienie, obrzęk i ropna wydzielina z obszaru biorczego lub dawczego.</li>
            <li>Otwarte ranki, częściowe wypadanie lub „wypychanie" się graftów.</li>
            <li>Objawy alergiczne: pokrzywka, duszności, obrzęk twarzy.</li>
            <li>Zasłabnięcie, silne zawroty głowy lub bóry w uszach po sesji HBOT.</li>
            <li>Krwawienie, które nie ustępuje po 10 min ucisku gazikiem.</li>
          </ul>
          <Mech>
            Nie czekaj z kontaktem „do rana". W krytycznym oknie 48 h każda godzina opóźnienia może wpłynąć na przeżywalność graftów.
          </Mech>
        </Card>
      </div>
    </Section>
  );
}
