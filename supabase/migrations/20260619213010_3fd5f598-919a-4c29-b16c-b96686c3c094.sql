
CREATE TABLE public.ebook_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  day_label text NOT NULL,
  day_from int NOT NULL,
  day_to int NOT NULL,
  body_md text NOT NULL DEFAULT '',
  order_idx int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ebook_chapters TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ebook_chapters TO authenticated;
GRANT ALL ON public.ebook_chapters TO service_role;

ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published chapters"
  ON public.ebook_chapters FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Admins can manage chapters"
  ON public.ebook_chapters FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ebook_chapters_updated_at
  BEFORE UPDATE ON public.ebook_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ebook_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  consent boolean NOT NULL DEFAULT false,
  access_token text NOT NULL UNIQUE,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ebook_leads_email ON public.ebook_leads (email);
CREATE INDEX idx_ebook_leads_created_at ON public.ebook_leads (created_at DESC);

GRANT ALL ON public.ebook_leads TO service_role;
GRANT SELECT ON public.ebook_leads TO authenticated;

ALTER TABLE public.ebook_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view leads"
  ON public.ebook_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed initial 14-day chapters
INSERT INTO public.ebook_chapters (slug, title, day_label, day_from, day_to, body_md, order_idx) VALUES
('wstep', 'Wstęp — dlaczego pierwsze 14 dni', 'Wprowadzenie', 0, 0,
'Po zabiegu DHI każdy przeszczepiony graft jest tkanką niedokrwioną. Twoje działania w ciągu pierwszych 14 dni bezpośrednio wpływają na przeżywalność mieszków włosowych i ostateczny efekt zabiegu.

Ten przewodnik opiera się o aktualne dane kliniczne (EBM) i protokoły stosowane w transplantologii. Nie jest substytutem konsultacji medycznej — w razie wątpliwości skontaktuj się z zespołem kliniki.',
0),

('dzien-0', 'Dzień 0 — bezpośrednio po zabiegu', 'Dzień 0', 0, 0,
'**Cel:** zminimalizować obrzęk, stres oksydacyjny i ryzyko mechanicznego uszkodzenia graftów.

- Pozycja pół-siedząca przez pierwsze 48 h (kąt 30–45°).
- Brak dotykania, drapania, mycia strefy biorczej.
- Sesja PBM 650/830 nm bezpośrednio po zabiegu (4–6 J/cm²).
- Pierwsza sesja HBOT 1,5–2,0 ATA w ciągu 6 h od zabiegu (jeżeli w protokole).
- Lód na czoło (NIE na strefę biorczą), aby ograniczyć migrację obrzęku.',
1),

('dzien-1-2', 'Dni 1–2 — krytyczne okno niedokrwienia', 'Dni 1–2', 1, 2,
'**Cel:** podtrzymać metabolizm graftu do momentu rewaskularyzacji (48–96 h).

- Druga sesja HBOT (24 h po pierwszej).
- PBM co 24 h, 20–30 minut.
- Spray HOCl 0,01–0,02% na strefę dawczą (delikatnie, bez wycierania).
- Spanie z głową uniesioną na 2 poduszkach.
- Nawodnienie ≥ 2,5 l wody / dobę; unikaj alkoholu i kofeiny.',
2),

('dzien-3-4', 'Dni 3–4 — pierwsze mycie i mikrobiom', 'Dni 3–4', 3, 4,
'**Cel:** rozpocząć kontrolowane usuwanie strupków, chronić mikrobiom skóry głowy.

- Pierwsze mycie wg instrukcji koordynatora (pH 5,5, bez SLS/SLES).
- Spray HOCl 2× dziennie.
- Sterylne żele z arniką / centellą na strefę dawczą.
- Kontynuacja PBM co 24 h.
- Unikaj sauny, basenu, intensywnego wysiłku.',
3),

('dzien-5-7', 'Dni 5–7 — gojenie pierwotne', 'Dni 5–7', 5, 7,
'**Cel:** wspierać angiogenezę, redukować ryzyko stanu zapalnego.

- PBM co 48 h.
- Trzecia sesja HBOT (opcjonalnie, wg planu).
- Możliwy świąd — NIE drapać. Stosować HOCl lub zimne kompresy.
- Strupki zaczynają odpadać samoistnie. Nigdy nie ściągaj ich siłą.',
4),

('dzien-8-10', 'Dni 8–10 — stabilizacja graftów', 'Dni 8–10', 8, 10,
'**Cel:** zakończyć fazę krytyczną. Grafty są już zakotwiczone naczyniowo.

- PBM co 48 h kontynuowane przez kolejne 12 tygodni.
- Można wrócić do lekkiego wysiłku aerobowego.
- Pierwsza sesja LADD z PRP + minoksydylem (laser tulowy / zimna plazma) — wg protokołu.
- Delikatny masaż skóry głowy poprawia perfuzję.',
5),

('dzien-11-14', 'Dni 11–14 — przejście do fazy długoterminowej', 'Dni 11–14', 11, 14,
'**Cel:** ustabilizować efekt i wejść w protokół wspierający 12-tygodniowy.

- Większość strupków odpadła; skóra biorcza nadal może być zaczerwieniona.
- Faza „shock loss" (utrata przeszczepionego włosa, NIE mieszka) jest normalna i przejściowa.
- Plan długoterminowy: PBM 3–4×/tydz., kontrola HBOT/LADD, raport biometryczny co tydzień.
- Konsultacja kontrolna z koordynatorem.',
6),

('checklista', 'Checklista — czego unikać przez 14 dni', 'Checklista', 0, 14,
'- ❌ Alkohol, palenie (vasokonstrykcja → spadek perfuzji graftu)
- ❌ Aspiryna, ibuprofen w pierwszych 48 h (chyba że zalecone)
- ❌ Sauna, basen, kąpiele słoneczne
- ❌ Intensywny trening, podnoszenie ciężarów
- ❌ Czapki, kaski, hełmy ściskające skórę głowy
- ❌ Drapanie, zrywanie strupków
- ✅ Sen z uniesioną głową (48–72 h)
- ✅ Dieta bogata w białko, żelazo, cynk, witaminy B
- ✅ Nawodnienie ≥ 2,5 l/dobę
- ✅ Regularny kontakt z koordynatorem',
7);
