# JJ Style — Home, catálogo e produto

Home responsiva, catálogo e página individual de produto para a JJ Style, com a identidade visual do [Figma da Home](https://www.figma.com/design/SEKixVXDTfooARsFs5MlaC). O projeto usa HTML5, CSS3, JavaScript simples e Bootstrap 5.3.8 por CDN. Não há processo de build, React, Tailwind ou checkout.

## Executar

Abra `index.html` em um navegador ou sirva a pasta localmente:

```bash
python -m http.server 8765
```

Depois visite `http://localhost:8765/` e use “Ver todos” para abrir `produtos.html`. O Bootstrap é referenciado pelo CDN; os arquivos em `vendor/bootstrap/` servem como fallback para ambientes que bloqueiam o CDN. Os caminhos relativos também funcionam no site publicado na Vercel.

## Estrutura

- `index.html`: Home com quatro produtos em destaque, navbar, carousel e formulário.
- `produtos.html`: catálogo com os seis produtos e consultas individuais pelo WhatsApp.
- `produto.html`: página individual que lê `id` e `versao` da URL, por exemplo `produto.html?id=puma-essentials&versao=2`.
- `css/style.css`: identidade visual, animação das marcas e responsividade.
- `js/main.js`: dados únicos dos seis produtos e suas versões, seletores de cor dos cards e da página individual, menu, carrossel e ações de contato compartilhadas pelas três páginas.
- Os dois ícones sociais do contato usam apenas HTML, SVG e CSS; a troca por seta também funciona com foco pelo teclado e sem animação em `prefers-reduced-motion`.
- `images/`: imagens fornecidas para banners, marcas, produtos, branding e loja.

## Contatos e configuração

Os destinos usados nesta demonstração ficam no início de `js/main.js`, em `STORE_CONFIG`:

```js
const STORE_CONFIG = Object.freeze({
  whatsappNumber: '5575999312633', // DDI e DDD, somente dígitos
  instagramUrl: 'https://www.instagram.com/jjstylle_/',
  address: 'R. Comendador Gomes, 483 - Parque Panorama, Feira de Santana - BA, 44091-238' // Endereço do mapa fornecido
});
```

**O WhatsApp 5575999312633 é um contato de demonstração deste projeto acadêmico, não o contato oficial da loja.** Os links de WhatsApp do header, footer, cards e bloco de atacado usam esse número. O formulário prepara uma mensagem com os campos preenchidos; a pessoa ainda precisa confirmar o envio no aplicativo. O botão de rotas usa o endereço incluído no mapa fornecido.

A Home e o catálogo montam os cards a partir de `PRODUCTS`, em `js/main.js`. Cada versão guarda imagem, descrição, cores da amostra e mensagem própria de WhatsApp. Os círculos sob o nome mostram as cores disponíveis nas fotos; conjuntos de duas cores usam uma amostra dividida. A Home mostra os quatro primeiros modelos; o catálogo mostra os seis. A foto e o nome de cada card abrem a página individual com a cor selecionada; “CONSULTAR” continua a abrir o WhatsApp diretamente. Para acrescentar ou corrigir uma versão, edite somente essa lista.

O mapa incorporado usa o iframe fornecido pela loja. Seu `src` permanece no `index.html`; a altura e a largura são definidas em `css/style.css`.

**Dados a confirmar com a loja:** preços e condições comerciais dos seis produtos; nomes comerciais dos modelos. As cores exibidas foram conferidas nas imagens disponíveis. Até lá, os cards mostram “Preço sob consulta”. Não há cálculo de frete, pagamento ou compra simulada.

A galeria do Instagram foi deixada para uma etapa posterior. Nas artes mobile dos banners 01 e 03, a chamada para Produtos aparece dentro da área do banner e leva à vitrine da Home.

## Entrega do TDE

- GitHub: [emersonbrandao058-dot/JJStyle](https://github.com/emersonbrandao058-dot/JJStyle)
- Site publicado: [jj-style.vercel.app](https://jj-style.vercel.app/)
- Design: [Figma da Home](https://www.figma.com/design/SEKixVXDTfooARsFs5MlaC)
- Páginas: `index.html`, `produtos.html` e `produto.html`.

O histórico Git registra pelo menos duas versões identificáveis: `7d83f44` (Versão 1 — Home e catálogo responsivos) e `5de55f5` (Versão 2 — página individual de produtos).
