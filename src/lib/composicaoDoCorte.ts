import type { ComposicaoDoCorte, DestinoDaParcela } from "@store/professional.store";

// relatorio-explica-valores-tela (PAR-9, DEC-166; contrato BAK 91da259): o relatorio do PROFISSIONAL
// explica para onde vai cada valor. No modo teste (charged:false) as taxas do gateway e do app
// aparecem RISCADAS com "nao cobrada no teste"; a multa vai a quem o Backend disser (goes_to).
// Corte antigo pode vir sem gateway_fee/app_fee: a linha e omitida. So o Partner usa isto.

export type LinhaDaComposicao = {
  chave: "service" | "gateway_fee" | "app_fee" | "penalty" | "total";
  rotulo: string;
  valor: number;
  /** Taxa nao cobrada no teste: o valor aparece riscado. */
  riscada: boolean;
  /** "Não cobrada no teste", ou "Vai para: …". */
  nota: string | null;
  forte: boolean;
};

const DESTINO: Record<DestinoDaParcela, string> = {
  professional: "Vai para você",
  gateway: "Vai para a empresa de pagamento",
  app: "Vai para o app",
};

function numero(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** As linhas do corte na ordem da conta; vazio quando o Backend nao mandou composicao. */
export function linhasDaComposicao(c: ComposicaoDoCorte | null | undefined): LinhaDaComposicao[] {
  if (!c) return [];
  const teste = c.charged === false;
  const destino = (k: "service" | "gateway_fee" | "app_fee" | "penalty") =>
    c.goes_to?.[k] ? DESTINO[c.goes_to[k] as DestinoDaParcela] ?? null : null;
  const linhas: LinhaDaComposicao[] = [];
  const servico = numero(c.service);
  if (servico != null) linhas.push({ chave: "service", rotulo: "Serviço", valor: servico, riscada: false, nota: destino("service"), forte: false });
  const gateway = numero(c.gateway_fee);
  if (gateway != null)
    linhas.push({ chave: "gateway_fee", rotulo: "Taxa da empresa de pagamento", valor: gateway, riscada: teste, nota: teste ? "Não cobrada no teste" : destino("gateway_fee"), forte: false });
  const app = numero(c.app_fee);
  if (app != null)
    linhas.push({ chave: "app_fee", rotulo: "Taxa do app", valor: app, riscada: teste, nota: teste ? "Não cobrada no teste" : destino("app_fee"), forte: false });
  const multa = numero(c.penalty);
  if (multa != null && multa > 0) linhas.push({ chave: "penalty", rotulo: "Multa", valor: multa, riscada: false, nota: destino("penalty"), forte: false });
  const total = numero(c.total);
  if (total != null) linhas.push({ chave: "total", rotulo: "Cliente pagou", valor: total, riscada: false, nota: null, forte: true });
  return linhas;
}

/** Algum corte do periodo traz composicao? (a secao so aparece se sim) */
export function temComposicao(cortes: { composition?: ComposicaoDoCorte | null }[] | null | undefined): boolean {
  return (cortes ?? []).some((c) => linhasDaComposicao(c.composition).length > 0);
}
