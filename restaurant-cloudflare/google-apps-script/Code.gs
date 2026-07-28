const TYPES = ['fixed', 'lunch', 'seasonal'];
const PROPERTY_NAMES = {fixed:'MENU_DOC_ID', lunch:'LUNCH_DOC_ID', seasonal:'SEASONAL_DOC_ID'};

function doGet() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get('menu-v1');
    if (cached) return output_(cached);
    const properties = PropertiesService.getScriptProperties();
    const menus = {};
    TYPES.forEach(type => {
      const id = properties.getProperty(PROPERTY_NAMES[type]);
      menus[type] = id ? readMenuDocument_(id) : [];
    });
    const result = JSON.stringify({updatedAt:new Date().toISOString(), source:'google-docs', menus});
    cache.put('menu-v1', result, 60);
    return output_(result);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error:String(error), updatedAt:new Date().toISOString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function readMenuDocument_(documentId) {
  const document = DocumentApp.openById(documentId);
  const tables = document.getBody().getTables();
  const groups = new Map();
  tables.forEach(table => {
    for (let rowIndex = 1; rowIndex < table.getNumRows(); rowIndex++) {
      const row = table.getRow(rowIndex);
      const values = [];
      for (let cellIndex = 0; cellIndex < row.getNumCells(); cellIndex++) values.push(row.getCell(cellIndex).getText().trim());
      const [category, name, description, price, labels, active] = values;
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
  CacheService.getScriptCache().remove('menu-v1');
}
