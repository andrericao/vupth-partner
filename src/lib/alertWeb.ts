import { Alert, Platform } from "react-native";

// Shim de `Alert` para a WEB.
//
// 🔴 A5 (Front-Client, 07/09): `Alert.alert` do React Native **nao e
// implementado no react-native-web**. Nao falha, nao loga, nao pinta nada — o
// usuario clica e nao acontece coisa alguma. Sao **100 chamadas em 29
// arquivos** aqui (e 60 no client): erro de formulario, "senha incorreta", o
// motivo de uma acao recusada.
//
// Foi isso ao tentar FINALIZAR um corte: o `handleAction` faz
// `Alert.alert("Erro", getApiErrorMessage(...))`. O codigo esta certo; o
// navegador e que nao desenha. Com o S36 em pe, a acao e recusada E o motivo
// fica invisivel — o pior par possivel.
//
// ⚠️ Ja saibiamos, e ninguem tinha somado: o comentario do proprio
// `web-shims/expo-secure-store.js` dizia que o Alert "tambem e no-op no React
// Native Web". Estava escrito como NOTA DE RODAPE DE OUTRO ASSUNTO, entao
// nunca virou item com dono — o mesmo padrao do `preview` apontando pra
// producao. O que esta no lugar errado nao e lido como problema.
//
// A saida (combinada com o client, que fez igual em `web-shims/alert.js`):
// trocar o metodo no objeto que o `react-native` exporta. Pega as 100 chamadas
// **sem tocar em nenhuma** — e as futuras tambem.
//
// O visual e sobrio DE PROPOSITO. Quando o design definir o dialogo da web,
// muda so este arquivo.

export type BotaoAlert = {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

type BotaoNormalizado = {
  text: string;
  onPress?: () => void;
  style: NonNullable<BotaoAlert["style"]>;
};

/** Minimo do `document` que o desenho usa — o resto nao interessa. */
export type DocumentoWeb = {
  createElement: (tag: string) => any;
  body: { appendChild: (n: any) => void; removeChild: (n: any) => void };
};

type Alvo = { alert: typeof Alert.alert; __vupthAlertWeb?: boolean };

/**
 * `Alert.alert(titulo)` e `Alert.alert(titulo, msg)` sao a forma mais comum no
 * app — sem botao nenhum. Viram um OK, senao a caixa nasce sem saida.
 *
 * Cancelar vai para a ESQUERDA: no nativo o botao que confirma fica na direita,
 * e inverter isso na web treinaria o dedo errado em quem usa os dois.
 */
export function normalizarBotoes(botoes?: BotaoAlert[]): BotaoNormalizado[] {
  if (!botoes || botoes.length === 0) return [{ text: "OK", style: "default" }];

  const normalizados = botoes.map((b) => ({
    text: b.text ?? "OK",
    onPress: b.onPress,
    style: b.style ?? "default",
  }));

  const cancelar = normalizados.filter((b) => b.style === "cancel");
  const resto = normalizados.filter((b) => b.style !== "cancel");
  return [...cancelar, ...resto];
}

const CORES = {
  forest: "#163300",
  green: "#9FE870",
  surface: "#FFFFFF",
  texto: "#163300",
  secundario: "#454745",
  perigo: "#B3261E",
};

export function desenharAlertWeb(
  doc: DocumentoWeb,
  titulo: string,
  mensagem?: string,
  botoes?: BotaoAlert[]
): void {
  const fundo = doc.createElement("div");
  Object.assign(fundo.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(22,51,0,.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: "9999",
  });

  const caixa = doc.createElement("div");
  Object.assign(caixa.style, {
    background: CORES.surface,
    borderRadius: "16px",
    padding: "20px",
    maxWidth: "380px",
    width: "100%",
    boxShadow: "0 12px 32px rgba(22,51,0,.2)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  });

  const h = doc.createElement("h2");
  h.textContent = titulo;
  Object.assign(h.style, {
    margin: "0 0 6px",
    fontSize: "17px",
    color: CORES.texto,
  });
  caixa.appendChild(h);

  // Sem mensagem NAO cria o paragrafo: `textContent = undefined` vira a string
  // "undefined" na tela, e o usuario le isso.
  if (mensagem) {
    const p = doc.createElement("p");
    p.textContent = mensagem;
    Object.assign(p.style, {
      margin: "0 0 16px",
      fontSize: "14px",
      lineHeight: "20px",
      color: CORES.secundario,
    });
    caixa.appendChild(p);
  }

  const linha = doc.createElement("div");
  Object.assign(linha.style, {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  });

  const fechar = () => doc.body.removeChild(fundo);

  for (const botao of normalizarBotoes(botoes)) {
    const b = doc.createElement("button");
    b.textContent = botao.text;
    const destrutivo = botao.style === "destructive";
    const cancel = botao.style === "cancel";
    Object.assign(b.style, {
      padding: "10px 16px",
      borderRadius: "999px",
      border: cancel ? `1px solid ${CORES.forest}` : "none",
      background: cancel ? "transparent" : destrutivo ? CORES.perigo : CORES.forest,
      color: cancel ? CORES.forest : destrutivo ? "#FFFFFF" : CORES.green,
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    });
    b.addEventListener("click", () => {
      // Fecha ANTES do callback: varios `onPress` navegam, e a caixa nao pode
      // sobreviver a navegacao.
      fechar();
      botao.onPress?.();
    });
    linha.appendChild(b);
  }

  caixa.appendChild(linha);
  fundo.appendChild(caixa);
  doc.body.appendChild(fundo);
}

export function alertWebInstalado(alvo: Alvo = Alert as unknown as Alvo): boolean {
  return alvo.__vupthAlertWeb === true;
}

/**
 * Instala o shim. Chamado UMA vez no boot (`app/_layout.tsx`), so na web.
 *
 * Devolve `false` — sem instalar — no nativo (la o Alert ja funciona) e quando
 * nao ha `document` (SSR, teste, export estatico). Boot nao pode quebrar por
 * causa de um dialogo.
 */
export function instalarAlertWeb(deps: {
  plataforma?: typeof Platform.OS;
  doc?: DocumentoWeb | null;
  alvo?: Alvo;
} = {}): boolean {
  const plataforma = deps.plataforma ?? Platform.OS;
  if (plataforma !== "web") return false;

  const doc =
    deps.doc ?? (typeof document !== "undefined" ? (document as unknown as DocumentoWeb) : null);
  if (!doc) return false;

  const alvo = deps.alvo ?? (Alert as unknown as Alvo);
  // Instalar duas vezes empilharia patch sobre patch — e o segundo passaria a
  // chamar o primeiro, nao o original.
  if (alvo.__vupthAlertWeb) return true;

  alvo.alert = ((titulo: string, mensagem?: string, botoes?: BotaoAlert[]) =>
    desenharAlertWeb(doc, titulo, mensagem, botoes)) as typeof Alert.alert;
  alvo.__vupthAlertWeb = true;
  return true;
}
