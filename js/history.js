/**
 * Histórico: mantém os últimos produtos visitados, sem duplicatas.
 * A lista é limitada e exibida em cards compactos.
 */

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

/** Registro de visitas: move o produto para o início e aplica o limite. */
function addToHistory(productId, versionIndex) {
  const history = getHistory().filter((entry) => entry.productId !== productId);
  history.unshift({ productId, versionIndex, viewedAt: Date.now() });

  while (history.length > HISTORY_LIMIT) {
    history.pop();
  }
  writeStorage(STORAGE_KEYS.history, history);
}

function clearHistory() {
  removeStorage(STORAGE_KEYS.history);
  document.dispatchEvent(new CustomEvent('jj:history-change'));
}

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

/** Interface: renderiza os itens recentes no DOM. */
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
