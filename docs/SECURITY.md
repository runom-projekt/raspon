# Bezpieczeństwo i dane

Ten dokument opisuje zasady zespołu i znane ograniczenia. Nie jest deklaracją
formalnej zgodności ani zastępstwem audytu prawnego.

## Klasy danych

| Klasa | Przykłady | Wymagane traktowanie |
|---|---|---|
| publiczne | tytuł oferty, opis, publiczne zdjęcia | publikacja zamierzona |
| wewnętrzne | logi techniczne, statystyki | dostęp pracowników wg roli |
| osobowe | imię, e-mail, telefon, adres, wiadomości | minimalizacja i kontrola dostępu |
| wysoce wrażliwe | dokument tożsamości, sekrety, dane płatnicze | prywatne, szyfrowane, audytowane |

## Sekrety

- `.env` nie jest commitowany;
- `.env.example` zawiera wyłącznie puste wartości lub bezpieczne przykłady;
- sekret JWT powinien być losowy, unikalny dla środowiska i mieć min. 32 znaki;
- klucze dostawców rotujemy po odejściu osoby z dostępem lub podejrzeniu wycieku;
- nie logujemy tokenów, haseł, podpisów webhooków ani pełnych dokumentów;
- frontend otrzymuje tylko zmienne jawnie publiczne `NEXT_PUBLIC_*`;
- produkcja powinna korzystać z menedżera sekretów zamiast trwałego pliku, gdy
  infrastruktura zostanie rozwinięta.

## Kontrola dostępu

- każda operacja mutująca sprawdza sesję oraz rolę lub własność zasobu;
- operacje administracyjne powinny weryfikować aktualny stan użytkownika w bazie;
- błędy `404` mogą służyć do nieujawniania istnienia cudzego zasobu;
- konta administratorów wymagają TOTP 2FA; sekret jest szyfrowany AES-256-GCM,
  kod czasowy nie może zostać użyty ponownie, a kody odzyskiwania są przechowywane wyłącznie jako hashe;
- usunięcie dostępu pracownika jest elementem checklisty offboardingu.

## Znane ryzyka blokujące bezpieczną produkcję

Stan na 2026-07-31:

1. Produkcyjne integracje Revolut, Resend, MessageBird i prywatny bucket R2
   wymagają dostarczenia poświadczeń przez właścicieli kont dostawców.
2. Dokumenty KYC utworzone przed wdrożeniem prywatnego bucketu wymagają migracji
   lub bezpiecznego usunięcia.
3. Backup PostgreSQL pozostaje lokalny na VPS; wymaga szyfrowanej kopii off-site.
4. CSP i HSTS wymagają sprawdzenia raportów oraz smoke testu na środowisku
   produkcyjnym po wdrożeniu.

Usunięte ryzyka:

- 2026-07-31 — publiczny endpoint statusu ograniczono zgodnie z
  [ADR 0001](adr/0001-booking-status-machine.md), a macierz przejść objęto testem.
- 2026-07-31 — sprawdzenie dostępności, użycie rabatu, rezerwację i płatność
  objęto jedną transakcją oraz blokadą kalendarza zgodnie z
  [ADR 0002](adr/0002-trailer-schedule-locking.md). Test integracyjny pozostaje
  aktywną częścią walidacji wdrożenia.
- 2026-07-31 — rate limiting przeniesiono do współdzielonego PostgreSQL; atomowy
  UPSERT chroni wiele instancji aplikacji, a adres klienta jest przyjmowany
  wyłącznie od jawnie zaufanego proxy i walidowany jako IPv4/IPv6.
- 2026-07-31 — uruchomiono codzienne backupy PostgreSQL z retencją, sumą SHA-256
  oraz cotygodniowym automatycznym odtworzeniem do odizolowanego kontenera.
- 2026-07-31 — powiadomienia otrzymały trwały stan dostarczenia, atomowe
  przejęcie zadania, ograniczony retry z backoff oraz chroniony sekretem
  lokalny endpoint workera; historycznych wpisów nie oznaczono fałszywie jako
  dostarczone.
- 2026-07-31 — wdrożenia produkcyjne otrzymały blokadę współbieżności,
  walidację archiwum i SHA-256, izolowany test migracji, automatyczny backup,
  identyfikowalne obrazy candidate/rollback oraz sprawdzony kontrolowaną awarią
  automatyczny rollback aplikacji po nieudanym smoke teście.
- 2026-07-31 — operacje administracyjne oraz odczyty prywatnych dokumentów KYC
  otrzymały transakcyjny audit trail z request ID; triggery PostgreSQL blokują
  zmianę i usunięcie historii. Zamknięto też anonimowy odczyt administracyjnych
  endpointów bannerów i kodów rabatowych.
- 2026-07-31 — `getSession()` weryfikuje bieżący status i rolę w bazie, a czas
  życia JWT skrócono z 30 do 7 dni.
- 2026-07-31 — nowe dokumenty KYC trafiają do osobnego prywatnego bucketu;
  administrator uzyskuje dostęp przez podpisany URL ważny 60 sekund.
- 2026-07-31 — aplikacja wysyła CSP, a na produkcji również HSTS.
- 2026-07-31 — usunięto atrapę przełącznika 2FA, która zapisywała flagę bez
  konfiguracji sekretu i bez weryfikacji podczas logowania. Funkcja pozostaje
  wyłączona do wdrożenia pełnego procesu TOTP lub WebAuthn.

Zmiany w tych obszarach wymagają review bezpieczeństwa. Lista powinna być
aktualizowana po usunięciu każdego ryzyka, z odnośnikiem do ADR lub zadania.

## KYC i RODO

Nowy upload `identity` używa osobnego prywatnego bucketu i kluczy przypisanych do
użytkownika. Do pełnego domknięcia procesu nadal wymagane są:

- szyfrowanie, rejestr odczytów i ograniczenie kopiowania;
- walidacja rzeczywistego typu oraz skan malware;
- określony cel, podstawa prawna i okres retencji;
- automatyczne usunięcie po upływie retencji;
- procedura realizacji praw osoby, której dane dotyczą;
- umowy powierzenia z dostawcami.

Nie używaj prawdziwych dokumentów na środowisku deweloperskim lub testowym.

## Płatności i webhooki

- kwota płatności pochodzi z serwera i snapshotu rezerwacji;
- webhook musi mieć poprawny podpis, świeży timestamp i ochronę przed replay;
- obsługa zdarzeń musi być idempotentna;
- stan `PAID` nie może być ustawiany przez użytkownika;
- logi przechowują identyfikator korelacji, nie dane karty;
- refund i payout wymagają jawnych uprawnień oraz śladu audytowego.

## Zgłaszanie podatności

Do czasu utworzenia dedykowanego kanału:

- nie wpisuj szczegółów exploita do publicznego zgłoszenia;
- przekaż opis właścicielowi technicznemu i właścicielowi biznesowemu;
- oznacz zakres, wpływ, sposób reprodukcji i proponowaną mitygację;
- dla aktywnego incydentu zastosuj procedurę z `OPERATIONS.md`.

Kontakt bezpieczeństwa: `DO UZUPEŁNIENIA`.
