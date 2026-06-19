// Shared materials catalog used by /panel and reminder dispatch.
// Keep this isomorphic: no browser or server-only imports.

export const CATEGORIES = [
  "Pielęgnacja",
  "HBOT",
  "PBM",
  "LADD",
  "Dieta",
  "Anti-aging",
] as const;
export const TYPES = ["Artykuł", "Wideo", "PDF", "Checklist"] as const;
export const WEEKS = [1, 2, 3, 4, 6, 8, 12] as const;

export type Category = (typeof CATEGORIES)[number];
export type MatType = (typeof TYPES)[number];

export interface Material {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: MatType;
  weeks: number[];
  minutes: number;
}

export const MATERIALS: Material[] = [
  {
    id: "m01",
    title: "Mycie głowy krok po kroku: doba 1–7",
    description:
      "Diagram natrysku, kąt strumienia, temperatura wody (max 32 °C), bezdotykowe spłukiwanie HOCI. Co robić, czego absolutnie nie robić w pierwszym tygodniu.",
    category: "Pielęgnacja",
    type: "Wideo",
    weeks: [1],
    minutes: 6,
  },
  {
    id: "m02",
    title: "Checklist dnia 0–14",
    description:
      "Codzienna lista zadań rano i wieczorem: PBM, sól fizjologiczna, sprej HOCI, pozycja spania, aktywność.",
    category: "Pielęgnacja",
    type: "Checklist",
    weeks: [1, 2],
    minutes: 3,
  },
  {
    id: "m03",
    title: "Protokół HBOT 1,5–2,0 ATA — pełna dokumentacja",
    description:
      "Sesje 1–4, kwalifikacja, przeciwwskazania (odma, ucho środkowe, POChP), wyrównywanie ciśnienia, co zabrać do komory.",
    category: "HBOT",
    type: "PDF",
    weeks: [1, 2],
    minutes: 12,
  },
  {
    id: "m04",
    title: "Fotobiomodulacja w domu — hełm 650/830 nm",
    description:
      "Jak ustawić sesje 20 min, częstotliwość 3–4×/tydzień, dawki J/cm², krzywa Arndta-Schulza i dlaczego więcej nie znaczy lepiej.",
    category: "PBM",
    type: "Artykuł",
    weeks: [2, 3, 4, 6, 8, 12],
    minutes: 8,
  },
  {
    id: "m05",
    title: "Shock loss — dlaczego włosy wypadają w tygodniu 2–6",
    description:
      "Mechanizm fizjologiczny, oś czasu, kiedy się nie martwić, kiedy zadzwonić do kliniki. Z odniesieniami do literatury.",
    category: "Pielęgnacja",
    type: "Artykuł",
    weeks: [2, 3, 4, 6],
    minutes: 9,
  },
  {
    id: "m06",
    title: "Dieta pozabiegowa — białko, żelazo, biotyna, omega-3",
    description:
      "Konkretne dzienne dawki, lista zakupowa, posiłki przykładowe na 14 dni. Co ogranicza neowaskularyzację (alkohol, nikotyna, cukier prosty).",
    category: "Dieta",
    type: "PDF",
    weeks: [1, 2, 3, 4],
    minutes: 15,
  },
  {
    id: "m07",
    title: "LADD z PRP i minoksydylem — przygotowanie do sesji",
    description:
      "Co odstawić, jak myć głowę przed wizytą, czego się spodziewać, downtime, pielęgnacja po. Protokół tulowy 1927 nm vs CAP.",
    category: "LADD",
    type: "Wideo",
    weeks: [4, 6, 8],
    minutes: 11,
  },
  {
    id: "m08",
    title: "Reintrodukcja aktywności: sport, sauna, basen, słońce",
    description:
      "Tabela tydzień po tygodniu — kiedy można wrócić do siłowni, biegania, sauny IR, kąpieli w morzu, ekspozycji UV.",
    category: "Pielęgnacja",
    type: "Checklist",
    weeks: [2, 3, 4, 6, 8],
    minutes: 4,
  },
  {
    id: "m09",
    title: "Minoksydyl doustny w mikrodawkach — off-label",
    description:
      "Dawkowanie 0,25–2,5 mg, monitoring ciśnienia, działania niepożądane, kwalifikacja kardiologiczna. Sinclair 2018, Randolph & Tosti 2021.",
    category: "LADD",
    type: "Artykuł",
    weeks: [4, 6, 8, 12],
    minutes: 10,
  },
  {
    id: "m10",
    title: "Egzosomy, peptydy biomimetyczne, GHK-Cu — trendy 2026",
    description:
      "Najnowsze doniesienia z medycyny regeneracyjnej: egzosomy z komórek macierzystych, peptydy sygnalne, miedź-peptyd jako adjuwant LADD.",
    category: "Anti-aging",
    type: "Artykuł",
    weeks: [8, 12],
    minutes: 13,
  },
  {
    id: "m11",
    title: "Czerwone flagi — kiedy natychmiast skontaktować się z kliniką",
    description:
      "Gorączka >38,5 °C, ropny wysięk, asymetryczny obrzęk, ból nieustępujący po lekach, krwawienie >15 min. Zdjęcia referencyjne.",
    category: "Pielęgnacja",
    type: "Checklist",
    weeks: [1, 2, 3],
    minutes: 5,
  },
  {
    id: "m12",
    title: "Komora hiperbaryczna od środka — wideo z sesji",
    description:
      "Pełen przebieg 90-minutowej sesji 2,0 ATA. Wyrównywanie uszu, oddychanie maską, rytm pracy operatora.",
    category: "HBOT",
    type: "Wideo",
    weeks: [1, 2],
    minutes: 8,
  },
  {
    id: "m13",
    title: "Mikrobiom skóry głowy po DHI — co stosować, czego unikać",
    description:
      "Szampony pH 5,5 bez SLS, prebiotyki topowe, dlaczego chlorheksydyna i jodyna szkodzą po dobie 3. Lista preparatów z neutralnym mikrobiomem.",
    category: "Pielęgnacja",
    type: "PDF",
    weeks: [2, 3, 4],
    minutes: 9,
  },
  {
    id: "m14",
    title: "Anti-aging skóry głowy — strategia na 12 miesięcy",
    description:
      "Cykl roczny: PBM podtrzymujące, mezoterapia rewitalizująca, retinoidy topowe, suplementacja systemowa. Plan synchronizowany z fazami anagenu.",
    category: "Anti-aging",
    type: "PDF",
    weeks: [12],
    minutes: 18,
  },
  {
    id: "m15",
    title: "Pozycja spania i poduszka podróżna — pierwsze 10 nocy",
    description:
      "Dlaczego kąt 45° redukuje obrzęk i ryzyko mechanicznej utraty graftów. Wybór poduszki, ułożenie, pierwsza noc po zabiegu.",
    category: "Pielęgnacja",
    type: "Wideo",
    weeks: [1],
    minutes: 4,
  },
];

export function materialsForWeek(week: number): Material[] {
  return MATERIALS.filter((m) => m.weeks.includes(week));
}

export const ALL_WEEKS = Array.from({ length: 12 }, (_, i) => i + 1);

export const WEEK_PRESETS: Record<string, number[]> = {
  key: [1, 2, 4, 8, 12],
  all: ALL_WEEKS,
  early: [1, 2, 3, 4],
};
