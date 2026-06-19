// Wersjonowanie szablonu raportu cotygodniowego.
// Każda zmiana układu, pól lub interpretacji klinicznej = nowa wersja + wpis w changelogu.
// Wersja semver: MAJOR (zmiana struktury danych), MINOR (nowe sekcje), PATCH (korekty edytorskie).

export const REPORT_TEMPLATE_VERSION = "1.2.0";
export const REPORT_TEMPLATE_RELEASED = "2026-06-18";

export interface TemplateChange {
  version: string;
  date: string;
  changes: string[];
}

export const REPORT_TEMPLATE_CHANGELOG: TemplateChange[] = [
  {
    version: "1.2.0",
    date: "2026-06-18",
    changes: [
      "Dodano blok podpisu koordynatora medycznego (imię, tytuł, numer PWZ/licencji)",
      "Dodano przycisk eksportu do PDF (drukowanie z dedykowanymi stylami)",
      "Dodano stopkę z wersją szablonu i hashem dokumentu",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-05-22",
    changes: [
      "Rozszerzono panel parametrów biometrycznych o wskaźnik 'do celu'",
      "Dodano sekcję trendów vs baseline z markerem celu",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-04-10",
    changes: ["Pierwsza produkcyjna wersja szablonu raportu cotygodniowego."],
  },
];

export interface Coordinator {
  name: string;
  title: string;
  license: string;
  signatureScript: string; // tekst odręcznego podpisu (font script w PDF)
}

export const DEFAULT_COORDINATOR: Coordinator = {
  name: "dr n. med. Anna Kowalska-Bujok",
  title: "Koordynator medyczny · Bujok Medical",
  license: "PWZ 5847291",
  signatureScript: "A. Kowalska-Bujok",
};
