// Alert.alert do React Native para o bundle WEB (ver app/_layout.tsx).
//
// IMPLEMENTACAO ESPELHADA DO FRONT-CLIENT (web-shims/alert.js, commit
// 5d99ad1e): mesmos nomes, mesma API, mesmas classes CSS. Eles acharam o
// defeito (A5) e resolveram primeiro; combinar a implementacao evita que os
// dois apps mostrem caixas diferentes e que a correcao de um nao sirva ao
// outro.
//
// O React Native Web NAO implementa `Alert`: a chamada nao falha, nao loga e
// nao pinta nada. Sao 100 chamadas em 29 arquivos neste app (60 no client) —
// confirmacoes, erros de formulario, o motivo de uma acao recusada. No
// navegador o usuario clicava e nada acontecia. Foi o que fez o "finalizar
// corte" parecer um botao quebrado: o handleAction JA avisava do erro, e o
// aviso nao existia na tela.
//
// POR QUE UM PATCH E NAO UM IMPORT NOVO: trocar `Alert` por um wrapper exigiria
// mexer nas 100 chamadas — e em cada uma escrita daqui pra frente, que ninguem
// lembraria. `Alert` e um objeto exportado pelo react-native; substituir o
// metodo dele atinge todo mundo, inclusive codigo de biblioteca.
//
// `window.alert`/`confirm` foram descartados: sao bloqueantes (travam o event
// loop, e o `onPress` do botao roda depois do bundle inteiro parar) e nao
// suportam mais de dois botoes. Varios Alert do app tem tres.
//
// O VISUAL E O DO DESENHO — os MESMOS numeros do DialogoVupth (a caixa do app),
// lidos pelo Design nos quatro "MODAL ·" do arquivo (resposta de 14/09):
//
//   fundo forest a 45% (nao preto) ............. rgba(22,51,0,.45) = #16330073
//   respiro lateral 24 · card raio 20, padding 22, gap 16
//   titulo Archivo 800, 18, ls -0.4 · corpo Inter 14/20, text-secondary
//   botoes empilhados, pilula de altura MINIMA 54, borda do vazado 1,5 forest
//
// A HIERARQUIA vem da mesma regra do app (src/lib/pesoDoBotao.ts, espelhada em
// `pesoWeb` abaixo): com acao destrutiva na caixa, o CANCELAR e o solido e o
// destrutivo e vazado com o rotulo em vermelho; sem ela, o confirmar e o solido.
//
// 🔴 25/09 (Andre: "a caixa do app deve ser igual a da web"): este arquivo
// tinha ficado com os valores da primeira deducao (fundo preto, padding 24,
// corpo 16, borda 2, destrutivo com borda vermelha). Travado em
// src/__tests__/projeto/caixaIgualNosDoisLados.test.ts.
//
// ⚠️ Altura MINIMA, nao cravada: caixa travada corta o rotulo quando a fonte
// cresce (DS4).

const Z_INDEX = 99999;

function criarEstilo() {
  if (document.getElementById("vupth-alert-style")) return;
  const style = document.createElement("style");
  style.id = "vupth-alert-style";
  style.textContent = `
    .vupth-alert-backdrop {
      position: fixed; inset: 0; z-index: ${Z_INDEX};
      display: flex; align-items: center; justify-content: center;
      background: rgba(22,51,0,.45); padding: 0 24px;
    }
    .vupth-alert-box {
      background: #FFFFFF; color: #163300;
      border-radius: 20px; padding: 22px;
      display: flex; flex-direction: column; gap: 16px;
      max-width: 420px; width: 100%; box-sizing: border-box;
      font-family: Inter_400Regular, system-ui, -apple-system, sans-serif;
    }
    .vupth-alert-title {
      font-family: Archivo_800ExtraBold, Archivo_700Bold, system-ui, sans-serif;
      font-size: 18px; letter-spacing: -0.4px; color: #163300; margin: 0;
    }
    .vupth-alert-msg {
      font-size: 14px; line-height: 20px; color: #454745;
      margin: 0; white-space: pre-wrap; max-height: 260px; overflow-y: auto;
    }
    .vupth-alert-actions { display: flex; flex-direction: column; gap: 12px; }
    .vupth-alert-btn {
      font-family: Archivo_700Bold, system-ui, sans-serif;
      font-size: 16px; cursor: pointer;
      min-height: 54px; padding: 8px 24px;
      border-radius: 9999px; border: 0;
      background: #9FE870; color: #163300;
    }
    .vupth-alert-btn[data-peso="solido"]:hover { opacity: .85; }
    .vupth-alert-btn[data-peso="vazado"],
    .vupth-alert-btn[data-peso="vazado-perigo"] {
      background: transparent; border: 1.5px solid #163300;
    }
    .vupth-alert-btn[data-peso="vazado-perigo"] { color: #B3261E; }
    .vupth-alert-btn[data-peso="vazado"]:hover,
    .vupth-alert-btn[data-peso="vazado-perigo"]:hover { background: #E2F6D5; }
    .vupth-alert-btn:focus-visible { outline: 2px solid #163300; outline-offset: 2px; }
  `;
  document.head.appendChild(style);
}

// A regra de src/lib/pesoDoBotao.ts, em JS (este arquivo nao passa pelo
// TypeScript). O teste de paridade compara as duas em todos os casos.
export function pesoWeb(buttons, i) {
  const estilo = buttons[i]?.style ?? "default";
  if (estilo === "destructive") return "vazado-perigo";
  const temDestrutivo = buttons.some((b) => b?.style === "destructive");
  if (temDestrutivo) return estilo === "cancel" ? "solido" : "vazado";
  return estilo === "cancel" ? "vazado" : "solido";
}

// Mesma normalizacao do React Native: sem botoes, vira um "OK" sozinho.
export function normalizarBotoes(buttons) {
  if (!Array.isArray(buttons) || buttons.length === 0) return [{ text: "OK" }];
  return buttons;
}

export function alertWeb(title, message, buttons, options) {
  if (typeof document === "undefined") return;
  criarEstilo();

  const anterior = document.activeElement;
  const backdrop = document.createElement("div");
  backdrop.className = "vupth-alert-backdrop";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");

  const box = document.createElement("div");
  box.className = "vupth-alert-box";

  if (title) {
    const h = document.createElement("h2");
    h.className = "vupth-alert-title";
    h.textContent = String(title);
    box.appendChild(h);
    backdrop.setAttribute("aria-label", String(title));
  }
  if (message) {
    const p = document.createElement("p");
    p.className = "vupth-alert-msg";
    p.textContent = String(message);
    box.appendChild(p);
  }

  const acoes = document.createElement("div");
  acoes.className = "vupth-alert-actions";

  let fechado = false;
  function fechar(onPress) {
    if (fechado) return;
    fechado = true;
    document.removeEventListener("keydown", aoTeclar);
    backdrop.remove();
    if (anterior && typeof anterior.focus === "function") anterior.focus();
    // Depois de tirar da tela: se o callback estourar, o dialogo nao fica preso.
    if (typeof onPress === "function") onPress();
  }

  const lista = normalizarBotoes(buttons);
  const cancelavel = options?.cancelable !== false;
  const botaoCancelar = lista.find((b) => b?.style === "cancel");

  function aoTeclar(e) {
    if (e.key !== "Escape" || !cancelavel) return;
    fechar(botaoCancelar?.onPress ?? options?.onDismiss);
  }

  lista.forEach((b, i) => {
    const btn = document.createElement("button");
    btn.className = "vupth-alert-btn";
    btn.type = "button";
    if (b?.style) btn.dataset.style = b.style;
    btn.dataset.peso = pesoWeb(lista, i);
    btn.textContent = b?.text ?? "OK";
    btn.onclick = () => fechar(b?.onPress);
    acoes.appendChild(btn);
  });

  box.appendChild(acoes);
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);

  document.addEventListener("keydown", aoTeclar);
  // O ultimo botao e a acao principal no padrao do iOS, que o app segue.
  const principal = acoes.lastElementChild;
  if (principal && typeof principal.focus === "function") principal.focus();
}

// Troca o metodo no objeto que o react-native exporta: pega as 100 chamadas
// existentes e as que vierem depois, sem import novo em lugar nenhum.
export function instalarAlertWeb(Alert) {
  if (!Alert || Alert.__vupthWebAlert) return false;
  Alert.alert = alertWeb;
  Alert.__vupthWebAlert = true;
  return true;
}
