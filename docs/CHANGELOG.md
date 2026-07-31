# Dziennik zmian

Chronologiczny dziennik istotnych zmian produkcyjnych i incydentów. Dla stanu
zadań i priorytetów patrz [ROADMAP](ROADMAP.md); dla pełnej procedury
wdrożeniowej i incydentowej patrz [OPERATIONS](OPERATIONS.md).

## 2026-08-01 — pierwsze konto administratora, rola superadmina

- Dodano pole `User.isSuperAdmin` (migracja
  `20260801000500_user_super_admin_flag`) zamiast nowej wartości enuma
  `UserRole` — świadomy wybór, żeby nie trzeba było przeglądać i poprawiać
  ok. 40 miejsc w kodzie sprawdzających dziś `role === "ADMIN"`. Superadmin
  ma pełne uprawnienia zwykłego admina (bo nadal ma `role: "ADMIN"`) plus
  dodatkowo dostęp do zarządzania rolami innych użytkowników.
- Nowy endpoint `PATCH /api/admin/users/[id]/role` i selektor roli na
  `/admin/benutzer`, widoczny tylko dla superadmina — pozwala zmieniać rolę
  innych kont między `CUSTOMER`/`OWNER`/`ADMIN`. Zwykli admini nie mogą
  nadawać uprawnień admina innym kontom.
- `getSession()` czyta `isSuperAdmin` (tak jak `role` i `status`) świeżo z
  bazy przy każdym żądaniu — nadanie lub odebranie uprawnień superadmina
  działa natychmiast, bez konieczności ponownego logowania.
- Założono pierwsze konto administratora: `martimfirma@gmail.com`, rola
  `ADMIN` + `isSuperAdmin: true`, status `ACTIVE`, e-mail zweryfikowany.
  Hasło ustawione samodzielnie przez użytkownika (rejestracja + link
  resetu hasła) — nigdy nie było widoczne dla asystenta. Konto przejdzie
  obowiązkową konfigurację 2FA (TOTP) przy pierwszym logowaniu do panelu,
  zgodnie z istniejącą polityką dla roli `ADMIN`.
- Dodano `DELETE /api/admin/users/[id]` — twarde kasowanie konta, dostępne
  tylko dla superadmina (nie zwykłego admina, bo w przeciwieństwie do
  blokady jest nieodwracalne). Konto z jakąkolwiek historią (rezerwacje,
  przyczepy, recenzje, zgłoszenia, wypłaty, zwroty, wiadomości) **nie da
  się skasować** — żadna z tych relacji nie ma kaskadowego usuwania w
  schemacie, więc próba skasowania takiego konta kończy się czytelnym
  błędem 409 z sugestią zablokowania konta zamiast kasowania. Usuwane są
  tylko konta bez żadnej historii transakcyjnej.

### Incydent: superadmin zablokował sam siebie (2026-07-31, 22:30 CEST)

Przełącznik blokady/aktywacji w `/admin/benutzer` nie miał zabezpieczenia
przed użyciem na własnym koncie (w przeciwieństwie do zmiany roli i
kasowania, które już to miały). Jedyne istniejące konto administratora
kliknęło „Sperren" przy własnym wierszu i natychmiast straciło dostęp —
`getSession()` odrzuca konta ze statusem `SUSPENDED`. Naprawione ręcznie
przez bezpośrednie ustawienie `status: ACTIVE` w bazie przez Prisma
wewnątrz kontenera aplikacji (bez znajomości hasła). Przyczyna źródłowa
naprawiona w kodzie: przełącznik jest teraz ukryty na własnym wierszu, a
`PATCH /api/admin/users/[id]/status` odrzuca też próbę zmiany własnego
statusu po stronie API (commit `0eac81f`).

### Kafelki statystyk i menu mobilne w panelu admina/wynajmującego (2026-08-01)

- Kafelki na `/admin` (Plattformstatistiken) były zwykłymi `<div>` — nie
  dało się w nie kliknąć, trzeba było wchodzić przez rozwijane menu.
  `StatCard` obsługuje teraz opcjonalny `href` i każdy kafelek prowadzi
  bezpośrednio do swojej sekcji (Benutzer, Anhänger, Buchungen,
  Auszahlungen, Meldungen).
- Przycisk menu mobilnego (hamburger) w panelu admina i wynajmującego był
  po prawej stronie górnego paska, a panel wysuwał się z lewej — myląca
  niespójność. Przycisk przeniesiony na lewo, zgodnie z kierunkiem
  wysuwania panelu, w obu panelach (ten sam współdzielony wzorzec).

## 2026-07-31 (wieczór) — nawigacja mobilna, konto klienta, incydent wdrożeniowy

### Naprawione

- **Dolne menu mobilne nakładało się na panel wynajmującego/admina.** Próg
  ukrywania `MobileBottomNav` (`lg: 1024px`) nie zgadzał się z progiem
  przełączania `DashboardSidebar`/`AdminSidebar` na widok statyczny
  (`md: 768px`) — w tym zakresie szerokości obie nawigacje były widoczne
  naraz. `MobileBottomNav` chowa się teraz na `/dashboard/*` i `/admin/*`.
- **Karty rezerwacji na `/buchungen` przepełniały się w poziomie** na wąskich
  ekranach (cena i status nie miały jak się zawinąć), co ściągało w bok całą
  stronę razem z dolnym menu. Layout karty jest teraz responsywny: pionowy
  układ na mobile, poziomy od `sm:`.
- **Klient (rola bez OWNER/ADMIN) nie miał nigdzie przycisku wylogowania.**
  „Abmelden” istniało wyłącznie w `DashboardSidebar` i `AdminSidebar`. Dodano
  współdzielony `LogoutButton`, użyty w `Header` (desktop) i na `/buchungen`
  (jedyny ekran, na który prowadzi zakładka „Konto” dla zwykłego klienta).
- **Licznik nieprzeczytanych powiadomień przy „Konto” nie znikał** po
  oznaczeniu jako przeczytane — liczony po stronie serwera w layoucie, bez
  odświeżenia po akcji klienta. Dodano `router.refresh()` po każdej akcji w
  `NotificationCenter`.
- **Nie dało się skasować powiadomień**, tylko oznaczyć jako przeczytane.
  Dodano `DELETE /api/notifications` (pojedynczo i zbiorczo) oraz przyciski
  kasowania w UI.
- **Plakietka z licznikiem powiadomień nie prowadziła nigdzie.** Zakładka
  „Konto” na mobile linkuje do `/buchungen`, a jedyny link do
  `/benachrichtigungen` (dzwonek w `Header`) jest ukryty poniżej `lg:` —
  klient nie miał na telefonie żadnej drogi do listy powiadomień. Dodano
  widoczny link „Benachrichtigungen” z plakietką na `/buchungen`.
- **Przewijanie strony przestało działać na telefonie** po pierwszej próbie
  naprawy przepełnienia poziomego — `overflow-x: hidden` na `<html>` może
  blokować przewijanie dotykowe w niektórych przeglądarkach mobilnych, bo
  traktują ten element jako główny kontener scrolla. Ograniczono
  `overflow-x: hidden` wyłącznie do `<body>`.

### Incydent: zepsute skrypty operacyjne po wdrożeniu (2026-07-31, ok. 23:13–23:26 CEST)

**Przyczyna:** paczka wydania (`git archive`) do pierwszego z powyższych
wdrożeń została zbudowana na Windowsie. Bez wymuszonych atrybutów końca
linii Git zapisał skrypty powłoki w archiwum z CRLF zamiast LF, co złamało
ich shebang (`#!/usr/bin/env bash\r` → `env` szuka programu `bash\r`).

**Wpływ:** przez ok. 13 minut wszystkie zadania cykliczne na serwerze
kończyły się błędem (`exit 127`): `raspon-notification-worker` (powiadomienia
i **reset hasła** — użytkownik nie mógł się zalogować po wylogowaniu),
`raspon-monitor`, `raspon-booking-expiry`, `raspon-payment-reversal`. Backup
i restore-check nie miały uruchomienia w tym oknie.

**Działanie:** ręczne odpalenie kolejki powiadomień przez wewnętrzne API
(z pominięciem zepsutego skryptu) wysłało zaległy e-mail resetu hasła.
Końce linii we wszystkich 10 skryptów w `/opt/raspon/scripts` naprawiono
na miejscu (`sed -i 's/\r$//'`, za zgodą użytkownika — plik logiki nie
zmienił się, tylko znaki końca linii). Wszystkie usługi cykliczne
zweryfikowano jako ponownie zielone w `journalctl`.

**Zapobieganie:** dodano `.gitattributes` (`*.sh`, `Dockerfile`, `*.yml`,
`*.yaml` → `eol=lf`), wymuszające LF w `git archive` niezależnie od
lokalnego `core.autocrlf`. Zweryfikowano przed kolejnym wdrożeniem
(`file` na rozpakowanych skryptach z archiwum). Warte rozważenia w
przyszłości: krok weryfikacji końców linii wpisany na stałe do
`deploy-production.sh`, żeby nie zależał od pamięci osoby wdrażającej.

### Wdrożenia

| Release ID | Commit | Zakres |
| --- | --- | --- |
| `20260731-e337e38` | `e337e38` | dolne menu, wylogowanie, kasowanie powiadomień |
| `20260731-6b507f9` | `6b507f9` | przewijanie, link do powiadomień na `/buchungen` |

Commit `381f70a` (`.gitattributes`) nie wymagał osobnego wdrożenia — nie
zmienia zachowania aplikacji, tylko sposób budowania przyszłych archiwów.
