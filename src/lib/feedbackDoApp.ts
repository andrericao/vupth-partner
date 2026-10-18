import * as SecureStore from "expo-secure-store";

import { abrirDialogo } from "@store/dialogo.store";
import { abrirLink, type PerfilDoSuporte, SUPORTE_URL } from "@lib/suporte";

// pedido-de-feedback (Andre, 17/10): depois do atendimento, uma caixa pedindo
// feedback sobre o aplicativo; dizendo sim, abre o Suporte no formulario que
// manda o e-mail para a equipe. O link (com perfil e categoria ja escolhidos)
// e o combinado com o Suporte (5a3b6b2).
//
// No maximo uma vez a cada 30 dias; 90 para quem ja enviou. Nao ha como saber
// se o formulario foi enviado — tocar em "Enviar feedback" conta como enviado.
const KEY = "feedback_do_app";
const DIA = 24 * 60 * 60 * 1000;
export const INTERVALO_SEM_ENVIAR = 30 * DIA;
export const INTERVALO_APOS_ENVIAR = 90 * DIA;

type Registro = { em: number; enviou: boolean };

/** O formulario do Suporte, com perfil e categoria "Feedback sobre o app". */
export function linkDoFeedback(perfil: PerfilDoSuporte): string {
  return `${SUPORTE_URL}contato.html?perfil=${perfil}&categoria=feedback`;
}

async function ler(): Promise<Registro | null> {
  try {
    const bruto = await SecureStore.getItemAsync(KEY);
    if (!bruto) return null;
    const r = JSON.parse(bruto);
    return typeof r?.em === "number" ? { em: r.em, enviou: r.enviou === true } : null;
  } catch {
    return null;
  }
}

/** Ja passou o intervalo desde a ultima vez que a caixa apareceu? */
export function podePedirFeedback(ultimo: Registro | null, agora: number): boolean {
  if (!ultimo) return true;
  const espera = ultimo.enviou ? INTERVALO_APOS_ENVIAR : INTERVALO_SEM_ENVIAR;
  return agora - ultimo.em >= espera;
}

/**
 * Pergunta pelo feedback do app, se for a hora. Nunca lanca: e um extra depois
 * do finalizar, nao pode atrapalhar a fila.
 */
export async function pedirFeedbackDoApp(
  perfil: PerfilDoSuporte,
  agora: number = Date.now()
): Promise<void> {
  try {
    if (!podePedirFeedback(await ler(), agora)) return;
    const escolha = await abrirDialogo({
      titulo: "Ajude a melhorar o app",
      mensagem: "Conte o que achou do aplicativo. Leva um minuto.",
      botoes: [{ texto: "Enviar feedback" }, { texto: "Agora não", estilo: "cancel" }],
    });
    const enviar = escolha === 0;
    await SecureStore.setItemAsync(KEY, JSON.stringify({ em: agora, enviou: enviar }));
    if (enviar) await abrirLink(linkDoFeedback(perfil));
  } catch {
    // sem armazenamento ou navegador: segue sem a caixa
  }
}
