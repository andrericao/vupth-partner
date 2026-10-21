// Rótulo e cor do selo de status nos HISTÓRICOS (Atendimentos do dono e Meu
// dia do profissional) — num lugar só, para as duas telas falarem igual.
//
// 🔴 Contrato do backend (decisão do Andre, 18/09): o status passou a separar
// quem encerrou.
//   REMOVED   = a LOJA tirou o cliente da fila (remover, ou a escalada do
//               "não chegou");
//   CANCELLED = o CLIENTE desistiu (cancelar, sair da fila, desistir).
// O backend segurou o deploy até os fronts aceitarem o valor novo: tela com
// switch por status e sem ramo padrão mostra o código cru — foi a reclamação
// do Andre em 18/09 ("uma tela branca com log do backend").
//
// CANCELLED segue "Cancelado", e não "Desistiu": as linhas de ANTES de 18/09
// são todas CANCELLED, inclusive as que a loja retirou — o backend não
// reconstrói o passado, e um rótulo que acusa o cliente mentiria nelas.

export type Selo = { label: string; selo: string; texto: string };

// O texto de cada selo e o par `on*` do fundo dele (onGreenTint, onAccentPeach):
// forest sobre tudo so valia no claro; no escuro o forest e a surface.
const SELOS: Record<string, Selo> = {
  FINISHED: { label: "Finalizado", selo: "bg-vupth-greenTint", texto: "text-vupth-onGreenTint" },
  CANCELLED: { label: "Cancelado", selo: "bg-vupth-dangerTint", texto: "text-vupth-danger" },
  // A loja agiu: nem sucesso nem erro do cliente — o tom de atenção da marca.
  REMOVED: { label: "Retirado", selo: "bg-vupth-accentPeach", texto: "text-vupth-onAccentPeach" },
  IN_PROGRESS: { label: "Em andamento", selo: "bg-vupth-greenTint", texto: "text-vupth-onGreenTint" },
  PAUSED: { label: "Pausado", selo: "bg-vupth-accentPeach", texto: "text-vupth-onAccentPeach" },
  SCHEDULED: { label: "Agendado", selo: "bg-vupth-background", texto: "text-vupth-textSecondary" },
  LATE: { label: "Atrasado", selo: "bg-vupth-accentPeach", texto: "text-vupth-onAccentPeach" },
};

// Um status que o app ainda não conhece não pode virar texto cru na tela.
const DESCONHECIDO: Selo = { label: "Outro", selo: "bg-vupth-background", texto: "text-vupth-textSecondary" };

export function seloDoStatus(status: string | null | undefined): Selo {
  return (status && SELOS[status]) || DESCONHECIDO;
}

// relatorio-sem-multa (DEC-83): o profissional e a loja ficam com o REGISTRO do
// atendimento que nao aconteceu e o MOTIVO — sem valor de multa. Sao tres
// motivos; o que o app nao conhece nao aparece (nada de codigo cru na tela).
const MOTIVOS: Record<string, string> = {
  CLIENT_CANCELLED: "Cliente cancelou",
  PROFESSIONAL_REMOVED: "Profissional removeu o cliente",
  REMOVED_FOR_LATENESS: "Cliente removido por atraso",
};

export function motivoNaoRealizado(motivo: string | null | undefined): string | null {
  return (motivo && MOTIVOS[motivo]) || null;
}

/** A linha de observacao do atendimento no historico, ou null. */
export function observacaoDoAtendimento(item: {
  not_realized_reason?: string | null;
  late_arrival?: boolean | null;
}): string | null {
  return motivoNaoRealizado(item.not_realized_reason) ?? (item.late_arrival ? "Teve atraso" : null);
}
