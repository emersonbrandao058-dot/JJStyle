// Verifica se os principais exemplos citados no README existem no código.
// Não depende de números de linha: a documentação é organizada por funções e blocos.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const start = readme.indexOf('## Principais trechos para apresentar');
const end = readme.indexOf('## Testes', start);
if (start < 0 || end < 0) throw new Error('Seção de apresentação não encontrada');
const section = readme.slice(start, end);
const examples = {
  'js/cart.js': ['clampQuantity', 'restoreCartLines', 'changeCartQuantity', 'getCart', 'buildCartMessage', 'addToCart', 'renderCart'],
  'js/catalog.js': ['matchesQuickFilter', 'findMatchingVersion', 'applyCatalogFilters', 'initializeCatalog'],
  'js/history.js': ['addToHistory'],
  'js/favorites.js': ['toggleFavorite'],
  'js/main.js': ['initializeAppEvents'],
  'js/storage.js': ['readStorage', 'writeStorage', 'removeStorage']
};
let checked = 0;
for (const [file, names] of Object.entries(examples)) {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const name of names) {
    if (!section.includes(name)) throw new Error('Exemplo ausente no README: ' + name);
    if (!new RegExp('\\bfunction\\s+' + name + '\\s*\\(').test(source)) {
      throw new Error('Função ausente em ' + file + ': ' + name);
    }
    checked++;
  }
}
for (const required of ['if / else', 'switch / case', 'for', 'while', 'getElementById', 'LocalStorage', 'Eventos']) {
  if (!section.includes(required)) throw new Error('Conceito ausente no roteiro: ' + required);
}
console.log(checked + ' exemplos conferidos por função; conceitos do TDE presentes.');
