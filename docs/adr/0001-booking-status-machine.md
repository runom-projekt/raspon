# ADR 0001: maszyna stanów rezerwacji

- Status: zaakceptowana
- Data: 2026-07-31

## Kontekst

Dotychczas każdy uczestnik rezerwacji mógł przez publiczny endpoint ustawić
praktycznie dowolny status. Pozwalało to między innymi ręcznie potwierdzić
nieopłaconą rezerwację oraz pominąć kolejne etapy procesu.

## Decyzja

Dozwolone są wyłącznie poniższe przejścia:

| Stan bieżący | Stan docelowy | Aktor |
|---|---|---|
| `PENDING` | `CONFIRMED` | zweryfikowany system płatniczy |
| `PENDING` | `DECLINED` | właściciel lub administrator |
| `PENDING` | `CANCELLED` | najemca lub administrator |
| `CONFIRMED` | `ACTIVE` | właściciel lub administrator |
| `ACTIVE` | `COMPLETED` | właściciel lub administrator |

Stany `COMPLETED`, `CANCELLED` i `DECLINED` są terminalne. Publiczny endpoint
uczestników nie przyjmuje `CONFIRMED`. Zmiana statusu zapisuje się warunkowo
względem stanu odczytanego, dzięki czemu spóźnione równoległe żądanie nie
nadpisuje nowszej decyzji.

Anulowanie potwierdzonej rezerwacji pozostaje zablokowane do czasu zatwierdzenia
polityki refundów, opłat za anulowanie i rozliczenia właściciela.

## Konsekwencje

- potwierdzenie rezerwacji może pochodzić tylko z obsługi płatności;
- właściciel nie może pominąć etapu odbioru ani cofnąć procesu;
- klient może sam anulować wyłącznie rezerwację oczekującą;
- nowe procesy refundu i sporów muszą rozszerzyć tę decyzję oraz jej testy.
