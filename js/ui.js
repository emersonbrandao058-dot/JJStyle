/**
 * Componentes reutilizáveis da interface: elementos, ícones, cores e avisos.
 */

function makeElement(tag, className, textContent) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  return element;
}

const ICON_PATHS = {
  heart: ['M12 20s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 6.9a4.3 4.3 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20Z'],
  bag: ['M5.5 8.5h13l-1.1 11.5H6.6L5.5 8.5Z', 'M9 8.5V7a3 3 0 0 1 6 0v1.5'],
  trash: ['M5 7h14', 'M10 7V5h4v2', 'M7 7l.9 12.5h8.2L17 7', 'M10.5 11v5', 'M13.5 11v5'],
  minus: ['M6 12h12'],
  plus: ['M12 6v12', 'M6 12h12'],
  check: ['m5.5 12.5 4 4 9-9'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7.5V12l3 2']
};

function makeIcon(name) {
  const namespace = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(namespace, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  icon.classList.add('icon', `icon-${name}`);

  const paths = ICON_PATHS[name] || [];
  for (let index = 0; index < paths.length; index++) {
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', paths[index]);
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.7');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    icon.append(path);
  }
  return icon;
}

function makeWhatsAppIcon() {
  const namespace = 'http://www.w3.org/2000/svg';
  const icon = document.createElementNS(namespace, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');

  [
    ['M5.2 17.8 3.8 21l3.5-1.2A9 9 0 1 0 5.2 17.8Z', '1.7'],
    ['M8.2 7.8c.3-.4.6-.4.9-.4h.5c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.7.9c.7 1.2 1.6 2.1 2.8 2.7l.9-.7c.2-.2.5-.2.7-.1l1.9.8c.3.1.4.3.4.5v.5c0 .4-.1.7-.4.9-.5.4-1.2.6-1.9.4-2.8-.7-5.3-3.1-6.4-5.8-.3-.8-.3-1.5.1-2.1Z', '1.4']
  ].forEach(([shape, width]) => {
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', shape);
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', width);
    path.setAttribute('stroke-linejoin', 'round');
    icon.append(path);
  });
  return icon;
}

function swatchFill(version) {
  if (version.swatch.length === 1) {
    return version.swatch[0];
  }
  return `linear-gradient(90deg, ${version.swatch[0]} 50%, ${version.swatch[1]} 50%)`;
}

function productUrl(productId, versionIndex) {
  return `produto.html?id=${encodeURIComponent(productId)}&versao=${versionIndex + 1}`;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* Aviso flutuante (toast) ------------------------------------------------- */
let toastTimer = null;

/** Feedback visual: aviso temporário com ação opcional, como Desfazer. */
function showToast(message, actionLabel, onAction) {
  const toast = document.getElementById('jj-toast');
  if (!toast) return;

  const text = document.getElementById('jj-toast-text');
  const actionButton = document.getElementById('jj-toast-action');
  const liveRegion = document.getElementById('jj-live');
  text.textContent = message;
  if (liveRegion) liveRegion.textContent = message;

  if (actionLabel && onAction) {
    actionButton.textContent = actionLabel;
    actionButton.hidden = false;
    actionButton.onclick = () => {
      hideToast();
      onAction();
    };
  } else {
    actionButton.hidden = true;
    actionButton.onclick = null;
  }

  placeToast(toast);
  toast.hidden = false;
  void toast.offsetWidth;
  toast.classList.add('is-visible');

  toast.dataset.duration = String(actionLabel && onAction ? 8000 : 3800);
  startToastTimer(toast);
}

function placeToast(toast) {
  const drawer = document.getElementById('carrinho');
  const host = drawer && drawer.classList.contains('show') ? drawer : document.body;
  if (toast.parentElement !== host) {
    host.append(toast);
  }
}

function startToastTimer(toast) {
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(hideToast, Number(toast.dataset.duration) || 3800);
}

function initializeToast() {
  const toast = document.getElementById('jj-toast');
  if (!toast) return;

  const pause = () => window.clearTimeout(toastTimer);
  const resume = () => {
    if (!toast.hidden && !toast.contains(document.activeElement)) startToastTimer(toast);
  };
  toast.addEventListener('mouseenter', pause);
  toast.addEventListener('focusin', pause);
  toast.addEventListener('mouseleave', resume);
  toast.addEventListener('focusout', () => window.setTimeout(resume, 0));

  const drawer = document.getElementById('carrinho');
  if (drawer) {
    drawer.addEventListener('hide.bs.offcanvas', () => document.body.append(toast));
  }
}

function hideToast() {
  const toast = document.getElementById('jj-toast');
  if (!toast) return;
  toast.classList.remove('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 250);
}

function bumpBadge(badge) {
  if (!badge || prefersReducedMotion()) return;
  badge.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
    { duration: 320, easing: 'ease-out' }
  );
}
