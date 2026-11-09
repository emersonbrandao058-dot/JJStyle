// TDE Parte II — favoritos, pesquisa, filtros, histórico e validação.
// Este arquivo é carregado depois de main.js; usa PRODUCTS e createProductCard.
const TDE_STORAGE = Object.freeze({ favorites: 'jjstyle-favoritos-v2', history: 'jjstyle-historico-v2' });

function tdeRead(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(saved) ? saved.filter((id) => PRODUCTS.some((p) => p.id === id)) : [];
  } catch (_) {
    return []; // Navegador pode bloquear armazenamento ou guardar dados inválidos.
  }
}

function tdeSave(key, values) {
  try { localStorage.setItem(key, JSON.stringify(values)); }
  catch (_) { /* Navegação e favoritos continuam funcionando nesta sessão. */ }
}

let tdeFavorites = tdeRead(TDE_STORAGE.favorites);
let tdeHistory = tdeRead(TDE_STORAGE.history);

function tdeFavoriteButton(productId) {
  const product = PRODUCTS.find((item) => item.id === productId);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tde-favorite';
  button.dataset.favoriteId = productId;
  button.addEventListener('click', () => tdeToggleFavorite(productId));
  tdeRefreshButton(button, product ? product.name : 'produto');
  return button;
}

function tdeRefreshButton(button, name) {
  const active = tdeFavorites.includes(button.dataset.favoriteId);
  button.textContent = active ? '♥ Salvo' : '♡ Favoritar';
  button.setAttribute('aria-pressed', String(active));
  button.setAttribute('aria-label', active ? 'Remover ' + name + ' dos favoritos' : 'Favoritar ' + name);
}

function tdeToggleFavorite(productId) {
  // if/else: alterna o estado do item, sem duplicar IDs.
  if (tdeFavorites.includes(productId)) {
    tdeFavorites = tdeFavorites.filter((id) => id !== productId);
  } else {
    tdeFavorites.push(productId);
  }
  tdeSave(TDE_STORAGE.favorites, tdeFavorites);
  tdeUpdateAllFavorites();
}

function tdeDecorateCard(card) {
  if (card.querySelector('.tde-favorite')) return;
  const button = tdeFavoriteButton(card.dataset.productId);
  const body = card.querySelector('.card-body');
  if (body) body.append(button);
}

function tdeUpdateAllFavorites() {
  document.querySelectorAll('.tde-favorite').forEach((button) => {
    const product = PRODUCTS.find((p) => p.id === button.dataset.favoriteId);
    tdeRefreshButton(button, product ? product.name : 'produto');
  });
  const count = document.getElementById('tde-favorite-count');
  if (count) count.textContent = String(tdeFavorites.length);
  const catalog = document.querySelector('[data-product-list="catalog"]');
  if (catalog && document.getElementById('tde-only-favorites')?.checked) tdeFilterCatalog();
}

// switch/case: filtro da marca selecionada, sem modificar os dados originais.
function tdeMatchesBrand(product, brand) {
  switch (brand) {
    case 'puma': return product.name.toLowerCase().includes('puma');
    case 'adidas': return product.name.toLowerCase().includes('adidas');
    case 'lacoste': return product.name.toLowerCase().includes('lacoste');
    case 'quiksilver': return product.name.toLowerCase().includes('quiksilver');
    case 'brt': return product.name.toLowerCase().includes('brt');
    default: return true;
  }
}

function tdeRenderCards(list, products, headingTag) {
  const number = STORE_CONFIG.whatsappNumber.replace(/\\D/g, '');
  const fragment = document.createDocumentFragment();
  // for: percorre a lista resultante e cria cada card usando o componente existente.
  for (let i = 0; i < products.length; i++) {
    const card = createProductCard(products[i], headingTag, number);
    tdeDecorateCard(card);
    fragment.append(card);
  }
  list.replaceChildren(fragment);
}

function tdeFilterCatalog() {
  const list = document.querySelector('[data-product-list="catalog"]');
  if (!list) return;
  const term = (document.getElementById('tde-search')?.value || '').trim().toLocaleLowerCase('pt-BR');
  const brand = document.getElementById('tde-brand')?.value || 'all';
  const favoritesOnly = Boolean(document.getElementById('tde-only-favorites')?.checked);
  const filtered = PRODUCTS.filter((product) => {
    const matchesTerm = (product.name + ' ' + product.versions.map((v) => v.description).join(' ')).toLocaleLowerCase('pt-BR').includes(term);
    return matchesTerm && tdeMatchesBrand(product, brand) && (!favoritesOnly || tdeFavorites.includes(product.id));
  });
  tdeRenderCards(list, filtered, 'h2');
  const feedback = document.getElementById('tde-results');
  if (feedback) feedback.textContent = filtered.length === 0
    ? 'Nenhum produto encontrado. Altere os filtros.'
    : filtered.length + (filtered.length === 1 ? ' produto encontrado.' : ' produtos encontrados.');
}

function tdeInitializeCatalog() {
  const list = document.querySelector('[data-product-list="catalog"]');
  if (!list) return;
  const heading = document.querySelector('.catalog-heading');
  if (!heading) return;
  const panel = document.createElement('div');
  panel.className = 'tde-toolbar';
  panel.innerHTML = `
    <label class="tde-field" for="tde-search">Buscar conjuntos
      <input id="tde-search" type="search" placeholder="Ex.: Puma, preto, azul…" autocomplete="off">
    </label>
    <label class="tde-field" for="tde-brand">Marca
      <select id="tde-brand">
        <option value="all">Todas as marcas</option>
        <option value="puma">Puma</option>
        <option value="adidas">Adidas</option>
        <option value="lacoste">Lacoste</option>
        <option value="quiksilver">Quiksilver</option>
        <option value="brt">BRT</option>
      </select>
    </label>
    <label class="tde-check"><input type="checkbox" id="tde-only-favorites"> Apenas favoritos (<span id="tde-favorite-count">0</span>)</label>
    <button type="button" id="tde-clear">Limpar filtros</button>
    <p id="tde-results" class="tde-results" role="status" aria-live="polite"></p>`;
  heading.insertAdjacentElement('afterend', panel);
  document.getElementById('tde-search').addEventListener('input', tdeFilterCatalog);
  document.getElementById('tde-brand').addEventListener('change', tdeFilterCatalog);
  document.getElementById('tde-only-favorites').addEventListener('change', tdeFilterCatalog);
  document.getElementById('tde-clear').addEventListener('click', () => {
    document.getElementById('tde-search').value = '';
    document.getElementById('tde-brand').value = 'all';
    document.getElementById('tde-only-favorites').checked = false;
    tdeFilterCatalog();
  });
  tdeFilterCatalog();
}

function tdeInitializeDetail() {
  const detail = document.getElementById('product-detail');
  if (!detail || detail.hidden) return;
  const id = new URLSearchParams(window.location.search).get('id');
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return;
  tdeHistory = [id, ...tdeHistory.filter((previous) => previous !== id)].slice(0, 5);
  tdeSave(TDE_STORAGE.history, tdeHistory);
  const action = document.querySelector('.detail-back');
  if (action) action.insertAdjacentElement('beforebegin', tdeFavoriteButton(id));
}

function tdeInitializeHistory() {
  const list = document.querySelector('[data-product-list="catalog"]');
  if (!list || tdeHistory.length === 0) return;
  const section = document.createElement('aside');
  section.className = 'tde-history';
  const heading = document.createElement('h2');
  heading.textContent = 'Vistos recentemente';
  const links = document.createElement('div');
  links.className = 'tde-history-links';
  // while: percorre até cinco IDs salvos, ignorando modelos excluídos.
  let index = 0;
  while (index < tdeHistory.length) {
    const product = PRODUCTS.find((p) => p.id === tdeHistory[index]);
    if (product) {
      const link = document.createElement('a');
      link.href = productUrl(product.id, 0);
      link.textContent = product.name + ' ↗';
      links.append(link);
    }
    index++;
  }
  section.append(heading, links);
  list.insertAdjacentElement('afterend', section);
}

function tdeInitializeContactValidation() {
  const form = document.getElementById('form-contato');
  if (!form) return;
  // Captura o submit antes do listener antigo para validar sem modificar o envio via WhatsApp.
  form.addEventListener('submit', (event) => {
    const name = document.getElementById('nome')?.value.trim() || '';
    const phone = (document.getElementById('telefone')?.value || '').replace(/\\D/g, '');
    const note = document.getElementById('form-note');
    if (name.length < 2 || phone.length < 10 || phone.length > 11) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (note) note.textContent = 'Informe seu nome e um telefone com DDD (10 ou 11 dígitos).';
      if (name.length < 2) document.getElementById('nome')?.focus();
      else document.getElementById('telefone')?.focus();
    }
  }, true);
}

document.querySelectorAll('[data-product-list="home"] .product-card').forEach(tdeDecorateCard);
tdeInitializeCatalog();
tdeInitializeDetail();
tdeInitializeHistory();
tdeInitializeContactValidation();
tdeUpdateAllFavorites();
