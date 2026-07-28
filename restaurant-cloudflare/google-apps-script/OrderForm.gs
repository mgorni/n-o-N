const ORDER_FORM_TITLE = 'Na Ostrzu Noża – zamówienie z dostawą';
const ORDER_RESPONSES_TITLE = 'Na Ostrzu Noża – Zamówienia (odpowiedzi)';
const MENU_SECTIONS = [
  {type:'fixed', label:'Menu stałe'},
  {type:'seasonal', label:'Menu sezonowe'},
  {type:'lunch', label:'Menu lunchowe'}
];

/**
 * Tworzy formularz zamówień (przy pierwszym uruchomieniu) albo synchronizuje
 * listę dań z trzema Arkuszami Google wskazanymi we właściwościach skryptu
 * (MENU_SHEET_ID, SEASONAL_SHEET_ID, LUNCH_SHEET_ID). Odpowiedzi trafiają do
 * arkusza „Zamówienia (odpowiedzi)”. Uruchom ponownie po każdej zmianie menu
 * albo włącz automat przez createDailyFormSyncTrigger().
 */
function setupOrderForm() {
  const properties = PropertiesService.getScriptProperties();
  let form = null;
  const formId = properties.getProperty('ORDER_FORM_ID');
  if (formId) {
    try { form = FormApp.openById(formId); } catch (error) { form = null; }
  }
  if (!form) {
    form = FormApp.create(ORDER_FORM_TITLE);
    properties.setProperty('ORDER_FORM_ID', form.getId());
  }
  configureForm_(form);
  rebuildFormItems_(form, properties);
  const destinationId = ensureDestination_(form);
  const embedUrl = form.getPublishedUrl().replace('/viewform', '/viewform?embedded=true');
  Logger.log('Formularz (edycja): %s', form.getEditUrl());
  Logger.log('Formularz (dla klientów): %s', form.getPublishedUrl());
  Logger.log('Adres dla config.js (orderFormUrl): %s', embedUrl);
  Logger.log('Arkusz odpowiedzi: https://docs.google.com/spreadsheets/d/%s', destinationId);
}

function configureForm_(form) {
  form.setTitle(ORDER_FORM_TITLE)
    .setDescription('Zamówienie z dostawą lub odbiorem osobistym. Płatność przy odbiorze – gotówką lub kartą. Zaznacz wybrane dania, a ilości wpisz w polu „Ilości i uwagi”. Zamówienie potwierdzimy telefonicznie.')
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setAllowResponseEdits(false)
    .setProgressBar(false)
    .setAcceptingResponses(true)
    .setConfirmationMessage('Dziękujemy! Potwierdzimy zamówienie telefonicznie. W razie pytań: 573 515 121.');
}

function rebuildFormItems_(form, properties) {
  form.getItems().forEach(item => form.deleteItem(item));

  form.addTextItem().setTitle('Imię i nazwisko').setRequired(true);
  const phone = form.addTextItem().setTitle('Telefon kontaktowy').setHelpText('Pod ten numer potwierdzimy zamówienie.').setRequired(true);
  phone.setValidation(FormApp.createTextValidation().setHelpText('Podaj numer telefonu, np. 573 515 121.').requireTextMatchesPattern('[+]?[0-9][0-9 \\-]{7,14}').build());
  const delivery = form.addMultipleChoiceItem().setTitle('Sposób odbioru').setRequired(true);
  delivery.setChoices([
    delivery.createChoice('Dostawa na adres'),
    delivery.createChoice('Odbiór osobisty w restauracji')
  ]);
  form.addParagraphTextItem().setTitle('Adres dostawy').setHelpText('Ulica, numer domu i mieszkania, piętro, kod do bramy. Przy odbiorze osobistym zostaw puste.');
  form.addTextItem().setTitle('Preferowana godzina').setHelpText('Np. „jak najszybciej” albo konkretna godzina.');

  let addedAnyDish = false;
  MENU_SECTIONS.forEach(section => {
    const sheetId = properties.getProperty(PROPERTY_NAMES[section.type]);
    if (!sheetId) return;
    const groups = readMenuSpreadsheet_(sheetId);
    if (!groups.length) return;
    form.addSectionHeaderItem().setTitle(section.label);
    groups.forEach(group => {
      const checkbox = form.addCheckboxItem().setTitle(section.label + ' – ' + group.category);
      checkbox.setChoices(group.items.map(item => checkbox.createChoice(item.price ? item.name + ' – ' + item.price : item.name)));
      addedAnyDish = true;
    });
  });
  if (!addedAnyDish) throw new Error('Brak aktywnych pozycji menu. Uzupełnij arkusze i właściwości skryptu (MENU_SHEET_ID, SEASONAL_SHEET_ID, LUNCH_SHEET_ID).');

  form.addParagraphTextItem().setTitle('Ilości i uwagi').setHelpText('Np. „2× Margherita, 1× Tiramisu”. Puste pole oznacza po jednej sztuce każdej zaznaczonej pozycji.');
  const payment = form.addMultipleChoiceItem().setTitle('Płatność przy odbiorze').setRequired(true);
  payment.setChoices([
    payment.createChoice('Gotówka przy odbiorze'),
    payment.createChoice('Karta przy odbiorze')
  ]);
  const consent = form.addCheckboxItem().setTitle('Zgoda na przetwarzanie danych').setRequired(true);
  consent.setChoices([consent.createChoice('Wyrażam zgodę na przetwarzanie moich danych osobowych w celu realizacji zamówienia.')]);
}

function ensureDestination_(form) {
  let destinationId = null;
  try { destinationId = form.getDestinationId(); } catch (error) { destinationId = null; }
  if (!destinationId) {
    const spreadsheet = SpreadsheetApp.create(ORDER_RESPONSES_TITLE);
    form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
    destinationId = spreadsheet.getId();
  }
  return destinationId;
}

function createDailyFormSyncTrigger() {
  ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === 'setupOrderForm').forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('setupOrderForm').timeBased().everyDays(1).atHour(9).create();
}
