// Solicitacoes de vinculo que ESPERAM O DONO. Ver o teste para o porque de
// contar so REQUEST: o convite (INVITATION) pendente espera o profissional.
export type VinculoResumo = { type: string; status: string };

export function solicitacoesPendentes(lista: VinculoResumo[] | null | undefined): number {
  if (!Array.isArray(lista)) return 0;
  return lista.filter((v) => v.type === "REQUEST" && v.status === "PENDING").length;
}
