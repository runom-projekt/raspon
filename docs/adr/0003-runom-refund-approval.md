# ADR 0003: ocena ryzyka refundu opłaconej rezerwacji przez RUNOM

- Status: zaakceptowana
- Data: 2026-08-01
- Autorzy: integracja RUNOM ↔ Raspon (projekt RUNOM, ADR-0029)
- Osoby zatwierdzające: Product Owner

## Kontekst

ADR-0001 (`0001-booking-status-machine.md`) stwierdza wprost: "Anulowanie potwierdzonej rezerwacji pozostaje zablokowane do czasu zatwierdzenia polityki refundów, opłat za anulowanie i rozliczenia właściciela." `docs/ROADMAP.md`, Etap 1, ma to jako jedyny nieodhaczony punkt sekcji "Rezerwacje i płatności — P0": "Dodać politykę anulowania, refundów, kaucji i sporów".

W praktyce `decideRenterCancellation` (`src/server/domain/bookingCancellation.ts`) i `cancelBookingByRenter` (`src/server/services/bookingCancellationService.ts`) JUŻ dopuszczały anulowanie rezerwacji `CONFIRMED`+`PAID` i tworzyły `PaymentReversal` (`FULL_REFUND`) **bezwarunkowo, bez żadnej bramki zatwierdzenia, niezależnie od kwoty czy terminu do odbioru** — kod nie odzwierciedlał polityki zapisanej w ADR-0001. Silnik wykonawczy refundu (`paymentReversalService.ts`: kolejkowanie, retry z backoffem, wywołanie bramki płatniczej, powiadomienia) jest dojrzały i poprawny — brakowało wyłącznie warstwy decyzyjnej "czy WOLNO to zrobić automatycznie".

RUNOM (projekt osobny, `C:\Users\verim\Projects\runom`) ma dokładnie taką warstwę: Task Orchestrator (maszyna stanów) + Approval Engine (próg ryzyka, auto-akceptacja poniżej progu, blokada + zatwierdzenie administratora powyżej) — zweryfikowane end-to-end na jego własnym środowisku (RUNOM ADR-0026/ADR-0027). RUNOM-011 (backlog RUNOM) już rozstrzygnął, że Raspon jest zewnętrznym konsumentem tego systemu, nie modułem wewnątrz RUNOM.

## Rozważane opcje

### Opcja A — zbudować własną politykę refundów w Raspon (progi, role zatwierdzające, kolejka decyzji)

Duplikuje funkcjonalność, którą RUNOM już dostarcza i ma zweryfikowaną. Wymaga nowego modelu danych (kolejka zatwierdzeń, role), nowego UI administracyjnego, własnych testów całego cyklu. Największy koszt, zero reużycia.

### Opcja B — delegować ocenę ryzyka do RUNOM przez REST, polling zamiast webhooków

RUNOM już eksponuje `POST /internal/tasks`, `POST /internal/tasks/:id/transition`, `POST /internal/tasks/:id/request-approval`, `POST /internal/tasks/:id/approve|reject`, `GET /internal/tasks/:id` — wszystko zweryfikowane na jego środowisku. Raspon rejestruje się jako pojedynczy agent RUNOM (już zrobione po stronie RUNOM: `agent.role='external_integration'`). Zero webhooków (RUNOM nie ma dziś wychodzących powiadomień) — worker uzgadniający w Raspon (analogiczny do istniejącego `payment-reversals/process`) odpytuje RUNOM o stan zadania.

### Opcja C — nie zmieniać nic, zostawić bezwarunkowy auto-refund

Odrzucone od razu: to jest dokładnie ryzyko, które ADR-0001 już nazwało i które ROADMAP.md oznacza jako otwarty punkt P0.

## Decyzja

Opcja B. WYŁĄCZNIE ścieżka `CONFIRMED`+`PAID` (`decision.reversal === "FULL_REFUND"`) przechodzi przez RUNOM — anulowanie nieopłaconej rezerwacji (`NONE`/`CANCEL_ORDER`) działa dokładnie jak dotąd, bez zmian, zero ryzyka regresji dla najczęstszej ścieżki (rezygnacja przed płatnością).

`riskScore` liczony liniowo z kwoty refundu względem konfigurowalnego progu (`RUNOM_REFUND_AUTO_APPROVE_MAX_EUR`, domyślnie 200 EUR) — poniżej połowy progu RUNOM auto-akceptuje, od progu wzwyż wymaga zatwierdzenia administratora zalogowanego jako użytkownik RUNOM (REST, poza Raspon).

**Bez skonfigurowanego RUNOM ścieżka `CONFIRMED`+`PAID` jest ZABLOKOWANA (HTTP 503), nie cicho dozwolona** — to świadome zaostrzenie względem poprzedniego stanu kodu, przywracające literę ADR-0001. Jeśli wywołanie RUNOM się nie powiedzie (sieć, błąd), refund NIE jest cicho dopuszczany — administrator musi rozwiązać problem dostępności.

## Konsekwencje

- Nowe, nullable pole `Booking.pendingCancellationTaskId` (wersjonowana migracja Prisma `20260801180000_pending_cancellation_task_id`, zero danych do migracji, wszystkie istniejące wiersze dostają `NULL`).
- Nowy klient `src/lib/runom.ts` (fetch z timeoutem 10s, ten sam wzorzec co `src/lib/paymentGateway.ts`).
- `cancelBookingByRenter` zwraca teraz `{ outcome: "cancelled" | "pending_review", ... }` zamiast bezpośrednio `PaymentReversal | null` — **breaking change sygnatury**, zaktualizowano jedynego wywołującego (`/api/bookings/[id]/cancel`, zwraca teraz `202` z `pendingReview: true` dla przypadku oczekującego) oraz test integracyjny koncurrencji (`bookingService.integration.test.ts`, teraz uruchamia lokalny serwer zastępczy RUNOM na czas testu zamiast pomijać tę ścieżkę).
- Nowy worker `POST /api/internal/runom-reconcile` (ten sam wzorzec sekretu co `/api/internal/payment-reversals/process`) — odpytuje RUNOM dla każdej rezerwacji z niepustym `pendingCancellationTaskId`, finalizuje zatwierdzone (wykonuje anulowanie + kolejkuje `PaymentReversal`, dokładnie ta sama transakcja co dotychczasowa ścieżka natychmiastowa) lub odrzucone (czyści oczekiwanie, rezerwacja ZOSTAJE `CONFIRMED`, renter dostaje powiadomienie o odmowie).
- **Wymaga cron/systemd wywołującego `runom-reconcile` okresowo** (analogicznie do istniejącego workera `payment-reversals/process`) — poza zakresem tego ADR, wdrożenie operacyjne osobnym krokiem, zanim ścieżka "wymaga zatwierdzenia" faktycznie się finalizuje w rozsądnym czasie.
- Nowe zmienne środowiskowe: `RUNOM_API_URL`, `RUNOM_AGENT_ID`, `RUNOM_AGENT_TOKEN`, `RUNOM_OWNER_USER_ID`, `RUNOM_REFUND_AUTO_APPROVE_MAX_EUR` (`.env.example` zaktualizowany).
- RUNOM nigdy nie widzi danych płatniczych/KYC — wyłącznie `bookingId`/`bookingCode`/kwotę/walutę jako treść zadania.

## Plan wdrożenia i wycofania

1. `prisma migrate deploy` na środowisku docelowym (aplikuje `20260801180000_pending_cancellation_task_id` — dodaje wyłącznie nullable kolumnę i indeks, bezpieczne, odwracalne ręcznym `ALTER TABLE ... DROP COLUMN`).
2. Ustawić zmienne `RUNOM_*` w `.env` produkcyjnym (agent RUNOM już zarejestrowany po stronie RUNOM, token przekazany poza repozytorium).
3. Skonfigurować worker cron/systemd wywołujący `POST /api/internal/runom-reconcile` z `X-Worker-Secret` (ten sam sekret co `NOTIFICATION_WORKER_SECRET`), interwał do ustalenia operacyjnie (proponowane: co 60s, dopóki nie pojawi się realna potrzeba szybszej reakcji).
4. Obserwowalność: `auditLog` (`BOOKING_CANCELLATION_AWAITING_APPROVAL`, `BOOKING_CANCELLATION_DECLINED`) + istniejące `BOOKING_CANCELLED_BY_RENTER`.
5. **Kryterium sukcesu**: żadna rezerwacja `CONFIRMED`+`PAID` nie otrzymuje refundu bez przejścia przez ocenę ryzyka; kwoty poniżej progu nadal anulują się natychmiast (brak regresji UX dla typowego przypadku).
6. **Wycofanie**: usunąć wywołanie RUNOM z `cancelBookingByRenter` (przywrócić poprzednią, bezwarunkową gałąź) — pole `pendingCancellationTaskId` może zostać w schemacie nieużywane, bez ryzyka. **Uwaga**: wycofanie przywraca bezwarunkowy auto-refund nazwany w tym ADR jako ryzyko — wymaga świadomej decyzji, nie automatycznego rollbacku.
