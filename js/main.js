/**
 * Integração das páginas: monta cards, detalhe de produto e cabeçalho.
 * Inicializa os módulos e atualiza a interface a partir dos eventos da loja.
 */

/* Cards de produto -------------------------------------------------------- */

function selectProductVersion(card, version, selectedButton, number, versionIndex, animateImage = false) {
  const image = card.querySelector('.card-img-top');
  const description = card.querySelector('.product-variant');
  const contactLink = card.querySelector('.product-whatsapp');
  const productName = card.querySelector('.card-title').textContent;

  card.dataset.versionIndex = String(versionIndex);
  image.src = version.image;
  image.alt = version.alt;
  const detailUrl = productUrl(card.dataset.productId, versionIndex);
  const imageLink = card.querySelector('.product-image-link');
  imageLink.href = detailUrl;
  imageLink.setAttribute('aria-label', `Ver ${productName}, cor ${version.description}`);
  card.querySelector('.product-name-link').href = detailUrl;
  if (animateImage && !prefersReducedMotion()) {
    const selectedImage = image.src;
    const fadeIn = () => {
      if (image.src !== selectedImage) return;
      image.animate([{ opacity: 0.55 }, { opacity: 1 }], {
        duration: 180,
        easing: 'ease-out'
      });
    };
    if (image.complete && image.naturalWidth > 0) {
      fadeIn();
    } else {
      image.addEventListener('load', fadeIn, { once: true });
    }
  }
  description.textContent = `Cor: ${version.description}`;
  contactLink.setAttribute('aria-label', `Consultar ${productName}, cor ${version.description}, no WhatsApp`);
  contactLink.title = 'Consultar no WhatsApp';
  if (/^\d{12,15}$/.test(number)) {
    contactLink.href = `https://wa.me/${number}?text=${encodeURIComponent(version.whatsappText)}`;
    contactLink.removeAttribute('aria-disabled');
  } else {
    contactLink.removeAttribute('href');
    contactLink.setAttribute('aria-disabled', 'true');
  }

  card.querySelector('.product-add').setAttribute(
    'aria-label',
    `Adicionar ${productName}, cor ${version.description}, ao carrinho`
  );
  card.querySelectorAll('.product-option').forEach((button) => {
    button.setAttribute('aria-pressed', String(button === selectedButton));
  });
}

function showAddedFeedback(button) {
  const label = button.querySelector('.product-add-label');
  window.clearTimeout(Number(button.dataset.feedbackTimer));
  button.classList.add('is-added');
  label.textContent = 'Adicionado';
  button.dataset.feedbackTimer = String(window.setTimeout(() => {
    button.classList.remove('is-added');
    label.textContent = 'Adicionar';
  }, 1600));
}

function createProductCard(product, headingTag, number, initialIndex = 0, priority = 'lazy') {
  const card = makeElement('article', 'card product-card');
  card.dataset.productId = product.id;
  const firstVersion = product.versions[initialIndex];

  const media = makeElement('div', 'product-media');
  const imageLink = makeElement('a', 'product-image-link');
  imageLink.href = productUrl(product.id, initialIndex);
  const image = makeElement('img', 'card-img-top');
  image.width = 800;
  image.height = 1067;
  image.decoding = 'async';
  if (priority === 'lazy') {
    image.loading = 'lazy';
  } else if (priority === 'high') {
    image.fetchPriority = 'high';
  }
  image.src = firstVersion.image;
  image.alt = firstVersion.alt;
  imageLink.append(image);
  media.append(imageLink, createFavoriteButton(product, 'card-favorite'));
  if (product.isNew) {
    media.append(makeElement('span', 'product-badge', 'Novo'));
  }

  const body = makeElement('div', 'card-body');
  const heading = makeElement(headingTag, 'card-title');
  const nameLink = makeElement('a', 'product-name-link', product.name);
  nameLink.href = imageLink.href;
  heading.append(nameLink);
  body.append(heading);

  const options = makeElement('div', 'product-options');
  options.setAttribute('role', 'group');
  options.setAttribute('aria-label', `Cores de ${product.name}`);
  let selectedButton = null;

  product.versions.forEach((version, index) => {
    const button = makeElement('button', 'product-option');
    button.type = 'button';
    button.setAttribute('aria-label', `Cor ${version.description} do ${product.name}`);
    button.setAttribute('aria-pressed', String(index === initialIndex));
    button.title = version.description;
    button.style.setProperty('--swatch-fill', swatchFill(version));
    button.addEventListener('click', () => {
      selectProductVersion(card, version, button, number, index, true);
    });
    if (index === initialIndex) selectedButton = button;
    options.append(button);
  });
  body.append(options);

  body.append(
    makeElement('p', 'product-variant', `Cor: ${firstVersion.description}`),
    makeElement('p', 'product-price', 'Preço sob consulta')
  );

  const actions = makeElement('div', 'product-actions');
  const addButton = makeElement('button', 'product-add');
  addButton.type = 'button';
  addButton.append(makeIcon('bag'), makeElement('span', 'product-add-label', 'Adicionar'));
  addButton.addEventListener('click', () => {
    addToCart(product.id, Number(card.dataset.versionIndex), 1);
    showAddedFeedback(addButton);
  });

  const contactLink = makeElement('a', 'btn product-whatsapp');
  contactLink.target = '_blank';
  contactLink.rel = 'noopener noreferrer';
  contactLink.append(makeWhatsAppIcon());

  actions.append(addButton, contactLink);
  body.append(actions);
  card.append(media, body);
  selectProductVersion(card, firstVersion, selectedButton, number, initialIndex);
  return card;
}

function renderProducts(number) {
  document.querySelectorAll('[data-product-list="home"]').forEach((list) => {
    const featured = getFeaturedProducts(4);
    list.replaceChildren(...featured.map((entry) => createProductCard(entry.product, 'h3', number, entry.versionIndex)));
  });
  syncFavoriteButtons();
}

/* Página individual do produto ------------------------------------------- */

function getRelatedProducts(product, limit) {
  const others = PRODUCTS.filter((item) => item.id !== product.id);
  const score = (item) => {
    if (item.brand === product.brand) return 2;
    if (item.isNew) return 1;
    return 0;
  };
  return others
    .map((item, order) => ({ item, order }))
    .sort((a, b) => score(b.item) - score(a.item) || a.order - b.order)
    .slice(0, limit)
    .map((entry) => entry.item);
}

function initializeDetailQuantity() {
  const input = document.getElementById('detail-quantity');
  const decrease = document.getElementById('detail-decrease');
  const increase = document.getElementById('detail-increase');

  const update = (value) => {
    const quantity = clampQuantity(value);
    input.value = String(quantity);
    decrease.disabled = quantity <= 1;
    increase.disabled = quantity >= CART_MAX_QUANTITY;
  };

  decrease.addEventListener('click', () => update(Number(input.value) - 1));
  increase.addEventListener('click', () => update(Number(input.value) + 1));
  input.addEventListener('change', () => update(input.value));
  update(1);
}

function renderProductDetail(number) {
  const detail = document.getElementById('product-detail');
  if (!detail) return null;

  const params = new URLSearchParams(window.location.search);
  const product = getProductById(params.get('id'));
  if (!product) {
    document.getElementById('product-not-found').hidden = false;
    document.title = 'Produto não encontrado | JJ Style';
    return null;
  }

  const requestedVersion = Number(params.get('versao')) - 1;
  let currentIndex = isValidVersion(product, requestedVersion) ? requestedVersion : 0;
  const image = document.getElementById('detail-image');
  image.fetchPriority = 'high';
  const colorName = document.getElementById('detail-color-name');
  const contactLink = document.getElementById('detail-whatsapp');
  const options = document.getElementById('detail-options');
  const favoriteButton = document.getElementById('detail-favorite');

  document.title = `${product.name} | JJ Style`;
  document.getElementById('detail-breadcrumb-name').textContent = product.name;
  document.getElementById('detail-name').textContent = product.name;
  document.getElementById('detail-brand').textContent = product.brand;
  document.getElementById('detail-badge').hidden = !product.isNew;
  options.setAttribute('aria-label', `Cores de ${product.name}`);

  function selectVersion(index, updateUrl = false) {
    const version = product.versions[index];
    currentIndex = index;
    image.src = version.image;
    image.alt = version.alt;
    colorName.textContent = version.description;
    contactLink.setAttribute('aria-label', `Consultar ${product.name}, cor ${version.description}, no WhatsApp`);
    if (/^\d{12,15}$/.test(number)) {
      contactLink.href = `https://wa.me/${number}?text=${encodeURIComponent(version.whatsappText)}`;
      contactLink.removeAttribute('aria-disabled');
    } else {
      contactLink.removeAttribute('href');
      contactLink.setAttribute('aria-disabled', 'true');
    }
    options.querySelectorAll('.product-option').forEach((button, buttonIndex) => {
      button.setAttribute('aria-pressed', String(buttonIndex === index));
    });
    addToHistory(product.id, index);
    if (updateUrl) window.history.replaceState(null, '', productUrl(product.id, index));
  }

  product.versions.forEach((version, index) => {
    const button = makeElement('button', 'product-option');
    button.type = 'button';
    button.title = version.description;
    button.setAttribute('aria-label', `Selecionar cor ${version.description}`);
    button.style.setProperty('--swatch-fill', swatchFill(version));
    button.addEventListener('click', () => selectVersion(index, true));
    options.append(button);
  });

  favoriteButton.dataset.favoriteId = product.id;
  favoriteButton.addEventListener('click', () => handleFavoriteClick(product));

  initializeDetailQuantity();
  document.getElementById('detail-add').addEventListener('click', () => {
    const quantity = clampQuantity(document.getElementById('detail-quantity').value);
    addToCart(product.id, currentIndex, quantity);
  });

  const relatedList = document.getElementById('related-products');
  if (relatedList) {
    const related = getRelatedProducts(product, 4);
    relatedList.replaceChildren(...related.map((item) => createProductCard(item, 'h3', number)));
    document.getElementById('related-section').hidden = related.length === 0;
  }

  selectVersion(currentIndex);
  syncFavoriteButtons();
  detail.hidden = false;
  return product.id;
}

/* Header: contadores de favoritos e carrinho ------------------------------ */

function setBadge(badge, value) {
  if (!badge) return;
  const previous = badge.textContent;
  badge.textContent = value > 99 ? '99+' : String(value);
  badge.hidden = value === 0;
  if (value > 0 && previous !== badge.textContent) {
    bumpBadge(badge);
  }
}

function updateHeaderCounters() {
  const favoritesTotal = getFavorites().length;
  const cartTotal = countCartItems(getCart());

  setBadge(document.getElementById('favorites-count'), favoritesTotal);
  setBadge(document.getElementById('cart-count'), cartTotal);

  const favoritesLink = document.getElementById('header-favorites');
  const cartButton = document.getElementById('header-cart');
  if (favoritesLink) {
    favoritesLink.setAttribute('aria-label', `Favoritos (${favoritesTotal})`);
  }
  if (cartButton) {
    cartButton.setAttribute('aria-label', `Abrir carrinho (${cartTotal} ${cartTotal === 1 ? 'item' : 'itens'})`);
  }
}

/** Eventos da aplicação: atualizam contadores e sincronizam outras abas. */
function initializeAppEvents() {
  document.addEventListener('jj:favorites-change', () => {
    updateHeaderCounters();
    syncFavoriteButtons();
  });
  document.addEventListener('jj:cart-change', () => {
    updateHeaderCounters();
    renderCart();
  });

  window.addEventListener('storage', (event) => {
    switch (event.key) {
      case STORAGE_KEYS.favorites:
        document.dispatchEvent(new CustomEvent('jj:favorites-change'));
        break;
      case STORAGE_KEYS.cart:
        document.dispatchEvent(new CustomEvent('jj:cart-change'));
        break;
      case STORAGE_KEYS.history:
        document.dispatchEvent(new CustomEvent('jj:history-change'));
        break;
      case null:
        document.dispatchEvent(new CustomEvent('jj:favorites-change'));
        document.dispatchEvent(new CustomEvent('jj:cart-change'));
        document.dispatchEvent(new CustomEvent('jj:history-change'));
        break;
      default:
        break;
    }
  });
}

/* Links, Bootstrap e contato (Parte I) ------------------------------------ */

function activateExternalLink(link, href) {
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
}

function activateSocialLink(link, href, label) {
  activateExternalLink(link, href);
  link.setAttribute('aria-label', label);
  link.title = label;
}

function initializeBootstrap() {
  if (!window.bootstrap) return;

  const carousel = document.getElementById('carousel-destaques');
  if (carousel) {
    bootstrap.Carousel.getOrCreateInstance(carousel);
  }

  const menu = document.getElementById('menu-principal');
  const menuLinks = menu.querySelectorAll('.nav-link, .nav-contact');
  menuLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (menu.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(menu).hide();
      }
    });
  });
}

function openWhatsApp(number, message) {
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function initializeWholesaleWhatsApp(number) {
  document.querySelectorAll('[data-whatsapp-message]').forEach((button) => {
    button.disabled = false;
    button.addEventListener('click', () => {
      openWhatsApp(number, button.dataset.whatsappMessage);
    });
  });
}

function initializeContactForm(number) {
  const form = document.getElementById('form-contato');
  if (!form) return;
  form.querySelector('[type="submit"]').disabled = false;
  document.getElementById('form-note').textContent =
    'Ao continuar, a mensagem será preparada no WhatsApp. Confirme o envio no aplicativo.';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const fields = new FormData(form);
    const message = `Olá! Meu nome é ${fields.get('nome')}.\nWhatsApp: ${fields.get('telefone')}\nAssunto: ${fields.get('assunto')}\nMensagem: ${fields.get('mensagem')}`;
    openWhatsApp(number, message);
  });
}

function initializeWhatsApp() {
  const number = STORE_CONFIG.whatsappNumber.replace(/\D/g, '');
  if (!/^\d{12,15}$/.test(number)) return;

  const socialLink = document.querySelector('[data-social="whatsapp"]');
  if (socialLink) {
    activateSocialLink(socialLink, `https://wa.me/${number}`, 'Conversar com a JJ Style no WhatsApp');
  }
  activateExternalLink(document.getElementById('header-whatsapp'), `https://wa.me/${number}`);
  activateExternalLink(document.getElementById('footer-whatsapp'), `https://wa.me/${number}`);
  initializeWholesaleWhatsApp(number);
  initializeContactForm(number);
}

function initializeInstagram() {
  try {
    const instagram = new URL(STORE_CONFIG.instagramUrl);
    const validDomain = ['instagram.com', 'www.instagram.com'].includes(instagram.hostname);

    if (instagram.protocol === 'https:' && validDomain && instagram.pathname !== '/') {
      const socialLink = document.querySelector('[data-social="instagram"]');
      if (socialLink) {
        activateSocialLink(socialLink, instagram.href, 'Visitar a JJ Style no Instagram');
      }
    }
  } catch (_) {
  }
}

function initializeLocation() {
  const address = STORE_CONFIG.address.trim();
  if (!address) return;

  document.querySelectorAll('[data-store-address]').forEach((element) => {
    element.textContent = address;
  });

  const addressText = document.getElementById('address-text');
  if (addressText) addressText.textContent = address;

  const routeButton = document.getElementById('route-button');
  if (!routeButton) return;

  routeButton.disabled = false;
  routeButton.addEventListener('click', () => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  });
}

/* Inicialização ----------------------------------------------------------- */

const WHATSAPP_NUMBER = STORE_CONFIG.whatsappNumber.replace(/\D/g, '');

initializeBootstrap();
initializeToast();
initializeAppEvents();
renderProducts(WHATSAPP_NUMBER);
initializeCatalog();
const currentProductId = renderProductDetail(WHATSAPP_NUMBER);
initializeHistory(currentProductId);
initializeCart();
updateHeaderCounters();
initializeWhatsApp();
initializeInstagram();
initializeLocation();
