import type { AttendanceInQueue } from "@lib/types";

/**
 * Qual atendimento o card "ATENDENDO AGORA" deve mostrar.
 *
 * 🔴 Existe por causa do bloqueio do MVP: o card dependia de UMA fonte — o
 * `current_attendance` do snapshot da fila. Quando esse campo vem vazio durante
 * o `IN_PROGRESS`, some o card inteiro, e com ele o Finalizar, o Pausar e o
 * cronômetro. O único caminho que restava até o botão era PAUSAR, e o backend
 * recusa finalizar o que está pausado (S36): o laço fechava aí, e é o que
 * impedia a demonstração.
 *
 * A rede é a memória local: o `startAttendance` RECEBE o atendimento do backend
 * e a tela jogava a resposta fora. Guardar isso não inventa dado nenhum — é a
 * resposta que o próprio servidor deu quando disse "começou".
 *
 * ⚠️ O servidor continua sendo a FONTE DA VERDADE: se ele fala, ele manda,
 * inclusive para dizer que o atendimento está PAUSADO ou que já é outro
 * cliente. A memória local só preenche o silêncio.
 *
 * ⚠️ Isto NÃO fecha o diagnóstico: continua valendo descobrir por que o campo
 * vem vazio (o painel dos 7 toques mostra `GET:` e `WS:` para separar backend de
 * front). O que muda é que o profissional deixa de ficar preso enquanto isso.
 */
export function escolherAtendimentoAtual(
  doServidor: AttendanceInQueue | null | undefined,
  local: AttendanceInQueue | null | undefined,
  listaDeEspera?: AttendanceInQueue[] | null
): AttendanceInQueue | null {
  if (doServidor) return doServidor;

  // 🔎 Medido no aparelho (08/09): o `current_attendance` vem NULO logo apos
  // iniciar. A hipotese que esta linha cobre e que o atendimento continua na
  // LISTA DE ESPERA com status proprio, em vez de ser movido para o campo — ou
  // seja, o dado sempre esteve na tela, do lado errado, parecendo cliente que
  // ainda aguarda.
  //
  // Vem ANTES da memoria local porque e dado do servidor, e portanto mais novo:
  // se o cliente foi trocado por outro aparelho, e isto que sabe.
  const naLista = (listaDeEspera ?? []).find(
    (a) => a?.status === "IN_PROGRESS" || a?.status === "PAUSED"
  );
  if (naLista) return naLista;

  return local ?? null;
}

/**
 * Traz um atendimento de OUTRA fonte para o formato que a tela desenha.
 *
 * 🔴 Existe por causa de uma tela branca que EU causei: liguei a resposta do
 * `/start` no card sem conferir o formato. O snapshot da fila entrega
 * `totalValue`/`clientName`; o endpoint pode responder em snake_case — e o card
 * faz `attendance.totalValue.toFixed(2)` direto. `undefined.toFixed` derruba o
 * render inteiro, e o app vira tela branca no meio de um atendimento.
 *
 * A lição: rede que alimenta a tela com dado de outra fonte precisa falar a
 * MESMA LÍNGUA da tela — ter o mesmo assunto não basta.
 *
 * Sem `id` devolve null: um card sem identidade nao consegue finalizar nem
 * pausar nada, e existir so para quebrar e pior do que nao existir.
 */
export function normalizarAtendimento(bruto: any): AttendanceInQueue | null {
  if (!bruto?.id) return null;

  return {
    ...bruto,
    id: bruto.id,
    clientName: bruto.clientName ?? bruto.client_name ?? "Cliente",
    totalValue: Number(bruto.totalValue ?? bruto.total_value ?? 0),
    services: bruto.services ?? bruto.service_items ?? [],
    status: bruto.status ?? "IN_PROGRESS",
  } as AttendanceInQueue;
}
