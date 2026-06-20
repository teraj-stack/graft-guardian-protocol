export type Stage = "Dzień 0-3" | "Dzień 4-14" | "Miesiąc 1+";
export type Topic = "LED" | "HBOT" | "LADD/PRP" | "pielęgnacja domowa" | "gojenie";

export const STAGES: Stage[] = ["Dzień 0-3", "Dzień 4-14", "Miesiąc 1+"];
export const TOPICS: Topic[] = ["LED", "HBOT", "LADD/PRP", "pielęgnacja domowa", "gojenie"];

export const FAQ: { q: string; a: string; stages: Stage[]; topics: Topic[] }[] = [
  {
    q: "Czym różni się 650 nm od 830 nm w fotobiomodulacji skóry głowy?",
    a: "650 nm (czerwone) penetruje do 1–2 mm i działa głównie na poziomie naskórka, skóry właściwej oraz brodawki włosa. 830 nm (bliska podczerwień) sięga 3–5 mm, dociera do brodawek głębiej osadzonych mieszków i obrzękniętej tkanki podskórnej. Oba zakresy aktywują oksydazę c-cytochromową (kompleks IV łańcucha oddechowego), zwiększając produkcję ATP mitochondrialnego.",
    stages: ["Dzień 0-3", "Dzień 4-14", "Miesiąc 1+"],
    topics: ["LED"],
  },
  {
    q: "Kiedy mogę umyć głowę po DHI?",
    a: "Pierwsze delikatne, bezdotykowe spłukiwanie obszaru biorczego solą fizjologiczną lub HOCI — od 48 godziny. Pełne mycie szamponem o pH 5,5 bez SLS — od doby 4. Tarcie i zdejmowanie strupów wyłącznie po 8. dobie. Wcześniejsze tarcie to najczęstsza mechaniczna przyczyna utraty graftów.",
    stages: ["Dzień 0-3"],
    topics: ["pielęgnacja domowa"],
  },
  {
    q: "Czy HBOT po przeszczepie włosów jest refundowany przez NFZ?",
    a: "Nie. Wskazania refundowane to m.in. zatrucia CO, choroba dekompresyjna, martwica radiacyjna, stopa cukrzycowa. Zastosowanie HBOT w transplantologii włosów to procedura komercyjna w ośrodkach prywatnych.",
    stages: ["Dzień 0-3"],
    topics: ["HBOT"],
  },
  {
    q: "Czy minoksydyl doustny w mikrodawkach jest bezpieczny?",
    a: "W dawkach 0,25–2,5 mg/dobę profil bezpieczeństwa u zdrowych dorosłych jest dobrze udokumentowany (m.in. Sinclair 2018, Randolph & Tosti 2021). Wymaga kwalifikacji lekarskiej, oceny ciśnienia tętniczego i wykluczenia przeciwwskazań kardiologicznych. Nie jest zarejestrowany w tym wskazaniu — stosowanie off-label.",
    stages: ["Miesiąc 1+"],
    topics: ["LADD/PRP"],
  },
  {
    q: "Po co PRP w roztworze przechowującym grafty?",
    a: "Osocze bogatopłytkowe zawiera VEGF, PDGF, EGF, IGF-1, TGF-β. Inkubacja graftów w PRP przed implantacją wysyca je czynnikami wzrostu, co przyspiesza angiogenezę i skraca okno niedokrwienia w pierwszych 48–72 godzinach po implantacji.",
    stages: ["Dzień 0-3"],
    topics: ["LADD/PRP"],
  },
  {
    q: "Czym HypoThermosol różni się od soli fizjologicznej?",
    a: "0,9% NaCl ma osmolarność ~308 mOsm/L i nie zawiera żadnego buforu energetycznego — komórki przechowywane w niej w temperaturze 4°C wyczerpują ATP w ciągu 2–4 godzin. HypoThermosol FRS jest buforowanym roztworem hipotermicznym (zawiera HEPES, mannitol, adenozynę, glutation) zaprojektowanym dla narządów do transplantacji, utrzymującym homeostazę jonową przy 2–8°C nawet ponad 24 h.",
    stages: ["Dzień 0-3"],
    topics: ["LADD/PRP"],
  },
  {
    q: "Laser tulowy 1927 nm czy zimna plazma — co wybrać do LADD?",
    a: "Laser tulowy frakcyjny 1927 nm to standard w LADD: kontrolowane mikrokanały głębokości 150–300 µm, krótki downtime, szeroko udokumentowana penetracja minoksydylu i peptydów. Zimna plazma atmosferyczna (CAP) działa nietermicznie — generuje RONS, zwiększa przepuszczalność warstwy rogowej bez ablacji, ale głębokość drug delivery jest mniejsza (~50–100 µm). Tulowy: większa penetracja, więcej energii w tkance. CAP: bezpieczniejszy bezpośrednio nad świeżymi graftami.",
    stages: ["Miesiąc 1+"],
    topics: ["LADD/PRP"],
  },
  {
    q: "Czy mogę pić alkohol i palić po zabiegu?",
    a: "Nikotyna powoduje skurcz naczyń obwodowych do 90 minut po każdej dawce — w oknie rewaskularyzacji (doba 0–7) zwiększa ryzyko martwicy graftów. Alkohol upośledza hemostazę i zwiększa obrzęk. Zalecane wstrzymanie obu używek minimum 14 dni.",
    stages: ["Dzień 0-3", "Dzień 4-14"],
    topics: ["pielęgnacja domowa"],
  },
  {
    q: "Kiedy zobaczę finalny efekt?",
    a: "Shock loss przeszczepionych włosów: tydzień 2–6. Wejście w anagen: miesiąc 3–4. Pierwsze widoczne zagęszczenie: miesiąc 6. Efekt końcowy: 12–15 miesięcy od zabiegu.",
    stages: ["Miesiąc 1+"],
    topics: ["pielęgnacja domowa"],
  },
  {
    q: "Kiedy mogę wrócić do sportu, sauny, basenu i słońca po przeszczepie włosów metodą DHI?",
    a: "Sport lekki (spacer, joga bez inwersji) — od doby 3. Trening siłowy i bieganie — od tygodnia 2, gdy strupki są zlane i ryzyko mechanicznego urazu graftów maleje. Sauna sucha i parowa — nie wcześniej niż 14 dni po zabiegu, ponieważ nagłe rozszerzenie naczyń i pocenie się osłabiają adhezję graftów. Basen z chlorowaną wodą — 14 dni, słona woda (morze) — 21 dni; chlor i sól działają drażniąco na gojącą się skórę głowy. Słońce bezpośrednie — unikaj przez 30 dni. Po tym czasie używaj kapelusza z filtrem UPF 50+; UV upośledza gojenie i zwiększa ryzyko przebarwień w strefie biorczej. Z solarium i opalania natryskowego wstrzymaj się 4 tygodnie.",
    stages: ["Dzień 4-14", "Miesiąc 1+"],
    topics: ["pielęgnacja domowa"],
  },
  {
    q: "Co jest normalne w pierwszych 48 godzinach po przeszczepie DHI?",
    a: "W dobie 0–3 normalne są: lekki obrzęk czoła i skroni (w płynie podczepczym), delikatny rumień w strefie biorczej, uczucie napięcia i „zaciskania” w miejscu implantacji, drobne kropelki surowicy na graftach oraz łagodny ból reagujący na leki przeciwbólowe z karty wypisowej. Te objawy wynikają z reakcji zapalnej, mikrokrwawień i retencji płynów w pozycji poziomej. Wskazane jest spanie w pozycji półsiedzącej (≥30°) przez pierwsze 5 dni.",
    stages: ["Dzień 0-3"],
    topics: ["gojenie"],
  },
  {
    q: "Czy obrzęk czoła i twarzy po zabiegu jest normalny?",
    a: "Tak — obrzęk czoła, powiek i górnej części twarzy występuje u 60–80% pacjentów w dobach 1–3. Jest to skutek przemieszczenia płynu pozabiegowego wzdłuż luźnej tkanki podskórnej czoła. Zazwyczaj ustępuje samoistnie w ciągu 48–72 h. Przyspieszają go: sen z uniesioną głową, zimne okłady wokół czoła (nie na strefę biorczą) oraz zalecone leki p/obrzękowe.",
    stages: ["Dzień 0-3"],
    topics: ["gojenie"],
  },
  {
    q: "Czy ból i ucisk w strefie biorczej są normalne w dobie 0–3?",
    a: "Tak. Uczucie „zaciskania”, łagodnego pulsowania lub pieczenia w okolicy implantacji jest typowe dla fazy ostrego zapalenia i gojenia pierwotnego. Ból powinien być łatwy do opanowania lekami z karty wypisowej (zazwyczaj paracetamol + ibuprofen). Jeśli ból narasta po dobie 2–3, towarzyszy mu gorączka >38 °C, gęsty wyciek ropny lub intensywny, rozszerzający się rumień — skontaktuj się natychmiast z kliniką.",
    stages: ["Dzień 0-3"],
    topics: ["gojenie"],
  },
  {
    q: "Kiedy strupki zaczną się zmywać i czy mogę je samodzielnie usuwać?",
    a: "Strupki zaczynają się formować od doby 2 i zazwyczaj zaczynają zmywać między dobą 7 a 14. Są to mieszane strupy surowicze, krwi i martwego naskórka. Nie wolno ich zdrapywać, skubać ani moczyć pod strumieniem wody — mechaniczne oderwanie strupa może wyrwać młody graft wraz z cebulką. Od doby 8 można wykonywać miękki masaż palcami podczas mycia szamponem pH 5,5 — strupy schodzą same pod wpływem wody i delikatnego rozpuszczania.",
    stages: ["Dzień 4-14"],
    topics: ["gojenie"],
  },
  {
    q: "Czy swędzenie skóry głowy w tygodniu 1–2 jest normalne?",
    a: "Tak. Swędzenie w okolicy biorczej między dobą 4 a 10 to znak gojenia — odbudowa naskórka, tworzenie nowych naczyń i powrót unerwienia. Może towarzyszyć mu delikatne łuszczenie. Nie drapać — podrażnienie mechaniczne zwiększa ryzyko infekcji i uszkodzenia graftów. Pomaga chłodząca mgiełka HOCl, delikatny szampon i (po konsultacji) krotka dawka antyhistaminowa. Jeśli swędzenie jest intensywne, zlokalizowane na strefie dawczej lub towarzyszy mu wysypka — zgłoś koordynatorowi.",
    stages: ["Dzień 4-14"],
    topics: ["gojenie"],
  },
  {
    q: "Czy wypadanie przeszczepionych włosów w tygodniach 2–6 jest normalne?",
    a: "Tak — to tzw. shock loss (łysienie telogenowe pooperacyjne). Przeszczepione włosy wchodzą w fazę telogenu i wypadają 2–6 tygodni po zabiegu. Jest to fizjologiczna, oczekiwana reakcja na mikrouraz implantacji. Same cebulki (grafty) pozostają w skórze. Nowy włos zaczyna rosnąć z tej samej cebulki w miesiącu 3–4. U pacjentów stosujących PBM w okresie pozabiegowym shock loss bywa mniej nasilone i krótsze.",
    stages: ["Dzień 4-14", "Miesiąc 1+"],
    topics: ["gojenie"],
  },
  {
    q: "Kiedy należy natychmiast skontaktować się z kliniką?",
    a: "Skontaktuj się natychmiast w przypadku: gorączki >38 °C po dobie 2, ropnego lub zielonkawego wycieku z okolicy biorczej, szybko rozchodzącego się rumienia i ciepła w okolicy implantacji, silnego bólu nieopanowywanego lekami, krwawienia utrzymującego się >30 minut, dużych siniaków poza obszarem czoła (szyja, klatka piersiowa), reakcji alergicznej na leki lub opatrunek, utraty dużej liczby graftów widocznej gołym okiem (krew z cebulkami w strupach).",
    stages: ["Dzień 0-3", "Dzień 4-14"],
    topics: ["gojenie", "pielęgnacja domowa"],
  },
  {
    q: "Czy mogę spać na boku po przeszczepie włosów?",
    a: "Przez pierwsze 4–5 dni zalecamy spanie na plecach z głową uniesioną o minimum 30° (poduszka klinowa lub dodatkowa poduszka pod szyję). Spanie na boku lub brzuchu zwiększa ucisk na strefę biorczą, tarcie o poduszkę i ryzyko mechanicznego uszkodzenia graftów. Od doby 5 można ostrożnie próbować pozycji bocznej, upewniając się, że nie ma bezpośredniego ucisku na implantację. Pełny powrót do ulubionej pozycji — zazwyczaj po 10–14 dniach, gdy adhezja graftów jest już stabilna.",
    stages: ["Dzień 0-3", "Dzień 4-14"],
    topics: ["pielęgnacja domowa"],
  },
  {
    q: "Doba 0 (dzień zabiegu) — co robić po powrocie do domu?",
    a: "Po wyjściu z kliniki: nie zdejmuj opaski czołowej do czasu zalecanego na karcie wypisowej (zwykle 24 h — chroni przed spływaniem surowicy do oczu). Śpij półsiedząco (≥30°). Nie dotykaj strefy biorczej. Nie myj głowy. Nie zażywaj aspiryny ani NLPZ poza zaleconymi (ryzyko krwawienia) — paracetamol jest bezpieczny. Pij 2–3 L wody. Pierwsza dawka antybiotyku/sterydu zgodnie z kartą. Jeśli zaplanowano PBM/HBOT — pierwsza sesja zwykle w dobie 0 lub +1.",
    stages: ["Dzień 0-3"],
    topics: ["pielęgnacja domowa", "gojenie"],
  },
  {
    q: "Doba 1 — czego się spodziewać?",
    a: "Strefa biorcza: drobne strupki surowicze zaczynają się formować, lekki rumień, możliwy „mrowiący” dyskomfort. Strefa dawcza: tępy ból, uczucie naciągnięcia. Możliwe pierwsze oznaki obrzęku czoła. Czynności: kontynuuj sen pod kątem, zimne okłady na czoło (nie na grafty), leki zgodnie z kartą. Dozwolone: krótki spacer, lekki posiłek bogaty w białko. Zakazane: schylanie się, podnoszenie >5 kg, mycie głowy, czapka opinająca strefę biorczą.",
    stages: ["Dzień 0-3"],
    topics: ["pielęgnacja domowa", "gojenie"],
  },
  {
    q: "Doba 2 — kiedy zacząć spryskiwanie solą fizjologiczną / HOCl?",
    a: "Od 48 godziny po zabiegu rozpocznij delikatne, bezdotykowe nawilżanie strefy biorczej sterylną solą fizjologiczną lub roztworem HOCl (kwas podchlorawy) — spryskuj z odległości 15–20 cm co 2–3 h w ciągu dnia. Cel: utrzymać grafty w wilgotnym środowisku (przyspiesza rewaskularyzację), zmiękczyć strupki, ograniczyć kolonizację bakteryjną. Nie pocieraj, nie wycieraj ręcznikiem — pozwól wyschnąć powietrzem.",
    stages: ["Dzień 0-3"],
    topics: ["pielęgnacja domowa", "gojenie"],
  },
  {
    q: "Doba 3 — szczyt obrzęku, czy to powód do niepokoju?",
    a: "Nie. Obrzęk czoła, powiek i nasady nosa najczęściej kulminuje w dobie 2–3, po czym samoistnie ustępuje w ciągu 48–72 h. Pomaga: dalszy sen ≥30°, chłodne (nie lodowate) okłady na czoło, lekka aktywność (spacer). Niepokojące i wymagające kontaktu z kliniką: obrzęk asymetryczny z silnym bólem jednej strony, obrzęk szyi/krtani, duszność, wysypka — to objawy reakcji alergicznej lub infekcji, nie typowego obrzęku pozabiegowego.",
    stages: ["Dzień 0-3"],
    topics: ["gojenie"],
  },
  {
    q: "Doba 4 — pierwsze mycie głowy: jak to zrobić krok po kroku?",
    a: "1) Nanieś cienką warstwę emolientu (np. olej migdałowy lub dedykowany pre-wash) na strefę biorczą; pozostaw 15–20 min, by zmiękczyć strupki. 2) Spłucz letnią wodą z dłoni — nie pod prysznicem (strumień zbyt silny). 3) Spień łagodny szampon pH 5,5 (bez SLS) w dłoni i nakładaj pianę opuszkami palców, bez pocierania. 4) Spłucz wodą z dłoni. 5) Osusz przykładając ręcznik z mikrofibry — nie pocieraj. Powtarzaj 1×/dobę do doby 14.",
    stages: ["Dzień 4-14"],
    topics: ["pielęgnacja domowa"],
  },
  {
    q: "Doba 5–7 — co się dzieje z graftami biologicznie?",
    a: "To okno rewaskularyzacji: nowe naczynia kapilarne wrastają z łożyska biorcy w przeszczepione mieszki. Grafty przechodzą z fazy imbibicji (odżywianie dyfuzyjne z osocza) w fazę inoskulacji (połączenie z mikrokrążeniem). To kluczowy moment — od jego sprawności zależy przeżywalność. Wspiera go: dobre dotlenienie (HBOT, ograniczenie nikotyny), fotobiomodulacja (PBM 650/830 nm), unikanie skoków ciśnienia i mechanicznych urazów. Adhezja graftów jest jeszcze słaba — nie noś czapek opinających.",
    stages: ["Dzień 4-14"],
    topics: ["gojenie", "HBOT", "LED"],
  },
  {
    q: "Doba 8–10 — kiedy mogę delikatnie masować skórę głowy?",
    a: "Od doby 8 możesz wykonywać miękki masaż okrężny opuszkami palców podczas mycia szamponem — pomaga to w odchodzeniu strupków i poprawia mikrokrążenie. Nie używaj paznokci, szczotek, irygatorów ani prysznica skierowanego prosto na strefę biorczą. Sesje PBM kontynuuj wg protokołu. Możesz wrócić do pracy biurowej (jeśli jeszcze nie wróciłeś) — strefa biorcza jest już mniej rumieniowa.",
    stages: ["Dzień 4-14"],
    topics: ["pielęgnacja domowa", "LED"],
  },
  {
    q: "Doba 11–14 — koniec fazy krytycznej, co dalej?",
    a: "Większość strupków powinna zejść do doby 14. Strefa biorcza: różowa, gładka, czasem z drobnym łuszczeniem. Grafty są stabilnie zakotwiczone (adhezja ~100%). Można: wrócić do treningu siłowego i biegania, normalnego mycia głowy, używania delikatnej odżywki. Należy: nadal unikać sauny, basenu, intensywnego słońca (do doby 21–30), kontynuować PBM/minoksydyl/HBOT zgodnie z protokołem. Umów kontrolę 14-dniową i zaplanuj fotografie kontrolne (te same kąty co przed zabiegiem).",
    stages: ["Dzień 4-14", "Miesiąc 1+"],
    topics: ["gojenie", "pielęgnacja domowa"],
  },
  {
    q: "Czy zaczerwienienie strefy biorczej utrzymujące się 2–4 tygodnie jest normalne?",
    a: "Tak. Różowo-czerwone zabarwienie strefy biorczej (tzw. post-procedural erythema) utrzymuje się u większości pacjentów 2–6 tygodni, u osób o jasnej karnacji nawet do 8 tygodni. Wynika z młodych naczyń kapilarnych i przewlekłej fazy zapalnej gojenia. Łagodzi je: PBM 650 nm, ochrona przeciwsłoneczna (UPF 50+), unikanie alkoholu i sauny. Niepokojące: rumień ciepły, bolesny, rozszerzający się poza strefę zabiegu — wymaga konsultacji (podejrzenie folliculitis lub cellulitis).",
    stages: ["Dzień 4-14", "Miesiąc 1+"],
    topics: ["gojenie"],
  },
  {
    q: "Co jeść i pić w dobach 0–14, żeby wspomóc gojenie?",
    a: "Białko: 1,2–1,6 g/kg m.c./dobę (mięso, ryby, jaja, rośliny strączkowe) — substrat dla kolagenu i keratyny. Witamina C 500–1000 mg/dobę i cynk 15–25 mg/dobę — kofaktor hydroksylacji kolagenu i mitozy keratynocytów. Żelazo, witamina D3, B12 — jeśli niedobór wykryty w badaniach przedoperacyjnych. Omega-3 (2–3 g EPA/DHA) — modulacja zapalenia. Woda: 30–35 ml/kg m.c. Unikać: alkoholu (14 dni), nadmiaru cukrów prostych, suplementów na bazie czosnku, miłorzębu, kurkumy w wysokich dawkach (działanie przeciwpłytkowe — ryzyko krwawienia).",
    stages: ["Dzień 0-3", "Dzień 4-14"],
    topics: ["pielęgnacja domowa"],
  },
];
