import * as SecureStore from "expo-secure-store";

import { formatarReais } from "@lib/dinheiro";

// aba-de-custos (Andre, 15/10; desenho da Design em design-custos.html): a
// calculadora "Quanto cobrar?". Entra em R$ (nunca em porcentagem), tudo local:
// o ultimo calculo fica no aparelho e o resultado nunca edita o preco do servico.
export type EntradaDeCustos = {
  fixos: number; // custos fixos do mes, R$
  dias: number; // dias trabalhados por mes
  cortesPorDia: number;
  custoPorCorte: number; // lamina, toalha, produto, R$
  ganho: number; // quanto quer ganhar no mes, R$
};

export const PADRAO_DE_CUSTOS: EntradaDeCustos = { fixos: 0, dias: 22, cortesPorDia: 8, custoPorCorte: 0, ganho: 0 };

export type ResultadoDeCustos = {
  cortesNoMes: number;
  fixoPorCorte: number;
  ganhoPorCorte: number;
  minimo: number; // cobre a conta
  sugerido: number; // paga a pessoa
  sobraPct: number; // da sugerida, so informacao
};

/** minimo = fixos / (dias x cortes) + custo por corte; sugerido = minimo + ganho / (dias x cortes). */
export function calcularCustos(e: EntradaDeCustos): ResultadoDeCustos | null {
  const cortesNoMes = e.dias * e.cortesPorDia;
  if (!(cortesNoMes > 0)) return null;
  const fixoPorCorte = e.fixos / cortesNoMes;
  const ganhoPorCorte = e.ganho / cortesNoMes;
  const minimo = fixoPorCorte + e.custoPorCorte;
  const sugerido = minimo + ganhoPorCorte;
  return {
    cortesNoMes,
    fixoPorCorte,
    ganhoPorCorte,
    minimo: Math.round(minimo),
    sugerido: Math.round(sugerido),
    sobraPct: sugerido > 0 ? Math.round((ganhoPorCorte / sugerido) * 100) : 0,
  };
}

/** Quanto falta para o servico chegar ao sugerido; so quando o preco esta abaixo. */
export function faltaParaSugerido(preco: number, sugerido: number): number | null {
  const falta = Math.round(sugerido - preco);
  return falta > 0 ? falta : null;
}

/** O "Saiba mais": a conta com os numeros da pessoa, a porcentagem so aqui. */
export function explicacaoDaConta(r: ResultadoDeCustos, e: EntradaDeCustos): string[] {
  return [
    `${formatarReais(e.fixos)} de custo fixo ÷ ${r.cortesNoMes} cortes = ${formatarReais(r.fixoPorCorte)} por corte.`,
    `Mais ${formatarReais(e.custoPorCorte)} de custo do corte = mínimo de ${formatarReais(r.minimo)}.`,
    `${formatarReais(e.ganho)} que você quer ganhar ÷ ${r.cortesNoMes} cortes = ${formatarReais(r.ganhoPorCorte)} por corte.`,
    `Mínimo mais o ganho = sugerido de ${formatarReais(r.sugerido)}. Sobram ${r.sobraPct}% do preço para você.`,
  ];
}

const KEY = "custos_calculo";

/** O ultimo calculo; sem nada salvo (ou lixo), o padrao. */
export async function lerCustos(): Promise<EntradaDeCustos> {
  try {
    const bruto = await SecureStore.getItemAsync(KEY);
    if (!bruto) return PADRAO_DE_CUSTOS;
    const v = JSON.parse(bruto);
    const num = (x: unknown, d: number) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : d);
    return {
      fixos: num(v.fixos, PADRAO_DE_CUSTOS.fixos),
      dias: num(v.dias, PADRAO_DE_CUSTOS.dias),
      cortesPorDia: num(v.cortesPorDia, PADRAO_DE_CUSTOS.cortesPorDia),
      custoPorCorte: num(v.custoPorCorte, PADRAO_DE_CUSTOS.custoPorCorte),
      ganho: num(v.ganho, PADRAO_DE_CUSTOS.ganho),
    };
  } catch {
    return PADRAO_DE_CUSTOS;
  }
}

export async function salvarCustos(e: EntradaDeCustos): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(e));
  } catch {
    // o calculo segue valendo na tela; so nao fica guardado
  }
}
