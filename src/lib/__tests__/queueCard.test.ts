import { mensagemDoAtraso, queueMenuActions, formatServices, QUEUE_ACTION_LABEL } from "../queueCard";

describe("queueMenuActions", () => {
  it("1o da vez: não chegou + remover (sem adiantar)", () => {
    // "Iniciar" entrou no menu do 1o em 2026-08-11 (pedido do Andre): e
    // REDUNDANTE com o botao do rodape de proposito — quem abriu o menu do
    // proximo espera poder inicia-lo dali, sem fechar e procurar o botao.
    expect(queueMenuActions(true)).toEqual(["iniciar", "nao-chegou", "remover"]);
  });
  it("demais: adiantar + promover + remover (sem não chegou)", () => {
    expect(queueMenuActions(false)).toEqual(["adiantar", "promover", "remover"]);
    // quem nao e o 1o NAO pode ser iniciado direto (a regra atende-primeiro)
    expect(queueMenuActions(false)).not.toContain("iniciar");
  });
  it("promover só aparece fora do 1o lugar (reordena sem iniciar)", () => {
    expect(queueMenuActions(false)).toContain("promover");
    expect(queueMenuActions(true)).not.toContain("promover");
  });
  it("Remover esta presente em qualquer posicao (pode remover a qualquer hora)", () => {
    expect(queueMenuActions(true)).toContain("remover");
    expect(queueMenuActions(false)).toContain("remover");
  });
  it("não existe 'não compareceu'/no-show entre as ações", () => {
    const all = [...queueMenuActions(true), ...queueMenuActions(false)];
    expect(all).not.toContain("nao-compareceu");
    expect(all).not.toContain("no-show");
  });
  it("toda ação tem rotulo", () => {
    [...queueMenuActions(true), ...queueMenuActions(false)].forEach((a) => {
      expect(QUEUE_ACTION_LABEL[a]).toBeTruthy();
    });
  });
});

describe("formatServices", () => {
  it("junta os nomes com ' + '", () => {
    expect(formatServices([{ customName: "Corte" }, { customName: "Barba" }])).toBe("Corte + Barba");
  });
  it("um serviço", () => {
    expect(formatServices([{ customName: "Corte" }])).toBe("Corte");
  });
  it("lista vazia vira string vazia", () => {
    expect(formatServices([])).toBe("");
  });
});

// 🔴 O QUE FALTAVA, dito por ele em 09/09: "é só adicionar o botão no modal".
//
// Eu passei quatro rodadas atrás do CARD verde, e ele estava usando o MENU do
// cliente. O menu foi desenhado "por POSIÇÃO, não por status" — e por isso nunca
// contemplou quem já está sendo atendido: as cinco ações existentes são todas
// sobre quem ESPERA. Quem está na cadeira não tem entrada nenhuma ali.
//
// Nenhum diagnóstico de dado ia achar isso: o menu nunca teve o botão para
// mostrar.
describe("queueMenuActions — quem já está sendo atendido", () => {
  it("EM ATENDIMENTO: finalizar vem primeiro, e pausar ao lado", () => {
    expect(queueMenuActions(true, "IN_PROGRESS")).toEqual(["finalizar", "pausar", "remover"]);
  });

  it("PAUSADO: o par vira finalizar + retomar", () => {
    expect(queueMenuActions(true, "PAUSED")).toEqual(["finalizar", "retomar", "remover"]);
  });

  it("quem está em atendimento NÃO pode ser 'iniciado' de novo", () => {
    expect(queueMenuActions(true, "IN_PROGRESS")).not.toContain("iniciar");
  });

  it("sem status, nada muda — a fila comum segue como sempre foi", () => {
    expect(queueMenuActions(true)).toEqual(["iniciar", "nao-chegou", "remover"]);
    expect(queueMenuActions(false)).toEqual(["adiantar", "promover", "remover"]);
    expect(queueMenuActions(false, "SCHEDULED")).toEqual(["adiantar", "promover", "remover"]);
  });

  it("os rótulos novos existem — menu sem texto é menu quebrado", () => {
    expect(QUEUE_ACTION_LABEL.finalizar).toMatch(/finalizar/i);
    expect(QUEUE_ACTION_LABEL.pausar).toMatch(/pausar/i);
    expect(QUEUE_ACTION_LABEL.retomar).toMatch(/retomar/i);
  });
});

// Regra dos atrasos refeita pelo backend em 26/09 (e328629): atraso 1 e 2 troca
// de lugar com o proximo; no 3o, multa de R$ 5,00 e o cliente vai para o FIM da
// fila. O "Nao compareceu" saiu. O profissional precisa saber disso ao marcar.
describe("mensagemDoAtraso", () => {
  it("explica a troca de lugar e o que acontece no 3o atraso", () => {
    const m = mensagemDoAtraso("Ana");
    expect(m).toMatch(/Ana troca de lugar com o próximo/);
    expect(m).toMatch(/3º atraso.*fim da fila.*R\$ 5,00/);
  });
});
