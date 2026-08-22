import { queueMenuActions, formatServices, QUEUE_ACTION_LABEL } from "../queueCard";

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
