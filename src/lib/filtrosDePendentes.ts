import { formatarReais } from "@lib/dinheiro";
import { isoDate } from "@lib/time";
import type { PagamentoPendente } from "@lib/pagamento";
import type { PremioDeIndicacao } from "@lib/premios";

// premio-em-pendentes, opcao (a) do Andre (05/11): Pendentes mostra tudo o que esta
// pendente (pagamentos dos clientes e premios de indicacao), com filtros por tipo e
// por periodo. So o que o dado ja distingue: o pagamento e de um corte; o premio e
// bonificacao. Os dois trazem `finished_at` (o dia do corte).

export type TipoDePendente = "TODOS" | "CORTES" | "BONIFICACAO";
export type PeriodoDePendente = "TUDO" | "HOJE" | "SEMANA" | "MES";

export const TIPOS_DE_PENDENTE: { key: TipoDePendente; rotulo: string }[] = [
  { key: "TODOS", rotulo: "Todos" },
  { key: "CORTES", rotulo: "Cortes" },
  { key: "BONIFICACAO", rotulo: "Bonificação" },
];

export const PERIODOS_DE_PENDENTE: { key: PeriodoDePendente; rotulo: string }[] = [
  { key: "TUDO", rotulo: "Tudo" },
  { key: "HOJE", rotulo: "Hoje" },
  { key: "SEMANA", rotulo: "7 dias" },
  { key: "MES", rotulo: "30 dias" },
];

const DIAS: Record<Exclude<PeriodoDePendente, "TUDO">, number> = { HOJE: 1, SEMANA: 7, MES: 30 };

/** O corte caiu no periodo (dias do calendario local, contando hoje)? Sem data, so em "Tudo". */
export function noPeriodo(iso: string | null | undefined, periodo: PeriodoDePendente, agora: Date = new Date()): boolean {
  if (periodo === "TUDO") return true;
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const inicio = new Date(agora);
  inicio.setDate(inicio.getDate() - (DIAS[periodo] - 1));
  const dia = isoDate(d);
  return dia >= isoDate(inicio) && dia <= isoDate(agora);
}

export function filtrarPendentes(
  { pagamentos, premios }: { pagamentos: PagamentoPendente[]; premios: PremioDeIndicacao[] },
  tipo: TipoDePendente,
  periodo: PeriodoDePendente,
  agora: Date = new Date()
): { pagamentos: PagamentoPendente[]; premios: PremioDeIndicacao[] } {
  return {
    pagamentos: tipo === "BONIFICACAO" ? [] : pagamentos.filter((p) => noPeriodo(p.finished_at, periodo, agora)),
    premios: tipo === "CORTES" ? [] : premios.filter((p) => noPeriodo(p.finished_at, periodo, agora)),
  };
}

/** "1 atendimento gerou R$ 5,00" / "3 atendimentos geraram R$ 15,00". */
export function textoDoResumo(quantos: number, total: number): string {
  const valor = formatarReais(total);
  return quantos === 1 ? `1 atendimento gerou ${valor}` : `${quantos} atendimentos geraram ${valor}`;
}

/** Um resumo por campanha, na ordem em que as campanhas aparecem. */
export function resumosPorCampanha(premios: PremioDeIndicacao[]): { chave: string; campanha: string; texto: string }[] {
  const grupos = new Map<string, { campanha: string; quantos: number; total: number }>();
  for (const p of premios) {
    const chave = p.campaign_id || p.campaign_name;
    const g = grupos.get(chave) ?? { campanha: p.campaign_name, quantos: 0, total: 0 };
    const v = Number(p.amount);
    g.quantos += 1;
    g.total += Number.isFinite(v) ? v : 0;
    grupos.set(chave, g);
  }
  return [...grupos.entries()].map(([chave, g]) => ({ chave, campanha: g.campanha, texto: textoDoResumo(g.quantos, g.total) }));
}

/** O resumo da campanha de um premio (topo da janela). */
export function resumoDaCampanhaDe(p: PremioDeIndicacao, premios: PremioDeIndicacao[]): string {
  const chave = p.campaign_id || p.campaign_name;
  return resumosPorCampanha(premios).find((r) => r.chave === chave)?.texto ?? textoDoResumo(1, Number(p.amount) || 0);
}

/** "05/11" do dia do corte (fuso do aparelho); invalido, null. */
export function diaCurto(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}`;
}
