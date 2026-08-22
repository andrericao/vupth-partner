import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Render = ambiente de TESTE; Railway = PRODUCAO, e e no Railway que o time
// testa em device (Andre 2026-08-22).
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

const env = process.env.EXPO_PUBLIC_API_ENV ?? "staging";
const BASE_URL = API_URLS[env] ?? API_URLS.staging;

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

  if (data?.fieldErrors) {
    return Object.entries(data.fieldErrors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join("\n");
  }
  if (data?.message) {
    return data.message;
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 de NEGOCIO, nao de sessao: senha atual incorreta na troca de senha
    // (PATCH /profile/update-password/me). A tela trata como erro de campo —
    // NAO pode disparar refresh/logout (senao o usuario cai fora ao errar a senha).
    const errorCode = error.response?.data?.code;

    if (
      error.response?.status === 401 &&
      errorCode !== "CURRENT_PASSWORD_INVALID" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = await SecureStore.getItemAsync("vupth_refresh_token");
      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        await SecureStore.setItemAsync(
          "vupth_access_token",
          data.access_token
        );
        await SecureStore.setItemAsync(
          "vupth_refresh_token",
          data.refresh_token
        );

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch {
        await SecureStore.deleteItemAsync("vupth_access_token");
        await SecureStore.deleteItemAsync("vupth_refresh_token");
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
