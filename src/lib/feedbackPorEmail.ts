import { Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "@lib/api";

// feedback-no-app (PAR-8, DEC-167; contrato BAK feedback-por-email, a936dcc): "Enviar feedback" no
// Perfil. POST /feedback, so logado: { text (1 a 1000), app: PARTNER, category?, app_version?, device? }.
// 204 vazio. 422 VALIDATION_ERROR; 429 FEEDBACK_LIMIT (5 por usuario por dia). Sem e-mail do
// usuario nem dado pessoal no corpo.
export const FEEDBACK_MAX = 1000;

export type ResultadoDoFeedback = { ok: true } | { ok: false; mensagem: string };

export const MENSAGEM_LIMITE = "Você já enviou bastante feedback hoje. Obrigado! Tente de novo amanhã.";

export async function enviarFeedback(texto: string): Promise<ResultadoDoFeedback> {
  const text = texto.trim().slice(0, FEEDBACK_MAX);
  if (!text) return { ok: false, mensagem: "Escreva uma mensagem antes de enviar." };
  try {
    await api.post("/feedback", {
      text,
      app: "PARTNER",
      app_version: Constants.expoConfig?.version ?? undefined,
      device: Platform.OS,
    });
    return { ok: true };
  } catch (erro: any) {
    const code = erro?.response?.data?.code;
    if (erro?.response?.status === 429 || code === "FEEDBACK_LIMIT") {
      return { ok: false, mensagem: MENSAGEM_LIMITE };
    }
    if (!erro?.response) {
      return { ok: false, mensagem: "Sem conexão. Verifique sua internet e tente novamente." };
    }
    return { ok: false, mensagem: "Não foi possível enviar agora. Tente de novo mais tarde." };
  }
}
