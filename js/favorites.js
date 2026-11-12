/**
 * Favoritos: guarda IDs dos produtos e sincroniza os corações da interface.
 */

function getFavorites() {
  const saved = readStorage(STORAGE_KEYS.favorites, []);
  if (!Array.isArray(saved)) {
    return [];
  }
  return saved.filter((productId) => getProductById(productId));
}

function isFavorite(productId) {
  return getFavorites().includes(productId);
}

/** Regra de negócio: alterna o favorito e notifica os outros módulos. */
function toggleFavorite(productId) {
  const favorites = getFavorites();
  const position = favorites.indexOf(productId);
  let added;

  if (position === -1) {
    favorites.push(productId);
    added = true;
  } else {
    favorites.splice(position, 1);
    added = false;
  }

  writeStorage(STORAGE_KEYS.favorites, favorites);
  document.dispatchEvent(new CustomEvent('jj:favorites-change'));
  return added;
}

function paintFavoriteButton(button, active) {
  const product = getProductById(button.dataset.favoriteId);
  button.setAttribute('aria-pressed', String(active));

  if (product) {
    const action = active ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
    button.setAttribute('aria-label', `${action}: ${product.name}`);
    button.title = action;
  }
  const label = button.querySelector('.favorite-label');
  if (label) {
    label.textContent = active ? 'Favoritado' : 'Favoritar';
  }
}

/** Interface: reflete a lista salva em todos os botões de favorito. */
function syncFavoriteButtons() {
  const favorites = getFavorites();
  const buttons = document.querySelectorAll('[data-favorite-id]');

  for (let index = 0; index < buttons.length; index++) {
    paintFavoriteButton(buttons[index], favorites.includes(buttons[index].dataset.favoriteId));
  }
}

function createFavoriteButton(product, extraClass) {
  const button = makeElement('button', `favorite-toggle ${extraClass || ''}`.trim());
  button.type = 'button';
  button.dataset.favoriteId = product.id;
  button.append(makeIcon('heart'));
  button.addEventListener('click', () => handleFavoriteClick(product));
  paintFavoriteButton(button, isFavorite(product.id));
  return button;
}

function handleFavoriteClick(product) {
  const added = toggleFavorite(product.id);
  if (added) {
    showToast(`${product.name} foi salvo nos favoritos.`, 'Ver favoritos', () => {
      window.location.href = 'produtos.html?filtro=favoritos';
    });
  } else {
    showToast(`${product.name} saiu dos favoritos.`);
  }
}
