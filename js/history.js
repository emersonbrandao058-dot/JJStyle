/* ==========================================================================
   history.js — Produtos vistos recentemente
   --------------------------------------------------------------------------
   Sempre que a página produto.html abre, o produto vai para o início da
   lista. Cada produto aparece uma vez e a lista guarda no máximo
   HISTORY_LIMIT itens: { productId, versionIndex, viewedAt }.
   ========================================================================== */

const HISTORY_LIMIT = 8;

function getHistory() {
  const saved = readStorage(STORAGE_KEYS.history, []);
  if (!Array.isArray(saved)) {
    return [];
  }
  return saved.filter((entry) => entry
    && isValidVersion(getProductById(entry.productId), entry.versionIndex)
    && Number.isFinite(entry.viewedAt));
}

function addToHistory(productId, versionIndex) {
  // Remove a visita anterior do mesmo produto e coloca a nova no início.
  const history = getHistory().filter((entry) => entry.productId !== productId);
  history.unshift({ productId, versionIndex, viewedAt: Date.now() });

  // Enquanto passar do limite, descarta o item mais antigo (fim da lista).
  while (history.length > HISTORY_LIMIT) {
    history.pop();
  }
  writeStorage(STORAGE_KEYS.history, history);
}

function clearHistory() {
  removeStorage(STORAGE_KEYS.history);
  document.dispatchEvent(new CustomEvent('jj:history-change'));
}

// Converte a data da visita em um texto amigável.
function describeViewTime(viewedAt) {
  const minutes = Math.floor((Date.now() - viewedAt) / 60000);

  if (minutes < 1) {
    return 'Visto agora';
  } else if (minutes < 60) {
    return `Visto há ${minutes} min`;
  } else if (minutes < 60 * 24) {
    const hours = Math.floor(minutes / 60);
    return `Visto há ${hours} h`;
  } else {
    const days = Math.floor(minutes / (60 * 24));
    return days === 1 ? 'Visto ontem' : `Visto há ${days} dias`;
  }
}

function createHistoryItem(entry) {
  const product = getProductById(entry.productId);
  const version = product.versions[entry.versionIndex];

  const link = makeElement('a', 'recent-item');
  link.href = productUrl(product.id, entry.versionIndex);

  // Miniatura leve (240 x 320) para o card compacto de 64 px.
  const image = makeElement('img');
  image.src = getThumbnail(version);
  image.alt = '';
  image.width = 240;
  image.height = 320;
  image.loading = 'lazy';
  image.decoding = 'async';

  const text = makeElement('span', 'recent-text');
  text.append(
    makeElement('strong', 'recent-name', product.name),
    makeElement('span', 'recent-color', version.description),
    makeElement('span', 'recent-time', describeViewTime(entry.viewedAt))
  );
  link.append(image, text);
  return link;
}

// Mostra a seção "Vistos recentemente". Na página do produto, o atual fica de fora.
function renderHistory(currentProductId) {
  const section = document.getElementById('recently-viewed');
  const list = document.getElementById('recently-viewed-list');
  if (!section || !list) return;

  const history = getHistory();
  const items = [];
  let index = 0;

  while (index < history.length) {
    if (history[index].productId !== currentProductId) {
      items.push(createHistoryItem(history[index]));
    }
    index++;
  }

  list.replaceChildren(...items);
  section.hidden = items.length === 0;
}

function initializeHistory(currentProductId) {
  const clearButton = document.getElementById('recently-viewed-clear');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      clearHistory();
      showToast('Histórico de produtos vistos apagado.');
    });
  }
  document.addEventListener('jj:history-change', () => renderHistory(currentProductId));
  renderHistory(currentProductId);
}
