# Onboarding programisty

## Cel pierwszego dnia

Nowa osoba powinna:

- uruchomić bazę i aplikację lokalnie;
- zalogować się trzema rolami testowymi;
- przejść przepływ: wystawienie przyczepy → rezerwacja → płatność w sandboxie;
- odnaleźć kod odpowiedzialny za każdą część przepływu;
- uruchomić wszystkie dostępne kontrole jakości.

## Wymagania

- Node.js 20;
- npm zgodny z `package-lock.json`;
- Docker z Compose;
- Git;
- dostęp do repozytorium;
- opcjonalnie dostęp do sandboxów Revolut, Cloudflare R2, Resend i MessageBird;
- dla KYC osobny prywatny bucket R2 skonfigurowany przez `R2_PRIVATE_BUCKET_NAME`.

Na Windows, jeżeli polityka PowerShell blokuje `npm.ps1`, używaj `npm.cmd`.

## Uruchomienie lokalne

```powershell
npm.cmd ci
Copy-Item .env.example .env
docker compose up -d
npm.cmd run db:push
npm.cmd run db:seed
npm.cmd run dev
```

Aplikacja: `http://localhost:3000`. PostgreSQL: `localhost:5432`.

Konta seedujące:

| Rola | Login | Hasło |
|---|---|---|
| administrator | `admin@raspon.de` | `Passwort123!` |
| właściciel | `vermieter@raspon.de` | `Passwort123!` |
| klient | `kunde@raspon.de` | `Passwort123!` |

Te dane są wyłącznie deweloperskie. Seedowania nie wolno uruchamiać na produkcji
bez świadomej decyzji administratora.

## Minimalna konfiguracja `.env`

Do podstawowej pracy wystarczą:

```dotenv
DATABASE_URL="postgresql://raspon:raspon@localhost:5432/raspon?schema=public"
JWT_SECRET="lokalny-losowy-sekret-o-dlugosci-minimum-32-znakow"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Pozostałe integracje mogą pozostać puste. Nigdy nie kopiuj sekretów produkcyjnych
do lokalnego `.env`, komunikatora, zgłoszenia ani dokumentacji.

## Kontrole przed rozpoczęciem pracy

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Build może wypisać błędy połączenia z bazą, jeśli PostgreSQL nie działa. Obecnie
część stron przechwytuje te błędy, dlatego sam kod zakończenia `0` nie gwarantuje
sprawnego połączenia z bazą.

## Mapa katalogów

```text
src/app/                 strony i endpointy Next.js App Router
src/components/          komponenty interfejsu według obszaru
src/lib/                 współdzielone adaptery, auth, walidacja i narzędzia
src/server/services/     logika aplikacyjna wykonywana po stronie serwera
src/types/               współdzielone typy TypeScript
prisma/schema.prisma     model relacyjny
prisma/seed.ts           dane demonstracyjne
public/                  zasoby statyczne i manifest PWA
scripts/                 narzędzia pomocnicze
```

## Pierwsze zadanie próbne

Zalecane zadanie onboardingowe: dodać małą, nieszkodliwą walidację lub opis pola,
razem z testem. Pozwala to przejść pełny cykl zmiany bez dotykania płatności,
autoryzacji albo danych osobowych.

## Dostępy do uzyskania

Lista zależy od roli i zasady najmniejszych uprawnień:

- repozytorium i system zadań;
- podgląd logów produkcyjnych;
- dostęp SSH przez indywidualny klucz;
- panel Contabo;
- DNS i Cloudflare R2;
- Revolut Business/Merchant;
- Resend oraz MessageBird;
- miejsce przechowywania sekretów i backupów.

Każdy dostęp powinien być indywidualny, odwoływalny i odnotowany. Nie przekazujemy
prywatnych kluczy SSH poprzedniego pracownika.
