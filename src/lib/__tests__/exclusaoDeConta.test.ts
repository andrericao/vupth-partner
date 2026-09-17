import { mensagemDaExclusao } from "@lib/exclusaoDeConta";

const erro = (status: number, data: object) => ({ response: { status, data } });

// Mesmas frases e mesma regra do client (Settings.tsx deles): senha errada e
// erro de CAMPO; o bloqueio 409 e TEMPORARIO e a mensagem do backend diz o
// que fazer para destravar — tem de aparecer como veio.
describe("mensagemDaExclusao", () => {
  it("senha errada", () => {
    expect(mensagemDaExclusao(erro(401, { code: "CURRENT_PASSWORD_INVALID" }))).toBe(
      "Senha incorreta. Confira e tente de novo."
    );
  });

  it("bloqueio: a mensagem do backend passa sem traducao", () => {
    expect(
      mensagemDaExclusao(
        erro(409, { code: "ACCOUNT_DELETE_NOT_ALLOWED", message: "Encerre a fila antes." })
      )
    ).toBe("Encerre a fila antes.");
  });

  it("bloqueio sem mensagem cai num texto que ainda diz o que fazer", () => {
    expect(mensagemDaExclusao(erro(409, { code: "ACCOUNT_DELETE_NOT_ALLOWED" }))).toMatch(
      /atendimento em andamento/
    );
  });

  it("sem rede", () => {
    expect(mensagemDaExclusao(new Error("Network Error"))).toMatch(/Sem conexao/);
  });

  it("outro erro com mensagem do backend", () => {
    expect(mensagemDaExclusao(erro(500, { message: "falhou" }))).toBe("falhou");
  });
});
