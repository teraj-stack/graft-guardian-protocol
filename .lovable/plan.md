## Cel
Dodać pełne tłumaczenie strony na angielski i turecki z możliwością przełączania języka. Polski pozostaje domyślny.

## Zakres treści
Strona ma bardzo dużo tekstu rozsianego po wielu plikach:
- `src/routes/index.tsx` + `src/routes/-sections/*` (Hero, Creator, FAQ, Timeline, PBM, HBOT, LADD, EBM, Pricing, Reviews, e-book CTA...)
- Podstrony: `sklep`, `panel`, `raport`, `koszt-przeszczepu-wlosow`, `prywatnosc`, `cookies`, `przypomnienia`, `auth`, `ebook.$token`
- Dane: `faq-data.ts`, `schedule-data.ts` (15 rozdziałów e-book + dni 0-14), `pricing-data.ts`, `materials.ts`, `references.functions.ts`
- Komponenty: `BackButton`, `CookieConsentBanner`, `CartDrawer`, formularz kontaktowy, `AnimatedTile` (komunikaty błędów), `TherapyCalculator`
- Szablony e-mail React Email (przypomnienia, raport) — opcjonalnie sterowane parametrem `locale`
- SEO: `head()` (title/description/og) per język + `hreflang`

## Podejście techniczne

### 1. Biblioteka
- `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- Inicjalizacja w `src/lib/i18n.ts`, import w `src/router.tsx` przed renderem
- Wykrywanie języka: `localStorage` → `navigator.language` → fallback `pl`

### 2. Przełącznik
- Nowy komponent `LanguageSwitcher` (PL / EN / TR) w nagłówku obok logo (w `__root.tsx`)
- Zapis wyboru w `localStorage` + atrybut `<html lang="...">` aktualizowany przez `useEffect`

### 3. Organizacja tłumaczeń
- `src/locales/{pl,en,tr}/common.json` — nawigacja, przyciski, formularze, błędy
- `src/locales/{pl,en,tr}/home.json` — sekcje strony głównej (klucze per sekcja: hero, creator, hbot, pbm, ladd, ebm, timeline...)
- `src/locales/{pl,en,tr}/faq.json` — pytania/odpowiedzi (struktura tablicowa)
- `src/locales/{pl,en,tr}/schedule.json` — dni 0-14, e-book rozdziały
- `src/locales/{pl,en,tr}/shop.json`, `pricing.json`, `legal.json`, `panel.json`, `report.json`, `cost-guide.json`
- Klucze hierarchiczne, np. `home.hero.title`

### 4. Migracja treści
- Sekcja po sekcji: ekstrakcja stringów PL do `pl/*.json`, podmiana na `t('klucz')`
- Tłumaczenia EN i TR generowane jako pełne, profesjonalne wersje medyczne (terminologia: graft, follicle, scab, PBM, HBOT itp.). Turecki używa standardowej terminologii klinicznej (foliküler, greft, kabuk).
- Liczby, jednostki (ATA, mW/cm², nm), nazwy własne (Graftgen, MySkinCode, Bujok Medical, Mabel Hair Clinic, ZnanyLekarz) pozostają bez zmian.

### 5. SEO per język
- `head()` w każdej route czyta `i18n.language` i zwraca odpowiednie meta
- Dodanie `<link rel="alternate" hreflang="pl|en|tr|x-default">` w `__root.tsx`
- Schema.org `inLanguage` aktualizowane dynamicznie

### 6. Stałe poza komponentami
- Pliki danych (`faq-data.ts`, `schedule-data.ts`) zmieniają się ze stałych tablic na funkcje `getFaqItems(t)` lub klucze indeksowane w JSON (preferowane — pełne tablice w `*.json`)

### 7. Co NIE jest tłumaczone (świadomie)
- Nazwy własne kliniki / lekarza / partnerów
- Cytaty pacjentów z ZnanyLekarz.pl (oryginalne polskie opinie) — zostają w PL z notką „original review in Polish" w EN/TR
- Treści prawne (`prywatnosc`, `cookies`) — tłumaczenie informacyjne, oryginał polski jako wiążący (notka prawna na górze EN/TR)
- Konsole/logi/komentarze w kodzie
- Faktury, dane KRS/NIP

## Zakres prac (kolejność)
1. Setup i18next + LanguageSwitcher + `__root.tsx` (hreflang, lang attr) — bez zmian treści
2. Strona główna: Hero, Creator, CreatorReviews, FAQ, Timeline, sekcje 01-09
3. Nawigacja, BackButton, CookieConsent, formularz kontaktowy
4. Podstrony: sklep, koszt-przeszczepu, panel, raport, przypomnienia, ebook
5. Strony prawne + auth + admin
6. SEO meta per route, sitemap z wariantami języka
7. Smoke test: przełączanie języka, sprawdzenie 5 najważniejszych sekcji, brak surowych kluczy w UI

## Skala
~3000-4000 stringów do przetłumaczenia × 2 języki. Robione w całości w jednej sesji (wiele plików równolegle). Czas wykonania to ~30-60 wywołań narzędzi.

## Pytanie do Ciebie
Czy potwierdzasz pełny zakres (cała strona + wszystkie podstrony + e-mail/e-book), czy w pierwszej iteracji tłumaczymy tylko stronę główną + sklep + cennik (najważniejsze dla prezentacji partnerom w Turcji), a resztę w kolejnym kroku?