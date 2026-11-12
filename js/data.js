/**
 * Dados centrais da loja: configuração, produtos e versões de cor.
 * O catálogo, os favoritos e o carrinho reutilizam estas informações.
 */

const STORE_CONFIG = Object.freeze({
  whatsappNumber: '5575999312633',
  instagramUrl: 'https://www.instagram.com/jjstylle_/',
  address: 'R. Comendador Gomes, 483 - Parque Panorama, Feira de Santana - BA, 44091-238'
});

/** Catálogo: cada produto reúne marca, imagens e versões disponíveis. */
const PRODUCTS = [
  {
    id: 'puma-essentials',
    name: 'Conjunto Puma Essentials',
    brand: 'Puma',
    isNew: false,
    versions: [
      {
        swatch: ['#ececf2', '#1b1a20'],
        description: 'Branco e preto',
        image: 'images/produtos/produto-01-puma-branco-preto.webp',
        alt: 'Camiseta Puma branca com bermuda preta',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Puma Essentials, branco e preto.'
      },
      {
        swatch: ['#a8cdf5', '#d0bea5'],
        description: 'Azul e bege',
        image: 'images/produtos/01-puma-azul-bege.webp',
        alt: 'Camiseta Puma azul com bermuda bege',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Puma Essentials, azul e bege.'
      }
    ]
  },
  {
    id: 'adidas-performance',
    name: 'Conjunto Adidas Performance',
    brand: 'Adidas',
    isNew: false,
    versions: [
      {
        swatch: ['#242527'],
        description: 'Preto',
        image: 'images/produtos/produto-02-adidas-preto.webp',
        alt: 'Conjunto Adidas preto',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Adidas Performance, preto.'
      },
      {
        swatch: ['#afb2ba', '#1d3153'],
        description: 'Cinza e azul-marinho',
        image: 'images/produtos/02-adidas-cinza-azul-marinho.webp',
        alt: 'Camiseta Adidas cinza com bermuda azul-marinho',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Adidas Performance, cinza e azul-marinho.'
      }
    ]
  },
  {
    id: 'puma-sport',
    name: 'Conjunto Puma Sport',
    brand: 'Puma',
    isNew: false,
    versions: [
      {
        swatch: ['#1e1e23', '#eeedf1'],
        description: 'Preto e branco',
        image: 'images/produtos/produto-03-puma-preto-branco.webp',
        alt: 'Camiseta Puma preta de manga longa com bermuda branca',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Puma Sport, preto e branco.'
      },
      {
        swatch: ['#601222', '#ddcbb0'],
        description: 'Vinho e bege',
        image: 'images/produtos/03-puma-vinho-bege.webp',
        alt: 'Camiseta Puma vinho de manga longa com bermuda bege',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Puma Sport, vinho e bege.'
      }
    ]
  },
  {
    id: 'lacoste-sport',
    name: 'Conjunto Lacoste Sport',
    brand: 'Lacoste',
    isNew: false,
    versions: [
      {
        swatch: ['#de0927'],
        description: 'Vermelho',
        image: 'images/produtos/produto-04-lacoste-vermelho.webp',
        alt: 'Conjunto Lacoste vermelho',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Lacoste Sport, vermelho.'
      },
      {
        swatch: ['#1b2a49'],
        description: 'Azul-marinho',
        image: 'images/produtos/04-lacoste-azul-marinho.webp',
        alt: 'Regata e bermuda Lacoste azul-marinho',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Lacoste Sport, azul-marinho.'
      }
    ]
  },
  {
    id: 'quiksilver-classic',
    name: 'Conjunto Quiksilver Classic',
    brand: 'Quiksilver',
    isNew: false,
    versions: [
      {
        swatch: ['#171719', '#efeeee'],
        description: 'Preto e branco',
        image: 'images/produtos/produto-05-quiksilver-preto-branco.webp',
        alt: 'Conjunto Quiksilver preto e branco',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Quiksilver Classic, preto e branco.'
      },
      {
        swatch: ['#303827', '#d5c5af'],
        description: 'Verde-oliva e bege',
        image: 'images/produtos/05-quiksilver-verde-oliva-bege.webp',
        alt: 'Camisetas Quiksilver verde-oliva com bermuda bege',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Quiksilver Classic, verde-oliva e bege.'
      }
    ]
  },
  {
    id: 'brt',
    name: 'Conjunto BRT',
    brand: 'BRT',
    isNew: false,
    versions: [
      {
        swatch: ['#eeeef4', '#17181c'],
        description: 'Branco e preto',
        image: 'images/produtos/produto-06-brt-branco-preto.webp',
        alt: 'Conjunto BRT branco e preto',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto BRT, branco e preto.'
      },
      {
        swatch: ['#c4b3ee', '#5e5f63'],
        description: 'Lilás e cinza',
        image: 'images/produtos/06-brt-lilas-cinza.webp',
        alt: 'Camiseta BRT lilás com bermuda cinza',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto BRT, lilás e cinza.'
      }
    ]
  },
  {
    id: 'nike-urban',
    name: 'Conjunto Nike Urban',
    brand: 'Nike',
    isNew: true,
    versions: [
      {
        swatch: ['#141518', '#5c5d61'],
        description: 'Preto e cinza',
        image: 'images/produtos/produto-07-nike-urban-preto-cinza.webp',
        alt: 'Camiseta Nike preta com bermuda cinza',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Nike Urban, preto e cinza.'
      }
    ]
  },
  {
    id: 'new-balance-casual',
    name: 'Conjunto New Balance Casual',
    brand: 'New Balance',
    isNew: true,
    versions: [
      {
        swatch: ['#d4bc9a', '#16171a'],
        description: 'Bege e preto',
        image: 'images/produtos/produto-08-new-balance-casual-bege-preto.webp',
        alt: 'Camiseta New Balance bege com bermuda preta',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto New Balance Casual, bege e preto.'
      }
    ]
  },
  {
    id: 'under-armour-active',
    name: 'Conjunto Under Armour Active',
    brand: 'Under Armour',
    isNew: true,
    versions: [
      {
        swatch: ['#4a5530', '#151618'],
        description: 'Verde-oliva e preto',
        image: 'images/produtos/produto-09-under-armour-active-verde-oliva-preto.webp',
        alt: 'Camiseta Under Armour verde-oliva com bermuda preta',
        whatsappText: 'Olá! Gostaria de consultar o preço e as condições do Conjunto Under Armour Active, verde-oliva e preto.'
      }
    ]
  }
];

/** Consultas auxiliares usadas por todas as páginas. */
function getProductById(productId) {
  return PRODUCTS.find((product) => product.id === productId);
}

function isValidVersion(product, versionIndex) {
  return Boolean(product)
    && Number.isInteger(versionIndex)
    && versionIndex >= 0
    && versionIndex < product.versions.length;
}

function getThumbnail(version) {
  return version.image.replace('images/produtos/', 'images/produtos/thumbs/');
}

function getVersionColors(version) {
  return version.description
    .split(' e ')
    .map((color) => color.trim())
    .map((color) => color.charAt(0).toUpperCase() + color.slice(1));
}
