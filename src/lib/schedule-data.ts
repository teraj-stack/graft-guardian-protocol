import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export type ScheduleTask = { id: string; label: string; tone?: "critical" | "default" };
export type ScheduleDay = {
  day: number;
  phase: string;
  focus: string;
  tasks: ScheduleTask[];
};

export const SCHEDULE: ScheduleDay[] = [
  {
    day: 0,
    phase: "Doba „Zero”",
    focus: "Bezpośrednio po zabiegu — start protokołu",
    tasks: [
      { id: "d0-pbm", label: "PBM 630–680 + 830 nm, 20 min — pierwsza sesja jeszcze w klinice", tone: "critical" },
      { id: "d0-hbot", label: "HBOT 1,5–3,0 ATA — pierwsza sesja w dobie „Zero”", tone: "critical" },
      { id: "d0-sleep", label: "Sen w pozycji półsiedzącej ≥30° (poduszka klinowa)" },
      { id: "d0-cold", label: "Zimne okłady wokół czoła (nigdy na strefę biorczą)" },
      { id: "d0-meds", label: "Leki wg karty wypisowej: antybiotyk, p/bólowe, p/obrzękowe" },
      { id: "d0-noalc", label: "Bez alkoholu, bez papierosów, bez wysiłku, bez schylania" },
    ],
  },
  {
    day: 1,
    phase: "Doba 1",
    focus: "Krytyczne okno reperfuzji",
    tasks: [
      { id: "d1-hbot", label: "HBOT — druga sesja", tone: "critical" },
      { id: "d1-pbm", label: "PBM 20 min" },
      { id: "d1-spray", label: "Bezdotykowy spray fizjologiczny / HOCl co 2–3 h" },
      { id: "d1-sleep", label: "Sen ≥30°, bez dotykania, bez czapki" },
    ],
  },
  {
    day: 2,
    phase: "Doba 2",
    focus: "Stabilizacja graftów",
    tasks: [
      { id: "d2-pbm", label: "PBM 20 min" },
      { id: "d2-hoci", label: "Spłukiwanie HOCl od 48 h — strumień bezdotykowy" },
      { id: "d2-walk", label: "Spacer 20–30 min, bez pochylania głowy" },
    ],
  },
  {
    day: 3,
    phase: "Doba 3",
    focus: "Koniec ostrego zapalenia",
    tasks: [
      { id: "d3-pbm", label: "PBM 20 min" },
      { id: "d3-wash", label: "Pierwsze delikatne mycie wg instrukcji kliniki" },
      { id: "d3-photo", label: "Zdjęcie kontrolne (góra, boki, tył) — dodaj do panelu pacjenta" },
    ],
  },
  {
    day: 4,
    phase: "Doba 4",
    focus: "Start fazy proliferacji",
    tasks: [
      { id: "d4-pbm", label: "PBM 20 min" },
      { id: "d4-wash", label: "Mycie skóry głowy szamponem pH 5,5 bez SLS, bez tarcia" },
      { id: "d4-sleep", label: "Można spać płasko (bez ucisku na strefę biorczą)" },
    ],
  },
  {
    day: 5,
    phase: "Doba 5",
    focus: "Zarządzanie mikrobiomem",
    tasks: [
      { id: "d5-pbm", label: "PBM 20 min" },
      { id: "d5-wash", label: "Mycie 1×/dobę, delikatne osuszanie ręcznikiem (bez pocierania)" },
      { id: "d5-sport", label: "Lekka aktywność OK — bez pocenia się głowy" },
    ],
  },
  {
    day: 6,
    phase: "Doba 6",
    focus: "Kontrola erytemy",
    tasks: [
      { id: "d6-pbm", label: "PBM 20 min" },
      { id: "d6-photo", label: "Trichoskopowe zdjęcie kontrolne (panel pacjenta)" },
      { id: "d6-erythema", label: "Ocena rumienia — jeśli utrzymuje się: kontakt z koordynatorem" },
    ],
  },
  {
    day: 7,
    phase: "Doba 7 — tydzień 1.",
    focus: "Punkt kontrolny tygodniowy",
    tasks: [
      { id: "d7-pbm", label: "PBM 20 min" },
      { id: "d7-report", label: "Raport tygodniowy: anagen %, grubość, tolerancja skóry" },
      { id: "d7-call", label: "Kontakt telefoniczny / wideo z koordynatorem", tone: "critical" },
    ],
  },
  {
    day: 8,
    phase: "Doba 8",
    focus: "Usuwanie strupów",
    tasks: [
      { id: "d8-pbm", label: "PBM 20 min" },
      { id: "d8-massage", label: "Miękki masaż usuwający strupy + botaniki (arnika, centella)" },
      { id: "d8-noscratch", label: "Bezwzględnie nie drapać — strupy schodzą same z wodą" },
    ],
  },
  {
    day: 9,
    phase: "Doba 9",
    focus: "Mikrobiom + nawilżenie",
    tasks: [
      { id: "d9-pbm", label: "PBM 20 min" },
      { id: "d9-mist", label: "Mgiełka HOCl / fizjologiczna 2–3×/dobę" },
      { id: "d9-diet", label: "Dieta przeciwzapalna: omega-3, polifenole, białko" },
    ],
  },
  {
    day: 10,
    phase: "Doba 10",
    focus: "Strefa dawcza",
    tasks: [
      { id: "d10-pbm", label: "PBM 20 min — ze szczególnym uwzględnieniem strefy dawczej" },
      { id: "d10-cap", label: "Opcjonalnie: sesja zimnej plazmy (CAP) na strefę dawczą" },
      { id: "d10-photo", label: "Zdjęcie strefy dawczej (panel pacjenta)" },
    ],
  },
  {
    day: 11,
    phase: "Doba 11",
    focus: "Powrót do codzienności",
    tasks: [
      { id: "d11-pbm", label: "PBM 20 min" },
      { id: "d11-sport", label: "Powrót do umiarkowanego sportu (bez sztang nad głową)" },
      { id: "d11-hat", label: "Luźna czapka OK przy słońcu — nigdy ciasna" },
    ],
  },
  {
    day: 12,
    phase: "Doba 12",
    focus: "Konsolidacja",
    tasks: [
      { id: "d12-pbm", label: "PBM 20 min" },
      { id: "d12-wash", label: "Mycie standardowym szamponem pH 5,5" },
    ],
  },
  {
    day: 13,
    phase: "Doba 13",
    focus: "Przygotowanie do kontroli",
    tasks: [
      { id: "d13-pbm", label: "PBM 20 min" },
      { id: "d13-photo", label: "Pełna seria zdjęć kontrolnych (5 ujęć)" },
      { id: "d13-questions", label: "Spisz pytania na wizytę kontrolną" },
    ],
  },
  {
    day: 14,
    phase: "Doba 14 — koniec protokołu 14-dniowego",
    focus: "Kontrola + plan miesiąc 1+",
    tasks: [
      { id: "d14-visit", label: "Wizyta kontrolna w klinice (trichoskopia)", tone: "critical" },
      { id: "d14-pbm", label: "PBM przechodzi w tryb 2–3×/tydz." },
      { id: "d14-plan", label: "Ustalenie planu LADD / PRP / minoksydyl na miesiąc 1+" },
      { id: "d14-report", label: "Raport końcowy fazy ostrej (panel pacjenta)" },
    ],
  },
];

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function icsDate(iso: string): string {
  return iso.replaceAll("-", "");
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildPlainText(surgeryDate: string): string {
  const lines: string[] = [
    `Graftgen.com — Przypomnienia po przeszczepie włosów (Dzień 0–14)`,
    `Data zabiegu: ${surgeryDate}`,
    ``,
  ];
  for (const d of SCHEDULE) {
    const date = addDaysIso(surgeryDate, d.day);
    lines.push(`Dzień ${d.day} — ${date} — ${d.phase}`);
    lines.push(`Fokus: ${d.focus}`);
    for (const t of d.tasks) {
      lines.push(`  • ${t.label}${t.tone === "critical" ? "  [KRYTYCZNE]" : ""}`);
    }
    lines.push(``);
  }
  lines.push(`Źródło: https://graftgen.com  •  Materiał edukacyjny, nie zastępuje zaleceń lekarza.`);
  return lines.join("\n");
}

export function buildShortMessage(surgeryDate: string): string {
  // Compact SMS/WhatsApp-friendly summary.
  const lines: string[] = [
    `Graftgen — protokół 0–14 (data zabiegu: ${surgeryDate}):`,
  ];
  for (const d of SCHEDULE) {
    const date = addDaysIso(surgeryDate, d.day);
    lines.push(`D${d.day} ${date}: ${d.focus}`);
  }
  lines.push(`Pełna checklista: https://graftgen.com/#harmonogram`);
  return lines.join("\n");
}

export function buildIcs(surgeryDate: string): string {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const out: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Graftgen.com//Protokol 14//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Graftgen — Dzień 0–14",
    "X-WR-TIMEZONE:Europe/Warsaw",
  ];
  for (const d of SCHEDULE) {
    const date = addDaysIso(surgeryDate, d.day);
    const dtstart = icsDate(date);
    const dtend = icsDate(addDaysIso(date, 1));
    const summary = `Dzień ${d.day} — ${d.phase}`;
    const descLines = [
      d.focus,
      "",
      ...d.tasks.map((t) => `• ${t.label}${t.tone === "critical" ? " [KRYTYCZNE]" : ""}`),
      "",
      "Graftgen.com — materiał edukacyjny.",
    ];
    out.push(
      "BEGIN:VEVENT",
      `UID:graftgen-${surgeryDate}-d${d.day}@graftgen.com`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:${icsEscape(summary)}`,
      `DESCRIPTION:${icsEscape(descLines.join("\n"))}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(summary)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  out.push("END:VCALENDAR");
  return out.join("\r\n");
}

// ----- Localized hook for UI components -----
// Translates day phases, focus and task labels per active language.
// Task IDs and `tone` are preserved from the static SCHEDULE so that
// progress (localStorage) remains stable across languages.
export function useSchedule(): ScheduleDay[] {
  const { t, i18n } = useTranslation();
  return useMemo(() => {
    return SCHEDULE.map((d, idx) => {
      const phase = t(`schedule.days.${idx}.phase`, { defaultValue: d.phase });
      const focus = t(`schedule.days.${idx}.focus`, { defaultValue: d.focus });
      const tasksI18n = t(`schedule.days.${idx}.tasks`, {
        returnObjects: true,
        defaultValue: d.tasks.map((x) => x.label),
      }) as unknown as string[];
      const tasks = d.tasks.map((task, ti) => ({
        ...task,
        label: tasksI18n?.[ti] ?? task.label,
      }));
      return { ...d, phase, focus, tasks };
    });
    // re-translate on language change
  }, [t, i18n.language]);
}
