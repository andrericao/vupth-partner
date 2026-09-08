/**
 * Finalizar um atendimento, inclusive quando ele esta PAUSADO.
 *
 * 🔴 O laco que bloqueava o MVP, na descricao do Andre: "so aparece a opcao de
 * pausar, quando pausado nao se pode finalizar porque o status nao permite, so
 * pode ser terminado o servico em progresso e ficamos nesse ciclo".
 *
 * O backend aceita `finish` so em `IN_PROGRESS` (S36) — e isso esta registrado
 * como DECISAO deles, nao como defeito. A pergunta de produto que sobrou ("pausei
 * e acabou ali" obriga a retomar so para finalizar, gravando um intervalo que
 * nao existiu) continua no handoff.
 *
 * Enquanto ela nao volta, quem paga e quem esta com o cliente na cadeira. Entao o
 * front faz o caminho inteiro: retoma e finaliza, em vez de mandar a pessoa
 * descobrir sozinha — clicando num botao que e recusado sem dizer por que.
 *
 * ⚠️ Se o retomar falhar, NAO finaliza: dois erros seguidos escondem qual foi o
 * que importou.
 */
export async function finalizarAtendimento(
  attendanceId: string,
  estaPausado: boolean,
  acoes: {
    retomar: (id: string) => Promise<unknown>;
    finalizar: (id: string) => Promise<unknown>;
  }
): Promise<void> {
  if (estaPausado) await acoes.retomar(attendanceId);
  await acoes.finalizar(attendanceId);
}
