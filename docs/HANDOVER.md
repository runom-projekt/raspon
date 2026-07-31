# Przekazanie projektu i zmiana pracownika

Checklistę wykonują wspólnie osoba przekazująca, przejmująca i właściciel biznesowy.
Samo przekazanie haseł nie jest przekazaniem projektu.

## Wiedza

- [ ] Osoba przejmująca uruchomiła projekt od zera według `ONBOARDING.md`.
- [ ] Przeszła główny przepływ trzema rolami.
- [ ] Potrafi wskazać kod auth, rezerwacji, płatności, storage i powiadomień.
- [ ] Zna znane ryzyka z `SECURITY.md`.
- [ ] Zna bieżące zadania, terminy i niedokończone wdrożenia.
- [ ] Otrzymała historię ostatnich incydentów i decyzji ADR.
- [ ] Dokumentacja została poprawiona w miejscach wymagających wiedzy ustnej.

## Kod i wydania

- [ ] Repozytorium ma aktualną główną gałąź i brak nieprzekazanych zmian lokalnych.
- [ ] Wiadomo, jaka wersja/commit działa na produkcji.
- [ ] Znany jest proces review, wdrożenia i rollbacku.
- [ ] Znane są planowane zmiany schematu i kompatybilność wersji.
- [ ] Kontrole jakości zostały uruchomione i ich wynik zapisany.

## Infrastruktura

- [ ] Zweryfikowano dostęp do VPS bez współdzielenia prywatnego klucza.
- [ ] Zweryfikowano nginx, Docker Compose, certyfikat i odnowienie TLS.
- [ ] Zweryfikowano lokalizację logów i sposób diagnostyki.
- [ ] Zweryfikowano backup i wykonano lub wskazano ostatni test restore.
- [ ] Zweryfikowano monitoring, alerty oraz osoby powiadamiane.
- [ ] Znane są RPO, RTO i procedura incydentu.

## Usługi zewnętrzne

- [ ] Contabo.
- [ ] DNS/domena.
- [ ] Cloudflare R2.
- [ ] Revolut Business/Merchant i sandbox.
- [ ] Resend.
- [ ] MessageBird.
- [ ] System przechowywania sekretów.
- [ ] System zadań i kanały operacyjne.

Każda usługa powinna mieć co najmniej dwóch uprawnionych opiekunów i odzyskiwanie
kontrolowane przez firmę, nie prywatny adres pracownika.

## Offboarding osoby odchodzącej

- [ ] Usunięto jej klucz z `authorized_keys`.
- [ ] Odebrano dostęp do repozytorium, VPS, paneli i systemu zadań.
- [ ] Unieważniono aktywne sesje administracyjne.
- [ ] Zrotowano sekrety, do których miała bezpośredni dostęp.
- [ ] Sprawdzono osobiste tokeny API i klucze deploy.
- [ ] Przeniesiono własność kont, webhooków i alertów.
- [ ] Zabezpieczono służbowe urządzenia i kopie danych.
- [ ] Odnotowano datę oraz osobę wykonującą każdy krok.

Nie rotuj wszystkich sekretów bez planu kolejności: może to przerwać produkcję.
Najpierw przygotuj nowe wartości, następnie wdrożenie, weryfikację i unieważnienie
starych danych.

## Protokół przekazania

```text
Data:
Osoba przekazująca:
Osoba przejmująca:
Właściciel zatwierdzający:
Wersja produkcyjna:
Otwarte incydenty:
Otwarte migracje:
Najważniejsze ryzyka:
Brakujące dostępy:
Data następnego przeglądu:
```

