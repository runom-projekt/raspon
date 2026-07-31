# Operacje i produkcja

## Topologia

- domena: `https://raspon.de`;
- VPS: Contabo, Ubuntu 24.04;
- katalog aplikacji: `/opt/raspon`;
- nginx na hoście kończy TLS i proxy do `127.0.0.1:3000`;
- kontenery: `app`, `postgres` oraz profil narzędziowy `migrate`/`seed`;
- dane PostgreSQL: wolumin `raspon_postgres_data`;
- certyfikat: Let's Encrypt odnawiany przez `certbot.timer`.

Adresy IP, nazwy hostów i ścieżki mogą się zmienić. Ich aktualny rejestr powinien
znajdować się w bezpiecznym systemie operacyjnym, a nie służyć jako sekret.

## Zasady dostępu

- SSH wyłącznie indywidualnym kluczem;
- logowanie hasłem wyłączone;
- sekrety produkcyjne w `/opt/raspon/.env` z prawami `600`;
- odejście pracownika wymaga usunięcia jego klucza i sesji w usługach;
- nie kopiujemy całego produkcyjnego `.env` do celów diagnostycznych.

## Procedura wdrożenia

Przed wdrożeniem:

1. review i zielone kontrole jakości;
2. backup, jeżeli zmienia się schemat lub proces płatniczy;
3. zapis wersji/commita wdrażanego artefaktu;
4. plan cofnięcia;
5. potwierdzenie okna wdrożenia dla zmian ryzykownych.

Produkcja używa jednego skryptu wdrożeniowego. Przyjmuje identyfikator wydania
oraz archiwum znajdujące się w `/opt/raspon/releases`:

```bash
/opt/raspon/scripts/deploy-production.sh RELEASE_ID \
  /opt/raspon/releases/ARCHIVE.tar.gz
```

Skrypt blokuje równoległe wdrożenia, odrzuca niebezpieczne ścieżki archiwum,
zapisuje SHA-256, uruchamia migracje i testy konkurencyjności na izolowanym
PostgreSQL, wykonuje zweryfikowany backup, buduje identyfikowalne obrazy
`candidate`, zachowuje poprzedni obraz `rollback`, stosuje `prisma migrate
deploy`, przełącza aplikację i wykonuje smoke test HTTPS wraz z bazą. Jeśli
smoke test nie przejdzie, aplikacja automatycznie wraca do poprzedniego obrazu.
Migracji bazy skrypt nie cofa — wymagają kompatybilnego forward-fix.

Stan ostatniego wdrożenia znajduje się w
`/var/lib/raspon-ops/deploy-status.json`.

Zmienne `NEXT_PUBLIC_*` oraz `R2_PUBLIC_URL` używane przez konfigurację obrazów są
ustalane podczas builda. Ich zmiana wymaga przebudowania obrazu.

## Kontrola po wdrożeniu

- kontenery są zdrowe i nie restartują się;
- strona główna zwraca poprawną odpowiedź HTTPS;
- logowanie działa;
- wyszukiwarka zwraca oferty;
- panel właściciela jest dostępny tylko właściwej roli;
- połączenie z bazą działa bez błędów Prisma;
- dla zmian płatniczych wykonano scenariusz sandbox, nie produkcyjną płatność;
- logi nie zawierają nowych powtarzających się błędów.

Przykładowe polecenia diagnostyczne:

```bash
docker compose -f docker-compose.prod.yml --env-file .env ps
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=200 app
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=200 postgres
curl -I https://raspon.de
```

## Cofnięcie

Każde automatyczne wdrożenie zachowuje poprzedni obraz i archiwum źródeł
oznaczone identyfikatorem wydania.

Jeżeli zmiana objęła bazę:

- nie cofaj kodu bez sprawdzenia zgodności ze schematem;
- nie wykonuj destrukcyjnych poleceń Prisma;
- przywrócenie backupu jest ostatecznością i wymaga oceny utraty nowych danych;
- preferuj poprawkę forward-fix lub kompatybilną migrację naprawczą.

## Backup i odtwarzanie

PostgreSQL jest kopiowany codziennie przez `raspon-backup.timer` do
`/var/backups/raspon/postgres`. Kopie są tworzone w formacie custom PostgreSQL,
sprawdzane przez `pg_restore --list`, chronione sumą SHA-256 i przechowywane
przez 14 dni. Wynik ostatniego uruchomienia znajduje się w
`/var/lib/raspon-ops/backup-status.json`.

`raspon-restore-check.timer` co tydzień odtwarza najnowszą kopię do osobnego,
tymczasowego kontenera PostgreSQL i sprawdza tabele oraz historię migracji.
Wynik zapisuje w `/var/lib/raspon-ops/restore-status.json`.

```bash
systemctl status raspon-backup.timer raspon-restore-check.timer
journalctl -u raspon-backup.service -u raspon-restore-check.service
```

Kopia na tym samym VPS ogranicza ryzyko awarii danych, ale nie awarii całego
serwera. Nadal wymagane są: szyfrowana kopia poza VPS, uzgodnione RPO/RTO,
odbiorca alertów oraz polityka retencji obiektów R2.

## Monitoring i samonaprawa

`raspon-monitor.timer` co pięć minut sprawdza publiczny health endpoint wraz z
bazą, ważność TLS (minimum 7 dni), wykorzystanie dysku (próg 85%), świeżość
backupu i testu restore oraz liczbę restartów kontenera. Po dwóch nieudanych
próbach health watchdog jednokrotnie restartuje aplikację i ponawia kontrolę.
Stan jest zapisywany w `/var/lib/raspon-ops/monitor-status.json`.

Opcjonalny `OPS_ALERT_WEBHOOK_URL` można umieścić w chronionym prawami `600`
pliku `/opt/raspon/.ops.env`. Przy błędzie watchdog wyśle tam raport JSON.

Health endpoint rozróżnia sprawność aplikacji od gotowości biznesowej.
`status: degraded` przy działającej bazie oznacza brak co najmniej jednej
krytycznej konfiguracji: Revolut, e-mail lub prywatnego storage KYC. Wartości
sekretów nigdy nie są zwracane — widoczne są tylko stany `configured` i
`unavailable`. Watchdog raportuje taki stan jako problem integracji, ale nie
restartuje sprawnej aplikacji.

## Kolejka powiadomień

Nowe powiadomienia są zapisywane trwale przed próbą wysyłki.
`raspon-notification-worker.timer` co minutę pobiera należne zadania przez
chroniony lokalny endpoint. Błędy przechodzą do `RETRY` z exponential backoff,
po 8 próbach do `FAILED`; zadania pozostawione w `PROCESSING` są odzyskiwane po
10 minutach. E-maile korzystają z klucza idempotencji opartego na ID zadania.

Stan workera znajduje się w
`/var/lib/raspon-ops/notification-worker-status.json`, a panel administracyjny
pokazuje stan i liczbę prób każdego powiadomienia. Brak konfiguracji dostawcy
nie zużywa limitu prób — zadanie czeka na bezpieczne podłączenie integracji.

Ten sam minutowy worker automatycznie nalicza wypłatę netto dla każdej
zakończonej i opłaconej rezerwacji aktywnego, zweryfikowanego właściciela.
Powiązanie `Payout.bookingId` oraz blokada transakcyjna gwarantują jednokrotne
naliczenie. Monitoring zgłasza zakończone rezerwacje bez naliczonej wypłaty po
pięciominutowym okresie tolerancji. Faktyczny przelew pozostaje kontrolowaną
operacją administratora do czasu podłączenia zgodnego prawnie API przelewów.

Reset hasła korzysta z osobnej trwałej kolejki w `PasswordResetToken`. Surowy
token jest przechowywany wyłącznie jako szyfrogram AES-256-GCM i usuwany po
wysłaniu; do weryfikacji pozostaje tylko hash. Niedostępny dostawca nie powoduje
utraty żądania ani zużycia limitu prób. Worker ponawia dostarczenie do czasu
wygaśnięcia godzinnego tokenu, a backlog i trwałe błędy obejmuje health kolejki.

## Audit administracyjny

Zmiany użytkowników, weryfikacji KYC, ofert, wypłat, zgłoszeń, bloga, bannerów
i kodów rabatowych są zapisywane w `AuditLog` w tej samej transakcji co operacja.
Rejestrowane są aktor, akcja, typ i ID zasobu, bezpieczne pola przed/po, czas
oraz request ID. Dostęp do prywatnego dokumentu KYC również tworzy wpis.

Tabela jest append-only: triggery PostgreSQL blokują `UPDATE` i `DELETE`.
Ostatnie 200 wpisów jest dostępne administratorowi pod `/admin/audit`.

## Incydenty

1. Ogranicz wpływ: wyłącz wadliwą funkcję lub ruch, jeśli to konieczne.
2. Zachowaj logi i znaczniki czasu; nie usuwaj dowodów.
3. Nie publikuj sekretów ani danych klientów na kanale incydentu.
4. Ustal wersję aplikacji, dotknięte konta i zakres czasowy.
5. Dla płatności porównaj dane lokalne z panelem dostawcy.
6. Po naprawie udokumentuj przyczynę, wpływ i działanie zapobiegawcze.

Incydent obejmujący dane osobowe wymaga natychmiastowej eskalacji do osoby
odpowiedzialnej za ochronę danych i oceny obowiązków wynikających z RODO.

## Integracje

### Revolut

Webhook: `POST /api/webhooks/revolut`. Wymagane są API key, środowisko i sekret
podpisu. Rejestruj zdarzenia `ORDER_COMPLETED`, `ORDER_PAYMENT_FAILED` oraz
`ORDER_PAYMENT_DECLINED`.

### Cloudflare R2

Frontend wysyła plik bezpośrednio przez presigned `PUT`. Bucket publicznych zdjęć
wymaga CORS dla `http://localhost:3000` i `https://raspon.de`.

Dokumenty tożsamości używają `R2_PRIVATE_BUCKET_NAME`. Ten bucket:

- musi być inny niż publiczny `R2_BUCKET_NAME`;
- nie może mieć domeny publicznej ani włączonego `r2.dev`;
- pozwala poświadczeniom aplikacji na `PutObject` i `GetObject`;
- powinien mieć reguły retencji uzgodnione z właścicielem procesu RODO.

Po wdrożeniu należy zinwentaryzować wartości `User.identityDocumentUrl`. Wartości
zaczynające się od `http://` lub `https://` oznaczają stare publiczne dokumenty
i muszą zostać przeniesione albo bezpiecznie usunięte.

### Resend i MessageBird

Brak konfiguracji nie powinien blokować głównego procesu, ale powoduje brak
wiadomości. Po wdrożeniu sprawdź dashboard dostawcy oraz logi aplikacji.
