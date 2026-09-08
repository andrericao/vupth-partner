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
