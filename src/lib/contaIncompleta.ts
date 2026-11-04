import { router } from "expo-router";

// aviso-7-dias-banner (DEC-163; BAK 5a59cbd): passado o prazo, sem CPF, o PATCH de status do
// profissional e o de abrir a loja respondem 422 ACCOUNT_INCOMPLETE. O app leva as Configuracoes
// com o aviso de conta incompleta. NUNCA derruba atendimento em curso: so a tentativa de
// comecar a trabalhar/abrir e barrada, e quem barra e o Backend.

export const ROTA_CONTA_INCOMPLETA = "/(professional)/settings-account";

export function ehContaIncompleta(error: any): boolean {
  return error?.response?.status === 422 && error?.response?.data?.code === "ACCOUNT_INCOMPLETE";
}

/** Se o erro e de conta incompleta, leva as Configuracoes e devolve true. Nunca lanca. */
export function levarSeContaIncompleta(error: any): boolean {
  if (!ehContaIncompleta(error)) return false;
  try {
    router.push({ pathname: ROTA_CONTA_INCOMPLETA, params: { aviso: "conta-incompleta" } } as any);
  } catch {
    // sem navegador montado (teste, boot): o erro segue para a tela de quem chamou
  }
  return true;
}
