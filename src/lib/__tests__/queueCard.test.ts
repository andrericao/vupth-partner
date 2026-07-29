import { queueMenuActions, formatServices, QUEUE_ACTION_LABEL } from "../queueCard";

describe("queueMenuActions", () => {
  it("1o da vez: nao chegou + remover (sem adiantar)", () => {
    expect(queueMenuActions(true)).toEqual(["nao-chegou", "remover"]);
  });
  it("demais: adiantar + promover + remover (sem nao chegou)", () => {
    expect(queueMenuActions(false)).toEqual(["adiantar", "promover", "remover"]);
  });
  it("promover so aparece fora do 1o lugar (reordena sem iniciar)", () => {
    expect(queueMenuActions(false)).toContain("promover");
    expect(queueMenuActions(true)).not.toContain("promover");
  });
  it("Remover esta presente em qualquer posicao (pode remover a qualquer hora)", () => {
    expect(queueMenuActions(true)).toContain("remover");
    expect(queueMenuActions(false)).toContain("remover");
  });
  it("nao existe 'nao compareceu'/no-show entre as acoes", () => {
    const all = [...queueMenuActions(true), ...queueMenuActions(false)];
    expect(all).not.toContain("nao-compareceu");
    expect(all).not.toContain("no-show");
  });
  it("toda acao tem rotulo", () => {
    [...queueMenuActions(true), ...queueMenuActions(false)].forEach((a) => {
      expect(QUEUE_ACTION_LABEL[a]).toBeTruthy();
    });
  });
});

describe("formatServices", () => {
  it("junta os nomes com ' + '", () => {
    expect(formatServices([{ customName: "Corte" }, { customName: "Barba" }])).toBe("Corte + Barba");
  });
  it("um servico", () => {
    expect(formatServices([{ customName: "Corte" }])).toBe("Corte");
  });
  it("lista vazia vira string vazia", () => {
    expect(formatServices([])).toBe("");
  });
});
