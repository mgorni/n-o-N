# Inwentaryzacja migracji

Stan źródła sprawdzony 22 lipca 2026 r.

## Przeniesione treści

- nazwa: Na Ostrzu Noża;
- hasło: Oryginalna kuchnia włoska;
- opis restauracji;
- adres, telefon i e-mail;
- godziny otwarcia i dostawy;
- odnośniki do Facebooka i Instagrama;
- menu stałe wraz z kategoriami, opisami i cenami;
- bieżąca oferta sezonowa;
- katalog 14 alergenów;
- galeria siedmiu zdjęć.

## Elementy celowo nieprzeniesione

- komunikaty i reklamy Restaumatic;
- koszyk, płatności i geolokalizacja dostawy Restaumatic;
- panel administratora Restaumatic;
- regulamin i polityka prywatności w części opisującej Restaumatic jako procesora i operatora systemu;
- mechanizmy zgód marketingowych i cookies dostarczane przez Restaumatic.

## Elementy wymagające decyzji lub danych

- link do Formularza Google do zamówień (formularz tworzy `google-apps-script/OrderForm.gs`; po uruchomieniu `setupOrderForm` wklej adres do `config.js`);
- opcjonalny link do Formularza Google do rezerwacji;
- ~~trzy identyfikatory Dokumentów Google~~ – zastąpione Arkuszami Google, identyfikatory w `google-sheets-templates/README.md`;
- dane przedsiębiorcy do dokumentów prawnych;
- zasady i koszt dostawy, minimalna wartość zamówienia, dostępne płatności;
- pełne przypisanie alergenów do konkretnych pozycji;
- potwierdzenie aktualności cen i oferty sezonowej.

## Assety

`assets-manifest.json` zawiera siedem adresów źródłowych zdjęć. Skrypt `npm run assets` kopiuje je do projektu. Po wykonaniu migracji pliki powinny zostać zatwierdzone w repozytorium, aby strona nie zależała od infrastruktury Restaumatic.
