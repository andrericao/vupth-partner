import { api } from "@lib/api";

// Notificacoes push (Expo). Contrato do backend em PRD_BACKEND secao "Notificacoes
// push (Expo)": POST /devices { token, platform }, DELETE /devices/{token}.
// Este modulo NAO importa expo-notifications/expo-device (modulos nativos) — a
// aquisicao do token recebe as dependencias por injecao, para ficar 100% testavel.
// O wiring nativo (permissao/token/listener) vive em src/hooks/usePushRegistration.

export type DevicePlatform = "ios" | "android" | "web";

// O token Expo vem como "ExponentPushToken[...]". Os colchetes crus no path sao
// rejeitados pelo Tomcat (400); por isso encodamos o segmento no DELETE.
export function deviceDeletePath(token: string): string {
  return `/devices/${encodeURIComponent(token)}`;
}

export function mapPlatform(os: string): DevicePlatform {
  if (os === "ios" || os === "android" || os === "web") return os;
  return "android";
}

// Roteia o toque na notificacao pelo data.type que o backend envia no push.
// Fila e atendimento levam o profissional para a fila; os de vinculo (DEC-19,
// 7e3e21b) levam a Solicitacoes da loja (dono) ou ao Vinculo (profissional).
// `minhaLoja` e a loja do dono logado: o aceite/recusa nela e de um convite
// dele. Tipo desconhecido ou ausente => null (nao navega).
export function notificationRoute(data: any, minhaLoja?: string | null): string | null {
  const type = data?.type;
  if (typeof type !== "string") return null;
  const loja = typeof data?.establishmentId === "string" ? data.establishmentId : null;
  const solicitacoes = loja ? `/(owner)/affiliations?establishmentId=${loja}` : null;
  if (type === "AFFILIATION_REQUESTED") return solicitacoes;
  if (type === "AFFILIATION_INVITED") return "/(professional)/settings-vinculo";
  if (type === "CUT_REQUESTED") return "/(professional)/cut-requests";
  // avisos-de-agenda-e-solicitacao (Backend 651514f): "Libere a sua agenda" leva a agenda.
  if (type === "AGENDA_RELEASE_PROMPT") return "/(professional)/agenda";
  // notificacao-com-botao (PAR-11): "Confira o pagamento" leva aos Relatorios,
  // onde estao os pendentes com o "Recebi"; "Hora de fechar?" leva a Fila, onde
  // o aviso de fechamento aparece; a loja removida leva ao Vinculo.
  if (type === "PAYMENT_CLAIMED") return "/(professional)/my-day";
  if (type === "PRICE_POLICY") return "/(professional)/ciencia-de-preco";
  if (type === "CLOSING_PROMPT" || type === "NO_SHOW_AVAILABLE") return "/(professional)/queue";
  if (type === "ESTABLISHMENT_REMOVED") return "/(professional)/settings-vinculo";
  // desativar-conta (Backend 01c785e): o convite de posse e o aviso de loja
  // desativada/reativada sao do profissional; a resposta da posse e do dono —
  // aceita, ele perdeu a loja e o inicio decide para onde ir.
  if (
    type === "OWNERSHIP_TRANSFER_REQUESTED" ||
    type === "ESTABLISHMENT_DEACTIVATED" ||
    type === "ESTABLISHMENT_REACTIVATED"
  ) {
    return "/(professional)/settings-vinculo";
  }
  if (type === "OWNERSHIP_TRANSFER_REFUSED") return "/(owner)/passar-posse";
  if (type === "OWNERSHIP_TRANSFER_ACCEPTED") return "/";
  if (type === "AFFILIATION_ACCEPTED" || type === "AFFILIATION_REJECTED") {
    return loja && minhaLoja && loja === minhaLoja ? solicitacoes : "/(professional)/settings-vinculo";
  }
  if (
    type === "QUEUE_NEXT_IN_LINE" ||
    type === "ATTENDANCE_STARTED" ||
    type === "ATTENDANCE_FINISHED" ||
    type.startsWith("SWAP_")
  ) {
    return "/(professional)/queue";
  }
  return null;
}

// Dependencias nativas injetadas (expo-notifications/expo-device) — permite testar
// a maquina de estados de permissao sem tocar em modulo nativo.
export type PushEnv = {
  isDevice: boolean;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: (opts: { projectId?: string }) => Promise<{
    data: string;
  }>;
  projectId?: string;
};

/**
 * Por que a aquisicao terminou assim. Alimenta o painel de diagnostico.
 *
 * 🔴 Ate 11/09 tudo isto era silencio: o hook engolia a excecao ("push nunca
 * deve derrubar o login", e continua verdade) e nada saia na tela. Com o A6
 * aberto — nenhuma notificacao nos DOIS apps — o QA nao tinha como distinguir
 * "o aparelho negou a permissao" de "a chamada nativa falhou por falta do
 * Firebase". Sao causas diferentes, em lugares diferentes, e o sintoma e um so.
 */
export type EstadoPush = "sem-aparelho" | "sem-permissao" | "falhou" | "obtido";

export async function acquireExpoPushToken(
  env: PushEnv & { onEstado?: (estado: EstadoPush, detalhe?: string) => void }
): Promise<string | null> {
  const relatar = env.onEstado ?? (() => {});

  // Emulador/web nao recebem push remoto — nem pede permissao.
  if (!env.isDevice) {
    relatar("sem-aparelho");
    return null;
  }

  let { status } = await env.getPermissionsAsync();
  if (status !== "granted") {
    status = (await env.requestPermissionsAsync()).status;
  }
  if (status !== "granted") {
    relatar("sem-permissao", status);
    return null;
  }

  try {
    const { data } = await env.getExpoPushTokenAsync({ projectId: env.projectId });
    if (!data) {
      relatar("falhou", "o Expo respondeu sem token");
      return null;
    }
    relatar("obtido");
    return data;
  } catch (erro: any) {
    // ESTE e o caso do FCM ausente: a chamada nativa estoura. Relata e
    // RELANCA — quem chama ja trata, e engolir aqui mudaria o comportamento.
    relatar("falhou", erro?.message ?? "a chamada nativa falhou");
    throw erro;
  }
}

export async function registerDevice(
  token: string,
  platform: DevicePlatform
): Promise<void> {
  await api.post("/devices", { token, platform });
}

export async function unregisterDevice(token: string): Promise<void> {
  await api.delete(deviceDeletePath(token));
}

/**
 * Onde push REALMENTE existe. Decide se vale a pena sequer CARREGAR o
 * `expo-notifications` — em dois ambientes ele nao so falha, ele atrapalha:
 *
 * - **Expo Go**: desde o **SDK 53** a Expo REMOVEU push do app do Expo Go, e o
 *   modulo **grita no import** ("Android Push notifications ... was removed").
 *   Como o hook e importado pelo `_layout`, o erro aparece antes de qualquer
 *   tela — durante o QA visual (2026-08-12) foi o que sujou a inicializacao.
 * - **Web**: nao ha modulo nativo nenhum. O build por URL (D8) precisa disto.
 *
 * `executionEnvironment` vem do `expo-constants`: `"storeClient"` = Expo Go.
 */
export function pushSupported(env: {
  os: string;
  executionEnvironment?: string | null;
}): boolean {
  if (env.os === "web") return false;
  if (env.executionEnvironment === "storeClient") return false; // Expo Go
  return true;
}

// ---------------------------------------------------------------------------
// Notificacao de ciencia (Andre, 02/10): a que so INFORMA ganha um jeito de
// fechar — "OK"; a de DECISAO segue com a tela dela (o modal de aceitar/recusar
// o pedido de corte, o "quer fechar?"). Mesmo comportamento do Client
// (52076672): com o app aberto, a de ciencia vira aviso com OK.

/**
 * Pushes que pedem uma decisao do profissional — o app ja tem a tela delas.
 * O CUT_REQUESTED saiu (aviso-de-corte-sem-ok, Andre 08/10): chegava sem OK.
 * Agora e aviso com OK, e o toque leva a Solicitacoes de corte.
 */
const PUSH_DE_DECISAO = new Set(["CLOSING_PROMPT"]);

export function ehDeDecisao(type: unknown): boolean {
  return typeof type === "string" && PUSH_DE_DECISAO.has(type);
}

/** O push com o app aberto vira aviso; sem texto nenhum, nao ha o que mostrar. */
export function avisoDoPush(conteudo: {
  title?: string | null;
  body?: string | null;
}): { titulo: string; mensagem: string } | null {
  const titulo = (conteudo.title ?? "").trim();
  const mensagem = (conteudo.body ?? "").trim();
  if (!titulo && !mensagem) return null;
  return { titulo: titulo || "VUPTH", mensagem };
}

/**
 * Categoria com o botao "OK" na propria notificacao (app fechado). So aparece
 * quando o Backend manda `categoryId: "CIENCIA"` no push — pedido em Solicitadas.
 */
export const CATEGORIA_CIENCIA = "CIENCIA";
export const ACAO_OK = "OK";

/** Canal Android HIGH novo, id "alertas" combinado com o Backend e o Client (o "default" antigo nao sobe de importancia). */
export const CANAL_ALERTAS = "alertas";

/** O toque foi no botao OK: so fecha a notificacao, nao abre tela. */
export function tocouNoOk(resposta: { actionIdentifier: string }): boolean {
  return resposta.actionIdentifier === ACAO_OK;
}

/**
 * notificacao-com-botao (PAR-11, Andre 15/10): "para toda notificacao deve ter
 * um botao". O "Hora de fechar?" pede decisao, entao ganha os dois botoes do
 * aviso da tela: "Fechar agora" (abre o app e fecha) e "Continuar atendendo"
 * (so fecha a notificacao). Aparece quando o push vem com categoryId
 * "FECHAMENTO" (pedido ao Backend em Solicitadas).
 */
export const CATEGORIA_FECHAMENTO = "FECHAMENTO";
export const ACAO_FECHAR_AGORA = "FECHAR_AGORA";
export const ACAO_CONTINUAR = "CONTINUAR";

/**
 * push-acoes-por-pergunta (Backend 7584964, 24/10): so o push que PERGUNTA algo
 * tem acao, e a acao e a mesma decisao da tela. CUT_REQUESTED e
 * OWNERSHIP_TRANSFER_REQUESTED chegam com categoryId "ACEITAR_RECUSAR" e o app
 * escolhe o endpoint pelo data.type; os botoes resolvem em segundo plano.
 */
export const CATEGORIA_ACEITAR_RECUSAR = "ACEITAR_RECUSAR";
export const ACAO_ACEITAR = "ACEITAR";
export const ACAO_RECUSAR = "RECUSAR";

/**
 * pagamento-ja-recebi (Backend 9f2f6fb): o PAYMENT_CLAIMED ("[nome] diz que pagou")
 * sai com categoryId "CONFIRMAR_RECUSAR". Confirmar = POST .../payment/confirm,
 * Recusar = POST .../payment/refuse (volta a PENDING). Mesmos botoes, sem abrir o app.
 */
export const CATEGORIA_CONFIRMAR_RECUSAR = "CONFIRMAR_RECUSAR";
export const ACAO_CONFIRMAR = "CONFIRMAR";

export type AcaoDoPush = "ok" | "fechar-agora" | "continuar" | "aceitar" | "recusar" | "abrir";

/** O que fazer com o toque: um dos botoes, ou o corpo da notificacao (abrir). */
export function acaoDoPush(resposta: { actionIdentifier: string }): AcaoDoPush {
  if (resposta.actionIdentifier === ACAO_OK) return "ok";
  if (resposta.actionIdentifier === ACAO_FECHAR_AGORA) return "fechar-agora";
  if (resposta.actionIdentifier === ACAO_CONTINUAR) return "continuar";
  if (resposta.actionIdentifier === ACAO_ACEITAR || resposta.actionIdentifier === ACAO_CONFIRMAR) return "aceitar";
  if (resposta.actionIdentifier === ACAO_RECUSAR) return "recusar";
  return "abrir";
}

/** O "Hora de fechar?" traz o fim da carencia: com ele a Fila mostra o aviso. */
export function carenciaDoFechamento(data: any): string | null {
  if (data?.type !== "CLOSING_PROMPT") return null;
  return typeof data?.graceUntil === "string" && data.graceUntil ? data.graceUntil : null;
}
