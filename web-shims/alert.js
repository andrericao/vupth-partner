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
// O VISUAL SEGUE O APP, e cada numero aqui foi COPIADO da fonte, nao escolhido:
//
//   backdrop rgba(0,0,0,.45) e padding 24 ....... mesmo do client
//   card branco, raio 20 ......................... tailwind.config.js radii.card
//   botao pilula, altura MINIMA 54 .............. src/components/nw/Button.tsx
//   solido #9FE870 com texto #163300 ............ Button.tsx vupthPrimary (nunca
//                                                 texto branco: brandGreen e
//                                                 claro demais)
//   cancel e destructive VAZADOS ................ Button.tsx vupthOutline
//                                                 (border-2, fundo transparente)
//   titulo/botao Archivo, corpo Inter ........... tailwind fontFamily heading/body
//   greenTint #E2F6D5 no hover .................. tailwind vupth.greenTint
//
// ⚠️ Altura MINIMA, nao cravada: o app honra o ajuste de fonte do aparelho, e
// caixa travada corta o rotulo quando a fonte cresce (DS4 — foi exatamente o
// defeito que o PR #28 consertou nos botoes).
//
// Sem tema escuro: o app nao tem um. Inventar aqui criaria divergencia com as
// telas. O refinamento fino e da equipe de design — quando vier, muda so este
// arquivo e as 100 chamadas seguem iguais.

const Z_INDEX = 99999;

function criarEstilo() {
  if (document.getElementById("vupth-alert-style")) return;
  const style = document.createElement("style");
  style.id = "vupth-alert-style";
  style.textContent = `
    .vupth-alert-backdrop {
      position: fixed; inset: 0; z-index: ${Z_INDEX};
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,.45); padding: 24px;
    }
    .vupth-alert-box {
      background: #FFFFFF; color: #163300;
      border-radius: 20px; padding: 24px;
      max-width: 420px; width: 100%;
      box-shadow: 0 4px 16px rgba(22,51,0,.08);
      font-family: Inter_400Regular, system-ui, -apple-system, sans-serif;
    }
    .vupth-alert-title {
      font-family: Archivo_700Bold, Inter_700Bold, system-ui, sans-serif;
      font-size: 18px; color: #163300; margin: 0 0 12px;
    }
    .vupth-alert-msg {
      font-size: 16px; line-height: 1.45; color: #454745;
      margin: 0; white-space: pre-wrap;
    }
    .vupth-alert-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
    .vupth-alert-btn {
      font-family: Archivo_700Bold, Inter_700Bold, system-ui, sans-serif;
      font-size: 16px; cursor: pointer;
      min-height: 54px; padding: 8px 24px;
      border-radius: 9999px; border: 0;
      background: #9FE870; color: #163300;
    }
    .vupth-alert-btn:hover { background: #8AD95C; }
    .vupth-alert-btn[data-style="cancel"] {
      background: transparent; color: #163300; border: 2px solid #163300;
    }
    .vupth-alert-btn[data-style="cancel"]:hover { background: #E2F6D5; }
    .vupth-alert-btn[data-style="destructive"] {
      background: transparent; color: #B3261E; border: 2px solid #B3261E;
    }
    .vupth-alert-btn[data-style="destructive"]:hover { background: #F7E4E2; }
    .vupth-alert-btn:focus-visible { outline: 2px solid #163300; outline-offset: 2px; }
  `;
  document.head.appendChild(style);
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

  lista.forEach((b) => {
    const btn = document.createElement("button");
    btn.className = "vupth-alert-btn";
    btn.type = "button";
    if (b?.style) btn.dataset.style = b.style;
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
