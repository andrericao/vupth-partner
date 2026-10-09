import { api, getApiErrorMessage } from "@lib/api";

// Passar a posse da loja (desativar-conta, contrato do Backend c0f5b17 e
// respostas ao S41 em 01c785e). So para um profissional ativo da loja, com
// aceite; o pedido nao vence e o dono pode pedir a qualquer momento (Andre, 08/10).

/** O pendente do dono: GET /establishment/{id}/ownership-transfer. */
export type PosseDoDono = {
  id: string;
  status: string;
  professional_id: string;
  professional_name: string;
  created_at: string;
};

/** Um convite que o profissional recebeu: GET /professional/me/ownership-transfers. */
export type ConviteDePosse = {
  id: string;
  establishment_id: string;
  establishment_name: string;
  from_owner_name: string;
  created_at: string;
  status: string;
};

export async function pedirPosse(establishmentId: string, professionalId: string): Promise<{ id: string; status: string }> {
  const { data } = await api.post(`/establishment/${establishmentId}/ownership-transfer`, { professionalId });
  return data;
}

/** null = sem pedido pendente (404 OWNERSHIP_TRANSFER_NOT_FOUND). */
export async function lerPosseDoDono(establishmentId: string): Promise<PosseDoDono | null> {
  try {
    const { data } = await api.get(`/establishment/${establishmentId}/ownership-transfer`);
    return data;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function cancelarPosse(id: string): Promise<void> {
  await api.delete(`/ownership-transfers/${id}`);
}

export async function listarConvitesDePosse(): Promise<ConviteDePosse[]> {
  const { data } = await api.get("/professional/me/ownership-transfers");
  return Array.isArray(data) ? data : [];
}

export async function aceitarPosse(id: string): Promise<void> {
  await api.post(`/ownership-transfers/${id}/accept`);
}

export async function recusarPosse(id: string): Promise<void> {
  await api.post(`/ownership-transfers/${id}/refuse`);
}

export function mensagemDaPosse(error: any): string {
  const code = error?.response?.data?.code;
  if (code === "TRANSFER_TARGET_NOT_IN_TEAM") {
    return "Escolha alguém que trabalha na loja — só quem está na equipe pode receber a posse.";
  }
  if (code === "TRANSFER_ALREADY_PENDING") {
    return "Já há um pedido pendente. Cancele esse antes de pedir para outra pessoa.";
  }
  return getApiErrorMessage(error, "Não foi possível concluir. Tente de novo.");
}

/** A equipe da loja, sem o proprio dono (ele nao passa a posse para si). */
export function candidatosAPosse(
  equipe: { id: string; name: string }[] | null | undefined,
  idDoDono: string | null | undefined
): { id: string; nome: string }[] {
  return (equipe ?? [])
    .filter((p) => p.id !== idDoDono)
    .map((p) => ({ id: p.id, nome: p.name }));
}
