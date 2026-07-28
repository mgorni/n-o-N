# Na Ostrzu Noża – strona na Cloudflare Pages

Gotowy projekt statycznej strony restauracji z dynamicznym menu z Arkuszy Google i zamówieniami przez Formularz Google (płatność przy odbiorze).

## Co zawiera

- stronę responsywną i dostępną klawiaturą;
- treści, dane kontaktowe, godziny, menu stałe i sezonowe przeniesione z obecnej strony;
- galerię siedmiu zdjęć z manifestem migracyjnym;
- lokalną kopię menu używaną awaryjnie;
- Cloudflare Pages Function `/api/menu`;
- Google Apps Script odczytujący trzy Arkusze Google (`Code.gs`);
- Google Apps Script budujący formularz zamówień z pozycji menu (`OrderForm.gs`);
- robocze strony prawne, które trzeba uzupełnić przed publikacją.

## 1. Pobranie zdjęć

```bash
npm install
npm run assets
```

Skrypt pobierze zdjęcia z dotychczasowej biblioteki Restaumatic do `site/assets/images`. Po pobraniu warto je zatwierdzić w repozytorium, aby nowa strona przestała zależeć od starego CDN.

## 2. Arkusze Google

Trzy arkusze z menu są już utworzone i wypełnione danymi (szczegóły i format opisuje `google-sheets-templates/README.md`):

| Menu | Identyfikator arkusza |
|---|---|
| Stałe | `1rbsy_LTrQpMou2b0mHdFtgpIduT9EHvAScWYC_kkgWM` |
| Sezonowe | `1jh0NNFqM5M3ekrPkv5MS7ljTfr9CeRLOHcw6DLf4OkY` |
| Lunchowe | `19QXSmZqUhQ6w6rwkdPVhJ-VzNa6iXz7ckxDJaNC3SQ0` |

Każdy arkusz ma kolumny:

`Kategoria | Nazwa | Opis | Cena | Oznaczenia | Aktywne`

Menu lunchowe zawiera wiersze przykładowe z `Aktywne = nie` – po wpisaniu prawdziwego lunchu zmień na `tak`.

## 3. Google Apps Script

1. Utwórz nowy projekt Apps Script (script.google.com) na tym samym koncie Google, na którym są arkusze.
2. Wklej `google-apps-script/Code.gs`, `google-apps-script/OrderForm.gs` i `appsscript.json`.
3. Identyfikatory arkuszy są wpisane w `Code.gs` (`DEFAULT_SHEET_IDS`); w razie potrzeby można je nadpisać właściwościami skryptu `MENU_SHEET_ID`, `SEASONAL_SHEET_ID`, `LUNCH_SHEET_ID` bez zmiany kodu.
4. Wdróż jako aplikację internetową wykonywaną jako właściciel, z dostępem dla każdego użytkownika mającego link.
5. Skopiuj adres wdrożenia kończący się `/exec`.

Po zmianie menu w arkuszach nowe dane pojawią się na stronie automatycznie (cache do kilku minut). Funkcja `clearMenuCache` czyści cache ręcznie.

## 4. Cloudflare

Projekt wykorzystuje Pages Functions, dlatego wdrażaj przez repozytorium Git lub Wrangler, a nie przez prosty Direct Upload z panelu.

W Cloudflare Pages dodaj zmienną środowiskową:

`GOOGLE_MENU_ENDPOINT = https://script.google.com/macros/s/.../exec`

Następnie:

```bash
npm run deploy
```

Lub połącz repozytorium z Cloudflare Pages:

- Build command: `npm run build`
- Build output directory: `site`

## 5. Formularz zamówień

Formularz zamówień (płatność przy odbiorze – gotówką lub kartą) tworzy i aktualizuje skrypt `OrderForm.gs`:

1. W edytorze Apps Script uruchom funkcję `setupOrderForm` i zaakceptuj uprawnienia (Formularze, Arkusze).
2. Skrypt utworzy formularz z pozycjami z trzech arkuszy menu oraz arkusz „Na Ostrzu Noża – Zamówienia (odpowiedzi)”, do którego trafiają zamówienia.
3. Z dziennika (Logger) skopiuj `Adres dla config.js (orderFormUrl)` i wklej go w `site/assets/js/config.js` jako `orderFormUrl`.
4. Wdróż stronę ponownie (`npm run deploy` albo commit i push przy integracji Git) – `config.js` to plik statyczny, więc zmiana adresu formularza pojawia się dopiero po nowym wdrożeniu.
5. Po każdej zmianie menu uruchom `setupOrderForm` ponownie, aby zsynchronizować listę dań, albo włącz codzienną synchronizację funkcją `createDailyFormSyncTrigger`. Synchronizacja aktualizuje pytania w miejscu, więc kolumny w arkuszu odpowiedzi pozostają spójne.

Analogicznie można podłączyć formularz rezerwacji (`reservationFormUrl` – tu również po zmianie potrzebne jest nowe wdrożenie).

## 6. Domena

Po udanym wdrożeniu dodaj `restauracjanaostrzunoza.pl` jako domenę niestandardową projektu Pages. Dopiero po sprawdzeniu wersji `pages.dev` przełącz DNS ze starej usługi.

## 7. Przed publikacją

- uzupełnij regulamin i politykę prywatności zgodnie z rzeczywistym procesem zamówień;
- dodaj dane przedsiębiorcy i zasady dostawy, płatności, anulowania i reklamacji;
- zweryfikuj ceny i skład wszystkich dań;
- dodaj pełne oznaczenia alergenów do pozycji (kolumna `Oznaczenia` – wyświetlane na stronie jako etykiety przy daniu i uwzględniane w wyszukiwarce menu);
- sprawdź zgody i klauzulę informacyjną w Formularzu Google;
- przetestuj zamówienie na telefonie i komputerze;
- po pobraniu zdjęć usuń z CSP domenę `restaumatic-production.imgix.net`, aby odciąć zależność od Restaumatic.
