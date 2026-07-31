# Dokumentacja techniczna Raspon

Ten katalog jest głównym źródłem wiedzy technicznej o projekcie. Dokumentacja ma
umożliwić przejęcie projektu przez nową osobę bez polegania na wiedzy ustnej.

## Od czego zacząć

1. [Onboarding](ONBOARDING.md) — uruchomienie projektu i pierwszy dzień pracy.
2. [Architektura](ARCHITECTURE.md) — komponenty, granice i przepływ danych.
3. [Domena i API](DOMAIN_AND_API.md) — role, modele i procesy biznesowe.
4. [Praca deweloperska](DEVELOPMENT.md) — zasady zmian i Definition of Done.
5. [Operacje](OPERATIONS.md) — wdrożenia, diagnostyka, backup i incydenty.
6. [Bezpieczeństwo](SECURITY.md) — sekrety, dane osobowe i znane ryzyka.
7. [Przekazanie projektu](HANDOVER.md) — checklista zmiany opiekuna.
8. [Plan rozwoju](ROADMAP.md) — etapy, priorytety i kryteria zakończenia.

## Źródła prawdy

| Obszar | Źródło prawdy |
|---|---|
| Model danych | `prisma/schema.prisma` |
| Kontrakty wejściowe API | `src/lib/validation.ts` i pliki `route.ts` |
| Logika rezerwacji | `src/server/services/bookingService.ts` |
| Autoryzacja | `src/lib/auth.ts` oraz kontrola w konkretnym endpointcie |
| Konfiguracja środowiska | `.env.example` |
| Zależności i polecenia | `package.json` |
| Obraz produkcyjny | `Dockerfile` |
| Topologia produkcyjna | `docker-compose.prod.yml` |
| Stan i ograniczenia projektu | niniejsza dokumentacja oraz kod |

Jeżeli dokumentacja i kod są sprzeczne, kod opisuje bieżące zachowanie, ale
sprzeczność należy naprawić w tym samym pull requeście.

## Właściciele wiedzy

Uzupełnić po ustanowieniu zespołu:

| Odpowiedzialność | Osoba / zespół | Zastępca |
|---|---|---|
| Produkt i reguły biznesowe | `DO UZUPEŁNIENIA` | `DO UZUPEŁNIENIA` |
| Aplikacja i baza danych | `DO UZUPEŁNIENIA` | `DO UZUPEŁNIENIA` |
| Produkcja i DNS | `DO UZUPEŁNIENIA` | `DO UZUPEŁNIENIA` |
| Płatności Revolut | `DO UZUPEŁNIENIA` | `DO UZUPEŁNIENIA` |
| Cloudflare R2 / dane KYC | `DO UZUPEŁNIENIA` | `DO UZUPEŁNIENIA` |

## Zasada aktualizacji

Zmiana architektury, zmiennej środowiskowej, procesu biznesowego, integracji lub
procedury wdrożenia musi aktualizować odpowiedni dokument. Duże decyzje zapisujemy
w `docs/adr/` na podstawie [szablonu ADR](adr/0000-template.md).
