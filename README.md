# JJ Style — Home, catálogo e produto

Home responsiva, catálogo e página individual de produto para a JJ Style, com a identidade visual do [Figma da Home](https://www.figma.com/design/SEKixVXDTfooARsFs5MlaC). O projeto usa HTML5, CSS3, JavaScript simples e Bootstrap 5.3.8 por CDN. Não há processo de build, React, Tailwind ou checkout.

## Executar

Abra `index.html` em um navegador ou sirva a pasta localmente:

```bash
python -m http.server 8765
```

Depois visite `http://localhost:8765/` e use “Ver todos” para abrir `produtos.html`. O Bootstrap é referenciado pelo CDN; os arquivos oficiais em `vendor/bootstrap/` servem como fallback para ambientes que bloqueiam o CDN. Os caminhos relativos funcionam também quando a pasta é publicada no GitHub Pages.

## Estrutura

- `index.html`: Home com quatro produtos em destaque, navbar, carousel e formulário.
- `produtos.html`: catálogo com os seis produtos e consultas individuais pelo WhatsApp.
- `produto.html`: página individual que lê `id` e `versao` da URL, por exemplo `produto.html?id=puma-essentials&versao=2`.
- `css/style.css`: identidade visual, animação das marcas e responsividade.
- `js/main.js`: dados únicos dos seis produtos e suas versões, seletores de cor dos cards e da página individual, menu, carrossel e ações de contato compartilhadas pelas três páginas.
- Os dois ícones sociais do contato usam apenas HTML, SVG e CSS; a troca por seta também funciona com foco pelo teclado e sem animação em `prefers-reduced-motion`.
- `images/`: imagens fornecidas para banners, marcas, produtos, branding e loja.

## Contatos e configuração

Os contatos oficiais ficam no início de `js/main.js`, em `STORE_CONFIG`:

```js
const STORE_CONFIG = Object.freeze({
  whatsappNumber: '5575988215508', // DDI e DDD, somente dígitos
  instagramUrl: 'https://www.instagram.com/jjstylle_/',
  address: 'R. Comendador Gomes, 483 - Parque Panorama, Feira de Santana - BA, 44091-238' // Endereço do mapa fornecido
});
```

Os ícones sociais, o header e o footer abrem os contatos oficiais em nova aba. Os cards e o bloco de atacado preparam mensagens no WhatsApp; o formulário inclui os campos preenchidos. A pessoa ainda precisa confirmar o envio no aplicativo. O botão de rotas usa o endereço incluído no mapa fornecido.

A Home e o catálogo montam os cards a partir de `PRODUCTS`, em `js/main.js`. Cada versão guarda imagem, descrição, cores da amostra e mensagem própria de WhatsApp. Os círculos sob o nome mostram as cores disponíveis nas fotos; conjuntos de duas cores usam uma amostra dividida. A Home mostra os quatro primeiros modelos; o catálogo mostra os seis. A foto e o nome de cada card abrem a página individual com a cor selecionada; “CONSULTAR” continua a abrir o WhatsApp diretamente. Para acrescentar ou corrigir uma versão, edite somente essa lista.

O mapa incorporado usa o iframe fornecido pela loja. Seu `src` permanece no `index.html`; a altura e a largura são definidas em `css/style.css`.

**Dados a confirmar com a loja:** preços e condições comerciais dos seis produtos; nomes comerciais dos modelos. As cores exibidas foram conferidas nas imagens disponíveis. Até lá, os cards mostram “Preço sob consulta”. Não há cálculo de frete, pagamento ou compra simulada.

A galeria do Instagram foi deixada para uma etapa posterior. Nas artes mobile dos banners 01 e 03, a chamada para Produtos aparece dentro da área do banner e leva à vitrine da Home.

## Orientação do TDE

O PDF do TDE também descreve versionamento em Git/GitHub e publicação em GitHub Pages ou Vercel para a entrega final. Esta pasta contém a implementação da Home e do catálogo; o repositório, os commits e a hospedagem devem ser preparados pelo grupo quando os dados da loja estiverem confirmados.
