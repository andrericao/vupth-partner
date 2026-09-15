import { rotulosCabem } from "../rotulosDaAba";

// A regra que faz a tab bar largar o rótulo em vez de cortá-lo (DS4).
// Os números vêm da medição do arquivo de design; o teste fixa o COMPORTAMENTO,
// não os números — se a medida mudar, é aqui que se descobre.
describe("rotulosCabem", () => {
  const TELA = 390; // o aparelho do arquivo de design

  it("na fonte normal, o rótulo fica — nos dois papéis", () => {
    expect(rotulosCabem(TELA, 1, "profissional")).toBe(true);
    expect(rotulosCabem(TELA, 1, "dono")).toBe(true);
  });

  it("a 130% ainda cabe: foi medido e passa inteiro", () => {
    expect(rotulosCabem(TELA, 1.3, "profissional")).toBe(true);
  });

  it("a 200% o rótulo SAI, em vez de ser cortado", () => {
    expect(rotulosCabem(TELA, 2, "profissional")).toBe(false);
  });

  // O erro que um limiar fixo cometeria: a mesma fonte, dois aparelhos.
  it("a MESMA fonte cabe num aparelho largo e não cabe num estreito", () => {
    expect(rotulosCabem(414, 1.6, "profissional")).toBe(true);
    expect(rotulosCabem(320, 1.6, "profissional")).toBe(false);
  });

  it("o dono aguenta mais — três rótulos curtos, não quatro", () => {
    expect(rotulosCabem(TELA, 2, "dono")).toBe(true);
    expect(rotulosCabem(TELA, 2, "profissional")).toBe(false);
  });

  // Na dúvida, mostrar: o rótulo é informação; esconder é o remédio.
  it.each([[NaN], [0], [-1], [Infinity]])("escala inválida (%s) não esconde nada", (s) => {
    expect(rotulosCabem(TELA, s as number, "profissional")).toBe(true);
  });
});
