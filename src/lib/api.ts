import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URLS: Record<string, string> = {
  local: `http://${process.env.EXPO_PUBLIC_API_LOCAL_IP ?? "192.168.0.16"}:8080`,
  staging: "https://vupth-backend-ia.onrender.com",
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
    "Voce ja tem uma solicitacao de vinculacao pendente para este estabelecimento. Aguarde a resposta do proprietario.",
  PROFESSIONAL_ALREADY_AFFILIATED:
    "Voce ja esta vinculado a um estabelecimento. Desafilie-se antes de solicitar a outro.",
  USER_ALREADY_PROFESSIONAL: "Voce ja possui um perfil profissional.",
  ESTABLISHMENT_NOT_FOUND: "Estabelecimento nao encontrado.",
  PROFESSIONAL_NOT_FOUND: "Perfil profissional nao encontrado.",
  AFFILIATION_NOT_FOUND: "Solicitacao de vinculacao nao encontrada.",
  ESTABLISHMENT_NOT_READY:
    "O estabelecimento precisa de pelo menos um profissional com servico cadastrado para abrir.",
  ESTABLISHMENT_HOURS_REQUIRED:
    "Defina o horario de funcionamento do estabelecimento antes de abrir.",
  INTERVAL_INVALID_TIME:
    "Horario da refeicao fora do horario de funcionamento do estabelecimento.",
  INTERVAL_CONFLICT:
    "Conflito de horario: a refeicao ja foi iniciada/encerrada hoje ou se sobrepoe a outra.",
  INTERVAL_NOT_FOUND: "Refeicao/intervalo nao encontrado.",
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

    if (error.response?.status === 401 && !originalRequest._retry) {
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
