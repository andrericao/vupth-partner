import { formatarReais } from "@lib/dinheiro";
import type { CorteDoRelatorio, ProfessionalReport } from "@store/professional.store";

// relatorio-com-pendencias (DEC-109; Backend de0af2e): em Relatorios, o que o
// profissional recebe, as taxas e a divida do pagamento por fora, no periodo e
// por corte. Sem multa e sem lucro do app. A divida de teste (flag do Painel
// desligada) aparece a parte, marcada como teste.
export type ResumoDePendencias = {
  recebe: number | null;
  taxas: number | null;
  divida: number;
  simulada: number;
};

const numero = (v: unknown): number | null => {
  const n = Number(v);
  return v == null || !Number.isFinite(n) ? null : n;
};

/** Sem nenhum dos campos (backend antigo), null: a secao nem aparece. */
export function resumoDePendencias(r: ProfessionalReport | null | undefined): ResumoDePendencias | null {
  if (!r) return null;
  const recebe = numero(r.receives_total);
  const taxas = numero(r.fees_total);
  const divida = numero(r.pending_debt_total);
  const simulada = numero(r.pending_debt_simulated_total);
  if (recebe === null && taxas === null && divida === null && simulada === null) return null;
  return { recebe, taxas, divida: divida ?? 0, simulada: simulada ?? 0 };
}

/** "Recebe R$ 27,00 · Taxas R$ 3,00 · Dívida R$ 2,90"; so o que vier. */
export function linhaDoCorte(c: CorteDoRelatorio): string {
  const partes: string[] = [];
  const recebe = numero(c.receives);
  const taxas = numero(c.fees);
  const divida = numero(c.pending_debt) ?? 0;
  const simulada = numero(c.pending_debt_simulated) ?? 0;
  if (recebe !== null) partes.push(`Recebe ${formatarReais(recebe)}`);
  if (taxas !== null) partes.push(`Taxas ${formatarReais(taxas)}`);
  if (divida > 0) partes.push(`Dívida ${formatarReais(divida)}`);
  else if (simulada > 0) partes.push(`Dívida ${formatarReais(simulada)} (teste)`);
  return partes.join(" · ");
}

/** "14:30" do fim do corte, na hora do aparelho; sem data valida, "". */
export function horaDoCorte(c: Pick<CorteDoRelatorio, "finished_at">): string {
  if (!c.finished_at) return "";
  const d = new Date(c.finished_at);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
