// Solicitacoes de vinculo que ESPERAM O DONO. Ver o teste para o porque de
// contar so REQUEST: o convite (INVITATION) pendente espera o profissional.
export type VinculoResumo = { type: string; status: string };

export function solicitacoesPendentes(lista: VinculoResumo[] | null | undefined): number {
  if (!Array.isArray(lista)) return 0;
  return lista.filter((v) => v.type === "REQUEST" && v.status === "PENDING").length;
}

type VinculoResolvido = { status: string; resolvedAt?: string | null; createdAt?: string | null };

/**
 * O historico do dono (historico-de-vinculo, BAK 7e3e21b): com ?status=ALL a
 * API manda tambem os resolvidos, com `resolvedAt`. Sem os PENDING, do mais
 * recente para o mais antigo; backend sem `resolvedAt` cai no `createdAt`.
 */
export function historicoDeVinculos<T extends VinculoResolvido>(lista: T[] | null | undefined): T[] {
  if (!Array.isArray(lista)) return [];
  const quando = (v: T) => v.resolvedAt ?? v.createdAt ?? "";
  return lista
    .filter((v) => v.status !== "PENDING")
    .sort((a, b) => quando(b).localeCompare(quando(a)));
}

/** "05/10" — o dia em que o vinculo foi resolvido; vazio sem data valida. */
export function diaDoVinculo(iso: string | null | undefined): string {
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[2]}/${m[1]}` : "";
}
