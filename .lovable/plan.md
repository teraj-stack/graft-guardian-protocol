## Cel

Pacjent mówiący **wyłącznie po turecku** ma móc:
1. Wejść na stronę i automatycznie zobaczyć tureckie tłumaczenie (auto-detekcja `navigator.language`).
2. Przejść całą publiczną ścieżkę (strona główna → FAQ → harmonogram → e-book → kontakt → sklep → koszyk → checkout) bez napotkania ani jednej polskiej frazy.
3. Otrzymać e-mail / SMS / PDF z harmonogramem w swoim języku.

Aktualny stan: i18n istnieje (PL/EN/TR), Hero + sekcje 01–07, 10, FAQ, Patient Journey, e-book, harmonogram 0–14 są przetłumaczone. Pozostaje ~30 plików z hardkodowanym polskim.

## Etapy (wszystkie w jednej iteracji)

### Etap 1 — Auto-detekcja języka + persystencja
- `src/lib/i18n.ts`: dodać `LanguageDetector` (`navigator → localStorage → cookie`), `fallbackLng: 'en'`, `supportedLngs: ['pl','en','tr']`.
- `LanguageSwitcher`: wizualne potwierdzenie aktywnego języka, zapis do `localStorage`.
- `<html lang>` aktualizowany dynamicznie w `__root.tsx`.

### Etap 2 — Publiczna strona główna (pozostałe sekcje)
Sekcje w `src/routes/-sections/below-fold.tsx` jeszcze hardkodowane PL:
- `DayZeroToThree` (Doba 0–3)
- `RisksAndContraindications` (Ryzyko / przeciwwskazania)
- `Pricing` (Sklep — kafelki, badge'y, CTA)
- `Contact` (formularz, walidacja, komunikaty)
- `EbookLeadMagnet` (już PL ↔ EN ↔ TR, weryfikacja)
- `InteractiveSchedule` (przyciski, modale, błędy SMS/Email — częściowo już zlokalizowane)
- `Creator` + `CreatorReviews` + `HeroFAQ`
- Stopka: linki, copyright, disclaimer

### Etap 3 — Strony pomocnicze (publiczne)
- `src/routes/sklep.tsx` + `product.$handle.tsx` + `CartDrawer.tsx` (Shopify storefront)
- `src/routes/ebook.$token.tsx` (gated reader e-booka — 15 rozdziałów)
- `src/routes/koszt-przeszczepu-wlosow.tsx` (przewodnik kosztów)
- `src/routes/cookies.tsx`, `prywatnosc.tsx`
- `src/routes/przypomnienia.tsx` + `przypomnienia.wypisz.tsx`
- `src/routes/raport.tsx` (publiczny szablon)
- `src/routes/auth.tsx` (logowanie/rejestracja)
- `CookieConsentBanner.tsx`
- `animated-tile.tsx` (komunikat o zablokowanym autoplay)

### Etap 4 — Treści dynamiczne z bibliotek
- `src/lib/pricing-data.ts` → przerobić na zlokalizowane (hook `usePricing()`)
- `src/lib/materials.ts` → hook `useMaterials()`
- `src/lib/company.ts` → opisy i adresy zlokalizowane
- `src/lib/faq-data.ts` → już OK (hook `useFaq`)
- `src/lib/schedule-data.ts` → już OK (hook `useSchedule`)

### Etap 5 — Komunikacja wychodząca (e-mail / SMS)
Pacjent turecki musi dostać wiadomość po turecku:
- `src/lib/email-templates/reminders-day-0-14.tsx` → przyjmuje `locale`, renderuje TR/EN/PL
- `src/lib/email-templates/weekly-report.tsx` → j.w.
- `src/lib/email-templates/test-ping.tsx` → j.w.
- `src/routes/api/public/reminders/send-checklist.ts` → przekazuje `locale` z requesta do template'u
- `src/routes/api/public/contact.ts` → potwierdzenie po stronie pacjenta w jego języku
- `src/lib/reminders/sender.server.ts` → tekst SMS lokalizowany
- `src/lib/contact-notify.server.ts` → notyfikacje wewnętrzne zostają PL (dla admina)

### Etap 6 — Panele wewnętrzne (poza zakresem dla pacjenta TR)
**Świadomie pomijamy** w tej iteracji (nie używają ich pacjenci):
- `src/routes/panel.tsx`, `raporty.status.tsx`, `_authenticated/*` (admin, raporty, vitals, brand-audit, phrase-audit, ebook, email-test)
- `report-template.ts`, `report-sends.functions.ts`, `email-test.functions.ts`

Jeśli zechcesz później — zrobimy osobno.

### Etap 7 — SEO multi-język
- W `head()` każdej publicznej trasy: `hreflang` × 3 (pl, en, tr, x-default).
- Tytuł/description/OG: zlokalizowane przez `t()` w `head()` (przekazując `i18n` przez kontekst).
- `sitemap.xml`: warianty językowe.
- `<html lang>` zsynchronizowane z aktywnym językiem.

### Etap 8 — Weryfikacja
- Playwright: TR → przejście Hero → FAQ → Harmonogram → E-book → Kontakt → Sklep. Screenshot każdego kroku — zero polskich znaków.
- `rg "[ąćęłńóśźż]" src/ -g '!locales/**' -g '!**/admin/**'` powinno zwrócić tylko komentarze i niewidoczne dla pacjenta TR pliki (panele).
- Skrypt CI `scripts/check-no-hardcoded-pl.mjs` blokujący nowe polskie literały w publicznych komponentach.

## Szczegóły techniczne

**i18n auto-detect (Etap 1)** — `src/lib/i18n.ts`:
```ts
i18n.use(LanguageDetector).init({
  detection: { order: ['querystring','localStorage','cookie','navigator'], caches: ['localStorage','cookie'] },
  supportedLngs: ['pl','en','tr'],
  fallbackLng: 'en',  // nie PL — pacjent TR z fallbackiem EN
});
```

**Format kluczy locale**: namespace per sekcja (`shop.*`, `contact.*`, `risks.*`, `dayZero.*`, `ebookReader.*`, `cookies.*`, `privacy.*`, `auth.*`, `costGuide.*`, `reminders.*`).

**E-mail templates**: każdy template przyjmuje `locale: 'pl'|'en'|'tr'` i ma trzy bloki tekstów (lub używa `i18next.getFixedT(locale)`).

**SEO `head()`**: bo `head()` jest statyczne, trzymamy 3 wersje meta w `locales/*.json` pod kluczem `seo.<route>.*` i czytamy w komponencie przez `useTranslation()` + `<Head>` z TanStack (gdzie się da — pozostałe zostają w default EN z poprawnym `hreflang`).

## Zakres pominięty (świadomie)

- Wszystkie ścieżki `/_authenticated/*` (panele admin, dashboardy raportów) — zostają w PL, bo są tylko dla zespołu.
- Treść wewnętrznych powiadomień Slack/e-mail do administracji — zostaje PL.

## Akceptacja

Pacjent z Turcji wpisuje `graftgen.com` w przeglądarce skonfigurowanej na `tr-TR`:
- automatycznie ładuje się wersja TR,
- przechodzi cały flow bez polskiej frazy,
- otrzymuje e-mail z harmonogramem i wiadomość SMS po turecku,
- może kupić produkt w sklepie i dostać potwierdzenie zamówienia w TR.
