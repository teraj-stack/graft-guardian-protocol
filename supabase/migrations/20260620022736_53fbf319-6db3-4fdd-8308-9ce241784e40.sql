-- Remove old aggregated chapters (idempotent)
DELETE FROM public.ebook_chapters
WHERE slug IN ('dzien-0','dzien-1-2','dzien-3-4','dzien-5-7','dzien-8-10','dzien-11-14');

-- Re-order surrounding chapters
UPDATE public.ebook_chapters SET order_idx = 0  WHERE slug = 'wstep';
UPDATE public.ebook_chapters SET order_idx = 99 WHERE slug = 'checklista';

-- Insert 15 daily chapters (Day 0 .. Day 14)
INSERT INTO public.ebook_chapters (slug, title, day_label, day_from, day_to, body_md, order_idx, published) VALUES

('dzien-00', 'Dzień 0 — bezpośrednio po zabiegu', 'Dzień 0', 0, 0,
E'**Cel kliniczny:** zminimalizować obrzęk, stres oksydacyjny i ryzyko mechanicznego uszkodzenia świeżo wszczepionych graftów. To pierwsze z 48 krytycznych godzin niedokrwienia.\n\n**Co robić:**\n- Pozycja pół-siedząca (kąt 30–45°) — także w aucie w drodze do domu.\n- Pierwsza sesja **PBM 630–680 + 830 nm**, 4–6 J/cm², bezpośrednio po zabiegu (jeśli w protokole).\n- Pierwsza sesja **HBOT 1,5–3,0 ATA** w ciągu 6 h od zabiegu (jeśli w protokole).\n- Zimny okład na **czoło i kark** (NIGDY na strefę biorczą) — ogranicza migrację obrzęku.\n- Lek przeciwbólowy wg karty (paracetamol; unikać NLPZ przez 48 h, chyba że zalecone).\n- Antybiotyk / sterydy zgodnie z kartą wypisu.\n\n**Czego unikać:**\n- Pochylania głowy w dół, schylania się, dźwigania.\n- Dotykania, drapania, mycia strefy biorczej.\n- Alkoholu, papierosów, kofeiny.\n\n**Sygnały alarmowe (kontakt z kliniką):** krwawienie nieustępujące po 15 min ucisku, gorączka > 38°C, narastający, jednostronny ból.',
1, true),

('dzien-01', 'Dzień 1 — okno krytyczne (0–24 h)', 'Dzień 1', 1, 1,
E'**Cel:** podtrzymać metabolizm graftu zanim ruszy rewaskularyzacja.\n\n**Rano:**\n- Sprawdź strefę dawczą w lustrze — punktowe zaschnięte plamki krwi są normą.\n- Spray **HOCl 0,01–0,02%** na strefę dawczą (2–3 pociągnięcia z 20 cm, bez wycierania).\n- Śniadanie bogate w białko (jajka, twaróg, ryba).\n\n**W ciągu dnia:**\n- Druga sesja **HBOT** (~24 h po pierwszej), jeśli w protokole.\n- **PBM** 20–30 min.\n- Nawodnienie: **≥ 2,5 l wody** rozłożone równomiernie.\n- Spacer 10–15 min w wolnym tempie — bez pocenia.\n\n**Wieczorem:**\n- Sen z głową na **2 poduszkach** (kąt ~30°).\n- NIE śpij na brzuchu ani na strefie biorczej.\n\n**Czego unikać:** schylania, pochylania, podnoszenia > 5 kg, gorącego prysznica.',
2, true),

('dzien-02', 'Dzień 2 — szczyt obrzęku', 'Dzień 2', 2, 2,
E'**Cel:** kontrola obrzęku okołooczodołowego (typowy szczyt 48–72 h) i ochrona graftów.\n\n**Co robić:**\n- Trzecia sesja **HBOT** (jeśli w protokole, co 24 h).\n- **PBM** 20–30 min.\n- Zimny okład na czoło 3–4× po 10 min (nadal NIE na biorczą).\n- HOCl 2× dziennie na strefę dawczą.\n- Lekki, miękki posiłek; suplementacja: cynk 15 mg, witamina C 500 mg, witamina D wg karty.\n\n**Czego się spodziewać:**\n- Obrzęk czoła / powiek — przejściowy, kosmetyczny, nie zagraża graftom.\n- Uczucie napięcia skóry biorczej.\n\n**Sygnały alarmowe:** ostry ból punktowy, ropna wydzielina, gorączka > 38°C, jednostronny obrzęk twarzy.',
3, true),

('dzien-03', 'Dzień 3 — pierwsze mycie', 'Dzień 3', 3, 3,
E'**Cel:** rozpocząć kontrolowane usuwanie wysięku i strupków bez naruszania mieszków.\n\n**Pierwsze mycie (krok po kroku):**\n1. Letnia woda (~30°C), słaby strumień, **NIGDY bezpośrednio na biorczą**.\n2. Rozprowadź łagodny szampon (pH 5,5, **bez SLS/SLES**, bez silikonów) w dłoniach na pianę.\n3. Nakładaj pianę **opuszkami palców**, ruchami okrężnymi, bez tarcia.\n4. Spłukuj polewając wodą z dłoni lub kubeczka.\n5. Osusz **przykładając** miękki ręcznik — nie pocieraj.\n\n**Reszta dnia:**\n- HOCl 2× dziennie.\n- **PBM** 20–30 min.\n- Możesz wrócić do pracy biurowej / zdalnej.\n\n**Czego unikać:** suszarki na gorąco, czapek ściskających, soczewek (jeśli obrzęk powiek).',
4, true),

('dzien-04', 'Dzień 4 — mikrobiom i regeneracja', 'Dzień 4', 4, 4,
E'**Cel:** wspierać mikrobiom skóry głowy i przyspieszyć fazę proliferacji.\n\n**Rutyna:**\n- Mycie 1× dziennie (jak w dniu 3).\n- Cienka warstwa sterylnego żelu z **arniką / centellą / panthenolem** na strefę dawczą.\n- HOCl 2× dziennie.\n- **PBM** co 24 h.\n- Dieta: białko 1,2–1,6 g/kg m.c., żelazo (mięso, szpinak), kwasy omega-3.\n\n**Aktywność:**\n- Spacer 30–45 min.\n- Lekkie rozciąganie, joga na krześle — bez pozycji odwróconych.\n\n**Czego unikać:** sauny, basenu, alkoholu, intensywnego treningu, ekspozycji na słońce > 15 min bez kapelusza z luźnym otokiem.',
5, true),

('dzien-05', 'Dzień 5 — angiogeneza', 'Dzień 5', 5, 5,
E'**Cel:** wspierać tworzenie nowych naczyń krwionośnych wokół graftów.\n\n**Co robić:**\n- Mycie 1× dziennie wg standardu z dnia 3.\n- **PBM** 20–30 min (najlepiej rano — efekt cytochromu c-oksydazy).\n- Czwarta sesja **HBOT** (jeśli w 6-sesyjnym protokole).\n- Nawodnienie ≥ 2,5 l.\n- Sen ≥ 7 h — w fazie głębokiej rośnie wydzielanie GH wspierającego gojenie.\n\n**Pierwsze objawy świądu:** to znak unerwienia. NIE drapać. Łagodzić zimnym kompresem lub sprayem HOCl.\n\n**Czego unikać:** alkoholu, energetyków, palenia, ostrego słońca.',
6, true),

('dzien-06', 'Dzień 6 — strupki zaczynają odpadać', 'Dzień 6', 6, 6,
E'**Cel:** umożliwić naturalne złuszczanie się strupków bez utraty graftów.\n\n**Co robić:**\n- Mycie 1–2× dziennie. Pianę zostaw na skórze **3–5 min**, by zmiękczyć strupki.\n- Spłukuj wyłącznie polewając — nie trzyj.\n- **PBM** co 24 h.\n- Możesz delikatnie **opukiwać** opuszkami palców skórę głowy (poprawa perfuzji).\n\n**Czego się spodziewać:**\n- Część strupków odpada z włosem przeszczepionym — to jest normalne. **Mieszek pozostaje pod skórą.**\n- Zaczerwienienie biorczej nadal widoczne.\n\n**Czego unikać:** zrywania strupków, używania grzebienia / szczotki na biorczej, peelingów, retinoidów.',
7, true),

('dzien-07', 'Dzień 7 — koniec pierwszego tygodnia', 'Dzień 7', 7, 7,
E'**Cel:** ocena wzrokowa i przejście do mniej intensywnej fazy gojenia.\n\n**Co robić:**\n- **Zdjęcie kontrolne** strefy biorczej i dawczej (dobre światło, ten sam kąt co w dniu 0) — wyślij do koordynatora.\n- Mycie 1× dziennie.\n- **PBM** co 24 h (od dnia 8 możesz przejść na co 48 h).\n- Wizyta kontrolna lub teleporada z koordynatorem.\n\n**Czego się spodziewać:**\n- Większość obrzęku ustępuje.\n- Strefa dawcza prawie zagojona (drobne strupki).\n- Biorcza: 30–60% strupków odpadło.\n\n**Co możesz wznowić:** lekki trening cardio (do 60% HRmax), praca stacjonarna w pełnym wymiarze.\n\n**Czego nadal unikać:** sauny, basenu, sportów kontaktowych, czapek ściskających.',
8, true),

('dzien-08', 'Dzień 8 — stabilizacja naczyniowa', 'Dzień 8', 8, 8,
E'**Cel:** zakończenie fazy krytycznej — grafty są zakotwiczone naczyniowo.\n\n**Co robić:**\n- Mycie 1× dziennie, możesz delikatnie używać opuszek palców pod prysznicem.\n- **PBM** co 48 h (12 tygodni).\n- HOCl według potrzeby (jeśli nadal jest wysięk).\n- Pierwsza ocena pod kątem **LADD** (PRP + minoksydyl, laser tulowy lub zimna plazma) — zwykle planowana między dniem 10 a 14.\n\n**Aktywność:** wracasz do siłowni z ograniczeniem ciężarów (do 50% 1RM, bez parcia tłoczni brzusznej i pozycji odwróconych).',
9, true),

('dzien-09', 'Dzień 9 — pielęgnacja codzienna', 'Dzień 9', 9, 9,
E'**Cel:** utrzymać rytm pielęgnacji wspierającej anagen.\n\n**Rutyna:**\n- Mycie 1× dziennie, łagodny szampon pH 5,5.\n- Odżywka **tylko na długości** (od dnia 10 możesz nakładać delikatnie na skórę).\n- **PBM** co 48 h.\n- Suplementacja: biotyna 5 mg, cynk 15 mg, witamina D 2000 IU, żelazo (jeśli wskazane laboratoryjnie).\n\n**Czego się spodziewać:**\n- Skóra biorcza nadal różowa.\n- Świąd związany z odrastaniem pierwszych włosków.\n\n**Czego unikać:** alkoholu w nadmiarze, palenia, mocnego stylingu (lakiery, woski) — do dnia 14.',
10, true),

('dzien-10', 'Dzień 10 — start LADD (opcjonalnie)', 'Dzień 10', 10, 10,
E'**Cel:** wzmocnić efekt zabiegu przez Laser-Assisted Drug Delivery.\n\n**Co robić:**\n- Pierwsza sesja **LADD** (laser tulowy lub zimna plazma) + **PRP** + **minoksydyl** — wg planu klinicznego.\n- Po sesji LADD: brak mycia przez **6 h**, brak ekspozycji na słońce przez **48 h**.\n- **PBM** co 48 h kontynuowane.\n\n**Co możesz wznowić:** pełny trening cardio, lekki trening siłowy (do 60% 1RM).\n\n**Czego unikać:** retinoidów, kwasów AHA/BHA, peelingów mechanicznych, sauny przez kolejne 48 h po LADD.\n\n**Sygnały alarmowe po LADD:** pęcherze, intensywne pieczenie > 2 h, krwawienie punktowe trwające > 30 min.',
11, true),

('dzien-11', 'Dzień 11 — kontrola dawczej', 'Dzień 11', 11, 11,
E'**Cel:** zadbać o strefę dawczą — to ona limituje przyszłe zabiegi.\n\n**Co robić:**\n- Strefa dawcza powinna być zagojona. Możesz wmasować **delikatny olejek** (jojoba, arganowy) 1× dziennie wieczorem.\n- Mycie standardowe 1× dziennie.\n- **PBM** co 48 h — uwzględnij także dawczą.\n- Zdjęcia kontrolne dawczej (porównaj z dniem 0).\n\n**Czego unikać:** golenia maszynką elektryczną na dawczej (do dnia 21), depilacji laserowej w obrębie skóry głowy (do końca 6 tyg.).',
12, true),

('dzien-12', 'Dzień 12 — życie społeczne', 'Dzień 12', 12, 12,
E'**Cel:** komfortowy powrót do aktywności społecznej i zawodowej.\n\n**Co robić:**\n- Możesz nosić **luźną** czapkę (bawełna, miękka czapka chirurgiczna) — nie nasuwaj jej, tylko zakładaj od góry.\n- Mycie 1× dziennie, dopuszczalne stylizowanie bez żelów i lakierów.\n- **PBM** co 48 h.\n- Spotkania, praca biurowa, kino — bez ograniczeń.\n\n**Czego unikać:** kasków rowerowych / motocyklowych (do dnia 21), hełmów ochronnych, sauny, basenu.',
13, true),

('dzien-13', 'Dzień 13 — przygotowanie do fazy długoterminowej', 'Dzień 13', 13, 13,
E'**Cel:** przejść z protokołu intensywnego na podtrzymujący 12-tygodniowy.\n\n**Co robić:**\n- Plan **PBM 3–4× / tydzień** przez kolejne 12 tygodni.\n- Plan **HBOT** podtrzymujący (np. 1×/tydz. przez 4 tygodnie) — jeśli w protokole.\n- Plan **LADD**: 3 sesje co 4 tygodnie.\n- Zacznij prowadzić **raport biometryczny** (cotygodniowy): zdjęcia w stałym świetle, gęstość, grubość włosa.\n\n**Co możesz wznowić:** treningi siłowe do 80% 1RM, ćwiczenia HIIT (krótkie).',
14, true),

('dzien-14', 'Dzień 14 — koniec protokołu wczesnego', 'Dzień 14', 14, 14,
E'**Cel:** zamknąć fazę 14-dniową, ustalić plan na miesiąc 1–3.\n\n**Co robić:**\n- **Konsultacja kontrolna** z koordynatorem (osobiście lub online).\n- Dokumentacja fotograficzna: biorcza + dawcza, 4 kąty.\n- Plan długoterminowy:\n  - **PBM** 3–4× / tydz. (kontynuuj 12 tyg.).\n  - **LADD** 3× co 4 tyg. od dnia 30.\n  - **HBOT** podtrzymujące (opcjonalnie).\n  - **Minoksydyl** miejscowy 5% (jeśli zalecony).\n  - **Finasteryd** doustny (jeśli zalecony i akceptowany).\n\n**Czego się spodziewać w kolejnych tygodniach:**\n- **Tydz. 3–6:** faza shock loss — utrata przeszczepionego trzonu włosa (NIE mieszka). To **normalne i przejściowe**.\n- **Mies. 3:** pierwsze nowe włosy z przeszczepionych mieszków.\n- **Mies. 6:** ~50% efektu finalnego.\n- **Mies. 12:** ~90% efektu finalnego.\n- **Mies. 15–18:** efekt finalny.\n\n**Możesz wznowić:** basen (z czepkiem), saunę (krótko, ≤ 10 min), morze (po spłukaniu słodką wodą), pełne treningi.\n\nGratulacje — przeszedłeś przez najbardziej krytyczne 14 dni. Konsekwencja w protokole długoterminowym decyduje teraz o jakości efektu.',
15, true);