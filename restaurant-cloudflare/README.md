# Na Ostrzu Noża – strona na Cloudflare Pages

Gotowy projekt statycznej strony restauracji z dynamicznym menu z Dokumentów Google i zamówieniami przez Formularze Google.

## Co zawiera

- stronę responsywną i dostępną klawiaturą;
- treści, dane kontaktowe, godziny, menu stałe i sezonowe przeniesione z obecnej strony;
- galerię siedmiu zdjęć z manifestem migracyjnym;
- lokalną kopię menu używaną awaryjnie;
- Cloudflare Pages Function `/api/menu`;
- Google Apps Script odczytujący trzy Dokumenty Google;
- miejsca na Formularz Google do zamówień i rezerwacji;
- robocze strony prawne, które trzeba uzupełnić przed publikacją.

## 1. Pobranie zdjęć

```bash
npm install
npm run assets
```

Skrypt pobierze zdjęcia z dotychczasowej biblioteki Restaumatic do `site/assets/images`. Po pobraniu warto je zatwierdzić w repozytorium, aby nowa strona przestała zależeć od starego CDN.

## 2. Dokumenty Google

Utwórz trzy Dokumenty Google na podstawie plików z katalogu `google-docs-templates` i w każdym wstaw tabelę z kolumnami:

`Kategoria | Nazwa | Opis | Cena | Oznaczenia | Aktywne`

Skopiuj identyfikatory dokumentów z adresów URL.

## 3. Google Apps Script

1. Utwórz nowy projekt Apps Script.
2. Wklej `google-apps-script/Code.gs` i `appsscript.json`.
3. W ustawieniach projektu dodaj właściwości skryptu:
   - `MENU_DOC_ID`
   - `LUNCH_DOC_ID`
   - `SEASONAL_DOC_ID`
4. Wdróż jako aplikację internetową wykonywaną jako właściciel, z dostępem dla każdego użytkownika mającego link.
5. Skopiuj adres wdrożenia kończący się `/exec`.

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

## 5. Formularze Google

Opublikuj formularz zamówień. Skopiuj adres z kodu osadzenia, zwykle w formacie:

`https://docs.google.com/forms/d/e/.../viewform?embedded=true`

Wklej go w `site/assets/js/config.js` jako `orderFormUrl`. Analogicznie można podłączyć formularz rezerwacji.

## 6. Domena

Po udanym wdrożeniu dodaj `restauracjanaostrzunoza.pl` jako domenę niestandardową projektu Pages. Dopiero po sprawdzeniu wersji `pages.dev` przełącz DNS ze starej usługi.

## 7. Przed publikacją

- uzupełnij regulamin i politykę prywatności zgodnie z rzeczywistym procesem zamówień;
- dodaj dane przedsiębiorcy i zasady dostawy, płatności, anulowania i reklamacji;
- zweryfikuj ceny i skład wszystkich dań;
- dodaj pełne oznaczenia alergenów do pozycji;
- sprawdź zgody i klauzulę informacyjną w Formularzu Google;
- przetestuj zamówienie na telefonie i komputerze;
- po pobraniu zdjęć usuń z CSP domenę `restaumatic-production.imgix.net`, aby odciąć zależność od Restaumatic.
