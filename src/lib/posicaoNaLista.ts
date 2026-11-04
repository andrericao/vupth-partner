// posicao-na-lista (DEC-176): ao abrir uma loja vinda da lista de busca, o app conta
// ao Backend em que posicao ela estava (?list_position=N, 1 = primeira). E so metrica:
// nao muda a resposta e serve para o André decidir o teto real da lista.

/** A posicao valida (inteiro >= 1) a partir do param de rota, ou null. */
export function posicaoValida(valor: unknown): number | null {
  const n = typeof valor === "number" ? valor : Number(valor);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

/** Os params da chamada: {list_position} so quando a loja veio da lista. */
export function paramsDaPosicao(valor: unknown): { list_position: number } | undefined {
  const n = posicaoValida(valor);
  return n == null ? undefined : { list_position: n };
}
