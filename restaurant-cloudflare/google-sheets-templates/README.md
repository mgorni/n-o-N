# Arkusze Google z menu

Menu strony pochodzi z trzech Arkuszy Google. Arkusze zostały już utworzone
na koncie restauracji i wypełnione danymi z `site/assets/data/menu-fallback.json`:

| Menu | Arkusz | Identyfikator |
|---|---|---|
| Stałe | [Na Ostrzu Noża – Menu stałe](https://docs.google.com/spreadsheets/d/1rbsy_LTrQpMou2b0mHdFtgpIduT9EHvAScWYC_kkgWM/edit) | `1rbsy_LTrQpMou2b0mHdFtgpIduT9EHvAScWYC_kkgWM` |
| Sezonowe | [Na Ostrzu Noża – Menu sezonowe](https://docs.google.com/spreadsheets/d/1jh0NNFqM5M3ekrPkv5MS7ljTfr9CeRLOHcw6DLf4OkY/edit) | `1jh0NNFqM5M3ekrPkv5MS7ljTfr9CeRLOHcw6DLf4OkY` |
| Lunchowe | [Na Ostrzu Noża – Menu lunchowe](https://docs.google.com/spreadsheets/d/19QXSmZqUhQ6w6rwkdPVhJ-VzNa6iXz7ckxDJaNC3SQ0/edit) | `19QXSmZqUhQ6w6rwkdPVhJ-VzNa6iXz7ckxDJaNC3SQ0` |

Pliki CSV w tym katalogu to kopie danych startowych – przydadzą się, gdyby
trzeba było odtworzyć arkusz od zera (Plik → Importuj → Prześlij).

## Format arkusza

Pierwszy wiersz to nagłówek z dokładnie sześcioma kolumnami:

`Kategoria | Nazwa | Opis | Cena | Oznaczenia | Aktywne`

Zasady:

- każdy kolejny wiersz to jedna pozycja menu;
- `Aktywne = nie` ukrywa pozycję (puste pole oznacza „tak”);
- pozycje o identycznej `Kategorii` są grupowane w jedną sekcję;
- `Oznaczenia` to lista po przecinku, np. `wege, ostre`;
- można używać wielu kart (zakładek) w jednym arkuszu – wszystkie są czytane,
  a pierwszy wiersz każdej karty jest traktowany jako nagłówek;
- w menu lunchowym jako kategorii najlepiej używać dni tygodnia
  (Poniedziałek…Piątek); wiersze przykładowe mają `Aktywne = nie` –
  po wpisaniu prawdziwego lunchu zmień na `tak`;
- zmiany publikują się automatycznie, z maksymalnie kilkuminutowym
  opóźnieniem cache.
