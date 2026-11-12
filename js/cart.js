/**
 * Carrinho demonstrativo: produtos, versões, quantidades e pedido via WhatsApp.
 * Os dados são salvos no navegador, sem processamento de pagamentos.
 */

const CART_MAX_QUANTITY = 99;

/** Estado do carrinho: valida produtos e recupera os itens salvos. */
function getCart() {
  const saved = readStorage(STORAGE_KEYS.cart, []);
  const cart = [];
  if (!Array.isArray(saved)) {
    return cart;
  }

  for (let index = 0; index < saved.length; index++) {
    const item = saved[index] || {};
    const product = getProductById(item.productId);
    const quantity = Number(item.quantity);

    if (isValidVersion(product, item.versionIndex) && Number.isInteger(quantity) && quantity > 0) {
      cart.push({
        productId: item.productId,
        versionIndex: item.versionIndex,
        quantity: Math.min(quantity, CART_MAX_QUANTITY)
      });
    }
  }
  return cart;
}

function saveCart(cart) {
  writeStorage(STORAGE_KEYS.cart, cart);
  document.dispatchEvent(new CustomEvent('jj:cart-change'));
}

function countCartItems(cart) {
  let total = 0;
  for (const item of cart) {
    total += item.quantity;
  }
  return total;
}

function findCartLine(cart, productId, versionIndex) {
  return cart.findIndex((item) => item.productId === productId && item.versionIndex === versionIndex);
}

function clampQuantity(value) {
  const quantity = Number.parseInt(value, 10);
  if (Number.isNaN(quantity) || quantity < 1) {
    return 1;
  } else if (quantity > CART_MAX_QUANTITY) {
    return CART_MAX_QUANTITY;
  }
  return quantity;
}

/** Operações principais: adicionar, alterar quantidade e trocar a cor. */
function addToCart(productId, versionIndex, quantity) {
  const product = getProductById(productId);
  if (!isValidVersion(product, versionIndex)) return;

  const cart = getCart();
  const amount = clampQuantity(quantity || 1);
  const line = findCartLine(cart, productId, versionIndex);

  if (line === -1) {
    cart.push({ productId, versionIndex, quantity: amount });
  } else {
    cart[line].quantity = clampQuantity(cart[line].quantity + amount);
  }
  saveCart(cart);

  const version = product.versions[versionIndex];
  showToast(`${product.name} (${version.description}) foi adicionado ao carrinho.`, 'Ver carrinho', openCart);
}

function changeCartQuantity(lineIndex, action, typedValue) {
  const cart = getCart();
  const item = cart[lineIndex];
  if (!item) return;

  switch (action) {
    case 'increase':
      item.quantity = clampQuantity(item.quantity + 1);
      break;
    case 'decrease':
      item.quantity = clampQuantity(item.quantity - 1);
      break;
    case 'set':
      item.quantity = clampQuantity(typedValue);
      break;
    default:
      return;
  }
  saveCart(cart);
}

function changeCartVersion(lineIndex, newVersionIndex) {
  const cart = getCart();
  const item = cart[lineIndex];
  if (!item || !isValidVersion(getProductById(item.productId), newVersionIndex)) return;

  const existingLine = findCartLine(cart, item.productId, newVersionIndex);
  if (existingLine !== -1 && existingLine !== lineIndex) {
    cart[existingLine].quantity = clampQuantity(cart[existingLine].quantity + item.quantity);
    cart.splice(lineIndex, 1);
    showToast('Essa cor já estava no carrinho. As quantidades foram somadas.');
  } else {
    item.versionIndex = newVersionIndex;
  }
  saveCart(cart);
}

/** Desfazer seguro: restaura apenas itens removidos no carrinho atual. */
function restoreCartLines(lines, position) {
  const cart = getCart();
  let insertAt = Math.min(position, cart.length);

  for (const line of lines) {
    const existingLine = findCartLine(cart, line.productId, line.versionIndex);
    if (existingLine === -1) {
      cart.splice(insertAt, 0, { ...line });
      insertAt++;
    } else {
      cart[existingLine].quantity = clampQuantity(cart[existingLine].quantity + line.quantity);
    }
  }
  saveCart(cart);
}

function removeFromCart(lineIndex) {
  const cart = getCart();
  const removed = cart[lineIndex];
  if (!removed) return;

  cart.splice(lineIndex, 1);
  saveCart(cart);

  const product = getProductById(removed.productId);
  showToast(`${product.name} foi removido.`, 'Desfazer', () => {
    restoreCartLines([removed], lineIndex);
    showToast(`${product.name} voltou ao carrinho.`);
  });
}

function clearCart() {
  const removedLines = getCart();
  if (removedLines.length === 0) return;
  saveCart([]);
  showToast('O carrinho foi esvaziado.', 'Desfazer', () => {
    restoreCartLines(removedLines, 0);
    showToast('Os itens voltaram ao carrinho.');
  });
}

/* Painel do carrinho ------------------------------------------------------ */

function openCart() {
  const drawer = document.getElementById('carrinho');
  if (drawer && window.bootstrap) {
    bootstrap.Offcanvas.getOrCreateInstance(drawer).show();
  }
}

function createQuantityButton(action, lineIndex, label, iconName, disabled) {
  const button = makeElement('button', 'quantity-button');
  button.type = 'button';
  button.dataset.cartAction = action;
  button.dataset.line = String(lineIndex);
  button.setAttribute('aria-label', label);
  button.disabled = disabled;
  button.append(makeIcon(iconName));
  return button;
}

function createCartItem(item, lineIndex) {
  const product = getProductById(item.productId);
  const version = product.versions[item.versionIndex];
  const detailUrl = productUrl(product.id, item.versionIndex);

  const row = makeElement('li', 'cart-item');

  const thumbLink = makeElement('a', 'cart-thumb');
  thumbLink.href = detailUrl;
  thumbLink.tabIndex = -1;
  thumbLink.setAttribute('aria-hidden', 'true');
  const thumb = makeElement('img');
  thumb.src = getThumbnail(version);
  thumb.alt = '';
  thumb.width = 240;
  thumb.height = 320;
  thumb.loading = 'lazy';
  thumb.decoding = 'async';
  thumbLink.append(thumb);

  const info = makeElement('div', 'cart-info');
  const name = makeElement('a', 'cart-name', product.name);
  name.href = detailUrl;
  info.append(name);

  const colorRow = makeElement('div', 'cart-color');
  const colorDot = makeElement('span', 'cart-color-dot');
  colorDot.style.setProperty('--swatch-fill', swatchFill(version));
  colorRow.append(colorDot);

  if (product.versions.length > 1) {
    const select = makeElement('select', 'cart-color-select');
    select.dataset.cartAction = 'color';
    select.dataset.line = String(lineIndex);
    select.setAttribute('aria-label', `Cor de ${product.name}`);
    product.versions.forEach((option, optionIndex) => {
      const optionElement = makeElement('option', '', option.description);
      optionElement.value = String(optionIndex);
      optionElement.selected = optionIndex === item.versionIndex;
      select.append(optionElement);
    });
    colorRow.append(select);
  } else {
    colorRow.append(makeElement('span', 'cart-color-name', version.description));
  }
  info.append(colorRow);

  const actions = makeElement('div', 'cart-actions');
  const stepper = makeElement('div', 'quantity-stepper');
  const input = makeElement('input', 'quantity-input');
  input.type = 'number';
  input.inputMode = 'numeric';
  input.min = '1';
  input.max = String(CART_MAX_QUANTITY);
  input.value = String(item.quantity);
  input.dataset.cartAction = 'set';
  input.dataset.line = String(lineIndex);
  input.setAttribute('aria-label', `Quantidade de ${product.name}`);

  stepper.append(
    createQuantityButton('decrease', lineIndex, `Diminuir quantidade de ${product.name}`, 'minus', item.quantity <= 1),
    input,
    createQuantityButton('increase', lineIndex, `Aumentar quantidade de ${product.name}`, 'plus', item.quantity >= CART_MAX_QUANTITY)
  );

  const removeButton = makeElement('button', 'cart-remove');
  removeButton.type = 'button';
  removeButton.dataset.cartAction = 'remove';
  removeButton.dataset.line = String(lineIndex);
  removeButton.setAttribute('aria-label', `Remover ${product.name} do carrinho`);
  removeButton.append(makeIcon('trash'), makeElement('span', '', 'Remover'));

  actions.append(stepper, removeButton);
  info.append(actions);
  row.append(thumbLink, info);
  return row;
}

function renderCart() {
  const list = document.getElementById('cart-items');
  if (!list) return;

  const cart = getCart();
  const total = countCartItems(cart);
  const emptyState = document.getElementById('cart-empty');
  const details = document.getElementById('cart-details');
  const footer = document.getElementById('cart-footer');

  const focused = document.activeElement;
  const focusAction = focused && list.contains(focused) ? focused.dataset.cartAction : null;
  const focusLine = focusAction ? focused.dataset.line : null;

  const rows = [];
  for (let index = 0; index < cart.length; index++) {
    rows.push(createCartItem(cart[index], index));
  }
  list.replaceChildren(...rows);

  if (cart.length === 0) {
    emptyState.hidden = false;
    list.hidden = true;
    details.hidden = true;
    footer.hidden = true;
  } else {
    emptyState.hidden = true;
    list.hidden = false;
    details.hidden = false;
    footer.hidden = false;
  }

  document.getElementById('cart-total').textContent = total === 1 ? '1 item' : `${total} itens`;
  document.getElementById('cart-heading-count').textContent = total > 0 ? `(${total})` : '';

  if (focusAction) {
    const target = list.querySelector(`[data-cart-action="${focusAction}"][data-line="${focusLine}"]`);
    if (target && !target.disabled) {
      target.focus();
    } else {
      document.getElementById('carrinho-titulo').focus();
    }
  }
}

/* Mensagem do WhatsApp ---------------------------------------------------- */

function buildCartMessage(cart, customerName, notes) {
  const greeting = customerName ? `Olá, JJ Style! Aqui é ${customerName} 👋` : 'Olá, JJ Style! 👋';
  const lines = [
    greeting,
    'Montei um pedido pelo site e gostaria de saber preços e disponibilidade.',
    '',
    '🛍️ *MEU PEDIDO*',
    ''
  ];

  for (let index = 0; index < cart.length; index++) {
    const item = cart[index];
    const product = getProductById(item.productId);
    const version = product.versions[item.versionIndex];
    lines.push(`*${index + 1}. ${product.name}*`);
    lines.push(`▫️ Cor: ${version.description}`);
    lines.push(`▫️ Quantidade: ${item.quantity}`);
    lines.push('');
  }

  const total = countCartItems(cart);
  lines.push(`📦 *Total:* ${total} ${total === 1 ? 'peça' : 'peças'}`);

  if (notes) {
    lines.push(`📝 *Observações:* ${notes}`);
  }
  lines.push('', 'Fico no aguardo dos valores e condições. Obrigado!', '_Pedido enviado pelo site JJ Style_');
  return lines.join('\n');
}

function checkoutCart() {
  const cart = getCart();
  const number = STORE_CONFIG.whatsappNumber.replace(/\D/g, '');

  if (cart.length === 0) {
    showToast('Adicione pelo menos um produto antes de finalizar.');
    return;
  }
  if (!/^\d{12,15}$/.test(number)) {
    showToast('O WhatsApp da loja não está configurado.');
    return;
  }

  const customerName = document.getElementById('cart-name').value.trim();
  const notes = document.getElementById('cart-notes').value.trim();
  const message = buildCartMessage(cart, customerName, notes);
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  showToast('Pedido preparado no WhatsApp. Confirme o envio no aplicativo.');
}

/* Eventos do painel ------------------------------------------------------- */

function initializeCart() {
  const list = document.getElementById('cart-items');
  if (!list) return;

  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-cart-action]');
    if (!button) return;
    const lineIndex = Number(button.dataset.line);

    switch (button.dataset.cartAction) {
      case 'increase':
      case 'decrease':
        changeCartQuantity(lineIndex, button.dataset.cartAction);
        break;
      case 'remove':
        removeFromCart(lineIndex);
        break;
      default:
        break;
    }
  });

  list.addEventListener('change', (event) => {
    const field = event.target;
    const lineIndex = Number(field.dataset.line);

    if (field.dataset.cartAction === 'set') {
      changeCartQuantity(lineIndex, 'set', field.value);
    } else if (field.dataset.cartAction === 'color') {
      changeCartVersion(lineIndex, Number(field.value));
    }
  });

  const nameField = document.getElementById('cart-name');
  const notesField = document.getElementById('cart-notes');
  const savedOrder = readStorage(STORAGE_KEYS.order, {});
  if (savedOrder && typeof savedOrder === 'object') {
    nameField.value = typeof savedOrder.name === 'string' ? savedOrder.name : '';
    notesField.value = typeof savedOrder.notes === 'string' ? savedOrder.notes : '';
  }
  const saveOrderFields = () => {
    writeStorage(STORAGE_KEYS.order, { name: nameField.value, notes: notesField.value });
  };
  nameField.addEventListener('input', saveOrderFields);
  notesField.addEventListener('input', saveOrderFields);

  document.getElementById('cart-checkout').addEventListener('click', checkoutCart);
  document.getElementById('cart-clear').addEventListener('click', clearCart);

  renderCart();
}
