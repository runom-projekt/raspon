# Raspon — platforma wynajmu przyczep

Marketplace do wynajmu przyczep zbudowany w Next.js 15, TypeScript, Tailwind CSS,
Prisma i PostgreSQL. Projekt zawiera publiczną wyszukiwarkę, rezerwacje, płatności
Revolut, panel właściciela, panel administratora, komunikację oraz CMS.

## Szybki start

Wymagane są Node.js 20, npm i Docker.

```powershell
npm.cmd ci
Copy-Item .env.example .env
docker compose up -d
npm.cmd run db:push
npm.cmd run db:seed
npm.cmd run dev
```

Aplikacja będzie dostępna pod `http://localhost:3000`.

Konta demonstracyjne mają hasło `Passwort123!`:

- `admin@raspon.de`;
- `vermieter@raspon.de`;
- `kunde@raspon.de`.

## Dokumentacja

Dokumentacja dla programistów i osób przejmujących projekt znajduje się w
[docs/README.md](docs/README.md).

- [onboarding](docs/ONBOARDING.md);
- [architektura](docs/ARCHITECTURE.md);
- [domena i API](docs/DOMAIN_AND_API.md);
- [proces deweloperski](docs/DEVELOPMENT.md);
- [operacje i wdrożenia](docs/OPERATIONS.md);
- [bezpieczeństwo i znane ryzyka](docs/SECURITY.md);
- [checklista przekazania projektu](docs/HANDOVER.md);
- [dalszy plan rozwoju](docs/ROADMAP.md).

## Kontrole jakości

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

## Ważny stan projektu

Projekt ma działający zakres MVP, ale przed obsługą prawdziwych płatności i
dokumentów tożsamości wymaga usunięcia ryzyk opisanych w
[dokumentacji bezpieczeństwa](docs/SECURITY.md). Obecnie nie posiada testów
automatycznych ani wersjonowanych migracji Prisma.

Sekretów nie umieszczamy w repozytorium. Pełna lista zmiennych i bezpieczne
wartości przykładowe znajdują się w `.env.example`.
