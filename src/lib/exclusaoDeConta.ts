import { getApiErrorMessage } from "@lib/api";

// Traducao dos erros do DELETE /profile/delete/me. Mesma regra do client
// (Settings.tsx deles), para os dois apps falarem igual:
//   401 CURRENT_PASSWORD_INVALID -> erro de CAMPO (o interceptor ja nao desloga)
//   409 ACCOUNT_DELETE_NOT_ALLOWED -> bloqueio TEMPORARIO; a mensagem do backend
//     diz o que fazer para destravar e passa como veio. Trocar por "nao e
//     possivel apagar esta conta" reprovaria na revisao das lojas de app.
export function mensagemDaExclusao(error: any): string {
  const code = error?.response?.data?.code;
  const msg = error?.response?.data?.message;

  if (code === "CURRENT_PASSWORD_INVALID") {
    return "Senha incorreta. Confira e tente de novo.";
  }
  if (code === "ACCOUNT_DELETE_NOT_ALLOWED") {
    return msg ?? "Você tem um atendimento em andamento. Conclua antes de apagar a conta.";
  }
  return getApiErrorMessage(error, "Não foi possível deletar a conta.");
}
