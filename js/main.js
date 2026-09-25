// Número com DDI e DDD; mensagens são montadas antes de abrir o WhatsApp.
const STORE_CONFIG = Object.freeze({
  whatsappNumber: '5575988215508',
  instagramUrl: 'https://www.instagram.com/jjstylle_/',
  address: 'R. Comendador Gomes, 483 - Parque Panorama, Feira de Santana - BA, 44091-238'
});

// Cada modelo aparece uma vez; Home e catálogo escolhem quantos cards exibir.
const PRODUCTS = [
  {
    name: 'Conjunto Puma Essentials',
    versions: [
      {
        swatch: ['#ececf2', '#1b1a20'],
        description: 'Branco e preto',
        image: 'images/produtos/produto-01-puma-branco-preto.png',
        alt: 'Camiseta Puma branca com bermuda preta',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Puma Essentials, branco e preto.'
      },
      {
        swatch: ['#a8cdf5', '#d0bea5'],
        description: 'Azul e bege',
        image: 'images/produtos/01-puma-azul-bege.png',
        alt: 'Camiseta Puma azul com bermuda bege',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Puma Essentials, azul e bege.'
      }
    ]
  },
  {
    name: 'Conjunto Adidas Performance',
    versions: [
      {
        swatch: ['#242527'],
        description: 'Preto',
        image: 'images/produtos/produto-02-adidas-preto.png',
        alt: 'Conjunto Adidas preto',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Adidas Performance, preto.'
      },
      {
        swatch: ['#afb2ba', '#1d3153'],
        description: 'Cinza e azul-marinho',
        image: 'images/produtos/02-adidas-cinza-azul-marinho.png',
        alt: 'Camiseta Adidas cinza com bermuda azul-marinho',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Adidas Performance, cinza e azul-marinho.'
      }
    ]
  },
  {
    name: 'Conjunto Puma Sport',
    versions: [
      {
        swatch: ['#1e1e23', '#eeedf1'],
        description: 'Preto e branco',
        image: 'images/produtos/produto-03-puma-preto-branco.png',
        alt: 'Camiseta Puma preta de manga longa com bermuda branca',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Puma Sport, preto e branco.'
      },
      {
        swatch: ['#601222', '#ddcbb0'],
        description: 'Vinho e bege',
        image: 'images/produtos/03-puma-vinho-bege.png',
        alt: 'Camiseta Puma vinho de manga longa com bermuda bege',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Puma Sport, vinho e bege.'
      }
    ]
  },
  {
    name: 'Conjunto Lacoste Sport',
    versions: [
      {
        swatch: ['#de0927'],
        description: 'Vermelho',
        image: 'images/produtos/produto-04-lacoste-vermelho.png',
        alt: 'Conjunto Lacoste vermelho',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Lacoste Sport, vermelho.'
      },
      {
        swatch: ['#1b2a49'],
        description: 'Azul-marinho',
        image: 'images/produtos/04-lacoste-azul-marinho.png',
        alt: 'Regata e bermuda Lacoste azul-marinho',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Lacoste Sport, azul-marinho.'
      }
    ]
  },
  {
    name: 'Conjunto Quiksilver Classic',
    versions: [
      {
        swatch: ['#171719', '#efeeee'],
        description: 'Preto e branco',
        image: 'images/produtos/produto-05-quiksilver-preto-branco.png',
        alt: 'Conjunto Quiksilver preto e branco',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Quiksilver Classic, preto e branco.'
      },
      {
        swatch: ['#303827', '#d5c5af'],
        description: 'Verde-oliva e bege',
        image: 'images/produtos/05-quiksilver-verde-oliva-bege.png',
        alt: 'Camisetas Quiksilver verde-oliva com bermuda bege',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Quiksilver Classic, verde-oliva e bege.'
      }
    ]
  },
  {
    name: 'Conjunto BRT',
    versions: [
      {
        swatch: ['#eeeef4', '#17181c'],
        description: 'Branco e preto',
        image: 'images/produtos/produto-06-brt-branco-preto.png',
        alt: 'Conjunto BRT branco e preto',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto BRT, branco e preto.'
      },
      {
        swatch: ['#c4b3ee', '#5e5f63'],
        description: 'Lilás e cinza',
        image: 'images/produtos/06-brt-lilas-cinza.png',
        alt: 'Camiseta BRT lilás com bermuda cinza',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto BRT, lilás e cinza.'
      }
    ]
  }
];

function makeElement(tag, className, textContent) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  return element;
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

function selectProductVersion(card, version, selectedButton, number, animateImage = false) {
  const image = card.querySelector('.card-img-top');
  const description = card.querySelector('.product-variant');
  const contactLink = card.querySelector('.product-whatsapp');

  image.src = version.image;
  image.alt = version.alt;
  if (animateImage && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  contactLink.setAttribute(
    'aria-label',
    `Consultar ${card.querySelector('.card-title').textContent}, cor ${version.description}, no WhatsApp`
  );
  if (/^\d{12,15}$/.test(number)) {
    contactLink.href = `https://wa.me/${number}?text=${encodeURIComponent(version.whatsappText)}`;
    contactLink.removeAttribute('aria-disabled');
  } else {
    contactLink.removeAttribute('href');
    contactLink.setAttribute('aria-disabled', 'true');
  }

  card.querySelectorAll('.product-option').forEach((button) => {
    button.setAttribute('aria-pressed', String(button === selectedButton));
  });
}

function createProductCard(product, headingTag, number) {
  const card = makeElement('article', 'card product-card');
  const firstVersion = product.versions[0];
  const image = makeElement('img', 'card-img-top');
  image.src = firstVersion.image;
  image.alt = firstVersion.alt;
  image.width = 1086;
  image.height = 1448;
  image.loading = 'lazy';

  const body = makeElement('div', 'card-body');
  body.append(makeElement(headingTag, 'card-title', product.name));

  if (product.versions.length > 1) {
    const options = makeElement('div', 'product-options');
    options.setAttribute('role', 'group');
    options.setAttribute('aria-label', `Cores de ${product.name}`);

    product.versions.forEach((version, index) => {
      const button = makeElement('button', 'product-option');
      button.type = 'button';
      button.setAttribute('aria-label', `Cor ${version.description} do ${product.name}`);
      button.setAttribute('aria-pressed', String(index === 0));
      button.title = version.description;
      const swatchFill = version.swatch.length === 1
        ? version.swatch[0]
        : `linear-gradient(90deg, ${version.swatch[0]} 50%, ${version.swatch[1]} 50%)`;
      button.style.setProperty('--swatch-fill', swatchFill);
      button.addEventListener('click', () => {
        selectProductVersion(card, version, button, number, true);
      });
      options.append(button);
    });
    body.append(options);
  }

  body.append(
    makeElement('p', 'product-variant', `Cor: ${firstVersion.description}`),
    makeElement('p', 'product-price', 'Preço sob consulta')
  );

  const contactLink = makeElement('a', 'btn product-whatsapp');
  contactLink.target = '_blank';
  contactLink.rel = 'noopener noreferrer';
  contactLink.append(
    makeWhatsAppIcon(),
    makeElement('span', '', 'CONSULTAR'),
    makeElement('span', 'product-whatsapp-arrow', '→')
  );
  body.append(contactLink);
  card.append(image, body);
  selectProductVersion(card, firstVersion, card.querySelector('.product-option'), number);
  return card;
}

function renderProducts(number) {
  document.querySelectorAll('[data-product-list]').forEach((list) => {
    const isHome = list.dataset.productList === 'home';
    const products = isHome ? PRODUCTS.slice(0, 4) : PRODUCTS;
    const headingTag = isHome ? 'h3' : 'h2';
    list.replaceChildren(...products.map((product) => createProductCard(product, headingTag, number)));
  });
}

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

function loadBootstrap() {
  if (window.bootstrap) {
    initializeBootstrap();
    return;
  }

  const fallbackScript = document.createElement('script');
  fallbackScript.src = 'vendor/bootstrap/bootstrap.bundle.min.js';
  fallbackScript.addEventListener('load', initializeBootstrap, { once: true });
  document.head.appendChild(fallbackScript);
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
    // Sem URL oficial, o ícone permanece visível e sem destino.
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

loadBootstrap();
renderProducts(STORE_CONFIG.whatsappNumber.replace(/\D/g, ''));
initializeWhatsApp();
initializeInstagram();
initializeLocation();
