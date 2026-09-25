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

const SELOS: Record<string, Selo> = {
  FINISHED: { label: "Finalizado", selo: "bg-vupth-greenTint", texto: "text-vupth-forest" },
  CANCELLED: { label: "Cancelado", selo: "bg-vupth-dangerTint", texto: "text-vupth-danger" },
  // A loja agiu: nem sucesso nem erro do cliente — o tom de atenção da marca.
  REMOVED: { label: "Retirado", selo: "bg-vupth-accentPeach", texto: "text-vupth-forest" },
  IN_PROGRESS: { label: "Em andamento", selo: "bg-vupth-greenTint", texto: "text-vupth-forest" },
  PAUSED: { label: "Pausado", selo: "bg-vupth-accentPeach", texto: "text-vupth-forest" },
  SCHEDULED: { label: "Agendado", selo: "bg-white", texto: "text-vupth-textSecondary" },
  LATE: { label: "Atrasado", selo: "bg-vupth-accentPeach", texto: "text-vupth-forest" },
};

// Um status que o app ainda não conhece não pode virar texto cru na tela.
const DESCONHECIDO: Selo = { label: "Outro", selo: "bg-white", texto: "text-vupth-textSecondary" };

export function seloDoStatus(status: string | null | undefined): Selo {
  return (status && SELOS[status]) || DESCONHECIDO;
}
