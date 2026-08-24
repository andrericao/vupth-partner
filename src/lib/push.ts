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
// Todos os tipos conhecidos levam o profissional para a fila; tipo desconhecido
// ou ausente => null (nao navega).
export function notificationRoute(data: any): string | null {
  const type = data?.type;
  if (typeof type !== "string") return null;
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

export async function acquireExpoPushToken(
  env: PushEnv
): Promise<string | null> {
  // Emulador/web nao recebem push remoto — nem pede permissao.
  if (!env.isDevice) return null;

  let { status } = await env.getPermissionsAsync();
  if (status !== "granted") {
    status = (await env.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  const { data } = await env.getExpoPushTokenAsync({ projectId: env.projectId });
  return data ?? null;
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
