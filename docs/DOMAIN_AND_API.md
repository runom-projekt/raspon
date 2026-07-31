# Domena i API

## Role

| Rola | Przeznaczenie |
|---|---|
| `CUSTOMER` | wyszukiwanie, rezerwacje, płatności, wiadomości, recenzje |
| `OWNER` | funkcje klienta oraz zarządzanie własnymi ofertami i terminami |
| `ADMIN` | moderacja, CMS, użytkownicy, zgłoszenia i wypłaty |

Autoryzację należy sprawdzać w każdym endpointcie. Ukrycie przycisku lub redirect w
layoucie nie jest zabezpieczeniem API.

## Najważniejsze agregaty

- `User` — konto, rola, status, dane kontaktowe i weryfikacja;
- `Trailer` — oferta właściciela, ceny, lokalizacja, zdjęcia i blokady;
- `Booking` — okres najmu, snapshot ceny i status procesu;
- `Payment` — jedna płatność przypisana do jednej rezerwacji;
- `Conversation` — rozmowa stron, opcjonalnie związana z rezerwacją;
- `Review` — jedna recenzja na zakończoną rezerwację;
- `DiscountCode` — rabat i licznik użyć;
- `Payout` — rozliczenie właściciela;
- `BlogPost` i `Banner` — treści CMS.

Pełny model i ograniczenia relacyjne: `prisma/schema.prisma`.

## Przepływ rezerwacji

Aktualne zachowanie:

```text
wybór terminu
  -> POST /api/bookings
  -> Booking(PENDING) + Payment(REQUIRES_PAYMENT)
  -> POST /api/bookings/{id}/checkout
  -> checkout Revolut
  -> POST /api/webhooks/revolut
  -> Payment(PAID) + Booking(CONFIRMED)
  -> ACTIVE
  -> COMPLETED
  -> recenzja
```

Checkout przekazuje do Revolut identyfikator rekordu `Payment` jako klucz
idempotencji. Powtórne żądanie wykorzystuje istniejące zamówienie. Webhook:

- wymaga prawidłowego podpisu i timestampu mieszczącego się w 5 minutach;
- pobiera zamówienie z Revolut i porównuje kwotę, walutę oraz kod rezerwacji;
- aktualizuje stany warunkowo, więc duplikat nie ponawia powiadomienia;
- nie cofa `PAID` po spóźnionym zdarzeniu błędu.

Maszyna stanów jest egzekwowana zgodnie z `docs/adr/0001-booking-status-machine.md`.
Podział odpowiedzialności:

| Przejście | Aktor |
|---|---|
| utworzenie `PENDING` | klient |
| `PENDING → CONFIRMED` | wyłącznie potwierdzona płatność/system |
| `PENDING → DECLINED` | właściciel lub administrator |
| `CONFIRMED → ACTIVE` | właściciel po wydaniu |
| `ACTIVE → COMPLETED` | właściciel po zwrocie |
| `PENDING → CANCELLED` | klient lub administrator |

Anulowanie po płatności pozostaje niedostępne do czasu wdrożenia polityki
refundów i rozliczeń.

Tworzenie rezerwacji jest serializowane per przyczepa blokadą transakcyjną
PostgreSQL. Sprawdzenie kolizji, rezerwacja rabatu, zapis `Booking` i zapis
`Payment` wykonują się atomowo. Dodawanie blokady terminu właściciela korzysta
z tego samego mechanizmu. Szczegóły: `docs/adr/0002-trailer-schedule-locking.md`.

## Wyliczanie ceny

`bookingService.ts` pobiera aktualną cenę dzienną oferty, liczbę dni, opcjonalny
rabat, prowizję oraz kaucję. W rezerwacji zapisywany jest snapshot kwot. Zmiana
cennika oferty nie powinna zmieniać istniejącej rezerwacji.

Konieczne jest zachowanie `Decimal` aż do granicy API płatniczego. Konwersja na
liczbę i minor units następuje w adapterze Revolut.

## Grupy endpointów

| Prefiks | Zakres |
|---|---|
| `/api/auth` | rejestracja, logowanie, wylogowanie, e-mail i reset hasła |
| `/api/account` | dane konta i dokument tożsamości |
| `/api/trailers` | oferty, zdjęcia i zablokowane daty |
| `/api/bookings` | rezerwacje, status i checkout |
| `/api/conversations` | rozmowy i wiadomości |
| `/api/favorites` | ulubione oferty |
| `/api/reviews` | recenzje zakończonych wynajmów |
| `/api/payouts` | wypłaty właściciela |
| `/api/uploads` | podpisane adresy uploadu R2 |
| `/api/webhooks` | zdarzenia systemów zewnętrznych |
| `/api/admin` | operacje administracyjne i CMS |

## Konwencje odpowiedzi

Endpointy zwracają JSON. Błędy mają zwykle postać:

```json
{ "error": "Czytelny komunikat" }
```

Dla błędów Zod część endpointów dodaje `issues`. Nie istnieje jeszcze jednolity
typ błędu ani wersjonowanie API. Przy zmianie istniejącej odpowiedzi należy
sprawdzić wszystkich konsumentów w komponentach.

Typowe statusy:

- `400` — niepoprawne dane lub niedozwolona operacja;
- `401` — brak sesji;
- `403` — brak uprawnienia;
- `404` — zasób nie istnieje albo nie należy do użytkownika;
- `409` — konflikt biznesowy;
- `429` — limit żądań;
- `500/503` — błąd serwera albo nieskonfigurowana integracja.

## Reset hasła

1. `POST /api/auth/forgot-password` przyjmuje adres e-mail.
2. Odpowiedź jest zawsze neutralna i nie potwierdza istnienia konta.
3. Jeśli konto istnieje i Resend jest skonfigurowany, poprzednie tokeny są usuwane,
   a użytkownik otrzymuje jednorazowy link ważny godzinę.
4. W bazie przechowywany jest wyłącznie hash tokenu.
5. `POST /api/auth/reset-password` ustawia nowe hasło, usuwa wszystkie tokeny resetu
   użytkownika i unieważnia rekordy refresh tokenów.

Formularze znajdują się pod `/passwort-vergessen` i
`/passwort-zuruecksetzen?token=...`. Funkcja wysyłki wymaga `RESEND_API_KEY` oraz
`RESEND_FROM_EMAIL`.

## Inwarianty do ochrony

- nie mogą istnieć nakładające się aktywne rezerwacje tej samej przyczepy;
- płatność `PAID` musi odpowiadać właściwemu zamówieniu i kwocie;
- użytkownik nie może zmieniać cudzej oferty lub rozmowy;
- tylko ukończona rezerwacja może otrzymać jedną recenzję;
- licznik wykorzystania rabatu nie może przekroczyć limitu;
- status i kwoty rezerwacji muszą zmieniać się atomowo;
- dane prywatne nie mogą być wystawiane w publicznym API ani publicznym storage.
