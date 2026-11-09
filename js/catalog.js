/* ==========================================================================
   catalog.js — Busca dinâmica, filtros e ordenação (produtos.html)
   --------------------------------------------------------------------------
   O estado dos filtros fica no objeto catalogState. A cada digitação ou
   mudança de filtro, applyCatalogFilters() percorre PRODUCTS, decide quais
   produtos aparecem e redesenha a grade. O estado também vai para a URL,
   então um link como produtos.html?filtro=favoritos abre já filtrado.
   ========================================================================== */

const DEFAULT_CATALOG_STATE = Object.freeze({
  search: '',
  quick: 'todos',
  brand: 'todas',
  color: 'todas',
  sort: 'destaques'
});

const catalogState = { ...DEFAULT_CATALOG_STATE };

// Remove acentos e maiúsculas: "Lilás" e "lilas" passam a ser iguais na busca.
function normalizeText(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Filtros rápidos (botões Todos, Novidades e Favoritos).
function matchesQuickFilter(product, quickFilter) {
  switch (quickFilter) {
    case 'novidades':
      return product.isNew;
    case 'favoritos':
      return isFavorite(product.id);
    case 'todos':
    default:
      return true;
  }
}

// Retorna o índice da primeira cor que combina com a busca e o filtro de cor,
// ou -1 se nenhuma combinar. Assim o card já abre na cor procurada.
function findMatchingVersion(product, state) {
  const words = normalizeText(state.search).split(/\s+/).filter(Boolean);

  for (let versionIndex = 0; versionIndex < product.versions.length; versionIndex++) {
    const version = product.versions[versionIndex];
    const colorMatches = state.color === 'todas' || getVersionColors(version).includes(state.color);
    const searchableText = normalizeText(
      `${product.name} ${product.brand} ${version.description} ${product.isNew ? 'novo novidade lancamento' : ''}`
    );

    // Todas as palavras digitadas precisam aparecer no texto do produto.
    let wordsMatch = true;
    let wordIndex = 0;
    while (wordsMatch && wordIndex < words.length) {
      if (!searchableText.includes(words[wordIndex])) {
        wordsMatch = false;
      }
      wordIndex++;
    }

    if (colorMatches && wordsMatch) {
      return versionIndex;
    }
  }
  return -1;
}

// Ordena uma cópia da lista, sem alterar PRODUCTS.
function sortProducts(products, sortOption) {
  const sorted = products.slice();

  switch (sortOption) {
    case 'nome-az':
      sorted.sort((a, b) => a.product.name.localeCompare(b.product.name, 'pt-BR'));
      break;
    case 'nome-za':
      sorted.sort((a, b) => b.product.name.localeCompare(a.product.name, 'pt-BR'));
      break;
    case 'marca':
      sorted.sort((a, b) => a.product.brand.localeCompare(b.product.brand, 'pt-BR')
        || a.product.name.localeCompare(b.product.name, 'pt-BR'));
      break;
    case 'destaques':
    default:
      // Lançamentos primeiro; o restante mantém a ordem do cadastro.
      sorted.sort((a, b) => Number(b.product.isNew) - Number(a.product.isNew));
      break;
  }
  return sorted;
}

// Produtos da vitrine da Home: mesma ordem de "Destaques" do catálogo.
function getFeaturedProducts(limit) {
  const entries = PRODUCTS.map((product) => ({ product, versionIndex: 0 }));
  return sortProducts(entries, 'destaques').slice(0, limit);
}

function hasActiveFilters() {
  return Object.keys(DEFAULT_CATALOG_STATE).some((key) => key !== 'sort'
    && catalogState[key] !== DEFAULT_CATALOG_STATE[key]);
}

function describeResults(total) {
  let text;
  if (total === 0) {
    text = 'Nenhum produto encontrado';
  } else if (total === 1) {
    text = '1 produto';
  } else {
    text = `${total} produtos`;
  }
  if (catalogState.search.trim()) {
    text += ` para “${catalogState.search.trim()}”`;
  }
  return text;
}

function applyCatalogFilters() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  const results = [];
  for (const product of PRODUCTS) {
    const brandMatches = catalogState.brand === 'todas' || product.brand === catalogState.brand;
    if (!brandMatches || !matchesQuickFilter(product, catalogState.quick)) {
      continue;
    }
    const versionIndex = findMatchingVersion(product, catalogState);
    if (versionIndex !== -1) {
      results.push({ product, versionIndex });
    }
  }

  const sorted = sortProducts(results, catalogState.sort);
  const number = STORE_CONFIG.whatsappNumber.replace(/\D/g, '');
  // A primeira linha aparece sem rolar: carrega já (a primeira foto com prioridade alta).
  grid.replaceChildren(...sorted.map((entry, index) => {
    let priority = 'lazy';
    if (index === 0) priority = 'high';
    else if (index < 3) priority = 'eager';
    return createProductCard(entry.product, 'h2', number, entry.versionIndex, priority);
  }));

  document.getElementById('catalog-count').textContent = describeResults(sorted.length);
  document.getElementById('catalog-clear').hidden = !hasActiveFilters();
  renderCatalogEmptyState(sorted.length === 0);
  syncCatalogControls();
  updateCatalogUrl();
}

function renderCatalogEmptyState(isEmpty) {
  const empty = document.getElementById('catalog-empty');
  const title = document.getElementById('catalog-empty-title');
  const text = document.getElementById('catalog-empty-text');
  empty.hidden = !isEmpty;
  if (!isEmpty) return;

  if (catalogState.quick === 'favoritos' && getFavorites().length === 0) {
    title.textContent = 'Você ainda não tem favoritos.';
    text.textContent = 'Toque no coração de um produto para guardá-lo aqui. Seus favoritos ficam salvos neste navegador.';
  } else {
    title.textContent = 'Nenhum produto encontrado.';
    text.textContent = 'Tente buscar por outra marca, modelo ou cor, ou limpe os filtros.';
  }
}

// Mantém campos e botões coerentes com o estado (útil ao abrir por um link).
function syncCatalogControls() {
  const searchInput = document.getElementById('catalog-search');
  if (searchInput.value !== catalogState.search) {
    searchInput.value = catalogState.search;
  }
  document.getElementById('catalog-search-clear').hidden = catalogState.search === '';
  document.getElementById('filter-brand').value = catalogState.brand;
  document.getElementById('filter-color').value = catalogState.color;
  document.getElementById('catalog-sort').value = catalogState.sort;

  document.querySelectorAll('[data-quick-filter]').forEach((chip) => {
    chip.setAttribute('aria-pressed', String(chip.dataset.quickFilter === catalogState.quick));
  });
  const favoritesCount = getFavorites().length;
  document.getElementById('chip-favorites-count').textContent = favoritesCount > 0 ? String(favoritesCount) : '';
}

function updateCatalogUrl() {
  const params = new URLSearchParams();
  if (catalogState.search.trim()) params.set('busca', catalogState.search.trim());
  if (catalogState.quick !== 'todos') params.set('filtro', catalogState.quick);
  if (catalogState.brand !== 'todas') params.set('marca', catalogState.brand);
  if (catalogState.color !== 'todas') params.set('cor', catalogState.color);
  if (catalogState.sort !== 'destaques') params.set('ordem', catalogState.sort);

  const query = params.toString();
  window.history.replaceState(null, '', `produtos.html${query ? `?${query}` : ''}${window.location.hash}`);
}

function readCatalogUrl(options) {
  const params = new URLSearchParams(window.location.search);
  const quick = params.get('filtro');
  const brand = params.get('marca');
  const color = params.get('cor');
  const sort = params.get('ordem');

  catalogState.search = params.get('busca') || '';
  if (['todos', 'novidades', 'favoritos'].includes(quick)) catalogState.quick = quick;
  if (options.brands.includes(brand)) catalogState.brand = brand;
  if (options.colors.includes(color)) catalogState.color = color;
  if (['destaques', 'nome-az', 'nome-za', 'marca'].includes(sort)) catalogState.sort = sort;
}

// Monta as opções de marca e cor a partir dos próprios dados dos produtos.
function collectFilterOptions() {
  const brands = [];
  const colors = [];
  for (const product of PRODUCTS) {
    if (!brands.includes(product.brand)) {
      brands.push(product.brand);
    }
    for (const version of product.versions) {
      for (const color of getVersionColors(version)) {
        if (!colors.includes(color)) {
          colors.push(color);
        }
      }
    }
  }
  brands.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  colors.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  return { brands, colors };
}

function fillSelect(select, values) {
  for (const value of values) {
    const option = makeElement('option', '', value);
    option.value = value;
    select.append(option);
  }
}

function resetCatalogFilters() {
  Object.assign(catalogState, DEFAULT_CATALOG_STATE, { sort: catalogState.sort });
  applyCatalogFilters();
  document.getElementById('catalog-search').focus();
}

// Redesenha a lista de favoritos sem deixar o teclado "perdido".
// Ao remover um favorito, o card some e o botão que tinha o foco sai da página.
// Regra previsível: o foco vai para o botão de favorito do card que ocupou o
// mesmo lugar (o próximo); se era o último, vai para o anterior; se a lista
// ficou vazia, vai para o título da mensagem de lista vazia.
function refreshFavoritesViewKeepingFocus() {
  const grid = document.getElementById('catalog-grid');
  const focusedCard = document.activeElement ? document.activeElement.closest('#catalog-grid .product-card') : null;
  const previousPosition = focusedCard ? Array.from(grid.children).indexOf(focusedCard) : -1;

  applyCatalogFilters();

  if (!focusedCard || grid.contains(focusedCard)) return;

  const cards = grid.children;
  if (cards.length === 0) {
    document.getElementById('catalog-empty-title').focus();
    return;
  }
  const target = cards[Math.min(previousPosition, cards.length - 1)];
  target.querySelector('.favorite-toggle').focus();
}

function focusCatalogSearchFromHash() {
  if (window.location.hash === '#busca') {
    const searchInput = document.getElementById('catalog-search');
    searchInput.focus();
    searchInput.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }
}

function initializeCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  const options = collectFilterOptions();
  fillSelect(document.getElementById('filter-brand'), options.brands);
  fillSelect(document.getElementById('filter-color'), options.colors);
  readCatalogUrl(options);

  const searchInput = document.getElementById('catalog-search');

  // Busca dinâmica: filtra a cada letra digitada.
  searchInput.addEventListener('input', () => {
    catalogState.search = searchInput.value;
    applyCatalogFilters();
  });
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && searchInput.value) {
      event.preventDefault();
      catalogState.search = '';
      applyCatalogFilters();
    }
  });
  document.getElementById('catalog-search-clear').addEventListener('click', () => {
    catalogState.search = '';
    applyCatalogFilters();
    searchInput.focus();
  });

  document.querySelectorAll('[data-quick-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      catalogState.quick = chip.dataset.quickFilter;
      applyCatalogFilters();
    });
  });

  document.getElementById('filter-brand').addEventListener('change', (event) => {
    catalogState.brand = event.target.value;
    applyCatalogFilters();
  });
  document.getElementById('filter-color').addEventListener('change', (event) => {
    catalogState.color = event.target.value;
    applyCatalogFilters();
  });
  document.getElementById('catalog-sort').addEventListener('change', (event) => {
    catalogState.sort = event.target.value;
    applyCatalogFilters();
  });

  document.getElementById('catalog-clear').addEventListener('click', resetCatalogFilters);
  document.getElementById('catalog-empty-clear').addEventListener('click', resetCatalogFilters);

  // Atalho de teclado: "/" leva o cursor para a busca.
  document.addEventListener('keydown', (event) => {
    const typing = event.target.closest('input, textarea, select, [contenteditable="true"]');
    if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  // Se o favorito sair enquanto o filtro "Favoritos" está ativo, o card some na hora.
  document.addEventListener('jj:favorites-change', () => {
    if (catalogState.quick === 'favoritos') {
      refreshFavoritesViewKeepingFocus();
    } else {
      syncCatalogControls();
    }
  });

  window.addEventListener('hashchange', focusCatalogSearchFromHash);
  applyCatalogFilters();
  // O navegador rola até o #fragmento só depois do carregamento e, nesse momento,
  // tira o foco do campo. Por isso a busca recebe o foco depois do evento "load".
  if (document.readyState === 'complete') {
    focusCatalogSearchFromHash();
  } else {
    window.addEventListener('load', () => window.setTimeout(focusCatalogSearchFromHash, 0), { once: true });
  }
}
