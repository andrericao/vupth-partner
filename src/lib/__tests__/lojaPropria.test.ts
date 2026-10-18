import { vinculoNaLojaNova, voltaDoCadastroDaLoja, textosDaEscolhaDeLoja } from "../lojaPropria";

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

// validacao de 17/10: a loja atual saia 3 vezes na tela e, sem nome, o botao
// dizia "Continuar em a loja de agora".
describe("textosDaEscolhaDeLoja", () => {
  it("o nome da loja atual aparece uma vez so, no subtitulo", () => {
    const t = textosDaEscolhaDeLoja("Studio Ana", "Barbearia do Léo");
    const tudo = Object.values(t).join(" ");
    expect(t.subtitulo).toBe("Hoje você atende em Studio Ana.");
    expect(tudo.match(/Studio Ana/g)).toHaveLength(1);
    expect(t.atender).toBe("Atender em Barbearia do Léo");
    expect(t.continuar).toBe("Continuar na loja atual");
  });

  it("sem o nome da loja atual, o subtitulo diz 'outra loja' — sem frase quebrada", () => {
    for (const vazio of [null, undefined, "", "  "]) {
      const t = textosDaEscolhaDeLoja(vazio, "Barbearia do Léo");
      expect(t.subtitulo).toBe("Hoje você atende em outra loja.");
      expect(Object.values(t).join(" ")).not.toMatch(/em a loja/);
    }
  });

  it("sem o nome da loja nova, fala em 'loja nova'", () => {
    const t = textosDaEscolhaDeLoja("Studio Ana", undefined);
    expect(t.atender).toBe("Atender na loja nova");
    expect(t.corpo).toContain("na sua loja nova");
  });
});
