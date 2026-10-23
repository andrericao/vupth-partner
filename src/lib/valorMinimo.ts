import { api } from "@lib/api";
import { confirmar } from "@lib/confirmar";
import { formatarReais } from "@lib/dinheiro";

// aviso-valor-minimo (DEC-121; Backend 37c7d91): servico de valor igual ou
// abaixo do minimo (padrao R$ 5,00) leva um aviso: as taxas fazem o preco do
// cliente subir demais. O cadastro continua permitido — a pessoa confirma.
// O minimo vem do Backend (GET /settings/service-min-price); sem resposta,
// nao ha aviso e o salvamento segue como sempre.
export async function buscarMinimoDoServico(): Promise<number | null> {
  try {
    const { data } = await api.get<{ min_price?: number | string | null }>("/settings/service-min-price");
    const n = Number(data?.min_price);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

/** Igual ou abaixo do minimo avisa; o minimo 0 (ou ausente) nunca avisa. */
export function abaixoDoMinimo(preco: number, minimo: number | null): boolean {
  return minimo != null && minimo > 0 && preco <= minimo;
}

export function textoDoAvisoDeMinimo(minimo: number) {
  return {
    titulo: "Valor baixo",
    mensagem: `O mínimo é ${formatarReais(minimo)}. As taxas deixam o preço do cliente alto.`,
    confirmar: "Cadastrar",
    cancelar: "Cancelar",
  };
}

/** true = pode salvar (preco ok, sem resposta do Backend, ou a pessoa confirmou). */
export async function confirmarValorMinimo(
  preco: number,
  deps: { buscar?: () => Promise<number | null>; perguntar?: typeof confirmar } = {}
): Promise<boolean> {
  const { buscar = buscarMinimoDoServico, perguntar = confirmar } = deps;
  const minimo = await buscar();
  if (!abaixoDoMinimo(preco, minimo)) return true;
  return perguntar(textoDoAvisoDeMinimo(minimo as number));
}
