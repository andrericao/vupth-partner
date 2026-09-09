import { escolherAtendimentoAtual } from "../atendimentoAtual";

// 🔴 BLOQUEIO DO MVP (08/09, terceira vez): "continua a falta de opção de
// finalizar o serviço".
//
// O `ServingCard` mostra "Finalizar" SEMPRE, sem condicional — o botão nunca
// sumiu. O card é que não monta, e ele dependia de UMA fonte: o
// `current_attendance` do snapshot da fila. Quando esse campo vem vazio durante
// o `IN_PROGRESS`, o profissional fica sem card, sem cronômetro e sem
// Finalizar — e o único caminho até o botão era pausar, que o backend depois
// recusa finalizar (S36). O laço fechava aí.
//
// O que ninguém tinha usado: o app JÁ SABE que o atendimento começou. O
// `startAttendance` recebe o atendimento do backend e a tela jogava a resposta
// fora. Este seletor traz essa memória de volta como REDE — sem trocar a fonte
// da verdade, que continua sendo o servidor.
const doServidor = { id: "a1", clientName: "Ana", status: "IN_PROGRESS" } as any;
const local = { id: "a1", clientName: "Ana", status: "IN_PROGRESS" } as any;

describe("escolherAtendimentoAtual", () => {
  it("o servidor manda quando fala — ele é a fonte da verdade", () => {
    const outro = { id: "a2", clientName: "Bruno" } as any;
    expect(escolherAtendimentoAtual(doServidor, outro)).toBe(doServidor);
  });

  it("servidor calado + começamos um atendimento = mostra o nosso", () => {
    // É ESTE o caso do bloqueio. Sem isso, não há card e não há Finalizar.
    expect(escolherAtendimentoAtual(null, local)).toBe(local);
    expect(escolherAtendimentoAtual(undefined, local)).toBe(local);
  });

  it("sem nenhum dos dois, não há card — e está certo", () => {
    expect(escolherAtendimentoAtual(null, null)).toBeNull();
  });

  it("o status do SERVIDOR prevalece: pausado não vira 'em andamento'", () => {
    const pausado = { id: "a1", clientName: "Ana", status: "PAUSED" } as any;
    expect(escolherAtendimentoAtual(pausado, local)).toBe(pausado);
  });
});

// 🔴 TERCEIRA FONTE (08/09, medido no aparelho pelo painel dos 7 toques): o
// `current_attendance` vinha NULO logo após iniciar e só aparecia depois. O
// card não montava, e o profissional era obrigado a PAUSAR para o botão surgir.
//
// A hipótese que sobra, e que esta fonte cobre: o atendimento em curso continua
// dentro da `waiting_list`, com status próprio, em vez de ser movido para o
// campo. Se for isso, o dado sempre esteve na tela — do lado errado, aparecendo
// como cliente que ainda espera.
//
// Custa nada estar errada: se o backend não fizer isso, a busca não acha nada e
// tudo segue como antes.
describe("escolherAtendimentoAtual — a lista de espera como terceira fonte", () => {
  const emAndamento = { id: "a9", clientName: "Caio", status: "IN_PROGRESS" } as any;
  const esperando = { id: "a8", clientName: "Dan", status: "SCHEDULED" } as any;

  it("acha o atendimento em curso escondido na lista de espera", () => {
    expect(escolherAtendimentoAtual(null, null, [esperando, emAndamento])).toBe(emAndamento);
  });

  it("acha também o PAUSADO — mesmo caso, outro estado", () => {
    const pausado = { id: "a9", clientName: "Caio", status: "PAUSED" } as any;
    expect(escolherAtendimentoAtual(null, null, [pausado])).toBe(pausado);
  });

  it("quem só espera NÃO vira atendimento em curso", () => {
    expect(escolherAtendimentoAtual(null, null, [esperando])).toBeNull();
  });

  it("o campo do servidor continua mandando quando existe", () => {
    expect(escolherAtendimentoAtual(doServidor, null, [emAndamento])).toBe(doServidor);
  });

  it("a lista vem antes da memória local: é dado do servidor, mais novo", () => {
    expect(escolherAtendimentoAtual(null, local, [emAndamento])).toBe(emAndamento);
  });

  it("lista ausente ou vazia não quebra nada", () => {
    expect(escolherAtendimentoAtual(null, local, [])).toBe(local);
    expect(escolherAtendimentoAtual(null, local, undefined)).toBe(local);
  });
});
