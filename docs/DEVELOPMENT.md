# Praca deweloperska

## Standardowy cykl zmiany

1. Zapisz cel i kryteria akceptacji w zadaniu.
2. Zidentyfikuj dotknięte inwarianty domenowe i dane osobowe.
3. Dla dużej decyzji dodaj ADR.
4. Zmień kod i dokumentację.
5. Dodaj lub zaktualizuj testy.
6. Uruchom kontrole jakości.
7. Poproś inną osobę o review.
8. Wdróż zgodnie z runbookiem i sprawdź kluczowy scenariusz.

## Polecenia

| Polecenie | Cel |
|---|---|
| `npm run dev` | serwer deweloperski |
| `npm run typecheck` | kontrola typów |
| `npm run lint` | lint |
| `npm run build` | produkcyjny build |
| `npm run db:push` | synchronizacja schematu bez historii |
| `npm run db:seed` | dane demo |
| `npm run db:studio` | podgląd danych |

Na Windows można zamienić `npm` na `npm.cmd`.

## Definition of Done

- kryteria akceptacji są spełnione;
- typy, lint i build przechodzą;
- są testy dla nowej logiki lub w zadaniu zapisano powód ich braku;
- autoryzacja jest sprawdzona po stronie serwera;
- wejście jest walidowane;
- operacje wielozapisowe są atomowe;
- logi nie ujawniają sekretów ani danych osobowych;
- dokumentacja i `.env.example` są aktualne;
- istnieje plan wdrożenia i cofnięcia;
- reviewer nie jest autorem zmiany dotyczącej płatności, auth lub KYC.

## Zasady kodu

- TypeScript pozostaje w trybie `strict`.
- Używaj aliasu `@/` dla modułów z `src`.
- Schematy wejściowe trzymaj w `src/lib/validation.ts` lub blisko endpointu.
- Nie ufaj identyfikatorom właściciela ani kwotom przesłanym przez klienta.
- Używaj `prisma.$transaction` dla jednego procesu biznesowego obejmującego wiele
  zapisów.
- Nie używaj `number` do trwałego liczenia pieniędzy; korzystaj z `Decimal`.
- Błędy dla klienta powinny być ogólne, a szczegóły trafiać do bezpiecznego logu.
- Nie wykonuj wysyłki sieciowej wewnątrz długiej transakcji bazodanowej.
- Nowe zależności wymagają uzasadnienia, kontroli licencji i podatności.

## Testy

Projekt obecnie nie ma skonfigurowanego frameworka testowego. Jest to priorytetowy
dług techniczny. Zalecany podział:

- testy jednostkowe: wycena, rabaty, przejścia statusów, walidacja;
- testy integracyjne z PostgreSQL: kolizje rezerwacji, transakcje, uprawnienia;
- testy Route Handlers: statusy HTTP i kontrakty JSON;
- E2E: rejestracja, publikacja oferty, booking i sandbox płatności;
- test webhooka: podpis, replay, idempotencja i powtórna dostawa.

Żaden test płatniczy nie powinien korzystać z produkcyjnego konta.

## Zmiany bazy

Projekt posiada wersjonowane migracje w `prisma/migrations`, a produkcyjne
wdrożenie używa `prisma migrate deploy`.

Docelowo:

1. utworzyć kontrolowaną migrację bazową odpowiadającą produkcji;
2. przetestować ją na kopii bazy;
3. wdrażać przez `prisma migrate deploy`;
4. przestać używać `db push` na produkcji;
5. dla zmian destrukcyjnych stosować expand/migrate/contract.

Do czasu wdrożenia tej strategii każda zmiana schematu wymaga backupu, porównania
planowanej zmiany i ręcznego potwierdzenia osoby odpowiedzialnej za bazę.

## Pull request

Opis PR powinien zawierać:

```text
Cel:
Zakres:
Zmiana zachowania / API / danych:
Ryzyka:
Testy:
Migracja danych:
Plan wdrożenia:
Plan cofnięcia:
Dokumentacja:
```

## Aktualizacja dokumentacji

- nowa zmienna → `.env.example`, `ONBOARDING.md` i ewentualnie `OPERATIONS.md`;
- nowy endpoint/proces → `DOMAIN_AND_API.md`;
- nowa integracja/topologia → `ARCHITECTURE.md` i `OPERATIONS.md`;
- nowy dostęp lub dane wrażliwe → `SECURITY.md` i `HANDOVER.md`;
- istotna decyzja → ADR.
