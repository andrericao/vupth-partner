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
};

export function getApiErrorMessage(error: any, fallback: string): string {
  if (!error?.response) {
    return "Sem conexao com o servidor. Verifique sua internet e tente novamente.";
  }
  const data = error.response.data;

  const code = data?.code;
  if (code && ERROR_MESSAGES_PT[code]) {
    return ERROR_MESSAGES_PT[code];
  }

  // Erro interno (5xx) sem codigo conhecido: a mensagem e do servidor para o
  // servidor (ex.: NullPointerException, 26/09) — nao e frase para o usuario.
  if (error.response.status >= 500) {
    return "O servidor teve um problema e não conseguiu concluir. Tente de novo em instantes — se continuar, avise o suporte.";
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
// Padrao ESPELHADO do client (src/services/api.ts deles): flag + fila. O
// primeiro 401 renova; os que chegam enquanto isso entram na fila e reusam o
// token novo — ou caem todos juntos, se a renovacao falhar. Um logout, nunca
// uma corrida. Nao ha janela entre o `if (isRefreshing)` e o
// `isRefreshing = true`: nao existe `await` entre os dois.
//
// ⚠️ Uma diferenca DELIBERADA do client: o refresh continua pelo `axios` GLOBAL,
// nao pelo `api`. Eles tem `isPublicPath` para a rota de auth; nos nao. Pelo
// `api`, um 401 no proprio refresh entraria nesta fila esperando a si mesmo —
// deadlock, com o app travado e sem erro nenhum.
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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

    // Ja ha uma renovacao em voo: espera por ela em vez de disparar outra.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync("vupth_refresh_token");
      if (!refreshToken) {
        // Sem refresh salvo nao ha o que renovar — mas a fila tambem precisa
        // saber, senao quem esperava fica pendurado para sempre.
        processQueue(error, null);
        return Promise.reject(error);
      }

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      await SecureStore.setItemAsync("vupth_access_token", data.access_token);
      await SecureStore.setItemAsync("vupth_refresh_token", data.refresh_token);

      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      processQueue(null, data.access_token);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await SecureStore.deleteItemAsync("vupth_access_token");
      await SecureStore.deleteItemAsync("vupth_refresh_token");
      return Promise.reject(error);
    } finally {
      // Sem isto, o primeiro refresh prenderia o app na fila para sempre.
      isRefreshing = false;
    }
  }
);
