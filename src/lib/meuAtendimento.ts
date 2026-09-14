/**
 * Quem pode encerrar um atendimento.
 *
 * REGRA (Alexia, 2026-09-14): o **profissional** finaliza o atendimento **dele**.
 * O dono nao finaliza o dos outros — a tela dele e leitura, e foi por isso que
 * os botoes dados a ela em 08/09 foram revertidos no mesmo dia (`194af84`).
 *
 * ⚠️ Quando o dono E TAMBEM o profissional, isto nao e excecao: o atendimento e
 * dele, entao a regra e a mesma. O que decide **nao e a tela** — e de quem e o
 * atendimento.
 *
 * Existe como funcao, e nao como ternario dentro da tela, exatamente por isso:
 * um botao que aparece "por causa da tela" envelhece mal (daqui a seis meses
 * alguem le a tela do dono e nao entende por que as vezes ha botao). Um botao
 * que aparece porque o atendimento e SEU explica a si mesmo, e as duas telas
 * passam a citar a mesma regra em vez de cada uma inventar a sua.
 */
export function ehMeuAtendimento(
  profissionalDaFila: string | null | undefined,
  euLogado: string | null | undefined
): boolean {
  // Sem saber quem e um dos dois, a resposta segura e NAO: esconder um botao
  // que deveria existir custa um toque a mais; mostrar um que nao deveria deixa
  // uma pessoa encerrar o atendimento de outra.
  if (!profissionalDaFila || !euLogado) return false;
  return profissionalDaFila === euLogado;
}
