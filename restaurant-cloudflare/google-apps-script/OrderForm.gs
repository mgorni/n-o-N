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
  // Arkusze czytamy przed jakąkolwiek zmianą formularza: gdy odczyt się nie
  // powiedzie, opublikowany formularz pozostaje nietknięty.
  const sections = readMenuSections_(properties);
  if (!sections.some(section => section.groups.length)) throw new Error('Brak aktywnych pozycji menu. Uzupełnij arkusze i właściwości skryptu (MENU_SHEET_ID, SEASONAL_SHEET_ID, LUNCH_SHEET_ID).');
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
  syncFormItems_(form, buildDesiredItems_(sections));
  const destinationId = ensureDestination_(form);
  // Od lipca 2026 formularze tworzone przez API są domyślnie nieopublikowane;
  // bez setPublished(true) klienci zobaczą stronę „formularz niedostępny”.
  if (typeof form.setPublished === 'function' && !form.isPublished()) form.setPublished(true);
  const embedUrl = form.getPublishedUrl().replace('/viewform', '/viewform?embedded=true');
  Logger.log('Formularz (edycja): %s', form.getEditUrl());
  Logger.log('Formularz (dla klientów): %s', form.getPublishedUrl());
  Logger.log('Adres dla config.js (orderFormUrl): %s', embedUrl);
  Logger.log('Arkusz odpowiedzi: https://docs.google.com/spreadsheets/d/%s', destinationId);
}

function readMenuSections_(properties) {
  return MENU_SECTIONS.map(section => {
    const sheetId = properties.getProperty(PROPERTY_NAMES[section.type]);
    return {label: section.label, groups: sheetId ? readMenuSpreadsheet_(sheetId) : []};
  });
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

function buildDesiredItems_(sections) {
  const items = [];
  items.push({type:'TEXT', title:'Imię i nazwisko', required:true});
  items.push({type:'TEXT', title:'Telefon kontaktowy', helpText:'Pod ten numer potwierdzimy zamówienie.', required:true, validationPattern:'[+]?[0-9][0-9 \\-]{7,14}', validationHelp:'Podaj numer telefonu, np. 573 515 121.'});
  items.push({type:'MULTIPLE_CHOICE', title:'Sposób odbioru', required:true, choices:['Dostawa na adres', 'Odbiór osobisty w restauracji']});
  items.push({type:'PARAGRAPH_TEXT', title:'Adres dostawy', helpText:'Ulica, numer domu i mieszkania, piętro, kod do bramy. Przy odbiorze osobistym zostaw puste.'});
  items.push({type:'TEXT', title:'Preferowana godzina', helpText:'Np. „jak najszybciej” albo konkretna godzina.'});
  sections.forEach(section => {
    if (!section.groups.length) return;
    items.push({type:'SECTION_HEADER', title:section.label});
    section.groups.forEach(group => {
      items.push({type:'CHECKBOX', title:section.label + ' – ' + group.category, choices:group.items.map(item => item.price ? item.name + ' – ' + item.price : item.name)});
    });
  });
  items.push({type:'PARAGRAPH_TEXT', title:'Ilości i uwagi', helpText:'Np. „2× Margherita, 1× Tiramisu”. Puste pole oznacza po jednej sztuce każdej zaznaczonej pozycji.'});
  items.push({type:'MULTIPLE_CHOICE', title:'Płatność przy odbiorze', required:true, choices:['Gotówka przy odbiorze', 'Karta przy odbiorze']});
  items.push({type:'CHECKBOX', title:'Zgoda na przetwarzanie danych', required:true, choices:['Wyrażam zgodę na przetwarzanie moich danych osobowych w celu realizacji zamówienia.']});
  return items;
}

// Kolumny w arkuszu odpowiedzi są powiązane z identyfikatorami pytań, nie z
// tytułami. Dlatego istniejące pytania aktualizujemy w miejscu (setChoices),
// zamiast kasować i tworzyć od nowa – inaczej każda synchronizacja dokładałaby
// do arkusza odpowiedzi nowy blok zduplikowanych kolumn.
function syncFormItems_(form, specs) {
  const unused = form.getItems().slice();
  specs.forEach((spec, index) => {
    const matchIndex = unused.findIndex(candidate => candidate.getType() === FormApp.ItemType[spec.type] && candidate.getTitle() === spec.title);
    const item = matchIndex >= 0 ? unused.splice(matchIndex, 1)[0] : createItem_(form, spec);
    applySpec_(item, spec);
    form.moveItem(item, index);
  });
  unused.forEach(item => form.deleteItem(item));
}

function createItem_(form, spec) {
  let created;
  switch (spec.type) {
    case 'TEXT': created = form.addTextItem(); break;
    case 'PARAGRAPH_TEXT': created = form.addParagraphTextItem(); break;
    case 'MULTIPLE_CHOICE': created = form.addMultipleChoiceItem(); break;
    case 'CHECKBOX': created = form.addCheckboxItem(); break;
    case 'SECTION_HEADER': created = form.addSectionHeaderItem(); break;
    default: throw new Error('Nieznany typ pola formularza: ' + spec.type);
  }
  created.setTitle(spec.title);
  return form.getItemById(created.getId());
}

function applySpec_(item, spec) {
  item.setHelpText(spec.helpText || '');
  switch (spec.type) {
    case 'TEXT': {
      const text = item.asTextItem().setRequired(spec.required === true);
      if (spec.validationPattern) text.setValidation(FormApp.createTextValidation().setHelpText(spec.validationHelp || '').requireTextMatchesPattern(spec.validationPattern).build());
      break;
    }
    case 'PARAGRAPH_TEXT':
      item.asParagraphTextItem().setRequired(spec.required === true);
      break;
    case 'MULTIPLE_CHOICE': {
      const choice = item.asMultipleChoiceItem().setRequired(spec.required === true);
      choice.setChoices(spec.choices.map(value => choice.createChoice(value)));
      break;
    }
    case 'CHECKBOX': {
      const checkbox = item.asCheckboxItem().setRequired(spec.required === true);
      checkbox.setChoices(spec.choices.map(value => checkbox.createChoice(value)));
      break;
    }
    case 'SECTION_HEADER':
      break;
  }
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
