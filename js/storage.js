/**
 * Persistência da loja: centraliza as chaves e o acesso ao LocalStorage.
 * Se o armazenamento falhar, os dados continuam disponíveis na sessão atual.
 */

const STORAGE_KEYS = Object.freeze({
  favorites: 'jjstyle:favoritos',
  cart: 'jjstyle:carrinho',
  history: 'jjstyle:historico',
  order: 'jjstyle:pedido'
});

const memoryStorage = new Map();

/** Leitura, gravação e remoção de dados com JSON e tratamento de erros. */
function readStorage(key, fallbackValue) {
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
  }
}
