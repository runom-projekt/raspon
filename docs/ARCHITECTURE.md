# Architektura

## Kontekst

Raspon jest monolitem Next.js obsługującym publiczny marketplace, panele klienta,
właściciela i administratora oraz API. Dane trzyma w PostgreSQL przez Prisma.
Pliki są wysyłane bezpośrednio z przeglądarki do Cloudflare R2. Płatności obsługuje
Revolut Merchant API.

```text
Przeglądarka
    |
    v
nginx / HTTPS
    |
    v
Next.js 15 (UI + Route Handlers + usługi)
    |             |              |             |
    v             v              v             v
PostgreSQL     Revolut       Cloudflare R2   Resend/MessageBird
```

Na produkcji nginx działa na hoście, a aplikacja i PostgreSQL w Docker Compose.
Port aplikacji jest wystawiony tylko na `127.0.0.1:3000`.

## Warstwy

### Prezentacja

`src/app/**/page.tsx` i `src/components/` odpowiadają za renderowanie. App Router
łączy Server Components i Client Components. Dostęp do paneli jest kontrolowany w
layoutach, ale ochrona UI nie zastępuje kontroli w endpointach API.

### API

`src/app/api/**/route.ts` udostępnia JSON API. Typowy endpoint:

1. pobiera sesję przez `getSession()`;
2. sprawdza rolę lub własność zasobu;
3. parsuje JSON;
4. waliduje Zod;
5. wykonuje operację Prisma lub wywołuje usługę;
6. zwraca `NextResponse.json`.

Nie istnieje centralny middleware autoryzacyjny ani wygenerowana specyfikacja
OpenAPI. Kontraktem jest kod endpointu i schemat Zod.

### Logika aplikacyjna

- `bookingService.ts` — wycena, kolizje terminów i utworzenie rezerwacji;
- `trailerService.ts` — wyszukiwanie i prezentacja ofert;
- `notificationService.ts` — zapis powiadomień i adapter SMS.

Nową logikę obejmującą kilka endpointów lub operacji bazodanowych należy umieszczać
w usłudze, a nie kopiować do handlerów.

### Dane

Prisma Client jest współdzielony przez `src/lib/prisma.ts`. Schemat zawiera dane
użytkowników, oferty, rezerwacje, płatności, komunikację, recenzje i CMS.

Projekt obecnie używa `prisma db push` i nie posiada historii migracji. Jest to
znany dług techniczny; plan przejścia opisano w [DEVELOPMENT.md](DEVELOPMENT.md).

### Integracje

| Integracja | Adapter | Tryb awarii |
|---|---|---|
| Revolut | `src/lib/revolut.ts` | checkout zwraca błąd; webhook aktualizuje płatność |
| Cloudflare R2 | `src/lib/storage.ts` | presign zwraca 503 |
| Resend | `src/lib/email.ts` | rejestracja działa, e-mail może nie zostać wysłany |
| MessageBird | `src/lib/sms/` | SMS jest pomijany lub błąd jest logowany |
| Mapy | komponenty trailer/home | fallback na OpenStreetMap |

## Uwierzytelnianie

- cookie `raspon_session`;
- podpisany JWT HS256;
- ważność 7 dni;
- `HttpOnly`, `SameSite=Lax`, `Secure` na produkcji;
- role: `CUSTOMER`, `OWNER`, `ADMIN`.

JWT przechowuje rolę jako snapshot, ale `getSession()` przy każdym uwierzytelnionym
żądaniu pobiera bieżący status i rolę z bazy. Usunięte lub zawieszone konto traci
dostęp natychmiast, a zmiana roli obowiązuje bez ponownego logowania.

## Zasady zależności

- komponent klienta nie importuje Prisma ani modułów oznaczonych `server-only`;
- endpoint waliduje wszystkie dane wejściowe;
- kontrola dostępu odbywa się po stronie serwera;
- kod domenowy nie zależy od komponentów React;
- adapter dostawcy zewnętrznego pozostaje w `src/lib/`;
- kwoty przechowywane są jako Prisma `Decimal`, nie `float`;
- daty w bazie są instancjami `Date`; interfejs powinien jawnie uwzględniać strefę.

## Decyzje architektoniczne

Istotne decyzje zapisujemy jako ADR. Pierwsze rekordy powinny objąć:

1. strategię migracji Prisma;
2. maszynę stanów rezerwacji;
3. prywatne przechowywanie KYC;
4. strategię sesji i unieważniania tokenów;
5. ochronę przed równoległymi rezerwacjami.
