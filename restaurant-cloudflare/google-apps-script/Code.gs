const TYPES = ['fixed', 'lunch', 'seasonal'];
const PROPERTY_NAMES = {fixed:'MENU_SHEET_ID', lunch:'LUNCH_SHEET_ID', seasonal:'SEASONAL_SHEET_ID'};

function doGet() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get('menu-v2');
    if (cached) return output_(cached);
    const properties = PropertiesService.getScriptProperties();
    const menus = {};
    TYPES.forEach(type => {
      const id = properties.getProperty(PROPERTY_NAMES[type]);
      menus[type] = id ? readMenuSpreadsheet_(id) : [];
    });
    const result = JSON.stringify({updatedAt:new Date().toISOString(), source:'google-sheets', menus});
    cache.put('menu-v2', result, 60);
    return output_(result);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error:String(error), updatedAt:new Date().toISOString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function readMenuSpreadsheet_(spreadsheetId) {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const groups = new Map();
  spreadsheet.getSheets().forEach(sheet => {
    const rows = sheet.getDataRange().getDisplayValues();
    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const [category, name, description, price, labels, active] = rows[rowIndex].map(value => String(value || '').trim());
      if (!category || !name || String(active || 'tak').toLowerCase() === 'nie') continue;
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push({name, description:description || '', price:price || '', labels:(labels || '').split(',').map(x=>x.trim()).filter(Boolean)});
    }
  });
  return Array.from(groups, ([category, items]) => ({category, items}));
}

function output_(json) {
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function clearMenuCache() {
  CacheService.getScriptCache().remove('menu-v2');
}
