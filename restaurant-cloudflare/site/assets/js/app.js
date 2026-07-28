(() => {
  const config = window.RESTAURANT_CONFIG || {};
  const state = { data: null, active: 'fixed', search: '' };
  const menuContent = document.querySelector('#menu-content');
  const menuStatus = document.querySelector('#menu-status');

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  async function loadMenu() {
    let source = 'aktualnego źródła';
    try {
      const response = await fetch(config.menuApiUrl || '/api/menu', {headers:{'Accept':'application/json'}});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.data = await response.json();
      source = 'Arkuszy Google';
    } catch (error) {
      const fallback = await fetch('/assets/data/menu-fallback.json');
      state.data = await fallback.json();
      source = 'kopii zapisanej na stronie';
      console.warn('Nie udało się pobrać menu z API:', error);
    }
    const date = state.data.updatedAt ? new Date(state.data.updatedAt).toLocaleString('pl-PL', {dateStyle:'medium', timeStyle:'short'}) : '';
    menuStatus.textContent = `Menu z ${source}${date ? ` · aktualizacja: ${date}` : ''}`;
    renderMenu();
  }

  function renderMenu() {
    const groups = state.data?.menus?.[state.active] || [];
    const needle = state.search.trim().toLocaleLowerCase('pl');
    const filtered = groups.map(group => ({...group, items:(group.items || []).filter(item => !needle || `${item.name} ${item.description} ${(item.labels || []).join(' ')}`.toLocaleLowerCase('pl').includes(needle))})).filter(group => group.items.length);
    if (!filtered.length) {
      const messages = {lunch:'Menu lunchowe nie zostało jeszcze opublikowane. Zapytaj telefonicznie o dzisiejszy lunch.',seasonal:'Obecnie nie ma aktywnej oferty sezonowej.',fixed:'Nie znaleziono pasujących pozycji.'};
      menuContent.innerHTML = `<div class="empty-state"><p>${escapeHtml(messages[state.active])}</p><a href="tel:${escapeHtml(config.phone || '+48573515121')}">Zadzwoń: 573 515 121</a></div>`;
      return;
    }
    menuContent.innerHTML = filtered.map(group => `<section class="menu-category"><h3>${escapeHtml(group.category)}</h3><div class="menu-grid">${group.items.map(item => `<article class="menu-item"><h4>${escapeHtml(item.name)}</h4><span class="price">${escapeHtml(item.price)}</span>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}${(item.labels || []).length ? `<p class="labels">${item.labels.map(label => `<span>${escapeHtml(label)}</span>`).join('')}</p>` : ''}</article>`).join('')}</div></section>`).join('');
  }

  document.querySelectorAll('[data-menu-tab]').forEach(button => button.addEventListener('click', () => {
    state.active = button.dataset.menuTab;
    document.querySelectorAll('[data-menu-tab]').forEach(item => item.setAttribute('aria-selected', String(item === button)));
    renderMenu();
  }));
  document.querySelector('#menu-search').addEventListener('input', event => { state.search = event.target.value; renderMenu(); });

  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#main-nav');
  navToggle.addEventListener('click', () => { const open = nav.dataset.open !== 'true'; nav.dataset.open = String(open); navToggle.setAttribute('aria-expanded', String(open)); });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { nav.dataset.open='false'; navToggle.setAttribute('aria-expanded','false'); }));

  const gallery = document.querySelector('#gallery-grid');
  const imageUrls = [
    '3cfafcb0-af8c-45e1-b401-ab33a59055f9','e2f6b67b-6490-4e08-8770-6972b064f0ff','c00161d0-90d8-4c42-b600-3364ff64a23b','9ab11095-7a21-4b3e-8478-e0d293fcfab9','b4672d3c-71c6-4f4e-989a-5a709ecedcb6','63861d41-6576-4584-855b-ca0f60578fc6','106c1dc6-f93f-4236-8aa1-ce8ccb3b1478'
  ];
  gallery.innerHTML = imageUrls.map((id, index) => `<figure><img loading="lazy" src="/assets/images/gallery-${String(index+1).padStart(2,'0')}.jpg" data-fallback="https://restaumatic-production.imgix.net/uploads/accounts/38691/media_library/${id}.jpg?auto=compress%2Cformat&crop=focalpoint&fit=max&h=auto&w=1920" alt="Danie lub wnętrze restauracji Na Ostrzu Noża, zdjęcie ${index+1}"></figure>`).join('');
  document.querySelectorAll('img[data-fallback]').forEach(img => img.addEventListener('error', () => { if (img.src !== img.dataset.fallback) img.src = img.dataset.fallback; }, {once:true}));

  const dialog = document.querySelector('#form-dialog');
  const frame = document.querySelector('#form-frame');
  const placeholder = document.querySelector('#form-placeholder');
  const title = document.querySelector('#form-title');
  function formUrl(type) { return type === 'order' ? config.orderFormUrl : config.reservationFormUrl; }
  document.querySelectorAll('[data-open-form]').forEach(button => button.addEventListener('click', () => {
    const type = button.dataset.openForm;
    const url = formUrl(type);
    title.textContent = type === 'order' ? 'Zamówienie online' : 'Rezerwacja stolika';
    if (url) { frame.src = url; frame.style.display='block'; placeholder.hidden=true; }
    else { frame.removeAttribute('src'); frame.style.display='none'; placeholder.hidden=false; placeholder.innerHTML = type === 'order' ? '<h3>Formularz zamówień nie został jeszcze podłączony</h3><p>W pliku <code>site/assets/js/config.js</code> wklej adres osadzenia opublikowanego Formularza Google jako <code>orderFormUrl</code>.</p><p><a class="button" href="tel:+48573515121">Zamów telefonicznie: 573 515 121</a></p>' : '<h3>Rezerwacja telefoniczna</h3><p>Rezerwacje na dzisiaj najlepiej potwierdzić telefonicznie.</p><p><a class="button" href="tel:+48573515121">Zadzwoń: 573 515 121</a></p>'; }
    dialog.showModal();
  }));
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  document.querySelector('[data-social="facebook"]').href = config.facebookUrl || '#';
  document.querySelector('[data-social="instagram"]').href = config.instagramUrl || '#';

  const adminCorner = document.querySelector('#admin-corner');
  const adminInput = document.querySelector('#admin-corner-input');
  const adminLinks = document.querySelector('#admin-corner-links');
  const adminSheets = config.menuSheets || [];
  function closeAdminCorner() { adminCorner.hidden = true; adminInput.value = ''; adminLinks.hidden = true; adminLinks.innerHTML = ''; }
  document.addEventListener('click', event => {
    const fromLeft = event.clientX;
    const fromBottom = window.innerHeight - event.clientY;
    if (fromLeft >= 10 && fromLeft <= 50 && fromBottom >= 10 && fromBottom <= 50) {
      adminCorner.hidden = false;
      adminInput.focus();
    } else if (!adminCorner.hidden && !adminCorner.contains(event.target)) {
      closeAdminCorner();
    }
  });
  adminInput.addEventListener('input', () => {
    if (adminInput.value.trim() === 'Gabriela' && adminSheets.length) {
      adminLinks.innerHTML = adminSheets.map(sheet => `<li><a href="${escapeHtml(sheet.url)}" target="_blank" rel="noopener">${escapeHtml(sheet.label)}</a></li>`).join('');
      adminLinks.hidden = false;
    } else {
      adminLinks.hidden = true;
      adminLinks.innerHTML = '';
    }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !adminCorner.hidden) closeAdminCorner(); });

  loadMenu();
})();