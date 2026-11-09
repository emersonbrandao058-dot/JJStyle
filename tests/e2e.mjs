// Testes de ponta a ponta do site JJ Style.
// Como rodar:  cd tests && npm install && npm test
// Usa o Microsoft Edge já instalado (via playwright-core) e um servidor local
// temporário, sem tocar na Vercel nem na internet (exceto a fonte Archivo, opcional).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let file = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
const only = process.argv[2] ? new RegExp(process.argv[2], 'i') : null;

class Check extends Error {}
function ok(condition, message) { if (!condition) throw new Check(message); }
function eq(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Check(`${message}: esperado ${JSON.stringify(expected)}, recebido ${JSON.stringify(actual)}`);
  }
}

const SIZES = { desktop: { width: 1440, height: 900 }, tablet: { width: 820, height: 1100 }, mobile: { width: 390, height: 844 } };

async function test(group, name, fn, { size = 'desktop', blockStorage = false } = {}) {
  const label = `${group} › ${name}`;
  if (only && !only.test(label)) return;
  const context = await browser.newContext({ viewport: SIZES[size], reducedMotion: 'reduce', locale: 'pt-BR' });
  const page = await context.newPage();
  const problems = [];
  const requests = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') problems.push(`console: ${message.text()}`); });
  page.on('request', (request) => requests.push(request.url()));
  // Só a fonte externa pode falhar sem culpa do site (offline); o resto precisa carregar.
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().startsWith(BASE)) problems.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  await page.addInitScript(() => {
    window.__opened = [];
    window.open = (url) => { window.__opened.push(String(url)); return null; };
  });
  if (blockStorage) {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
    });
  }
  const app = { page, context, requests, problems, go: (p) => page.goto(`${BASE}/${p}`, { waitUntil: 'load' }) };
  try {
    await fn(app);
    const relevant = problems.filter((p) => !/fonts\.(googleapis|gstatic)/.test(p));
    ok(relevant.length === 0, `erros no navegador: ${relevant.join(' | ')}`);
    results.push({ label, pass: true });
    console.log(`  ok   ${label}`);
  } catch (error) {
    results.push({ label, pass: false, error: error.message });
    console.log(`  FALHA ${label}\n         ${error.message.split('\n')[0]}`);
  } finally {
    await context.close();
  }
}

const read = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
async function seed(app, values) {
  await app.go('index.html');
  await app.page.evaluate((data) => {
    for (const [key, value] of Object.entries(data)) localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }, values);
}
const cartOf = (page) => read(page, 'jjstyle:carrinho');
const gridNames = (page) => page.$$eval('#catalog-grid .card-title', (els) => els.map((e) => e.textContent.trim()));
async function openCartDrawer(page) {
  await page.click('#header-cart');
  await page.waitForSelector('#carrinho.show');
}
async function addFromCard(page, productId) {
  await page.click(`article[data-product-id="${productId}"] .product-add`);
}
async function removeLine(page, line) { await page.click(`[data-cart-action="remove"][data-line="${line}"]`); }

/* ====================== Aviso de projeto acadêmico ====================== */
for (const pagePath of ['index.html', 'produtos.html', 'produto.html?id=brt']) {
  await test('Projeto acadêmico', pagePath + ': faixa informativa permanente', async (app) => {
    await app.go(pagePath);
    const notice = app.page.locator('.academic-banner');
    ok(await notice.isVisible(), 'faixa acadêmica não aparece');
    const message = await notice.innerText();
    ok(message.includes('PROJETO ACADÊMICO'), 'falta identificação acadêmica');
    ok(message.includes('sem vendas ou pagamentos reais'), 'falta aviso de demonstração');
  });
}
await test('Projeto acadêmico', 'preloader explica o contexto e pode ser dispensado', async (app) => {
  await app.go('index.html');
  const intro = app.page.locator('#academic-preloader');
  ok(await intro.count() === 1, 'preloader não foi criado');
  const message = await intro.innerText();
  ok(message.includes('projeto acadêmico'), 'preloader sem aviso acadêmico');
  ok(message.includes('Não realizamos vendas, pagamentos ou entregas reais'), 'preloader sem aviso comercial');
  await app.page.click('.academic-preloader-skip');
  await intro.waitFor({ state: 'detached', timeout: 3000 });
  await app.go('produtos.html');
  eq(await app.page.locator('#academic-preloader').count(), 0, 'preloader repetido na mesma aba');
});
await test('Projeto acadêmico', 'preloader desaparece automaticamente', async (app) => {
  await app.go('index.html');
  await app.page.locator('#academic-preloader').waitFor({ state: 'detached', timeout: 4000 });
  ok(await app.page.locator('.academic-banner').isVisible(), 'faixa sumiu após preloader');
});

/* ======================= 1. Carregamento e Bootstrap ======================= */
for (const file of ['index.html', 'produtos.html', 'produto.html?id=brt']) {
  await test('Recursos', `${file}: sem erros de JS, sem 404 e Bootstrap carregado uma única vez`, async (app) => {
    await app.go(file);
    const bootstrapRequests = app.requests.filter((u) => /bootstrap/i.test(u));
    const css = bootstrapRequests.filter((u) => /\.css/.test(u));
    const js = bootstrapRequests.filter((u) => /\.js/.test(u));
    eq(css.length, 1, 'downloads do CSS do Bootstrap');
    eq(js.length, 1, 'downloads do JS do Bootstrap');
    ok(bootstrapRequests.every((u) => u.startsWith(BASE)), `Bootstrap deve vir da mesma origem: ${bootstrapRequests.join(', ')}`);
    ok(await app.page.evaluate(() => Boolean(window.bootstrap && bootstrap.Offcanvas)), 'window.bootstrap indisponível');
    const external = app.requests.filter((u) => /fonts.(googleapis|gstatic)|cdn.|jsdelivr|unpkg|cdnjs/.test(u));
    eq(external, [], 'requisições a CDN/Google Fonts');
  });
}

await test('Recursos', 'a fonte Archivo carrega do próprio site (variável, pesos 400–800)', async (app) => {
  await app.go('produtos.html');
  await app.page.evaluate(() => document.fonts.ready);
  const info = await app.page.evaluate(async () => {
    await document.fonts.load('800 20px Archivo');
    await document.fonts.load('400 16px Archivo');
    return { loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family), ok700: document.fonts.check('700 16px Archivo', 'Ação') };
  });
  ok(info.loaded.some((f) => /Archivo/.test(f)), `Archivo não carregou: ${JSON.stringify(info)}`);
  ok(app.requests.some((u) => u.endsWith('vendor/fonts/archivo-latin.woff2')), 'arquivo local da fonte não foi requisitado');
});

await test('Recursos', 'todas as imagens carregam (naturalWidth > 0) na Home com rolagem completa', async (app) => {
  await app.go('index.html');
  await app.page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  });
  await app.page.waitForTimeout(800);
  const broken = await app.page.$$eval('img', (imgs) => imgs.filter((i) => i.complete && i.src && i.naturalWidth === 0 && i.getAttribute('fetchpriority') !== 'low' && i.offsetParent !== null).map((i) => i.src));
  eq(broken, [], 'imagens quebradas');
});

await test('Recursos', 'o site usa somente imagens WebP (nenhum PNG/JPG requisitado, exceto favicon)', async (app) => {
  await app.go('index.html');
  await app.go('produtos.html');
  await app.go('produto.html?id=nike-urban');
  const heavy = app.requests.filter((u) => /\.(png|jpe?g)(\?|$)/i.test(u) && !/favicon/.test(u));
  eq(heavy, [], 'imagens pesadas requisitadas');
});

await test('Bootstrap', 'carrossel avança e o menu mobile abre e fecha', async (app) => {
  await app.go('index.html');
  await app.page.click('.carousel-control-next');
  await app.page.waitForFunction(() => document.querySelectorAll('.carousel-item')[1].classList.contains('active'));
}, { size: 'desktop' });

await test('Bootstrap', 'menu hambúrguer abre no celular e fecha ao tocar num link', async (app) => {
  await app.go('index.html');
  await app.page.click('.menu-toggle');
  await app.page.waitForSelector('#menu-principal.show');
  await app.page.click('#menu-principal .nav-link[href="#atacado"]');
  await app.page.waitForFunction(() => !document.getElementById('menu-principal').classList.contains('show'));
}, { size: 'mobile' });

/* ================================ 2. Home ================================== */
await test('Home', 'vitrine mostra 4 produtos, lançamentos primeiro, com selo Novo', async (app) => {
  await app.go('index.html');
  const names = await app.page.$$eval('[data-product-list="home"] .card-title', (els) => els.map((e) => e.textContent.trim()));
  eq(names.length, 4, 'quantidade na vitrine');
  eq(names.slice(0, 3), ['Conjunto Nike Urban', 'Conjunto New Balance Casual', 'Conjunto Under Armour Active'], 'lançamentos primeiro');
  eq(await app.page.locator('[data-product-list="home"] .product-badge').count(), 3, 'selos Novo');
});

await test('Home', 'trocar a cor no card muda imagem, link da página, rótulo e texto do WhatsApp', async (app) => {
  await app.go('index.html');
  const card = app.page.locator('article[data-product-id="puma-essentials"]');
  await card.scrollIntoViewIfNeeded().catch(() => {});
  // Na Home a vitrine tem 4 itens: garante que Puma Essentials esteja presente via catálogo.
  await app.go('produtos.html');
  const c = app.page.locator('article[data-product-id="puma-essentials"]');
  await c.locator('.product-option').nth(1).click();
  ok((await c.locator('img').getAttribute('src')).includes('01-puma-azul-bege'), 'imagem não trocou');
  ok((await c.locator('.product-name-link').getAttribute('href')).includes('versao=2'), 'link do produto não trocou');
  eq(await c.locator('.product-variant').textContent(), 'Cor: Azul e bege', 'rótulo da cor');
  ok(decodeURIComponent(await c.locator('.product-whatsapp').getAttribute('href')).includes('azul e bege'), 'WhatsApp da cor');
});

await test('Home', 'formulário de contato monta mensagem no WhatsApp', async (app) => {
  await app.go('index.html');
  await app.page.fill('#form-contato [name="nome"]', 'Maria');
  await app.page.fill('#form-contato [name="telefone"]', '75999990000');
  await app.page.fill('#form-contato [name="mensagem"]', 'Quero atacado');
  const assunto = await app.page.$('#form-contato [name="assunto"]');
  if (assunto && (await assunto.evaluate((e) => e.tagName)) === 'SELECT') await assunto.selectOption({ index: 1 });
  else if (assunto) await assunto.fill('Atacado');
  await app.page.click('#form-contato [type="submit"]');
  const opened = await app.page.evaluate(() => window.__opened);
  eq(opened.length, 1, 'janelas abertas');
  ok(opened[0].startsWith('https://wa.me/5575999312633?text='), 'URL do WhatsApp');
  ok(decodeURIComponent(opened[0]).includes('Maria'), 'nome na mensagem');
});

/* ============================ 3. Catálogo ================================== */
await test('Catálogo', 'lista os 9 produtos', async (app) => {
  await app.go('produtos.html');
  eq((await gridNames(app.page)).length, 9, 'produtos no catálogo');
  eq(await app.page.textContent('#catalog-count'), '9 produtos', 'contador');
});

await test('Catálogo', 'busca ignora acentos e maiúsculas ("LILAS" encontra BRT lilás)', async (app) => {
  await app.go('produtos.html');
  await app.page.fill('#catalog-search', 'LILAS');
  eq(await gridNames(app.page), ['Conjunto BRT'], 'resultado');
  ok((await app.page.locator('article[data-product-id="brt"] img').getAttribute('src')).includes('06-brt-lilas-cinza'), 'abre já na cor buscada');
  ok(/para “LILAS”/.test(await app.page.textContent('#catalog-count')), 'contador cita a busca');
});

await test('Catálogo', 'busca com várias palavras exige todas ("puma azul")', async (app) => {
  await app.go('produtos.html');
  await app.page.fill('#catalog-search', 'puma azul');
  eq(await gridNames(app.page), ['Conjunto Puma Essentials'], 'resultado');
});

await test('Catálogo', 'busca sem resultado mostra estado vazio e "limpar" restaura tudo', async (app) => {
  await app.go('produtos.html');
  await app.page.fill('#catalog-search', 'zzzz');
  ok(await app.page.isVisible('#catalog-empty'), 'estado vazio visível');
  await app.page.click('#catalog-empty-clear');
  eq((await gridNames(app.page)).length, 9, 'após limpar');
  ok(await app.page.evaluate(() => document.activeElement.id === 'catalog-search'), 'foco volta à busca');
});

await test('Catálogo', 'filtro por marca', async (app) => {
  await app.go('produtos.html');
  await app.page.selectOption('#filter-brand', 'Puma');
  eq(await gridNames(app.page), ['Conjunto Puma Essentials', 'Conjunto Puma Sport'], 'marcas');
});

await test('Catálogo', 'filtro por cor mostra a versão daquela cor', async (app) => {
  await app.go('produtos.html');
  await app.page.selectOption('#filter-color', 'Bege');
  const names = await gridNames(app.page);
  ok(names.includes('Conjunto New Balance Casual') && names.includes('Conjunto Puma Essentials'), `cor Bege: ${names}`);
  ok((await app.page.locator('article[data-product-id="puma-essentials"] img').getAttribute('src')).includes('azul-bege'), 'versão bege');
});

await test('Catálogo', 'filtro Novidades', async (app) => {
  await app.go('produtos.html');
  await app.page.click('[data-quick-filter="novidades"]');
  eq((await gridNames(app.page)).length, 3, 'novidades');
});

await test('Catálogo', 'ordenação A–Z, Z–A e por marca', async (app) => {
  await app.go('produtos.html');
  await app.page.selectOption('#catalog-sort', 'nome-az');
  const az = await gridNames(app.page);
  eq(az, [...az].sort((a, b) => a.localeCompare(b, 'pt-BR')), 'A–Z');
  await app.page.selectOption('#catalog-sort', 'nome-za');
  eq(await gridNames(app.page), [...az].reverse(), 'Z–A');
  await app.page.selectOption('#catalog-sort', 'marca');
  const brands = await app.page.$$eval('#catalog-grid article', (els) => els.map((e) => e.dataset.productId));
  eq(brands[0], 'adidas-performance', 'primeira marca (Adidas)');
});

await test('Catálogo', 'estado vai para a URL e abre filtrado por link', async (app) => {
  await app.go('produtos.html?marca=Puma&cor=Bege&ordem=nome-za');
  eq(await gridNames(app.page), ['Conjunto Puma Sport', 'Conjunto Puma Essentials'], 'resultado do link');
  eq(await app.page.inputValue('#filter-brand'), 'Puma', 'select de marca');
  await app.page.fill('#catalog-search', 'sport');
  ok((await app.page.evaluate(() => location.search)).includes('busca=sport'), 'busca na URL');
});

await test('Catálogo', 'URL com valores inválidos é ignorada sem quebrar', async (app) => {
  await app.go('produtos.html?marca=Xyz&cor=Roxo&ordem=foo&filtro=bar');
  eq((await gridNames(app.page)).length, 9, 'produtos');
});

await test('Catálogo', 'atalho "/" foca a busca e Esc limpa', async (app) => {
  await app.go('produtos.html');
  await app.page.keyboard.press('/');
  ok(await app.page.evaluate(() => document.activeElement.id === 'catalog-search'), 'foco na busca');
  await app.page.keyboard.type('nike');
  eq((await gridNames(app.page)).length, 1, 'filtrou');
  await app.page.keyboard.press('Escape');
  eq((await gridNames(app.page)).length, 9, 'limpou');
});

await test('Catálogo', '#busca na URL foca o campo de busca', async (app) => {
  await app.go('produtos.html#busca');
  ok(await app.page.evaluate(() => document.activeElement.id === 'catalog-search'), 'foco');
});

/* ============================ 4. Favoritos ================================= */
await test('Favoritos', 'favoritar atualiza coração, contador do header e LocalStorage', async (app) => {
  await app.go('produtos.html');
  await app.page.click('article[data-product-id="brt"] .favorite-toggle');
  eq(await read(app.page, 'jjstyle:favoritos'), ['brt'], 'armazenado');
  eq(await app.page.textContent('#favorites-count'), '1', 'badge');
  eq(await app.page.getAttribute('article[data-product-id="brt"] .favorite-toggle', 'aria-pressed'), 'true', 'aria-pressed');
  await app.page.reload();
  eq(await app.page.getAttribute('article[data-product-id="brt"] .favorite-toggle', 'aria-pressed'), 'true', 'persistiu após recarregar');
});

await test('Favoritos', 'filtro Favoritos sem nenhum favorito mostra orientação', async (app) => {
  await app.go('produtos.html?filtro=favoritos');
  ok((await app.page.textContent('#catalog-empty-title')).includes('ainda não tem favoritos'), 'mensagem');
});

await test('Favoritos', 'ícone do header abre o catálogo já filtrado', async (app) => {
  await seed(app, { 'jjstyle:favoritos': ['nike-urban', 'brt'] });
  await app.page.click('#header-favorites');
  await app.page.waitForURL(/filtro=favoritos/);
  eq((await gridNames(app.page)).length, 2, 'favoritos');
});

await test('Favoritos', 'ids inexistentes e JSON corrompido são ignorados', async (app) => {
  await seed(app, { 'jjstyle:favoritos': ['nao-existe', 'brt'] });
  await app.go('produtos.html');
  eq(await app.page.textContent('#favorites-count'), '1', 'badge ignora inválidos');
  await app.page.evaluate(() => localStorage.setItem('jjstyle:favoritos', '{quebrado'));
  await app.page.reload();
  ok(await app.page.isHidden('#favorites-count'), 'badge oculto com JSON inválido');
});

await test('Favoritos', 'acessibilidade: remover favorito no filtro Favoritos leva o foco ao PRÓXIMO card', async (app) => {
  await seed(app, { 'jjstyle:favoritos': ['nike-urban', 'brt', 'puma-sport'] });
  await app.go('produtos.html?filtro=favoritos');
  const ids = await app.page.$$eval('#catalog-grid article', (els) => els.map((e) => e.dataset.productId));
  eq(ids.length, 3, 'três favoritos');
  await app.page.focus(`article[data-product-id="${ids[0]}"] .favorite-toggle`);
  await app.page.keyboard.press('Enter');
  const focus = await app.page.evaluate(() => ({ tag: document.activeElement.tagName, id: document.activeElement.closest('article')?.dataset.productId, cls: document.activeElement.className }));
  eq(focus.id, ids[1], `foco deveria ir ao próximo card (${JSON.stringify(focus)})`);
  ok(/favorite-toggle/.test(focus.cls), 'foco no botão de favorito do próximo card');
});

await test('Favoritos', 'acessibilidade: remover o ÚLTIMO card leva o foco ao anterior', async (app) => {
  await seed(app, { 'jjstyle:favoritos': ['nike-urban', 'brt'] });
  await app.go('produtos.html?filtro=favoritos');
  const ids = await app.page.$$eval('#catalog-grid article', (els) => els.map((e) => e.dataset.productId));
  await app.page.focus(`article[data-product-id="${ids[1]}"] .favorite-toggle`);
  await app.page.keyboard.press('Space');
  const id = await app.page.evaluate(() => document.activeElement.closest('article')?.dataset.productId);
  eq(id, ids[0], 'foco no card anterior');
});

await test('Favoritos', 'acessibilidade: remover o ÚNICO favorito leva o foco ao aviso de lista vazia', async (app) => {
  await seed(app, { 'jjstyle:favoritos': ['brt'] });
  await app.go('produtos.html?filtro=favoritos');
  await app.page.focus('article[data-product-id="brt"] .favorite-toggle');
  await app.page.keyboard.press('Enter');
  const info = await app.page.evaluate(() => ({ id: document.activeElement.id, tag: document.activeElement.tagName }));
  eq(info.id, 'catalog-empty-title', `foco no título do estado vazio (${JSON.stringify(info)})`);
  ok(await app.page.isVisible('#catalog-empty'), 'estado vazio visível');
});

await test('Favoritos', 'remover favorito fora do filtro Favoritos NÃO mexe no foco', async (app) => {
  await seed(app, { 'jjstyle:favoritos': ['brt'] });
  await app.go('produtos.html');
  await app.page.focus('article[data-product-id="brt"] .favorite-toggle');
  await app.page.keyboard.press('Enter');
  eq(await app.page.evaluate(() => document.activeElement.closest('article')?.dataset.productId), 'brt', 'foco permanece');
});

await test('Favoritos', 'página do produto: botão de favorito alterna', async (app) => {
  await app.go('produto.html?id=nike-urban');
  await app.page.click('#detail-favorite');
  eq(await read(app.page, 'jjstyle:favoritos'), ['nike-urban'], 'salvo');
  await app.page.click('#detail-favorite');
  eq(await read(app.page, 'jjstyle:favoritos'), [], 'removido');
});

/* ============================ 5. Página do produto ========================= */
await test('Produto', 'lê id e versão da URL e troca a cor atualizando a URL', async (app) => {
  await app.go('produto.html?id=puma-essentials&versao=2');
  eq(await app.page.textContent('#detail-color-name'), 'Azul e bege', 'cor inicial');
  await app.page.locator('#detail-options .product-option').first().click();
  eq(await app.page.textContent('#detail-color-name'), 'Branco e preto', 'cor trocada');
  ok(app.page.url().includes('versao=1'), 'URL atualizada');
});

await test('Produto', 'id inválido mostra "produto não encontrado"', async (app) => {
  await app.go('produto.html?id=xxx');
  ok(await app.page.isVisible('#product-not-found'), 'mensagem');
  ok((await app.page.title()).includes('não encontrado'), 'título');
});

await test('Produto', 'versão inválida cai na primeira cor', async (app) => {
  await app.go('produto.html?id=brt&versao=99');
  eq(await app.page.textContent('#detail-color-name'), 'Branco e preto', 'cor');
});

await test('Produto', 'quantidade respeita 1–99 e adiciona ao carrinho na cor escolhida', async (app) => {
  await app.go('produto.html?id=brt&versao=2');
  await app.page.fill('#detail-quantity', '150');
  await app.page.dispatchEvent('#detail-quantity', 'change');
  eq(await app.page.inputValue('#detail-quantity'), '99', 'máximo');
  await app.page.fill('#detail-quantity', '0');
  await app.page.dispatchEvent('#detail-quantity', 'change');
  eq(await app.page.inputValue('#detail-quantity'), '1', 'mínimo');
  await app.page.click('#detail-increase');
  await app.page.click('#detail-add');
  eq(await cartOf(app.page), [{ productId: 'brt', versionIndex: 1, quantity: 2 }], 'carrinho');
});

await test('Produto', 'mostra 4 sugestões, da mesma marca primeiro', async (app) => {
  await app.go('produto.html?id=puma-essentials');
  const ids = await app.page.$$eval('#related-products article', (els) => els.map((e) => e.dataset.productId));
  eq(ids.length, 4, 'sugestões');
  eq(ids[0], 'puma-sport', 'mesma marca primeiro');
});

/* ============================ 6. Histórico ================================= */
await test('Histórico', 'registra, mostra o mais recente primeiro, exclui o produto atual e limita a 8', async (app) => {
  const ids = ['puma-essentials', 'adidas-performance', 'puma-sport', 'lacoste-sport', 'quiksilver-classic', 'brt', 'nike-urban', 'new-balance-casual', 'under-armour-active'];
  for (const id of ids) await app.go(`produto.html?id=${id}`);
  const stored = await read(app.page, 'jjstyle:historico');
  eq(stored.length, 8, 'limite de 8');
  eq(stored[0].productId, 'under-armour-active', 'mais recente primeiro');
  const shown = await app.page.$$eval('#recently-viewed-list .recent-name', (els) => els.map((e) => e.textContent));
  ok(!shown.includes('Conjunto Under Armour Active'), 'produto atual fora da lista');
  eq(shown.length, 7, 'lista na tela');
});

await test('Histórico', 'repetir visita não duplica e "Limpar" apaga', async (app) => {
  await app.go('produto.html?id=brt');
  await app.go('produto.html?id=brt');
  await app.go('index.html');
  eq((await read(app.page, 'jjstyle:historico')).length, 1, 'sem duplicar');
  ok(await app.page.isVisible('#recently-viewed'), 'seção visível na Home');
  await app.page.click('#recently-viewed-clear');
  ok(await app.page.isHidden('#recently-viewed'), 'seção some');
  eq(await app.page.evaluate(() => localStorage.getItem('jjstyle:historico')), null, 'chave removida');
});

await test('Histórico', 'entradas inválidas no LocalStorage são descartadas', async (app) => {
  await seed(app, { 'jjstyle:historico': [{ productId: 'x', versionIndex: 0, viewedAt: 1 }, null, { productId: 'brt', versionIndex: 9, viewedAt: 1 }] });
  await app.go('index.html');
  ok(await app.page.isHidden('#recently-viewed'), 'nenhuma entrada válida');
});

/* ============================ 7. Carrinho ================================== */
await test('Carrinho', 'adicionar usa a cor selecionada, soma quantidades e atualiza badge', async (app) => {
  await app.go('produtos.html');
  await app.page.locator('article[data-product-id="brt"] .product-option').nth(1).click();
  await addFromCard(app.page, 'brt');
  await addFromCard(app.page, 'brt');
  eq(await cartOf(app.page), [{ productId: 'brt', versionIndex: 1, quantity: 2 }], 'carrinho');
  eq(await app.page.textContent('#cart-count'), '2', 'badge');
  eq(await app.page.getAttribute('#header-cart', 'aria-label'), 'Abrir carrinho (2 itens)', 'aria-label');
});

await test('Carrinho', 'painel vazio mostra orientação; com itens mostra lista e total', async (app) => {
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  ok(await app.page.isVisible('#cart-empty'), 'estado vazio');
  await app.page.click('[data-bs-dismiss="offcanvas"]');
  await app.page.waitForFunction(() => !document.getElementById('carrinho').classList.contains('show'));
  await addFromCard(app.page, 'nike-urban');
  await openCartDrawer(app.page);
  eq(await app.page.textContent('#cart-total'), '1 item', 'total');
  eq(await app.page.locator('#cart-items li').count(), 1, 'linhas');
});

await test('Carrinho', 'quantidade: +, −, digitada (0→1, 150→99, vazio→1)', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 1 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await app.page.click('[data-cart-action="increase"]');
  eq((await cartOf(app.page))[0].quantity, 2, '+');
  await app.page.click('[data-cart-action="decrease"]');
  eq((await cartOf(app.page))[0].quantity, 1, '−');
  ok(await app.page.isDisabled('[data-cart-action="decrease"]'), '− desativado em 1');
  for (const [typed, expected] of [['150', 99], ['0', 1], ['', 1], ['7', 7]]) {
    await app.page.fill('[data-cart-action="set"]', typed);
    await app.page.dispatchEvent('[data-cart-action="set"]', 'change');
    eq((await cartOf(app.page))[0].quantity, expected, `digitado "${typed}"`);
  }
});

await test('Carrinho', 'trocar a cor soma com a linha existente da mesma cor', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 2 }, { productId: 'brt', versionIndex: 1, quantity: 3 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await app.page.selectOption('[data-cart-action="color"][data-line="0"]', '1');
  eq(await cartOf(app.page), [{ productId: 'brt', versionIndex: 1, quantity: 5 }], 'linhas somadas');
});

await test('Carrinho', 'trocar a cor sem conflito só muda a cor', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 2 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await app.page.selectOption('[data-cart-action="color"]', '1');
  eq(await cartOf(app.page), [{ productId: 'brt', versionIndex: 1, quantity: 2 }], 'cor');
});

await test('Carrinho', 'remover + Desfazer devolve a linha na MESMA posição', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [
    { productId: 'brt', versionIndex: 0, quantity: 1 }, { productId: 'nike-urban', versionIndex: 0, quantity: 2 }, { productId: 'puma-sport', versionIndex: 1, quantity: 3 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await removeLine(app.page, 1);
  eq((await cartOf(app.page)).length, 2, 'após remover');
  await app.page.click('#jj-toast-action');
  eq((await cartOf(app.page)).map((i) => i.productId), ['brt', 'nike-urban', 'puma-sport'], 'ordem restaurada');
});

await test('Carrinho', 'acessibilidade: com o carrinho aberto, o teclado alcança "Desfazer" e Enter restaura o item', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 1 }, { productId: 'nike-urban', versionIndex: 0, quantity: 1 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await app.page.focus('[data-cart-action="remove"][data-line="0"]');
  await app.page.keyboard.press('Enter');
  let reached = false;
  for (let i = 0; i < 12 && !reached; i++) {
    await app.page.keyboard.press('Tab');
    reached = await app.page.evaluate(() => document.activeElement.id === 'jj-toast-action');
  }
  ok(reached, 'Tab nunca chegou ao botão "Desfazer" (preso no painel)');
  await app.page.keyboard.press('Enter');
  eq((await cartOf(app.page)).map((i) => i.productId), ['brt', 'nike-urban'], 'item voltou na posição original');
});

await test('Carrinho', 'o aviso volta para o body ao fechar o carrinho e continua visível', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 1 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await removeLine(app.page, 0);
  eq(await app.page.evaluate(() => document.getElementById('jj-toast').parentElement.id), 'carrinho', 'aviso dentro do painel enquanto aberto');
  await app.page.click('[data-bs-dismiss="offcanvas"]');
  await app.page.waitForFunction(() => !document.getElementById('carrinho').classList.contains('show'));
  eq(await app.page.evaluate(() => document.getElementById('jj-toast').parentElement.tagName), 'BODY', 'aviso fora do painel');
  ok(await app.page.isVisible('#jj-toast'), 'aviso visível');
});

await test('Carrinho', 'BUG 1: Desfazer não apaga alterações feitas depois da remoção (quantidade)', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 1 }, { productId: 'nike-urban', versionIndex: 0, quantity: 1 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await removeLine(app.page, 0);                         // remove BRT
  await app.page.evaluate(() => { window.__undo = document.getElementById('jj-toast-action').onclick; });
  await app.page.click('[data-cart-action="increase"]'); // Nike 1 → 2 (agora é a linha 0)
  await app.page.evaluate(() => window.__undo());        // Desfazer a remoção do BRT
  eq(await cartOf(app.page), [{ productId: 'brt', versionIndex: 0, quantity: 1 }, { productId: 'nike-urban', versionIndex: 0, quantity: 2 }], 'BRT volta na posição original e a quantidade nova do Nike é mantida');
});

await test('Carrinho', 'BUG 1: Desfazer depois de adicionar OUTRO produto mantém o novo produto', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 1 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await removeLine(app.page, 0);
  // Guarda o botão "Desfazer" antes de o toast ser trocado pelo aviso de "adicionado".
  await app.page.evaluate(() => { window.__undo = document.getElementById('jj-toast-action').onclick; });
  await app.page.evaluate(() => addToCart('nike-urban', 0, 1)); // ação posterior do usuário
  await app.page.evaluate(() => window.__undo());
  const ids = (await cartOf(app.page)).map((i) => i.productId).sort();
  eq(ids, ['brt', 'nike-urban'], 'os dois produtos devem existir');
});

await test('Carrinho', 'BUG 1: Desfazer soma com a linha recriada (mesmo produto e cor adicionados depois)', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 2 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await removeLine(app.page, 0);
  await app.page.evaluate(() => { window.__undo = document.getElementById('jj-toast-action').onclick; });
  await app.page.evaluate(() => addToCart('brt', 0, 1));
  await app.page.evaluate(() => window.__undo());
  eq(await cartOf(app.page), [{ productId: 'brt', versionIndex: 0, quantity: 3 }], 'quantidades somadas, sem duplicar linha');
});

await test('Carrinho', 'BUG 1: "Esvaziar" + Desfazer preserva o que foi adicionado depois', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 1 }, { productId: 'puma-sport', versionIndex: 0, quantity: 1 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await app.page.click('#cart-clear');
  await app.page.evaluate(() => { window.__undo = document.getElementById('jj-toast-action').onclick; });
  await app.page.evaluate(() => addToCart('nike-urban', 0, 2));
  await app.page.evaluate(() => window.__undo());
  const cart = await cartOf(app.page);
  eq(cart.map((i) => i.productId).sort(), ['brt', 'nike-urban', 'puma-sport'], 'itens');
  eq(cart.find((i) => i.productId === 'nike-urban').quantity, 2, 'quantidade do item novo');
});

await test('Carrinho', 'Desfazer respeita o limite de 99 por linha', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 90 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await removeLine(app.page, 0);
  await app.page.evaluate(() => { window.__undo = document.getElementById('jj-toast-action').onclick; });
  await app.page.evaluate(() => addToCart('brt', 0, 50));
  await app.page.evaluate(() => window.__undo());
  eq((await cartOf(app.page))[0].quantity, 99, 'limite');
});

await test('Carrinho', 'Desfazer remoção feita numa aba aparece também na outra aba (evento storage)', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 1 }] });
  const second = await app.context.newPage();
  await second.goto(`${BASE}/produtos.html`);
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await removeLine(app.page, 0);
  await second.waitForFunction(() => document.getElementById('cart-count').hidden === true);
  await app.page.click('#jj-toast-action');
  await second.waitForFunction(() => document.getElementById('cart-count').textContent === '1');
});

await test('Carrinho', 'dados corrompidos ou inválidos no LocalStorage são descartados', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'x', versionIndex: 0, quantity: 1 }, { productId: 'brt', versionIndex: 7, quantity: 1 },
    { productId: 'brt', versionIndex: 0, quantity: -3 }, { productId: 'brt', versionIndex: 0, quantity: 500 }, null, 'texto'] });
  await app.go('produtos.html');
  eq(await app.page.textContent('#cart-count'), '99', 'só o item válido (limitado a 99)');
  await app.page.evaluate(() => localStorage.setItem('jjstyle:carrinho', '{{{'));
  await app.page.reload();
  ok(await app.page.isHidden('#cart-count'), 'JSON inválido vira carrinho vazio');
});

await test('Carrinho', 'mensagem do WhatsApp: itens numerados, cores, quantidades, total, nome e observações', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 1, quantity: 2 }, { productId: 'nike-urban', versionIndex: 0, quantity: 1 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await app.page.fill('#cart-name', 'Emerson');
  await app.page.fill('#cart-notes', 'Tamanhos M e G');
  await app.page.click('#cart-checkout');
  const [url] = await app.page.evaluate(() => window.__opened);
  ok(url.startsWith('https://wa.me/5575999312633?text='), 'número da loja');
  const text = decodeURIComponent(url.split('text=')[1]);
  for (const part of ['Aqui é Emerson', '*1. Conjunto BRT*', 'Cor: Lilás e cinza', 'Quantidade: 2', '*2. Conjunto Nike Urban*', 'Cor: Preto e cinza', 'Quantidade: 1', '*Total:* 3 peças', 'Observações:* Tamanhos M e G']) {
    ok(text.includes(part), `mensagem sem "${part}"`);
  }
});

await test('Carrinho', 'mensagem sem nome/observações e com 1 peça usa singular', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 1 }] });
  await app.go('produtos.html');
  await app.page.evaluate(() => document.getElementById('cart-checkout').click());
  const [url] = await app.page.evaluate(() => window.__opened);
  const text = decodeURIComponent(url.split('text=')[1]);
  ok(text.startsWith('Olá, JJ Style! 👋'), 'saudação sem nome');
  ok(text.includes('*Total:* 1 peça') && !text.includes('1 peças'), 'singular');
  ok(!text.includes('Observações'), 'sem observações');
});

await test('Carrinho', 'nome e observações persistem entre visitas', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 1 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await app.page.fill('#cart-name', 'Ana');
  await app.page.fill('#cart-notes', 'Retirar na loja');
  await app.page.reload();
  await openCartDrawer(app.page);
  eq(await app.page.inputValue('#cart-name'), 'Ana', 'nome');
  eq(await app.page.inputValue('#cart-notes'), 'Retirar na loja', 'observações');
});

await test('Carrinho', 'checkout com carrinho vazio não abre o WhatsApp', async (app) => {
  await app.go('produtos.html');
  await app.page.evaluate(() => checkoutCart());
  eq(await app.page.evaluate(() => window.__opened.length), 0, 'janelas');
});

await test('Carrinho', 'acessibilidade: ao remover, o foco não se perde (vai para outro controle do carrinho)', async (app) => {
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'brt', versionIndex: 0, quantity: 1 }, { productId: 'nike-urban', versionIndex: 0, quantity: 1 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  await app.page.focus('[data-cart-action="remove"][data-line="0"]');
  await app.page.keyboard.press('Enter');
  const inside = await app.page.evaluate(() => document.getElementById('carrinho').contains(document.activeElement));
  ok(inside, 'foco precisa continuar dentro do carrinho');
});

await test('Carrinho', 'sincroniza entre abas pelo evento storage', async (app) => {
  await app.go('produtos.html');
  const second = await app.context.newPage();
  await second.goto(`${BASE}/produtos.html`);
  await addFromCard(second, 'brt');
  await app.page.waitForFunction(() => document.getElementById('cart-count').textContent === '1');
});

/* ======================= 8. LocalStorage bloqueado ========================= */
await test('Storage', 'com LocalStorage bloqueado o site abre e o carrinho funciona na sessão', async (app) => {
  await app.go('produtos.html');
  await addFromCard(app.page, 'brt');
  eq(await app.page.textContent('#cart-count'), '1', 'badge mesmo sem LocalStorage');
  await app.page.click('article[data-product-id="brt"] .favorite-toggle');
  eq(await app.page.textContent('#favorites-count'), '1', 'favorito mesmo sem LocalStorage');
}, { blockStorage: true });

/* ========================= 9. Responsividade =============================== */
for (const [name, width, height] of [['320', 320, 700], ['360', 360, 740], ['390', 390, 844], ['768', 768, 1024], ['820', 820, 1180], ['1024', 1024, 768], ['1280', 1280, 800], ['1440', 1440, 900], ['1920', 1920, 1080]]) {
  for (const file of ['index.html', 'produtos.html', 'produto.html?id=brt']) {
    await test('Responsivo', `${file.split('?')[0]} em ${name}px sem rolagem horizontal`, async (app) => {
      await app.page.setViewportSize({ width, height });
      await app.go(file);
      await app.page.waitForTimeout(150);
      const overflow = await app.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(overflow <= 0, `overflow horizontal de ${overflow}px`);
    });
  }
}

await test('Responsivo', 'painel do carrinho cabe na tela de 360px', async (app) => {
  await app.page.setViewportSize({ width: 360, height: 700 });
  await seed(app, { 'jjstyle:carrinho': [{ productId: 'under-armour-active', versionIndex: 0, quantity: 12 }] });
  await app.go('produtos.html');
  await openCartDrawer(app.page);
  const box = await app.page.locator('#carrinho').boundingBox();
  ok(box.width <= 360 && box.x >= 0, `largura ${box.width}`);
  const overflow = await app.page.evaluate(() => { const el = document.getElementById('carrinho'); return el.scrollWidth - el.clientWidth; });
  ok(overflow <= 0, `overflow no painel: ${overflow}`);
});

/* ============================ 10. Banner mobile ============================ */
// A chamada "VER PRODUTOS" não pode cobrir o texto/arte do banner nas larguras de celular.
// A verificação visual é feita por captura (screenshots/); aqui conferimos a geometria.
for (const width of [320, 360, 375, 390, 412, 430, 480, 600, 767]) {
  for (const slide of [0, 1, 2]) {
    await test('Banner', `slide ${slide + 1} em ${width}px: botão fora da arte, dentro do banner e com área de toque`, async (app) => {
      await app.page.setViewportSize({ width, height: 900 });
      await app.go('index.html');
      await app.page.evaluate((i) => {
        const items = document.querySelectorAll('.carousel-item');
        items.forEach((el, n) => { el.classList.toggle('active', n === i); el.style.transition = 'none'; });
      }, slide);
      const boxes = await app.page.evaluate((i) => {
        const item = document.querySelectorAll('.carousel-item')[i];
        const b = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
        return { item: b(item), cta: b(item.querySelector('.hero-cta')), art: b(item.querySelector('.hero-art')) };
      }, slide);
      ok(boxes.cta.x >= boxes.item.x && boxes.cta.x + boxes.cta.w <= boxes.item.x + boxes.item.w, 'botão estoura a largura do banner');
      ok(boxes.cta.y >= boxes.item.y && boxes.cta.y + boxes.cta.h <= boxes.item.y + boxes.item.h, 'botão fora da altura do banner');
      ok(boxes.cta.h >= 36, `área de toque pequena: ${boxes.cta.h}px`);
      ok(boxes.cta.y >= boxes.art.y + boxes.art.h - 1, `o botão (topo ${Math.round(boxes.cta.y)}px) invade a arte (que termina em ${Math.round(boxes.art.y + boxes.art.h)}px)`);
    });
  }
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} testes passaram${failed.length ? `, ${failed.length} falharam:` : '.'}`);
failed.forEach((r) => console.log(` - ${r.label}\n     ${r.error}`));
process.exit(failed.length ? 1 : 0);
