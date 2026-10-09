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
  // desativar-conta (c0f5b17): o dono com loja passa a posse ou apaga a loja antes.
  if (code === "OWNER_MUST_TRANSFER") {
    return msg ?? "Você ainda é dono de uma loja. Passe a posse para alguém da equipe ou apague a loja antes.";
  }
  return getApiErrorMessage(error, "Não foi possível deletar a conta.");
}

// Erros do POST /profile/deactivate/me (c0f5b17), na mesma regra do apagar:
//   401 CURRENT_PASSWORD_INVALID -> erro de CAMPO
//   409 ACCOUNT_DEACTIVATE_NOT_ALLOWED -> compromisso vivo (fila, atendimento);
//     a mensagem do backend diz o que fazer e passa como veio.
export function mensagemDaDesativacao(error: any): string {
  const code = error?.response?.data?.code;
  const msg = error?.response?.data?.message;

  if (code === "CURRENT_PASSWORD_INVALID") {
    return "Senha incorreta. Confira e tente de novo.";
  }
  if (code === "ACCOUNT_DEACTIVATE_NOT_ALLOWED") {
    return msg ?? "Você tem um atendimento ou fila em andamento. Conclua antes de desativar a conta.";
  }
  return getApiErrorMessage(error, "Não foi possível desativar a conta.");
}

// Erros do DELETE /establishment/{id} (c0f5b17, item 5): apagar a loja.
//   401 CURRENT_PASSWORD_INVALID -> erro de CAMPO
//   409 ESTABLISHMENT_HAS_ACTIVE_QUEUE -> ha gente na fila; a mensagem passa como veio.
export function mensagemDaRemocaoDaLoja(error: any): string {
  const code = error?.response?.data?.code;
  const msg = error?.response?.data?.message;

  if (code === "CURRENT_PASSWORD_INVALID") {
    return "Senha incorreta. Confira e tente de novo.";
  }
  if (code === "ESTABLISHMENT_HAS_ACTIVE_QUEUE") {
    return msg ?? "Ainda há clientes na fila. Atenda ou encerre a fila antes de apagar a loja.";
  }
  return getApiErrorMessage(error, "Não foi possível apagar a loja.");
}
