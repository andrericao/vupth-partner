import { vinculoNaLojaNova, voltaDoCadastroDaLoja } from "../lojaPropria";

// S23 / PAR-7 · abrir-meu-estabelecimento: o profissional que abre a propria
// loja. Ja atender em outra loja NAO pode virar troca silenciosa.
describe("vinculoNaLojaNova", () => {
  it("ja atende na loja nova: nada a fazer", () => {
    expect(vinculoNaLojaNova("loja-1", "loja-1")).toBe("ja-atende");
  });

  it("sem loja nenhuma: vincula direto, nao ha o que perder", () => {
    expect(vinculoNaLojaNova(null, "loja-1")).toBe("vincular");
    expect(vinculoNaLojaNova(undefined, "loja-1")).toBe("vincular");
    expect(vinculoNaLojaNova("", "loja-1")).toBe("vincular");
  });

  it("atende em outra loja: pergunta antes de trocar", () => {
    expect(vinculoNaLojaNova("loja-2", "loja-1")).toBe("perguntar");
  });

  it("sem a loja nova (parametro perdido): nada a fazer", () => {
    expect(vinculoNaLojaNova("loja-2", "")).toBe("ja-atende");
    expect(vinculoNaLojaNova(null, undefined)).toBe("ja-atende");
  });
});

describe("voltaDoCadastroDaLoja", () => {
  it("veio do Perfil do profissional: volta ao Perfil", () => {
    expect(voltaDoCadastroDaLoja("professional")).toBe("/(professional)/settings");
  });

  it("qualquer outra origem: o painel do dono, como antes", () => {
    expect(voltaDoCadastroDaLoja(undefined)).toBe("/(owner)/dashboard");
    expect(voltaDoCadastroDaLoja("owner")).toBe("/(owner)/dashboard");
  });
});
