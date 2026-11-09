// Confere se cada referência "js/arquivo.js:LINHA" do roteiro do README aponta mesmo
// para a estrutura prometida (if, switch, for, while, getElementById, ...).
// Uso: npm run check-docs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8').split('\n');

const RULES = {
  'if / else': /\bif\s*\(|\belse\b/,
  'switch / case': /\bswitch\s*\(/,
  'for': /\bfor\s*\(/,
  'while': /\bwhile\s*\(/,
  'Eventos': /addEventListener\(/,
  'DOM com getElementById': /getElementById\(/,
  'LocalStorage': /localStorage\.(getItem|setItem|removeItem)\(/
};

const start = readme.findIndex((line) => line.startsWith('## Roteiro para a apresentação'));
const end = readme.findIndex((line, i) => i > start && line.startsWith('### Sugestão'));
let checked = 0;
const errors = [];

for (const line of readme.slice(start, end)) {
  const cells = line.split('|').map((c) => c.trim());
  if (cells.length < 4) continue;
  const concept = cells[1].replace(/`/g, '');
  const rule = RULES[concept];
  const isFunctions = concept === 'Funções';
  if (!rule && !isFunctions) continue;

  for (const match of cells[2].matchAll(/(?:`(\w+)` )?\(`(js\/[\w.]+):(\d+)`\)/g)) {
    const [, name, file, lineNumber] = match;
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n')[Number(lineNumber) - 1] || '';
    checked++;
    if (isFunctions) {
      if (!new RegExp(String.raw`^function\s+${name}\b`).test(source)) errors.push(`${file}:${lineNumber} deveria declarar function ${name}, mas é: ${source.trim()}`);
    } else if (!rule.test(source)) {
      errors.push(`[${concept}] ${file}:${lineNumber} não contém a estrutura: ${source.trim()}`);
    }
  }
}

// Todo "js/x.js:N" citado em qualquer parte do README precisa existir.
for (const [i, line] of readme.entries()) {
  for (const m of line.matchAll(/(js\/[\w.]+):(\d+)/g)) {
    const total = fs.readFileSync(path.join(ROOT, m[1]), 'utf8').split('\n').length;
    if (Number(m[2]) > total) errors.push(`README linha ${i + 1}: ${m[1]}:${m[2]} passa do fim do arquivo (${total} linhas)`);
  }
}

if (checked === 0) errors.push('nenhuma referência encontrada: o formato da tabela mudou?');
console.log(`${checked} referências do roteiro conferidas.`);
if (errors.length) { console.log(errors.map((e) => ` - ${e}`).join('\n')); process.exit(1); }
console.log('Todas as referências do README batem com o código.');
