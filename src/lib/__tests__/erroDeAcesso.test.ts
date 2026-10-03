import {
  classificarErroDeAcesso,
  segundosDeEspera,
  textoDaEspera,
  rotaDoCadastro,
} from "../erroDeAcesso";

// Contrato do Backend (fd9a3af, 03/10): e-mail sem conta tem codigo proprio, e
// login/cadastro/esqueci tem limite de tentativas (429 + Retry-After).
const erro = (status: number, code?: string, headers: Record<string, string> = {}) => ({
  response: { status, data: code ? { code } : {}, headers },
});

describe("classificarErroDeAcesso", () => {
  it("401 EMAIL_NOT_FOUND: nao ha conta com o e-mail", () => {
    expect(classificarErroDeAcesso(erro(401, "EMAIL_NOT_FOUND"))).toEqual({ tipo: "sem-conta" });
  });

  it("404 EMAIL_NOT_FOUND (esqueci a senha): nao ha conta", () => {
    expect(classificarErroDeAcesso(erro(404, "EMAIL_NOT_FOUND"))).toEqual({ tipo: "sem-conta" });
  });

  it("401 BAD_CREDENTIALS: senha errada", () => {
    expect(classificarErroDeAcesso(erro(401, "BAD_CREDENTIALS"))).toEqual({ tipo: "senha-errada" });
  });

  it("401 sem codigo (backend antigo): senha errada, como antes", () => {
    expect(classificarErroDeAcesso(erro(401))).toEqual({ tipo: "senha-errada" });
  });

  it("429: espera, com os segundos do Retry-After", () => {
    expect(classificarErroDeAcesso(erro(429, "TOO_MANY_REQUESTS", { "retry-after": "30" }))).toEqual({
      tipo: "espera",
      mensagem: "Muitas tentativas. Tente de novo em 30 s.",
    });
  });

  it("qualquer outro erro: outro", () => {
    expect(classificarErroDeAcesso(erro(500))).toEqual({ tipo: "outro" });
    expect(classificarErroDeAcesso(new Error("rede"))).toEqual({ tipo: "outro" });
    expect(classificarErroDeAcesso(undefined)).toEqual({ tipo: "outro" });
  });
});

describe("segundosDeEspera", () => {
  it("le o Retry-After em segundos", () => {
    expect(segundosDeEspera(erro(429, undefined, { "retry-after": "45" }))).toBe(45);
  });

  it("aceita o cabecalho com maiusculas", () => {
    expect(segundosDeEspera(erro(429, undefined, { "Retry-After": "12" }))).toBe(12);
  });

  it("Retry-After como data HTTP: os segundos ate ela", () => {
    const agora = Date.parse("2026-10-03T12:00:00Z");
    const e = erro(429, undefined, { "retry-after": "Sat, 03 Oct 2026 12:01:30 GMT" });
    expect(segundosDeEspera(e, agora)).toBe(90);
  });

  it("data no passado vira no minimo 1 s", () => {
    const agora = Date.parse("2026-10-03T12:00:00Z");
    const e = erro(429, undefined, { "retry-after": "Sat, 03 Oct 2026 11:00:00 GMT" });
    expect(segundosDeEspera(e, agora)).toBe(1);
  });

  it("sem cabecalho ou ilegivel: 60 s", () => {
    expect(segundosDeEspera(erro(429))).toBe(60);
    expect(segundosDeEspera(erro(429, undefined, { "retry-after": "logo" }))).toBe(60);
    expect(segundosDeEspera({ response: { status: 429 } })).toBe(60);
  });
});

describe("textoDaEspera", () => {
  it("menos de um minuto: em segundos", () => {
    expect(textoDaEspera(59)).toBe("Muitas tentativas. Tente de novo em 59 s.");
  });

  it("um minuto ou mais: em minutos, arredondado para cima", () => {
    expect(textoDaEspera(60)).toBe("Muitas tentativas. Tente de novo em 1 min.");
    expect(textoDaEspera(61)).toBe("Muitas tentativas. Tente de novo em 2 min.");
  });
});

describe("rotaDoCadastro", () => {
  it("com o papel escolhido: direto ao cadastro dele", () => {
    expect(rotaDoCadastro("owner")).toBe("/(auth)/register?role=owner");
    expect(rotaDoCadastro("professional")).toBe("/(auth)/register?role=professional");
  });

  it("sem papel: a tela de entrada, que pergunta", () => {
    expect(rotaDoCadastro(undefined)).toBe("/(auth)");
    expect(rotaDoCadastro("qualquer")).toBe("/(auth)");
  });
});
