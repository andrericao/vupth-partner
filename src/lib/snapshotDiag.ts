// Resumo do snapshot da fila para o painel de diagnostico (7 toques na versao).
//
// POR QUE ISTO EXISTE: o "nao existe botao de finalizar" esta em aberto desde
// 31/08 sem prova. O `ServingCard` mostra "Finalizar" SEMPRE, sem condicional,
// entao o botao nunca sumiu — o CARD nao montou, e ele depende de UMA coisa:
// `current_attendance` preenchido no snapshot.
//
// Ver esse payload e que era impossivel: o QA roda em APK, onde nao ha
// DevTools, e os logs sao gated por `__DEV__`. Este resumo vai para a tela.
//
// A pergunta que ele responde tem duas respostas possiveis, e elas levam a
// times diferentes:
//   - o GET ja vem sem o campo          -> backend
//   - o GET vem com, o WS chega sem     -> nosso: o socket faz
//     `setQueryData(snapshot)` SEM MERGE, entao ele SUBSTITUI o que o GET
//     trouxe (ver useQueueSocket).
export type ResumoAtendimento = {
  /** false = o id nem estava na lista (outro defeito, nao confundir). */
  achouProfissional: boolean;
  temAtendimento: boolean;
  status: string | null;
  cliente: string | null;
  totalNaEspera: number;
};

const VAZIO: ResumoAtendimento = {
  achouProfissional: false,
  temAtendimento: false,
  status: null,
  cliente: null,
  totalNaEspera: 0,
};

export function resumirAtendimento(
  snapshot: unknown,
  professionalId?: string | null
): ResumoAtendimento {
  if (!professionalId) return VAZIO;

  const lista = (snapshot as any)?.professionals;
  if (!Array.isArray(lista)) return VAZIO;

  const eu = lista.find((p: any) => p?.id === professionalId);
  if (!eu) return VAZIO;

  const atual = eu.current_attendance ?? null;

  return {
    achouProfissional: true,
    temAtendimento: !!atual,
    status: atual?.status ?? null,
    cliente: atual?.clientName ?? null,
    totalNaEspera: Array.isArray(eu.waiting_list) ? eu.waiting_list.length : 0,
  };
}

/** Uma linha curta, do jeito que cabe no painel do aparelho. */
export function linhaDoResumo(origem: "GET" | "WS", r: ResumoAtendimento): string {
  if (!r.achouProfissional) return `${origem}: eu não estava na lista`;
  if (!r.temAtendimento) return `${origem}: current_attendance NULO · espera ${r.totalNaEspera}`;
  return `${origem}: ${r.status} · ${r.cliente ?? "?"} · espera ${r.totalNaEspera}`;
}
