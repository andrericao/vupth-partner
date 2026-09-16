import { ehMeuAtendimento } from "../meuAtendimento";

// A regra que decide se o Finalizar existe numa tela. Ela e o contrario de um
// ternario dentro do componente: aqui ela tem nome, e o teste diz o que ela
// protege — ninguem encerra o atendimento de outra pessoa.
describe("ehMeuAtendimento", () => {
  it("o profissional finaliza o atendimento dele", () => {
    expect(ehMeuAtendimento("prof-1", "prof-1")).toBe(true);
  });

  it("o dono NAO finaliza o atendimento de outro profissional", () => {
    expect(ehMeuAtendimento("prof-2", "prof-1")).toBe(false);
  });

  it("dono que TAMBEM e o profissional finaliza — nao e excecao, o atendimento e dele", () => {
    expect(ehMeuAtendimento("prof-1", "prof-1")).toBe(true);
  });

  // Na duvida, esconder custa um toque; mostrar deixa encerrar o corte de
  // outra pessoa. O default seguro e NAO.
  it.each([
    ["sem saber de quem e a fila", null, "prof-1"],
    ["sem saber quem esta logado", "prof-1", null],
    ["sem saber nenhum dos dois", null, null],
    ["id vazio nao casa com id vazio", "", ""],
  ])("%s => false", (_caso, fila, logado) => {
    expect(ehMeuAtendimento(fila as any, logado as any)).toBe(false);
  });
});
