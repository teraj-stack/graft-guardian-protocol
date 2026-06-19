export interface PricingPack {
  sessions: number;
  price: string;
  unitPrice: string;
  saving: string;
}

export interface PricingItem {
  code: string;
  name: string;
  handle: string;
  params: string;
  single: { price: string; label: string };
  packs: PricingPack[];
  scope: string[];
  note: string;
  hidden?: boolean;
}

export const PRICING: PricingItem[] = [
  {
    code: "HBOT",
    name: "Tlenoterapia hiperbaryczna",
    handle: "tlenoterapia-hiperbaryczna-hbot",
    params: "60–90 min · 2,0–2,4 ATA · 100% O₂",
    single: { price: "420 zł", label: "Sesja pojedyncza" },
    packs: [
      { sessions: 5, price: "1 995 zł", unitPrice: "399 zł", saving: "5%" },
      { sessions: 10, price: "3 800 zł", unitPrice: "380 zł", saving: "10%" },
      { sessions: 20, price: "7 140 zł", unitPrice: "357 zł", saving: "15%" },
    ],
    scope: [
      "Kwalifikacja lekarska przed pierwszą sesją (medycyna hiperbaryczna).",
      "Sesja w komorze wieloosobowej lub monoplace: 60–90 min przy 2,0–2,4 ATA.",
      "Tlen 100% pod maską lub kaskiem przez cały czas ekspozycji.",
      "Pomiar ciśnienia tętniczego przed i po sesji.",
      "Raport końcowy z rekomendacją liczby sesji w cyklu.",
    ],
    note: "Średnia z najwyższych stawek ośrodków premium w Warszawie i Gdańsku (ATAmed, Vimed, Komora-Hiperbaryczna, Regeneracja Gdańsk).",
  },
  {
    code: "LADD",
    name: "LADD: PRP + minoksydyl",
    handle: "ladd-prp-minoksydyl-laser-tulowy",
    params: "Er:YAG / tul · PRP (Magellan/Arthrex) · minoksydyl topowo",
    single: { price: "2 400 zł", label: "Sesja pojedyncza" },
    packs: [
      { sessions: 5, price: "11 400 zł", unitPrice: "2 280 zł", saving: "5%" },
      { sessions: 10, price: "21 600 zł", unitPrice: "2 160 zł", saving: "10%" },
      { sessions: 20, price: "40 800 zł", unitPrice: "2 040 zł", saving: "15%" },
    ],
    scope: [
      "Konsultacja trychologiczna i dobór parametrów laserowych do fototypu.",
      "Przygotowanie skóry głowy: oczyszczenie, dezynfekcja, ewentualna znieczulenie.",
      "Ablacja laserowa frakcyjna (Er:YAG lub thulium): 5–10 min, głębokość 150–300 µm.",
      "Aplikacja osocza bogatopłytkowego PRP (8–10 ml, 3–5x stężenie płytek) z minoksydylem.",
      "Instruktaż domowy: pielęgnacja 48 h po zabiegu, harmonogram następnych sesji.",
    ],
    note: "Uśrednienie najwyższych cen PRP premium oraz zabiegów laser-assisted drug delivery w klinikach trychologicznych Warszawy i Gdańska.",
  },
  {
    code: "LADD-CP",
    name: "LADD: PRP + minoksydyl — zimna plazma",
    handle: "ladd-prp-minoksydyl-zimna-plazma-cap",
    params: "CAP / zimna plazma · PRP (Magellan/Arthrex) · minoksydyl topowo",
    single: { price: "2 200 zł", label: "Sesja pojedyncza" },
    packs: [
      { sessions: 5, price: "10 450 zł", unitPrice: "2 090 zł", saving: "5%" },
      { sessions: 10, price: "19 800 zł", unitPrice: "1 980 zł", saving: "10%" },
      { sessions: 20, price: "37 400 zł", unitPrice: "1 870 zł", saving: "15%" },
    ],
    scope: [
      "Konsultacja trychologiczna i ocena tolerancji skóry na zimną plazmę.",
      "Przygotowanie skóry głowy: oczyszczenie, dezynfekcja, bez znieczulenia miejscowego.",
      "Aplikacja zimnej plazmy atmosferycznej (CAP): 10–15 min, głębokość ~50–100 µm.",
      "Aplikacja osocza bogatopłytkowego PRP (8–10 ml, 3–5x stężenie płytek) z minoksydylem.",
      "Instruktaż domowy: pielęgnacja 48 h po zabiegu, harmonogram następnych sesji.",
    ],
    note: "Uśrednienie najwyższych cen zabiegów z zimną plazmą (CAP) w połączeniu z PRP i minoksydylem w klinikach premium Warszawy i Gdańska.",
  },
  {
    code: "PBM",
    name: "Fototerapia (PBM / LLLT)",
    handle: "fototerapia-pbm-lllt",
    params: "630–680 nm · 5 J/cm² · 20–30 min",
    single: { price: "600 zł", label: "Sesja pojedyncza" },
    packs: [
      { sessions: 5, price: "2 850 zł", unitPrice: "570 zł", saving: "5%" },
      { sessions: 10, price: "4 800 zł", unitPrice: "480 zł", saving: "20%" },
      { sessions: 20, price: "9 000 zł", unitPrice: "450 zł", saving: "25%" },
    ],
    scope: [
      "Diagnostyka skóry głowy: trichoskopia przed cyklem i co 5 sesji.",
      "Dobór parametrów świetlnych: długość fali 630–680 nm, dawka ~5 J/cm².",
      "Sesja LED/PBM: 20–30 min z podziałem na strefy dawcy i biorcy.",
      "Pomiar temperatury skóry i ewentualna korekta dawki w czasie rzeczywistym.",
      "Raport z pomiarów: liczba mieszków w fazie anagen, grubość włosa, gęstość.",
    ],
    note: "Średnia z górnego przedziału cen klinik premium (Wellclinic, Hairmitage, Trycho-Med) dla zabiegów wykonywanych w gabinecie.",
  },
];

export const PRICING_FAQ: { q: string; a: string }[] = [
  {
    q: "Czym różnią się pakiety 5, 10 i 20 sesji?",
    a: "Pakiet 5 sesji to forma wprowadzająca — sprawdza się jako uzupełnienie standardowego protokołu pozabiegowego (np. 2 sesje HBOT + 3 LADD). Pakiet 10 sesji to pełny cykl optymalny dla większości pacjentów po DHI, umożliwiający systematyczną rewaskularyzację i biostymulację. Pakiet 20 sesji to program intensywny, zalecany przy dużej liczbie graftów, łączonych terapiach (HBOT + LADD + PBM) lub skłonnościach do wolniejszej angiogenezy.",
  },
  {
    q: "Czy mogę zmienić pakiet w trakcie terapii?",
    a: "Tak. Jeśli po 3–4 sesjach zdecydujesz się na wyższy pakiet, różnica jest rozliczana według ceny jednostkowej nowego pakietu z wstecznym rabatem. Nie ma kar za przeskok w górę. Przejście w dół (z 20 na 10 sesji) możliwe jest do wykorzystania 50% pierwotnego pakietu.",
  },
  {
    q: "Jak wygląda rozliczenie i płatność?",
    a: "Rozliczenie odbywa się przed pierwszą sesją (przedpłata za cały pakiet) lub w dwóch równych ratach: 50% przed startem, 50% po realizacji 50% pakietu. Nie wymagamy umów abonamentowych ani automatycznych obciążeń. Wystawiamy fakturę VAT.",
  },
  {
    q: "Czy niewykorzystane sesje przepadają?",
    a: "Nie. Sesje są ważne 12 miesięcy od daty zakupu. Możesz je zawiesić w dowolnym momencie (np. w przypadku konieczności wyjazdu) lub przekazać innemu pacjentowi po uprzednim uzgodnieniu z rejestracją.",
  },
  {
    q: "Czy pakiety łączą się między kategoriami (np. HBOT + LADD)?",
    a: "Tak. Przy jednorazowym zakupie pakietów z dwóch lub więcej kategorii stosujemy zniżkę współwystępowania 10% od sumy brutto pakietów. Dotyczy to pakietów 10 i 20 sesji. Pakiety 5 sesji kwalifikują się do zniżki wyłącznie jako dodatek do pakietu 10 lub 20 z innej kategorii.",
  },
  {
    q: "Jakie są zasady odwołania lub zwrotu?",
    a: "Do 48 h przed pierwszą sesją: zwrot 100% wartości pakietu. Po rozpoczęciu terapii: zwrot proporcjonalny do niewykorzystanych sesji (liczonych według ceny jednostkowej pakietu), pomniejszony o koszt konsultacji kwalifikacyjnej (350–500 zł). Nie pobieramy opłat administracyjnych.",
  },
  {
    q: "Skąd bierze się rabat obok ceny i jak jest liczony?",
    a: "Rabat wyliczamy automatycznie na podstawie pola 'cena katalogowa' (compareAtPrice) z naszego sklepu Shopify. Wzór jest prosty: (cena katalogowa − cena pakietu) ÷ cena katalogowa × 100. Przykład: jeśli katalogowa cena 5 sesji HBOT to 2 100 zł, a pakiet kosztuje 1 995 zł, rabat wynosi (2 100 − 1 995) ÷ 2 100 × 100 = 5%. To wartość procentowa, nie stała kwota — dlatego przy wyższych pakietach rabat wydaje się większy, bo różnica względem katalogu rośnie bezwzględnie.",
  },
  {
    q: "Dlaczego rabat procentowy różni się między wariantami (np. 5 vs 20 sesji)?",
    a: "Każdy wariant (1, 5, 10, 20 sesji) ma osobną cenę katalogową i osobną cenę pakietową. Przy większych pakietach koszt jednostkowy sesji spada bardziej — klinika zyskuje efekt skali: mniejsza liczba przygotowań sali, powtarzalność zabiegu i dłuższa relacja terapeutyczna. Dlatego zazwyczaj rabat rośnie wraz z liczbą sesji. Ponadto różne modalności (HBOT, LADD, PBM) mają inne struktury kosztów materiałowych i czasowych, więc ten sam pakiet 10 sesji może mieć inny procent rabatu dla tlenoterapii niż dla lasera tulowego.",
  },
  {
    q: "Co oznacza przekreślona cena w kolumnie 'Katalog'?",
    a: "To cena referencyjna ustalona w systemie Shopify jako 'compareAtPrice' — odpowiada standardowej stawce za pojedynczą sesję lub pakiet w rozliczeniu 'pay-as-you-go', bez rabatu za zobowiązanie do większej liczby zabiegów. Cena obok ('Pakiet') to rzeczywista kwota do zapłaty po rabacie. Jeśli w danym wariancie nie ma ceny katalogowej, wyświetlamy myślnik ('—') — oznacza to, że pakiet jest oferowany wyłącznie w cenie promocyjnej lub jest to produkt nowy, dla którego jeszcze nie ustaliliśmy referencyjnej stawki.",
  },
  {
    q: "Co dokładnie obejmuje jedna sesja tlenoterapii hiperbarycznej (HBOT)?",
    a: "Każda sesja rozpoczyna się od kwalifikacji lekarskiej (przy pierwszej wizycie) i pomiaru ciśnienia tętniczego. Pacjent przebywa w komorze hiperbarycznej (wieloosobowej lub monoplace) przez 60–90 minut przy ciśnieniu 2,0–2,4 ATA, oddychając tlenem 100% pod maską lub kaskiem. Po sesji wykonywany jest ponowny pomiar ciśnienia oraz wydawany jest krótki raport z rekomendacją dalszej liczby zabiegów. Całkowity czas pobytu w ośrodku to około 1,5–2 h.",
  },
  {
    q: "Co dokładnie obejmuje jedna sesja LADD — laser tulowy (thulium)?",
    a: "Sesja trwa około 60 min. Zaczyna się od konsultacji trychologicznej i doboru parametrów lasera do fototypu skóry. Skóra głowy jest oczyszczana i dezynfekowana; w razie potrzeby stosowane jest znieczulenie miejscowe. Następnie wykonywana jest ablacja laserowa frakcyjna (Er:YAG lub thulium) na głębokość 150–300 µm przez około 5–10 min. Bezpośrednio po ablacji aplikowane jest osocze bogatopłytkowe PRP (8–10 ml, stężenie 3–5x) wymieszane z minoksydylem. Na koniec pacjent otrzymuje instruktaż pielęgnacji domowej na najbliższe 48 h oraz wstępny harmonogram kolejnych sesji.",
  },
  {
    q: "Co dokładnie obejmuje jedna sesja LADD — zimna plazma (CAP)?",
    a: "Sesja trwa około 60–75 min. Rozpoczyna się konsultacją trychologiczną i oceną tolerancji skóry na zimną plazmę. Skóra głowy jest oczyszczana i dezynfekowana — znieczulenie zazwyczaj nie jest konieczne. Aplikacja zimnej plazmy atmosferycznej (CAP) trwa 10–15 min i penetruje około 50–100 µm, przygotowując kanały transdermalne. Następnie nakładane jest osocze bogatopłytkowe PRP (8–10 ml, stężenie 3–5x) z minoksydylem. Pacjent dostaje instruktaż pielęgnacji domowej na 48 h oraz plan kolejnych wizyt.",
  },
  {
    q: "Co dokładnie obejmuje jedna sesja fototerapii PBM / LLLT?",
    a: "Sesja trwa 20–30 min. Przed cyklem (i co 5 sesji) wykonywana jest trichoskopia diagnostyczna. Terapeuta dobiera parametry świetlne: długość fali 630–680 nm, dawka około 5 J/cm². Światło LED jest aplikowane naprzemiennie na strefę dawcy i biorcy. W trakcie sesji monitorowana jest temperatura skóry; dawka jest korygowana w czasie rzeczywistym, jeśli skóra reaguje nadwrażliwością. Po cyklu pacjent otrzymuje raport z liczbą mieszków w fazie anagen, grubością włosa i gęstością.",
  },
  {
    q: "Jaka jest różnica między zakupem 1, 5, 10 a 20 sesji poza ceną?",
    a: "Pojedyncza sesja (1) to elastyczna forma 'pay-as-you-go' — rezerwujesz termin bez zobowiązań, ale bez rabatu. Pakiet 5 sesji to tzw. forma wprowadzająca: z góry rezerwujesz 5 terminów, otrzymujesz niewielki rabat (około 5%) i priorytet w kalendarzu. Pakiet 10 sesji to pełny cykl terapeutyczny z dedykowanym harmonogramem (np. 2x HBOT + 3x LADD + 5x PBM), rabatem rzędu 10% oraz opieką koordynatora. Pakiet 20 sesji to program intensywny z najwyższym rabatem (15–25%), stałymi slotami czasowymi, cotygodniowymi raportami postępu i bezpośrednim numerem do koordynatora. Im większy pakiet, tym niższy koszt jednostkowy i wyższy priorytet rezerwacji.",
  },
  {
    q: "Czy pakiet 1 sesji to to samo, co pojedyncza wizyta bez zobowiązania?",
    a: "Tak. Wariant '1 sesja' odpowiada standardowej wizycie 'pay-as-you-go'. Nie ma rabatu, ale też nie ma zobowiązania do kolejnych wizyt. Cena jest identyczna ze stawką katalogową (compareAtPrice). Jeśli po pierwszej sesji zdecydujesz się na pakiet 5, 10 lub 20, różnica jest rozliczana z wstecznym rabatem, jak przy przeskoku między pakietami.",
  },
];
