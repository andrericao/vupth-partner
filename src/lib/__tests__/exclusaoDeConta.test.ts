import { mensagemDaExclusao, mensagemDaDesativacao, mensagemDaRemocaoDaLoja } from "@lib/exclusaoDeConta";

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
    expect(mensagemDaExclusao(new Error("Network Error"))).toMatch(/Sem conexão/);
  });

  it("outro erro com mensagem do backend (4xx)", () => {
    expect(mensagemDaExclusao(erro(422, { message: "falhou" }))).toBe("falhou");
  });

  it("erro interno (500): frase de servidor, nao a mensagem crua (26/09)", () => {
    expect(mensagemDaExclusao(erro(500, { message: "NullPointerException" }))).toMatch(/Algo deu errado/);
  });
});

// desativar-conta (contrato do Backend c0f5b17, 08/10): o dono com loja nao
// apaga a conta — passa a posse ou apaga a loja antes.
describe("mensagemDaExclusao — dono com loja", () => {
  it("409 OWNER_MUST_TRANSFER: a mensagem do backend passa como veio", () => {
    expect(
      mensagemDaExclusao(erro(409, { code: "OWNER_MUST_TRANSFER", message: "Passe a posse antes." }))
    ).toBe("Passe a posse antes.");
  });

  it("sem mensagem, diz os dois caminhos", () => {
    expect(mensagemDaExclusao(erro(409, { code: "OWNER_MUST_TRANSFER" }))).toMatch(
      /passe a posse.*ou apague a loja/i
    );
  });
});

describe("mensagemDaDesativacao", () => {
  it("senha errada", () => {
    expect(mensagemDaDesativacao(erro(401, { code: "CURRENT_PASSWORD_INVALID" }))).toBe(
      "Senha incorreta. Confira e tente de novo."
    );
  });

  it("compromisso vivo (409): a mensagem do backend passa como veio", () => {
    expect(
      mensagemDaDesativacao(
        erro(409, { code: "ACCOUNT_DEACTIVATE_NOT_ALLOWED", message: "Encerre a fila antes." })
      )
    ).toBe("Encerre a fila antes.");
  });

  it("409 sem mensagem ainda diz o que fazer", () => {
    expect(mensagemDaDesativacao(erro(409, { code: "ACCOUNT_DEACTIVATE_NOT_ALLOWED" }))).toMatch(
      /atendimento ou fila/
    );
  });

  it("outro erro cai na mensagem padrao", () => {
    expect(mensagemDaDesativacao(new Error("Network Error"))).toMatch(/Sem conexão/);
  });
});

describe("mensagemDaRemocaoDaLoja", () => {
  it("senha errada", () => {
    expect(mensagemDaRemocaoDaLoja(erro(401, { code: "CURRENT_PASSWORD_INVALID" }))).toBe(
      "Senha incorreta. Confira e tente de novo."
    );
  });

  it("loja com fila (409): a mensagem do backend passa; sem ela, diz o que fazer", () => {
    expect(
      mensagemDaRemocaoDaLoja(erro(409, { code: "ESTABLISHMENT_HAS_ACTIVE_QUEUE", message: "Fila aberta." }))
    ).toBe("Fila aberta.");
    expect(mensagemDaRemocaoDaLoja(erro(409, { code: "ESTABLISHMENT_HAS_ACTIVE_QUEUE" }))).toMatch(
      /clientes na fila/
    );
    // o codigo que o Backend usa de fato (6a5d3ab)
    expect(mensagemDaRemocaoDaLoja(erro(409, { code: "ESTABLISHMENT_HAS_ACTIVE_ATTENDANCES" }))).toMatch(
      /clientes na fila/
    );
  });

  it("outro erro cai na mensagem padrao", () => {
    expect(mensagemDaRemocaoDaLoja(new Error("Network Error"))).toMatch(/Sem conexão/);
  });
});
