## Cel
Pacjent zapisuje się na stronie (e-mail, telefon, data zabiegu, preferowane kanały, wybrane tygodnie). System automatycznie wysyła przypomnienia o materiałach z `/panel` w wybranych tygodniach po zabiegu — e-mailem i/lub SMS-em.

## Prerekwizyty (wymagane do działania)
1. **Lovable Cloud** — baza zapisów, harmonogram, kolejka, cron.
2. **Domena e-mail** (Lovable Emails) — wysyłka e-maili z własnej domeny.
3. **Twilio connector** — wysyłka SMS. Wymaga konta Twilio (numer nadawcy + API key). Inaczej SMS po prostu nie działa, e-mail dalej działa.

Po zatwierdzeniu planu włączę Cloud automatycznie i poprowadzę przez konfigurację domeny e-mail oraz Twilio.

## Co zbuduję

### 1. Baza danych (migracja)
- `reminder_subscriptions` — id, email, phone, surgery_date, channels (email/sms/both), selected_weeks (int[] 1–12), unsubscribe_token, created_at, active.
- `reminder_sends` — log wysyłek (subscription_id, week, channel, status, sent_at, message_id) + unikalny indeks zapobiegający duplikatom.
- RLS: insert dostępny publicznie (anon) z walidacją; select tylko service_role. GRANT-y zgodne z regułami projektu.

### 2. Formularz zapisu — `/przypomnienia`
- Nowa publiczna strona z formularzem: e-mail, telefon (E.164), data zabiegu (date picker), checkboxy kanałów, multi-select tygodni T1–T12 (z domyślnymi punktami kluczowymi: 1, 2, 4, 8, 12 — szybki preset „Kluczowe momenty" i „Wszystkie tygodnie").
- Walidacja Zod (client + server).
- Server route `/api/public/reminders/subscribe` (publiczny, anon) z rate-limitem przez idempotency key.
- Link w nawigacji + CTA w sekcji Patient Journey i w `/panel`.

### 3. Wypisanie się
- Strona `/przypomnienia/wypisz?token=...` — jeden klik dezaktywuje subskrypcję.
- Link automatycznie dołączany do każdej wiadomości.

### 4. Silnik wysyłek
- Server route `/api/public/reminders/dispatch` (zabezpieczony sekretem `REMINDER_CRON_SECRET` w nagłówku).
- Każde uruchomienie: znajdź subskrypcje, dla których `today − surgery_date` w dniach odpowiada początkowi któregoś z wybranych tygodni (np. tydzień N = dzień 7·(N−1) + 1), wyślij każdy kanał i zapisz w `reminder_sends` (idempotentnie).
- E-mail: szablon React Email „week-reminder" z listą materiałów dla danego tygodnia + link do `/panel?weeks=Tn`.
- SMS: krótki tekst (≤160 znaków) + skrócony link do panelu z filtrem tygodnia + info o STOP.
- pg_cron co godzinę woła endpoint dispatch.

### 5. Treść materiałów per tydzień
- Wyciągnę istniejące materiały z `/panel` (15 wpisów z tagami T1–T12) do współdzielonego modułu, żeby zarówno panel jak i e-mail/SMS korzystały z tego samego źródła.

## Szczegóły techniczne
- E-mail przez Lovable Emails (queue + retry, suppression list automatycznie).
- SMS przez Twilio gateway (`/twilio/Messages.json`); jeśli `TWILIO_API_KEY` brak — kanał SMS pomijany, log z `status: 'sms_disabled'`.
- Telefon przechowywany w E.164; walidacja regex `^\+[1-9]\d{7,14}$`.
- Brak per-user-auth — identyfikacja po `unsubscribe_token` (UUID).
- Zgody RODO: checkbox „Wyrażam zgodę na otrzymywanie przypomnień…" wymagany.

## Pominę (do następnej iteracji, chyba że poprosisz)
- Panel admina do podglądu/edycji subskrypcji.
- Modyfikacja harmonogramu po zapisie (na razie: wypisz + zapisz ponownie).
- Wielojęzyczność szablonów.

## Po zatwierdzeniu
Wykonam w kolejności: Cloud → setup domeny e-mail → migracja → formularz + strony → szablony → endpoint dispatch → cron → Twilio (poproszę o połączenie konektora) → test end-to-end z Playwrightem.
