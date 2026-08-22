// Substituto de expo-secure-store para o bundle WEB apenas (ver metro.config.js).
//
// O pacote nao tem implementacao web: build/ExpoSecureStore.web.js exporta um
// objeto vazio, entao a 1a chamada estoura. Como sessao, fila e preferencias
// passam todas por ele, sem isto o app nao autentica no navegador — e o erro
// sobe ate um Alert.alert, que tambem e no-op no React Native Web, deixando a
// tela parada sem dizer nada.
//
// sessionStorage NAO e armazenamento seguro. Isto vale so para rodar o app no
// navegador; o alvo nativo continua iOS/Android, onde o pacote real e usado sem
// passar por aqui.
//
// 🔒 sessionStorage, NAO localStorage (mitigacao 1 do D8, decidida em
// 2026-08-12): o token morre QUANDO A ABA FECHA, em vez de ficar guardado no
// navegador. Isso apaga o cenario do computador compartilhado — o proximo que
// sentar nao herda a sessao. O preco e logar de novo a cada visita, aceitavel
// p/ testadores. A outra metade da mitigacao e o CSP em `public/_headers`, que
// ataca o XSS — o vetor real, ja que aqui o token e legivel por qualquer JS da
// mesma origem.

function store() {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

// Navegador com storage bloqueado (modo privativo, cookies desligados): mantem
// a sessao viva enquanto a aba estiver aberta — mesmo comportamento do
// sessionStorage, entao o fallback nao afrouxa a regra.
const fallback = new Map();

export async function getItemAsync(key) {
  const s = store();
  return s ? s.getItem(key) : fallback.get(key) ?? null;
}

export async function setItemAsync(key, value) {
  const s = store();
  if (s) s.setItem(key, value);
  else fallback.set(key, value);
}

export async function deleteItemAsync(key) {
  const s = store();
  if (s) s.removeItem(key);
  else fallback.delete(key);
}

export async function isAvailableAsync() {
  return true;
}
