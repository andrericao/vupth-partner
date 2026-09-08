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
  local: AttendanceInQueue | null | undefined
): AttendanceInQueue | null {
  if (doServidor) return doServidor;
  return local ?? null;
}
