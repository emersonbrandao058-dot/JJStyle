# JJ Style — Home, catálogo, produto e carrinho

Home responsiva, catálogo e página individual de produto para a JJ Style, com a identidade visual do [Figma da Home](https://www.figma.com/design/SEKixVXDTfooARsFs5MlaC). O projeto usa HTML5, CSS3, JavaScript simples e Bootstrap 5.3.8 (cópia local em `vendor/bootstrap/`). Não há processo de build, React ou Tailwind. Na Parte II, o site ganhou favoritos, busca e filtros, carrinho com envio pelo WhatsApp e histórico de produtos vistos, tudo salvo no LocalStorage do navegador.

## Executar

O site é estático e **não depende de nenhum servidor externo** (Bootstrap e a fonte Archivo estão na pasta `vendor/`). Abra `index.html` no navegador ou sirva a pasta localmente, por exemplo:

```bash
npx serve .          # ou a extensão "Live Server" do VS Code
python -m http.server 8765   # se o Python estiver instalado
```

Depois use “Ver todos” para abrir `produtos.html`. Os caminhos são relativos e funcionam igual no site publicado na Vercel.

## Estrutura

- `index.html`: Home com quatro produtos em destaque (os lançamentos aparecem primeiro), navbar, carrossel, formulário e “Vistos recentemente”.
- `produtos.html`: catálogo com os nove produtos, busca dinâmica, filtros e ordenação.
- `produto.html`: página individual que lê `id` e `versao` da URL, por exemplo `produto.html?id=puma-essentials&versao=2`. Tem quantidade, carrinho, favorito, sugestões e histórico.
- `css/style.css`: identidade visual, animação das marcas e responsividade. Os estilos da Parte II ficam na seção final do arquivo.
- `js/`: um arquivo por responsabilidade (veja abaixo).
- `images/`: imagens fornecidas para banners, marcas, produtos, branding e loja. O site usa as versões `.webp`; os `.png` originais foram mantidos como arquivo-fonte.
- `images/produtos/thumbs/`: miniaturas WebP (240 × 320) usadas no carrinho e no histórico.
- `vendor/bootstrap/`: Bootstrap 5.3.8 (CSS e JS) servido pelo próprio site. `vendor/fonts/`: fonte Archivo (licença OFL incluída).
- `tests/`: testes automáticos de ponta a ponta (veja “Testes”).
- `docs/`: material da disciplina (o `.docx` do professor fica aqui e **não é versionado**, ver `.gitignore`).

### Imagens, fontes e desempenho

As imagens foram convertidas para WebP mantendo as proporções originais: produtos em 800 × 1067, banners com até 1600 px de largura e miniaturas de 240 × 320. A função `getThumbnail` (`js/data.js`) encontra a miniatura de cada versão do produto. Para o carregamento ficar mais rápido:

- o primeiro banner e a foto da página do produto pedem prioridade alta (`fetchpriority="high"`); os banners 2 e 3, que começam escondidos, usam prioridade baixa;
- os cards abaixo da primeira linha, o carrinho, o histórico e o mapa usam `loading="lazy"`;
- todas as imagens declaram `width` e `height`, evitando que a página “pule” enquanto carrega;
- **Bootstrap e fonte vêm do próprio site.** Antes o CSS do Bootstrap era baixado duas vezes (CDN e cópia local) e o JavaScript vinha de um CDN, bloqueando a página. Agora há um único `bootstrap.min.css` e um `bootstrap.bundle.min.js` com `defer`, carregado antes dos scripts do site. A Archivo (fonte variável, 35 KB) também é local, com `preload`, então não há conexões a `cdn.jsdelivr.net`, `fonts.googleapis.com` ou `fonts.gstatic.com`. O site funciona offline, exceto o mapa e os links externos;
- o favicon continua em PNG, porque nem todo navegador aceita favicon em WebP.

Medição com o Edge (servidor local, sem cache): a Home no celular, com rolagem completa, transfere cerca de 1,4 MB de arquivos do próprio site (o mapa do Google, incorporado e externo, soma mais); o catálogo no desktop, 1,8 MB; a página de produto no celular, 1,1 MB. Os dois ícones sociais do contato usam apenas HTML, SVG e CSS.

### Banner no celular

Abaixo de 768 px, o banner mostra a arte em cima e o botão (“Ver produtos”, “Faça seu pedido”) numa **faixa própria logo abaixo da arte**. Assim o botão nunca cobre título, produto ou modelo, em nenhuma largura (de 320 a 767 px). No desktop, o botão continua posicionado sobre a arte horizontal. A altura da arte é definida por `--hero-art-height` no bloco `@media (max-width: 767.98px)` de `css/style.css`.

### Organização do JavaScript

Os scripts são carregados com `defer`, nesta ordem, em todas as páginas (o Bootstrap vem primeiro):

| Arquivo | Responsabilidade |
| --- | --- |
| `js/data.js` | `STORE_CONFIG` e a lista `PRODUCTS` (nome, marca, lançamento, versões de cor). Só dados. |
| `js/storage.js` | `readStorage`, `writeStorage` e `removeStorage`: acesso seguro ao LocalStorage com JSON e `try/catch`. Se o navegador bloquear o LocalStorage, usa uma memória temporária e o site continua funcionando na sessão. |
| `js/ui.js` | Funções de interface reaproveitadas: criar elementos, ícones SVG, amostras de cor e aviso flutuante (toast). |
| `js/favorites.js` | Adicionar/remover favoritos e atualizar todos os corações da página. |
| `js/cart.js` | Carrinho: adicionar, quantidade, troca de cor, remoção com “Desfazer”, painel lateral e mensagem do WhatsApp. |
| `js/history.js` | Histórico de produtos visualizados (até 8, sem repetição, mais recente primeiro). |
| `js/catalog.js` | Busca dinâmica, filtros rápidos, marca, cor, ordenação e sincronização com a URL. |
| `js/main.js` | Cards de produto, página do produto, contadores do header, eventos entre módulos e inicialização. |

Os módulos conversam por eventos próprios (`jj:favorites-change`, `jj:cart-change`, `jj:history-change`): quem altera os dados dispara o evento, e header, carrinho e catálogo se atualizam. O evento `storage` do navegador mantém abas diferentes sincronizadas.

## Funcionalidades da Parte II

- **Aviso acadêmico:** as três páginas exibem uma faixa laranja informando que a JJ Style é uma demonstração para a disciplina de Programação Front-End, sem vendas ou pagamentos reais. No primeiro acesso da aba, um preloader explica o contexto do projeto, permite entrada imediata e desaparece automaticamente. O código fica em `js/academic.js` e usa `sessionStorage` apenas para não repetir a abertura durante a navegação.

- **Novos produtos:** Conjunto Nike Urban (preto e cinza), Conjunto New Balance Casual (bege e preto) e Conjunto Under Armour Active (verde-oliva e preto), com selo “Novo”. O banner “Novidades da semana” abre o catálogo já filtrado em Novidades.
- **Favoritos:** coração nos cards e na página do produto; contador no header; o ícone do header abre `produtos.html?filtro=favoritos`. Ao remover um favorito dentro dessa lista, o foco do teclado vai para o card que ocupou o lugar (o próximo; se era o último, o anterior; se a lista esvaziou, para a mensagem de lista vazia).
- **Busca e filtros:** a busca filtra a cada letra e ignora acentos e maiúsculas (“lilas” encontra “Lilás”). Há filtros rápidos (Todos, Novidades, Favoritos), marca, cor e ordenação. Ao filtrar por cor, o card já aparece na versão daquela cor. O estado vai para a URL (ex.: `produtos.html?marca=Puma&cor=Bege`). Atalhos: `/` foca a busca e `Esc` limpa. O link `produtos.html#busca` (ícone de lupa do header) já abre com o cursor na busca.
- **Carrinho:** o botão “Adicionar” usa a cor selecionada no card; na página do produto também é possível escolher a quantidade. No painel lateral, cada item permite trocar a cor (cores iguais são somadas), alterar a quantidade (1 a 99), remover e desfazer. Nome e observações (ex.: tamanhos) são opcionais e ficam salvos.
- **Desfazer seguro:** “Desfazer” não restaura um retrato antigo do carrinho. Ele devolve ao carrinho *atual* apenas as linhas removidas (`restoreCartLines`, `js/cart.js`), na posição original; se o mesmo produto e cor já voltaram, as quantidades são somadas (limite de 99). Tudo o que a pessoa fez depois da remoção é preservado. Com o carrinho aberto, o aviso com o botão “Desfazer” fica dentro do painel, para que o teclado consiga alcançá-lo.
- **Finalização pelo WhatsApp:** como os preços são sob consulta, “Finalizar pelo WhatsApp” monta uma mensagem numerada e formatada para o WhatsApp (negrito e ícones) com produto, cor, quantidade, total de peças, nome e observações. A pessoa ainda confirma o envio no aplicativo. Exemplo:

  ```text
  Olá, JJ Style! Aqui é Emerson 👋
  Montei um pedido pelo site e gostaria de saber preços e disponibilidade.

  🛍️ *MEU PEDIDO*

  *1. Conjunto New Balance Casual*
  ▫️ Cor: Bege e preto
  ▫️ Quantidade: 2

  📦 *Total:* 2 peças
  📝 *Observações:* Tamanhos M e G

  Fico no aguardo dos valores e condições. Obrigado!
  _Pedido enviado pelo site JJ Style_
  ```

- **Histórico:** “Vistos recentemente” aparece na Home, no catálogo e na página do produto (sem repetir o produto aberto), com o tempo da visita (“Visto há 3 h”) e botão para limpar.
- **Experiência:** sugestões “Você também pode gostar” (mesma marca primeiro), avisos com ação (“Ver carrinho”, “Desfazer”; avisos com botão ficam 8 s e pausam com o mouse ou o foco), estados vazios com orientação e região `aria-live` para leitores de tela.

### Chaves no LocalStorage

| Chave | Conteúdo |
| --- | --- |
| `jjstyle:favoritos` | `["nike-urban", "brt"]` |
| `jjstyle:carrinho` | `[{ "productId": "nike-urban", "versionIndex": 0, "quantity": 2 }]` |
| `jjstyle:historico` | `[{ "productId": "brt", "versionIndex": 1, "viewedAt": 1793000000000 }]` |
| `jjstyle:pedido` | `{ "name": "…", "notes": "…" }` |

Ao ler, os dados são validados: itens de produtos inexistentes ou JSON corrompido são descartados sem quebrar a página.

## Principais trechos para apresentar

A documentação dentro do código está organizada por **blocos de responsabilidade**, não por linha. Cada arquivo possui uma breve descrição e apenas os pontos centrais têm comentários adicionais.

| Conceito exigido | Onde demonstrar | Explicação |
| --- | --- | --- |
| HTML, CSS e Bootstrap | `index.html`, `produtos.html`, `produto.html`, `css/style.css` | Estrutura semântica, navegação, cards, carrossel, offcanvas e responsividade. |
| `if / else` | `js/cart.js` — `clampQuantity` e `restoreCartLines` | Validação da quantidade e decisões ao desfazer uma remoção. |
| `switch / case` | `js/cart.js` — `changeCartQuantity`; `js/catalog.js` — `matchesQuickFilter` | Escolha da ação do carrinho ou do filtro selecionado. |
| `for` | `js/cart.js` — `getCart` e `buildCartMessage` | Percorre itens do carrinho para validar e montar o pedido. |
| `while` | `js/history.js` — `addToHistory`; `js/catalog.js` — `findMatchingVersion` | Limita o histórico e percorre palavras da busca. |
| Funções | `addToCart`, `toggleFavorite`, `applyCatalogFilters`, `addToHistory` | Separam as funcionalidades em partes reutilizáveis. |
| DOM com `getElementById` | `js/cart.js` — `renderCart`; `js/catalog.js` — `initializeCatalog` | Localiza elementos para atualizar a interface. |
| Eventos | `js/catalog.js` — `initializeCatalog`; `js/main.js` — `initializeAppEvents` | Reage a digitação, cliques, alterações e sincronização entre abas. |
| LocalStorage | `js/storage.js` — `readStorage`, `writeStorage`, `removeStorage` | Persiste favoritos, carrinho, histórico e dados do pedido. |
| Projeto acadêmico | `js/academic.js`, `css/style.css` | Identifica a demonstração e apresenta aviso inicial uma vez por aba. |

### Apresentação individual — Emerson Brandão

A apresentação é individual. Demonstre a Home, o catálogo e a página do produto; depois explique os exemplos de JavaScript acima e finalize com um pedido demonstrativo pelo WhatsApp, sem enviar uma compra real.

## Testes

Os testes automáticos ficam em `tests/` e usam o Microsoft Edge já instalado (via `playwright-core`, sem baixar navegador):

```bash
cd tests
npm install
npm test             # testes de ponta a ponta no navegador
npm run check-docs   # confere as funções citadas neste README
```

A suíte abre o site num servidor local temporário e cobre carregamento sem erros de JavaScript e sem 404, Bootstrap e fonte carregados uma única vez e do próprio site, busca, filtros, ordenação, favoritos (incluindo foco do teclado), histórico, carrinho (quantidades, cores, Desfazer, mensagem do WhatsApp), LocalStorage corrompido ou bloqueado, sincronização entre abas, ausência de rolagem horizontal de 320 a 1920 px e o posicionamento do botão do banner no celular. O que é conferido apenas visualmente (aparência dos banners e das páginas) foi inspecionado por capturas de tela e não faz parte da suíte.

## Contatos e configuração

Os destinos usados nesta demonstração ficam no início de `js/data.js`, em `STORE_CONFIG`:

```js
const STORE_CONFIG = Object.freeze({
  whatsappNumber: '5575999312633', // DDI e DDD, somente dígitos
  instagramUrl: 'https://www.instagram.com/jjstylle_/',
  address: 'R. Comendador Gomes, 483 - Parque Panorama, Feira de Santana - BA, 44091-238' // Endereço do mapa fornecido
});
```

**O WhatsApp 5575999312633 é um contato de demonstração deste projeto acadêmico, não o contato oficial da loja.** Os links de WhatsApp do header, footer, cards, carrinho e bloco de atacado usam esse número. O formulário e o carrinho preparam mensagens com os dados preenchidos; a pessoa ainda precisa confirmar o envio no aplicativo. O botão de rotas usa o endereço incluído no mapa fornecido.

A Home e o catálogo montam os cards a partir de `PRODUCTS`, em `js/data.js`. Cada produto tem `brand` (filtro por marca) e `isNew` (selo “Novo”); cada versão guarda imagem, descrição, cores da amostra e mensagem própria de WhatsApp. As cores do filtro são lidas da descrição de cada versão. A foto e o nome de cada card abrem a página individual com a cor selecionada; “Adicionar” coloca essa cor no carrinho e o ícone do WhatsApp continua abrindo a consulta individual. Para acrescentar ou corrigir uma versão, edite somente essa lista.

O mapa incorporado usa o iframe fornecido pela loja. Seu `src` permanece no `index.html`; a altura e a largura são definidas em `css/style.css`.

**Dados a confirmar com a loja:** preços e condições comerciais dos nove produtos; nomes comerciais dos modelos; tamanhos disponíveis (por isso o carrinho oferece um campo de observações em vez de uma lista de tamanhos). As cores exibidas foram conferidas nas imagens disponíveis. Até lá, os cards mostram “Preço sob consulta”. Não há cálculo de frete nem pagamento.

A galeria do Instagram foi deixada para uma etapa posterior. Na arte mobile do banner 01, a chamada para Produtos leva à vitrine da Home; a do banner 03 abre as novidades no catálogo.

## Prototipação e identidade visual

Antes da implementação, a Home foi prototipada no Figma em versões Desktop e Mobile. O fundo escuro é a base da interface; o laranja destaca CTAs, botões e elementos de atenção, enquanto cores secundárias e tons neutros ajudam na hierarquia e na legibilidade.

A Home começa pelo banner principal e segue por marcas, produtos, atendimento para atacado e varejo, apresentação da loja, contato e rodapé. Essa sequência facilita a navegação. No mobile, os elementos são reorganizados para telas menores sem perder a identidade visual. O Figma serviu de referência para a implementação em HTML, CSS e Bootstrap.

Os recursos da Parte II seguem a mesma linguagem: superfícies escuras, botões em pílula, laranja para ações principais (incluindo “Finalizar pelo WhatsApp”) e verde nos atalhos de consulta individual pelo WhatsApp.

## Entrega do TDE

- GitHub: [emersonbrandao058-dot/JJStyle](https://github.com/emersonbrandao058-dot/JJStyle)
- Site publicado (TDE Parte II): [jj-style.vercel.app](https://jj-style.vercel.app/)
- Design: [Figma da Home](https://www.figma.com/design/SEKixVXDTfooARsFs5MlaC)
- Páginas: `index.html`, `produtos.html` e `produto.html`.
- Prazos (Parte II): envio no Google Sala de Aula até 16/11/2026; apresentação em 17/11/2026.

O histórico Git registra pelo menos duas versões identificáveis: `7d83f44` (Versão 1 — Home e catálogo responsivos) e `5de55f5` (Versão 2 — página individual de produtos).
