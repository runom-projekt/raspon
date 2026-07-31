# Plan dalszego rozwoju

## Cel

Plan prowadzi od obecnego MVP do bezpiecznego, mierzalnego i utrzymywalnego
marketplace'u obsługującego prawdziwe rezerwacje oraz płatności. Kolejność wynika
z ryzyka i zależności technicznych, nie z atrakcyjności funkcji.

Szacunki zakładają zespół:

- 2 programistów full-stack;
- część etatu osoby odpowiedzialnej za produkt i testy;
- okresowe wsparcie DevOps oraz specjalisty bezpieczeństwa/RODO.

Przy jednej osobie terminy należy co najmniej podwoić. Każdy etap kończy się
decyzją go/no-go. Nie rozpoczynamy płatnego wzrostu ruchu przed zakończeniem
etapów 0–2.

## Priorytety

| Poziom | Znaczenie |
|---|---|
| P0 | ryzyko utraty pieniędzy, danych lub kontroli nad systemem |
| P1 | warunek stabilnej produkcji i sprawnej pracy zespołu |
| P2 | wzrost konwersji, automatyzacja operacji i poprawa produktu |
| P3 | skalowanie lub rozwój opcjonalny |

## Etap 0 — kontrola projektu

**Horyzont:** 1 tydzień  
**Cel:** ustanowić jednoznaczne źródło kodu, odpowiedzialności i stanu produkcji.

### Zakres

- [ ] Utworzyć lub odzyskać właściwe repozytorium Git.
- [ ] Ustalić strategię gałęzi, review i ochronę głównej gałęzi.
- [ ] Przypisać właścicieli z tabeli w `docs/README.md`.
- [ ] Oznaczać każdą produkcyjną wersję tagiem lub numerem wydania.
- [ ] Zinwentaryzować konta, domeny, webhooki, klucze i osoby z dostępem.
- [ ] Potwierdzić, jaka wersja kodu działa na produkcji.
- [ ] Utworzyć backlog i przepisać do niego ryzyka z `SECURITY.md`.
- [ ] Zdefiniować minimalne metryki biznesowe i techniczne.

### Kryteria zakończenia

- każda zmiana produkcyjna wskazuje konkretny commit;
- repozytorium wymaga review przed połączeniem;
- co najmniej dwie osoby kontrolowane przez firmę mają dostęp awaryjny;
- każdy element P0 ma właściciela i termin.

## Etap 1 — bezpieczeństwo procesów krytycznych

**Horyzont:** 2–4 tygodnie  
**Cel:** usunąć możliwość manipulacji rezerwacją, płatnością i danymi KYC.

### Rezerwacje i płatności — P0

- [x] Zatwierdzić maszynę stanów rezerwacji w ADR.
- [x] Rozdzielić akcje klienta, właściciela, administratora i systemu płatniczego.
- [x] Uniemożliwić ustawienie `CONFIRMED`/`PAID` przez użytkownika.
- [x] Objąć utworzenie rezerwacji, płatności i użycie rabatu transakcją.
- [x] Wprowadzić blokadę serializującą równoległe zapisy tego samego kalendarza.
- [x] Dodać integracyjny test dwóch równoległych rezerwacji na PostgreSQL.
- [x] Zapewnić idempotencję tworzenia checkoutu.
- [x] Weryfikować kwotę, walutę i powiązanie zamówienia w webhooku.
- [x] Odrzucać webhooki starsze niż 5 minut i zapewnić idempotencję skutków.
- [x] Dodać trwały dziennik odebranych zdarzeń po przygotowaniu migracji bazy.
- [ ] Dodać politykę anulowania, refundów, kaucji i sporów.

### Tożsamość i dane — P0

- [x] Rozdzielić upload KYC do osobnego prywatnego bucketu.
- [x] Wprowadzić 60-sekundowe URL-e dla upoważnionych administratorów.
- [ ] Przenieść lub usunąć dokumenty zapisane wcześniej jako publiczne URL-e.
- [ ] Walidować rzeczywisty format pliku i skanować uploady.
- [ ] Ustalić retencję dokumentów oraz automatyczne usuwanie.
- [ ] Dodać rejestr dostępu do dokumentów.
- [ ] Przeprowadzić przegląd treści prawnych i umów z dostawcami pod kątem RODO.

### Sesje i uprawnienia — P0/P1

- [x] Weryfikować aktualny status i rolę przy każdym uwierzytelnionym żądaniu.
- [x] Wprowadzić natychmiastowe odcięcie sesji po zawieszeniu konta i zmianie roli.
- [x] Skrócić życie sesji z 30 do 7 dni.
- [x] Dodać obowiązkowe TOTP 2FA dla administratorów z jednorazowymi kodami odzyskiwania.
- [x] Dodać CSP i produkcyjne HSTS.
- [x] Zweryfikować zaufane proxy przed uznaniem konfiguracji nagłówków klienta.
- [x] Przenieść rate limiting do współdzielonego magazynu PostgreSQL.

### Kryteria zakończenia

- test równoległy nie tworzy podwójnej rezerwacji;
- ponowiony webhook nie wywołuje ponownie skutków biznesowych;
- użytkownik nie może ręcznie osiągnąć stanu opłaconej rezerwacji;
- żaden dokument KYC nie ma publicznego adresu;
- zawieszone konto traci dostęp w określonym i przetestowanym czasie;
- przegląd bezpieczeństwa nie wykazuje otwartych P0.

## Etap 2 — jakość i bezpieczne wdrożenia

**Horyzont:** 2–4 tygodnie  
**Cel:** każda zmiana ma automatyczny dowód jakości i może być bezpiecznie wdrożona.

### Testy — P1

- [ ] Wybrać i skonfigurować framework testów jednostkowych.
- [ ] Uruchamiać PostgreSQL dla testów integracyjnych.
- [x] Pokryć wycenę, rabaty i maszynę stanów testami tabelarycznymi.
- [ ] Pokryć API auth, uprawnienia i własność zasobów.
- [ ] Dodać testy kolizji oraz współbieżności rezerwacji.
- [ ] Dodać testy podpisu, replay i idempotencji webhooka.
- [ ] Dodać E2E głównego przepływu w sandboxie.

Nie należy ustalać arbitralnego celu pokrycia całego kodu. Wymagane jest pełne
pokrycie inwariantów finansowych i autoryzacyjnych.

### Baza danych — P1

- [x] Utworzyć migrację bazową na podstawie zweryfikowanego schematu produkcji.
- [x] Przejść z `db push` na `prisma migrate deploy`.
- [ ] Testować migracje na kopii danych.
- [ ] Ustalić procedurę expand/migrate/contract.
- [x] Dodać regularne backupy, raportowanie ich stanu i automatyczny test restore.
- [ ] Wykonać oraz udokumentować próbne odtworzenie.

### CI/CD — P1

- [ ] Pipeline: install → typecheck → lint → test → build.
- [ ] Skan sekretów, zależności i obrazu kontenera.
- [ ] Budować jeden identyfikowalny obraz i promować go między środowiskami.
- [ ] Oddzielić staging od produkcji.
- [x] Wprowadzić identyfikowalne wdrożenie z automatycznym testem integracyjnym,
  backupem, migracją i smoke testem.
- [x] Zachowywać poprzedni obraz i automatycznie cofać aplikację po błędzie smoke.
- [x] Naprawić ostrzeżenie nieobsługiwanej opcji `serverActions`.

### Kryteria zakończenia

- zmiana nie może trafić na główną gałąź bez zielonego pipeline;
- migracja jest wersjonowana i została sprawdzona na kopii bazy;
- zespół odtworzył bazę z backupu;
- wdrożenie i rollback wykonano na stagingu według runbooka;
- krytyczne procesy mają automatyczne testy.

## Etap 3 — obserwowalność i operacje

**Horyzont:** 2–3 tygodnie  
**Cel:** zespół dowiaduje się o problemie przed klientem i potrafi wskazać przyczynę.

### Zakres — P1

- [ ] Centralne logowanie strukturalne z identyfikatorem żądania.
- [ ] Monitoring błędów frontend/backend.
- [ ] Metryki aplikacji, bazy, kontenerów i integracji.
- [x] Endpoint health/readiness sprawdzający krytyczne zależności.
- [ ] Alerty: monitoring restartów, backupu, TLS i dysku działa; pozostało
  podłączenie odbiorcy oraz alertów błędów płatności i webhooków.
- [ ] Dashboard procesu: rezerwacja → checkout → płatność → potwierdzenie.
- [x] Ślad audytowy operacji administratora i wypłat; refundy oczekują na proces.
- [ ] Runbooki dla najczęstszych alarmów.
- [ ] Retencja i anonimizacja logów.

### Proponowane SLI

| Wskaźnik | Początkowy cel |
|---|---|
| dostępność aplikacji | 99,5% miesięcznie |
| odpowiedź stron/API p95 | poniżej 1 s, poza zewnętrznym checkoutem |
| skuteczne przetworzenie webhooka | co najmniej 99,9% |
| czas wykrycia P1 | poniżej 15 min |
| poprawny backup | codziennie |
| test restore | co najmniej kwartalnie |

Cele należy skorygować po zebraniu 4–6 tygodni danych.

### Kryteria zakończenia

- sztucznie wywołana awaria generuje właściwy alert;
- dla rezerwacji można odtworzyć chronologię bez odczytu danych wrażliwych;
- dashboard pokazuje różnicę między rezerwacjami i opłaconymi rezerwacjami;
- każdy alarm ma właściciela i runbook.

## Etap 4 — domknięcie produktu

**Horyzont:** 4–8 tygodni  
**Cel:** ograniczyć ręczną obsługę i zwiększyć zaufanie oraz konwersję.

Kolejność ustala produkt na podstawie danych, ale rekomendowane są:

### Operacje marketplace — P1/P2

- [ ] Pełny proces kaucji, zwrotów, anulowań i sporów.
- [ ] Automatyczne naliczanie wypłat właścicieli wdrożone; pozostało
  podłączenie prawnie zgodnego przelewu i automatyczne uzgadnianie bankowe.
- [x] Append-only historia działań administracyjnych z request ID i panelem.
- [ ] Moderacja ofert i dokumentów z kolejką oraz SLA.
- [x] Powiadomienia e-mail/SMS z trwałą kolejką, retry i stanem dostarczenia.
- [ ] Szablony wiadomości i wersjonowanie treści.

### Doświadczenie użytkownika — P2

- [ ] Poprawna dostępność terminów i stref czasowych.
- [ ] Wyszukiwanie po promieniu/geolokalizacji.
- [ ] Lepsze filtry, sortowanie i widok mapy.
- [ ] Transparentne rozbicie ceny przed checkoutem.
- [ ] Panel statusu rezerwacji z dozwolonymi akcjami.
- [x] Odzyskiwanie hasła przez jednorazowy link e-mail.
- [ ] Zarządzanie sesjami i usuwanie konta.
- [ ] Eksport danych użytkownika i realizacja żądań RODO.
- [ ] Responsywność, dostępność WCAG i podstawowe testy urządzeń.

### Zaufanie — P2

- [ ] Weryfikacja właściciela i dokumentów pojazdu.
- [ ] Polityka ubezpieczenia opisana zgodnie z rzeczywistą usługą.
- [ ] System zgłoszeń, sporów oraz blokowania nadużyć.
- [ ] Ochrona przed spamem, fałszywymi kontami i próbami wyłudzeń.

### Kryteria zakończenia

- cały cykl najmu, anulowania i refundu jest obsługiwany i audytowalny;
- operacje nie wymagają ręcznej edycji rekordów w bazie;
- użytkownik rozumie cenę, status oraz kolejną akcję;
- procesy ochrony danych można wykonać według udokumentowanej procedury.

## Etap 5 — wzrost i skalowanie

**Horyzont:** po uzyskaniu stabilnych danych produktowych  
**Cel:** inwestować dopiero w potwierdzone ograniczenia systemu lub rynku.

### P2/P3

- [ ] Analityka lejka z zachowaniem zgód i prywatności.
- [ ] SEO programatyczne dla lokalizacji i kategorii, bez thin content.
- [ ] Eksperymenty produktowe z wcześniej ustaloną metryką sukcesu.
- [ ] Wielojęzyczność i jawna strategia lokalizacji.
- [ ] Automatyzacja podatków, faktur i wymogów kolejnych krajów.
- [ ] Cache oraz optymalizacja zapytań na podstawie pomiarów.
- [ ] Oddzielenie workerów/kolejek dla powiadomień i zadań asynchronicznych.
- [ ] Skalowanie aplikacji i bazy dopiero po testach obciążeniowych.
- [ ] Aplikacja mobilna tylko po potwierdzeniu, że PWA/web ogranicza retencję.

Nie zaleca się wczesnego dzielenia monolitu na mikroserwisy. Obecna architektura
jest wystarczająca, dopóki pomiary nie pokażą problemu ze skalą lub autonomią zespołów.

## Backlog startowy

| ID | Zadanie | Priorytet | Etap | Zależność |
|---|---|---:|---:|---|
| SEC-01 | maszyna stanów rezerwacji i uprawnienia — ukończone 2026-07-31 | P0 | 1 | ADR 0001 |
| DB-01 | atomowe tworzenie rezerwacji — ukończone 2026-07-31 | P0 | 1 | ADR 0002 |
| DB-02 | ochrona przed podwójną rezerwacją — ukończone 2026-07-31 | P0 | 1 | ADR 0002, testowy PostgreSQL |
| PAY-01 | idempotentny checkout i webhook — skutki zabezpieczone, dziennik oczekuje | P0 | 1 | migracje Prisma |
| KYC-01 | prywatny storage dokumentów — kod gotowy, migracja starych danych oczekuje | P0 | 1 | konfiguracja bucketu, retencja |
| AUTH-01 | unieważnianie sesji i kontrola statusu — ukończone 2026-07-31 | P0 | 1 | kontrola bazodanowa |
| TEST-01 | testy logiki finansowej i statusów | P1 | 2 | SEC-01 |
| DB-03 | migracje Prisma | P1 | 2 | backup + kopia produkcji |
| OPS-01 | backup i próbne odtworzenie | P1 | 2 | właściciel operacyjny |
| CICD-01 | pipeline i staging | P1 | 2 | repozytorium Git |
| OBS-01 | logi, błędy i correlation ID | P1 | 3 | wybór narzędzia |
| OBS-02 | monitoring płatności i alerty | P1 | 3 | OBS-01 |
| PROD-01 | anulowania, refundy i spory | P1 | 4 | SEC-01, PAY-01 |
| PROD-02 | automatyzacja wypłat | P2 | 4 | uzgodnienie finansowe |
| UX-01 | odzyskiwanie hasła i sesje | P2 | 4 | AUTH-01 |
| DATA-01 | analityka lejka | P2 | 5 | polityka prywatności |

## Metryki prowadzące rozwój

### Biznesowe

- liczba aktywnych ofert;
- udział ofert kończących moderację;
- wyszukiwanie → szczegóły oferty;
- szczegóły → rozpoczęcie rezerwacji;
- rezerwacja → opłacenie;
- odsetek anulowań, refundów i sporów;
- czas do pierwszej rezerwacji właściciela;
- powracający klienci i właściciele.

### Techniczne

- błędy na 1000 żądań;
- p50/p95/p99 czasu odpowiedzi;
- błędy i opóźnienia webhooków;
- niespójności stanów płatność/rezerwacja;
- czas pipeline i częstotliwość wdrożeń;
- change failure rate i czas przywrócenia;
- wynik backupu oraz data ostatniego restore.

## Zarządzanie roadmapą

Roadmapę przeglądamy co dwa tygodnie. Postęp oceniamy na podstawie kryteriów
zakończenia, nie liczby napisanych funkcji. Każde przesunięcie P0 wymaga wpisania:

- właściciela decyzji;
- uzasadnienia;
- ryzyka pozostawionego w systemie;
- nowego terminu;
- działania ograniczającego ryzyko.

Plan jest kierunkiem, a nie zamrożonym harmonogramem. Kolejność etapów 0–3 należy
utrzymać; zakres etapów 4–5 powinien zmieniać się wraz z danymi produktowymi.
