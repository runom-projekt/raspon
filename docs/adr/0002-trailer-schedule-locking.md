# ADR 0002: serializacja zapisów kalendarza przyczepy

- Status: zaakceptowana
- Data: 2026-07-31

## Kontekst

Sprawdzenie dostępności i utworzenie rezerwacji były osobnymi operacjami.
Dwa równoległe żądania mogły więc oba zobaczyć wolny termin, a następnie utworzyć
nakładające się rezerwacje. Podobny wyścig był możliwy między rezerwacją klienta
i blokadą terminu dodawaną przez właściciela.

## Decyzja

Każda operacja zapisująca kalendarz przyczepy:

1. rozpoczyna transakcję PostgreSQL;
2. pobiera transakcyjną blokadę doradczą wyliczoną z identyfikatora przyczepy;
3. pod blokadą ponownie sprawdza kolizje;
4. wykonuje wszystkie powiązane zapisy;
5. zwalnia blokadę przez commit albo rollback.

Utworzenie `Booking`, powiązanego `Payment` oraz zwiększenie licznika kodu
rabatowego stanowią jedną transakcję. Rezerwacja limitowanego kodu korzysta
z warunkowego `UPDATE`, dlatego licznik nie może przekroczyć `maxUses`.

Blokada obejmuje wyłącznie operacje na jednej przyczepie. Różne przyczepy mogą
być rezerwowane równolegle.

## Konsekwencje

- rozwiązanie świadomie zależy od PostgreSQL;
- każda przyszła ścieżka zapisująca `Booking` lub `BlockedDate` musi korzystać
  z `lockTrailerSchedule`;
- awaria dowolnego zapisu cofa rezerwację, płatność i użycie rabatu;
- test integracyjny wymaga dwóch niezależnych połączeń z testowym PostgreSQL;
- przed pełnym zamknięciem `DB-02` należy uruchomić taki test w CI.

