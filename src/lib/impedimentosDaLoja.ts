// remover-profissionais-ao-excluir-loja (PAR-15, DEC-173; contrato BAK 3abe464): o DELETE da loja
// responde 409 com `blockers[]`: { code, count, items:[{id, name}] }. A tela lista cada impedimento;
// nos profissionais oferece "Remover da loja" (so desfaz o vinculo: a conta dele fica), e nos
// atendimentos e agendamentos leva a quem resolve. Nao existe "cancelar tudo": o dono resolve e tenta de novo.

export type CodigoDoImpedimento =
  | "ESTABLISHMENT_HAS_PROFESSIONALS"
  | "ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES"
  | "ESTABLISHMENT_HAS_FUTURE_BOOKINGS";

export type ItemDoImpedimento = { id: string; name: string };

export type ImpedimentoDaLoja = {
  code: CodigoDoImpedimento;
  titulo: string;
  count: number;
  items: ItemDoImpedimento[];
  /** So os profissionais tem "Remover da loja". */
  removivel: boolean;
  /** Atendimentos e agendamentos: o atalho para onde se resolve. */
  atalho: { rotulo: string; rota: string } | null;
};

const CODIGOS: CodigoDoImpedimento[] = [
  "ESTABLISHMENT_HAS_PROFESSIONALS",
  "ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES",
  "ESTABLISHMENT_HAS_FUTURE_BOOKINGS",
];

function titulo(code: CodigoDoImpedimento, n: number): string {
  if (code === "ESTABLISHMENT_HAS_PROFESSIONALS")
    return n === 1 ? "1 profissional na loja" : `${n} profissionais na loja`;
  if (code === "ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES")
    return n === 1 ? "1 cliente na fila ou em atendimento" : `${n} clientes na fila ou em atendimento`;
  return n === 1 ? "1 agendamento futuro" : `${n} agendamentos futuros`;
}

/** Os impedimentos do 409 da exclusao, na ordem do Backend; [] se o erro nao for esse. */
export function impedimentosDaExclusao(error: any): ImpedimentoDaLoja[] {
  const dados = error?.response?.data;
  if (error?.response?.status !== 409 || !Array.isArray(dados?.blockers)) return [];
  const saida: ImpedimentoDaLoja[] = [];
  for (const b of dados.blockers) {
    if (!CODIGOS.includes(b?.code)) continue;
    const items: ItemDoImpedimento[] = Array.isArray(b.items)
      ? b.items.filter((i: any) => i && typeof i.id === "string").map((i: any) => ({ id: i.id, name: String(i.name ?? "") }))
      : [];
    const count = typeof b.count === "number" ? b.count : items.length;
    saida.push({
      code: b.code,
      titulo: titulo(b.code, count),
      count,
      items,
      removivel: b.code === "ESTABLISHMENT_HAS_PROFESSIONALS",
      atalho:
        b.code === "ESTABLISHMENT_HAS_PROFESSIONALS"
          ? null
          : { rotulo: "Ver atendimentos", rota: "/(owner)/(tabs)/attendances" },
    });
  }
  return saida;
}

/** Tira um profissional ja removido da lista; some o bloco que ficar sem itens. */
export function semProfissional(impedimentos: ImpedimentoDaLoja[], profissionalId: string): ImpedimentoDaLoja[] {
  return impedimentos
    .map((i) =>
      i.code === "ESTABLISHMENT_HAS_PROFESSIONALS"
        ? { ...i, items: i.items.filter((x) => x.id !== profissionalId), count: Math.max(0, i.count - 1) }
        : i
    )
    .filter((i) => i.count > 0 || i.items.length > 0)
    .map((i) => (i.code === "ESTABLISHMENT_HAS_PROFESSIONALS" ? { ...i, titulo: titulo(i.code, i.count) } : i));
}

/** Erro do "Remover da loja" (409 com atendimento em curso, ou o padrao). */
export function mensagemDoRemoverDaLoja(error: any): string {
  if (error?.response?.data?.code === "PROFESSIONAL_HAS_ACTIVE_ATTENDANCES") {
    return "Esse profissional tem um atendimento em andamento. Espere terminar e tente de novo.";
  }
  return "Não foi possível remover da loja. Tente de novo.";
}
