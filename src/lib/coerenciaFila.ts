import type { StatusKey } from "@lib/workStatus";

// Coerência entre o STATUS do profissional e o estado da FILA.
//
// 🔴 Regra do Andre (09/09): "não pode o profissional estar 'fora' com o status
// de fila aberta, NÃO EXISTE".
//
// `work_status` e `accepting_new` sempre foram campos independentes, e nada
// impedia a combinação. Para o cliente ela é promessa falsa: fila aberta quer
// dizer "pode entrar", e não há ninguém para atender.
//
// ⚠️ INTERVALO é diferente de FORA, e por isso não entra nas duas regras: quem
// está em intervalo VOLTA. Fechar a fila dele esvaziaria a espera de quem já
// contava com o atendimento depois do almoço.

/** Ir para "Fora" fecha a fila — se ela estiver aberta. */
export function fechaFilaAoSair(proximo: StatusKey, aceitandoAgora: boolean): boolean {
  return proximo === "indisponivel" && aceitandoAgora;
}

/**
 * Abrir a fila implica estar em cena: quem estava "Fora" passa a "Trabalhando".
 *
 * A porta de trás da mesma incoerência — sem isto, bastava abrir a fila estando
 * fora para recriar o estado que a regra proíbe.
 *
 * Fechar a fila NÃO mexe no status: sair da fila não é sair do trabalho (ainda
 * há quem terminar).
 */
export function viraTrabalhandoAoAbrirFila(atual: StatusKey, abrindo: boolean): boolean {
  return abrindo && atual === "indisponivel";
}
