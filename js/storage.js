/* ==========================================================================
   storage.js — Acesso ao LocalStorage
   --------------------------------------------------------------------------
   O LocalStorage guarda apenas texto. Por isso os dados são convertidos com
   JSON.stringify ao salvar e JSON.parse ao ler. Tudo fica dentro de
   try/catch porque o navegador pode bloquear o armazenamento (aba anônima,
   cookies desativados ou espaço cheio). Se isso acontecer, os dados ficam
   numa memória temporária: o carrinho e os favoritos continuam funcionando
   enquanto a página estiver aberta, só não são lembrados na próxima visita.
   ========================================================================== */

// O prefixo "jjstyle:" evita conflito com dados de outros sites no mesmo domínio.
const STORAGE_KEYS = Object.freeze({
  favorites: 'jjstyle:favoritos',
  cart: 'jjstyle:carrinho',
  history: 'jjstyle:historico',
  order: 'jjstyle:pedido'
});

// Reserva usada somente quando o LocalStorage não está disponível.
const memoryStorage = new Map();

function readStorage(key, fallbackValue) {
  // Um valor na memória é mais novo que o do disco: só existe se o salvamento falhou.
  if (memoryStorage.has(key)) {
    return memoryStorage.get(key);
  }
  try {
    const savedText = window.localStorage.getItem(key);
    if (savedText === null) {
      return fallbackValue;
    }
    return JSON.parse(savedText);
  } catch (error) {
    // JSON inválido ou armazenamento bloqueado: usa o valor padrão.
    return fallbackValue;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    memoryStorage.delete(key);
    return true;
  } catch (error) {
    memoryStorage.set(key, value);
    return false;
  }
}

function removeStorage(key) {
  memoryStorage.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    // Nada a fazer: o dado já não está acessível.
  }
}
