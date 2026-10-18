import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as Updates from "expo-updates";

import { resolveApiEnv } from "@lib/apiEnv";

// Render = ambiente de TESTE; Railway = PRODUCAO. Quem testa bate no Render:
// o app via Expo/APK de `preview` e a web pelo link `dev*` (Andre 2026-09-06).
//
// `staging` e `dev` sao o MESMO host de proposito: este app batizou de
// `staging` o que o client batizou de `dev`, e o mesmo `.env` circula entre os
// dois repos. Sem o apelido, `EXPO_PUBLIC_API_ENV=dev` aqui caia no fallback
// sem avisar.
const API_URLS: Record<string, string> = {
  local: `http://${process.env.EXPO_PUBLIC_API_LOCAL_IP ?? "192.168.0.16"}:8080`,
  staging: "https://vupth-backend-ia.onrender.com",
  dev: "https://vupth-backend-ia.onrender.com",
  prod: "https://vupth-backend-ia-production.up.railway.app",
};

// O CANAL manda quando existe (bundle publicado); o `.env` so vale rodando
// local. Ver `apiEnv.ts` pro porque — em resumo, o `.env` de quem publica
// vazava pro app de todo mundo.
const canalDoBundle = (() => {
  try {
    return Updates.channel;
  } catch {
    return null;
  }
})();
const env = resolveApiEnv(canalDoBundle, process.env.EXPO_PUBLIC_API_ENV);
/** O ambiente em que este bundle roda (links publicos seguem o mesmo). */
export const API_ENV = env;
const BASE_URL = API_URLS[env];

// URL do WebSocket STOMP. http→ws, https→wss.
// O backend registra /ws com SockJS; para um WebSocket NATIVO (sem a lib SockJS)
// e preciso usar o transporte websocket do SockJS em /ws/websocket — senao o
// GET /ws cai no handler SockJS (HTTP 200) e o upgrade nativo falha (socket fecha).
export const WS_URL = `${BASE_URL.replace(/^http/, "ws")}/ws/websocket`;

// Endpoint PUBLICO de readiness (raiz do servidor, fora de /api/v1) — usado pelo
// portao de cold start do Render (ver src/lib/readiness.ts + PRD_BACKEND 18c).
export const READINESS_URL = `${BASE_URL}/actuator/health/readiness`;

// axios.create e o uso idiomatico (metodo do default export), nao um named export.
// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Mensagens do backend vem em ingles; traduzimos as conhecidas por codigo.
const ERROR_MESSAGES_PT: Record<string, string> = {
  // agenda-do-profissional (05/10): a agenda do profissional cabe no horario
  // da loja.
  PROFESSIONAL_HOURS_OUTSIDE_ESTABLISHMENT:
    "Esse horário passa do horário da loja. A sua agenda tem de caber nele.",
  // Acesso (fd9a3af, 03/10). As telas de login/esqueci tratam os dois antes
  // (com "Criar conta" e os segundos do Retry-After); isto e o texto de reserva.
  EMAIL_NOT_FOUND: "Não há conta com este e-mail.",
  TOO_MANY_REQUESTS: "Muitas tentativas. Espere um pouco e tente de novo.",
  // 422 da divisao do preco (contrato de 18/09): a conta nao fechou com a regra
  // das Taxas Vupth — ou o servico ainda e da regra antiga.
  // So agenda x fila (8e6c00f): troca so antes do 1o cliente da fila de hoje.
  OPERATION_MODE_LOCKED:
    "O modo só muda no começo do expediente, antes do primeiro cliente na fila de hoje.",
  SERVICE_PRICE_SPLIT_INVALID:
    "O preço não fechou com a regra das Taxas Vupth. Confira o valor e salve de novo.",
  AFFILIATION_ALREADY_PENDING:
    "Você já tem uma solicitação de vinculação pendente para este estabelecimento. Aguarde a resposta do proprietário.",
  PROFESSIONAL_ALREADY_AFFILIATED:
    "Você já está vinculado a um estabelecimento. Desafilie-se antes de solicitar a outro.",
  USER_ALREADY_PROFESSIONAL: "Você já possui um perfil profissional.",
  ESTABLISHMENT_NOT_FOUND: "Estabelecimento não encontrado.",
  PROFESSIONAL_NOT_FOUND: "Perfil profissional não encontrado.",
  AFFILIATION_NOT_FOUND: "Solicitação de vinculação não encontrada.",
  ESTABLISHMENT_NOT_READY:
    "O estabelecimento precisa de pelo menos um profissional com serviço cadastrado para abrir.",
  // Horario por dia (S27): semana incompleta, horario faltando ou data passada.
  BUSINESS_HOURS_INVALID:
    "Horário inválido: confira os 7 dias e use datas de hoje em diante.",
  ESTABLISHMENT_HOURS_REQUIRED:
    "Defina o horário de funcionamento do estabelecimento antes de abrir.",
  // desativar-conta, fatia 1 (Backend 6a5d3ab): a loja do dono desativado.
  ESTABLISHMENT_UNAVAILABLE:
    "Esta loja está desativada. Ela volta quando o dono reativar a conta.",
  ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES:
    "Não é possível fechar enquanto há clientes em atendimento ou na fila. Conclua a fila antes de fechar.",
  INTERVAL_INVALID_TIME:
    "Horário da refeição fora do horário de funcionamento do estabelecimento.",
  INTERVAL_CONFLICT:
    "Conflito de horário: a refeição já foi iniciada/encerrada hoje ou se sobrepoe a outra.",
  INTERVAL_NOT_FOUND: "Refeicao/intervalo não encontrado.",
  // S1 — status do profissional (fatia 1).
  PROFESSIONAL_HAS_NO_SERVICE:
    "Cadastre pelo menos um serviço antes de entrar em expediente.",
  PROFESSIONAL_HAS_ACTIVE_ATTENDANCES:
    "Não da para ficar indisponível com cliente em atendimento ou na fila. Termine a fila primeiro.",
  // Esqueci minha senha (S7). O backend nao distingue "e-mail desconhecido" de
  // "codigo errado" de proposito (anti-enumeracao) — a mensagem cobre os dois.
  RESET_CODE_INVALID:
    "Código inválido. Confira o e-mail e o código digitado (após 5 erros ou uso, peça um novo).",
  RESET_CODE_EXPIRED: "Código expirado (vale 15 minutos). Peça um novo código.",
  // Trocar senha (breaking backend 2026-07-23): a senha ATUAL confere via
  // PasswordEncoder.matches; errada volta 401 — erro de campo, nao de sessao.
  CURRENT_PASSWORD_INVALID: "Senha atual incorreta.",
  VALIDATION_ERROR: "Verifique os dados informados e tente novamente.",
  // erros-em-portugues (Andre, 17/10): toda mensagem para a pessoa em portugues,
  // pelo CODIGO — o texto do servidor pode vir em ingles ("E-mail not registered").
  ACCESS_DENIED: "Você não tem acesso a isso.",
  ACCOUNT_DISABLED: "Esta conta está desativada.",
  ACCOUNT_DEACTIVATED: "Esta conta está desativada. Entre de novo para reativá-la.",
  ACCOUNT_LOCKED: "Conta bloqueada por tentativas demais. Tente de novo mais tarde.",
  BAD_CREDENTIALS: "E-mail ou senha incorretos.",
  REFRESH_TOKEN_INVALID: "Sua sessão expirou. Entre de novo.",
  REFRESH_TOKEN_NOT_FOUND: "Sua sessão expirou. Entre de novo.",
  EMAIL_NOT_AVAILABLE: "Este e-mail já está em uso.",
  EMAILS_ARE_THE_SAME: "O novo e-mail é igual ao atual.",
  INVALID_BIRTH_DATE: "Data de nascimento inválida.",
  INVALID_PROFILE_PHOTO: "Foto inválida. Escolha outra imagem.",
  NO_FIELDS_TO_UPDATE: "Nada para salvar: nenhum campo foi alterado.",
  INVALID_ARGUMENT: "Verifique os dados informados e tente novamente.",
  NOT_FOUND: "Não encontramos o que você procurou.",
  USER_NOT_FOUND: "Usuário não encontrado.",
  OWNER_NOT_FOUND: "Dono não encontrado.",
  CLIENT_NOT_FOUND: "Cliente não encontrado.",
  CLIENT_NOT_IN_QUEUE: "Este cliente não está na fila.",
  CLIENT_ALREADY_IN_QUEUE: "Este cliente já está na fila.",
  NOT_A_PROFESSIONAL: "Esta conta não tem perfil profissional.",
  PROFESSIONAL_NOT_AFFILIATED: "O profissional não está vinculado a esta loja.",
  AFFILIATION_ACCESS_DENIED: "Você não tem acesso a esta solicitação.",
  ESTABLISHMENT_ACCESS_DENIED: "Você não tem acesso a esta loja.",
  ESTABLISHMENT_NOT_OPEN: "A loja está fechada.",
  ESTABLISHMENT_NOBODY_WORKING: "Ninguém está trabalhando na loja agora.",
  OWNER_STORE_LIMIT: "Você já tem 5 lojas, o máximo por dono.",
  OWNER_MUST_TRANSFER: "Passe a loja para outro dono antes de continuar.",
  ACCOUNT_DEACTIVATE_NOT_ALLOWED: "Não é possível desativar a conta agora. Confira se há atendimentos em andamento.",
  ACCOUNT_DELETE_NOT_ALLOWED: "Não é possível excluir a conta agora. Confira se há atendimentos em andamento.",
  ACCOUNT_DELETION_LINK_INVALID: "Este link de exclusão não vale mais. Peça um novo.",
  ATTENDANCE_NOT_FOUND: "Atendimento não encontrado.",
  ATTENDANCE_INVALID_STATUS: "Este atendimento não pode mais ser alterado.",
  ATTENDANCE_ALREADY_CANCELLED: "Este atendimento já foi cancelado.",
  ATTENDANCE_ALREADY_IN_PROGRESS: "Este atendimento já está em andamento.",
  ATTENDANCE_ALREADY_RATED: "Este atendimento já foi avaliado.",
  ATTENDANCE_CANCEL_NOT_ALLOWED: "Você não pode cancelar este atendimento.",
  ATTENDANCE_NO_ROOM_FOR_SERVICE: "Não há tempo para este serviço no atendimento.",
  ATTENDANCE_SERVICE_ITEM_NOT_FOUND: "Serviço do atendimento não encontrado.",
  NO_SHOW_TOO_EARLY: "Ainda é cedo para marcar a falta.",
  NO_SHOW_REMOVED: "Este atendimento já foi retirado da fila.",
  CUT_REQUEST_EXPIRED: "Este pedido de corte expirou.",
  CUT_REQUEST_NOT_PENDING: "Este pedido de corte já foi respondido.",
  QUEUE_SWAP_ALREADY_PENDING: "Já existe um pedido de troca de lugar pendente.",
  QUEUE_SWAP_NOT_FOUND: "Pedido de troca de lugar não encontrado.",
  QUEUE_SWAP_OFFER_NOT_FOUND: "Oferta de troca de lugar não encontrada.",
  PAYMENT_ACCESS_DENIED: "Você não tem acesso a este pagamento.",
  PAYMENT_INVALID_STATUS: "Este pagamento não pode mais ser alterado.",
  PAYMENT_NOT_AVAILABLE: "Este pagamento não está disponível.",
  PIX_KEY_NOT_SET: "A chave Pix ainda não foi cadastrada.",
  PROFESSIONAL_AGENDA_FULL: "A agenda do profissional está cheia.",
  PROFESSIONAL_AGENDA_ONLY: "Este profissional atende só com horário marcado.",
  PROFESSIONAL_NOT_ACCEPTING_NEW: "O profissional não está aceitando novos clientes.",
  SERVICE_ITEM_ALREADY_EXISTS: "Você já tem esse serviço cadastrado.",
  SERVICE_ITEM_NOT_FOUND: "Serviço não encontrado.",
  SERVICE_TYPE_KEYWORD_ALREADY_EXISTS: "Já existe um tipo de serviço com esse nome.",
  ADDRESS_INVALID_COORDINATES: "Localização inválida. Confira o endereço.",
  ADDRESS_INVALID_UF: "Estado inválido. Use a sigla, por exemplo SP.",
  GEOCODING_ADDRESS_NOT_FOUND: "Não encontramos esse endereço no mapa. Confira os dados.",
  ESTABLISHMENT_INVALID_FILTER: "Filtro inválido.",
  INTENTION_BEFORE_QUEUE_END: "Escolha um horário depois do fim da fila.",
  INTENTION_HORIZON_EXCEEDED: "Esse horário está longe demais. Escolha uma data mais próxima.",
  INTENTION_OUTSIDE_BUSINESS_HOURS: "Esse horário está fora do funcionamento da loja.",
  INVALID_PATH_VARIABLE: "Não foi possível abrir esta página.",
  METHOD_NOT_ALLOWED: "Ação não permitida.",
  STORAGE_NOT_CONFIGURED: "O envio de fotos está indisponível agora. Tente mais tarde.",
};

export function getApiErrorMessage(error: any, fallback: string): string {
  if (!error?.response) {
    return "Sem conexão. Verifique sua internet e tente novamente.";
  }
  const data = error.response.data;

  const code = data?.code;
  if (code && ERROR_MESSAGES_PT[code]) {
    return ERROR_MESSAGES_PT[code];
  }

  // Erro interno (5xx) sem codigo conhecido: a mensagem e do servidor para o
  // servidor (ex.: NullPointerException, 26/09) — nao e frase para o usuario.
  if (error.response.status >= 500) {
    return "Algo deu errado e não foi possível concluir. Tente de novo em instantes — se continuar, avise o suporte.";
  }

  if (data?.fieldErrors) {
    return Object.entries(data.fieldErrors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join("\n");
  }
  if (data?.message) {
    return data.message;
  }

  // 403 sem `code` nem `message`: o backend recusou, e o app nao tem como
  // saber SE foi por o recurso nao ser seu ou por o seu papel nao permitir —
  // os dois casos chegam iguais. Ate o backend distinguir (ver S31 no
  // HANDOFF_BACKEND), a mensagem tem de ser verdadeira nos dois; dizer
  // "faca login de novo" seria chute, e mandaria a pessoa pro lugar errado.
  if (error.response.status === 403) {
    return "Você não tem acesso a isso. Se acabou de mudar algo na sua conta, feche e abra o app.";
  }
  return fallback;
}

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("vupth_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔴 REFRESH EM VOO UNICO (single-flight). Pedido do Front-Client, 06/09: "os
// quatro POST /auth/refresh do log de PROD sao deste app".
//
// Cada 401 disparava o PROPRIO refresh. O backend ROTACIONA o refresh token, e
// isso transforma concorrencia em logout: com quatro chamadas simultaneas uma
// ganha e as outras tomam 401 — e a perdedora, ao cair no catch, APAGA OS
// TOKENS QUE A VENCEDORA ACABOU DE SALVAR. O usuario era deslogado pela propria
// renovacao que deu certo.
//
// O primeiro 401 renova; os que chegam enquanto isso esperam a MESMA promessa
// e reusam o token novo — ou caem todos juntos, se a renovacao falhar. Um
// logout, nunca uma corrida. Nao ha janela entre o `if (!refreshEmVoo)` e a
// atribuicao: nao existe `await` entre os dois.
//
// ⚠️ Uma diferenca DELIBERADA do client: o refresh continua pelo `axios` GLOBAL,
// nao pelo `api`. Eles tem `isPublicPath` para a rota de auth; nos nao. Pelo
// `api`, um 401 no proprio refresh entraria nesta fila esperando a si mesmo —
// deadlock, com o app travado e sem erro nenhum.
//
// um-refresh-por-vez (PAR-17, 15/10 — log [SLOW] do staging: dois POST
// /auth/refresh juntos). O interceptor ja tinha o voo unico, mas o
// `refreshToken()` do auth store (socket, onboarding) fazia o SEU, em
// paralelo. Agora os dois passam por `renovarSessao()`: uma promessa so em voo;
// quem chega depois espera o mesmo resultado.
type Tokens = { access_token: string; refresh_token: string };
let refreshEmVoo: Promise<Tokens> | null = null;

/** Sem refresh token salvo: nao ha o que renovar. */
export const SEM_REFRESH = "SEM_REFRESH";

export function renovarSessao(): Promise<Tokens> {
  if (!refreshEmVoo) {
    refreshEmVoo = (async () => {
      const refreshToken = await SecureStore.getItemAsync("vupth_refresh_token");
      if (!refreshToken) throw new Error(SEM_REFRESH);
      const { data } = await axios.post<Tokens>(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
      await SecureStore.setItemAsync("vupth_access_token", data.access_token);
      await SecureStore.setItemAsync("vupth_refresh_token", data.refresh_token);
      return data;
    })().finally(() => {
      // Sem isto, o primeiro refresh prenderia o app para sempre.
      refreshEmVoo = null;
    });
  }
  return refreshEmVoo;
}

// desativar-conta (c0f5b17): no "So consultar" o que mexe na operacao da 403
// ACCOUNT_DEACTIVATED. O auth store se registra aqui para reabrir o "Reativar"
// — o api nao importa o store (o store importa o api).
let avisarContaDesativada: (() => void) | null = null;
export function aoContaDesativada(fn: (() => void) | null) {
  avisarContaDesativada = fn;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && error.response?.data?.code === "ACCOUNT_DEACTIVATED") {
      avisarContaDesativada?.();
      return Promise.reject(error);
    }

    // 401 de NEGOCIO, nao de sessao: senha atual incorreta na troca de senha
    // (PATCH /profile/update-password/me). A tela trata como erro de campo —
    // NAO pode disparar refresh/logout (senao o usuario cai fora ao errar a senha).
    const errorCode = error.response?.data?.code;

    if (
      error.response?.status !== 401 ||
      errorCode === "CURRENT_PASSWORD_INVALID" ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const { access_token } = await renovarSessao();
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch (refreshError: any) {
      // Sem refresh salvo nao se apaga nada; refresh recusado derruba a sessao
      // (um logout so, mesmo com varias requisicoes esperando).
      if (refreshError?.message !== SEM_REFRESH) {
        await SecureStore.deleteItemAsync("vupth_access_token");
        await SecureStore.deleteItemAsync("vupth_refresh_token");
      }
      return Promise.reject(error);
    }
  }
);
