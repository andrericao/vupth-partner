import {
  situacaoDoPonto,
  mensagemDoEnderecoSalvo,
  perguntarPosicaoAoAbrir,
  mensagemDaPerguntaDoPonto,
} from "@lib/pontoNoMapa";

// loja-sem-coordenada (S25, contrato BAK d215d5a): o endereco diz se ja virou
// ponto no mapa — so LOCATED entra na busca por proximidade.
describe("situacaoDoPonto", () => {
  it("UNRESOLVED: a loja nao aparece para quem busca por perto", () => {
    expect(situacaoDoPonto({ locationStatus: "UNRESOLVED" })).toBe("sem-ponto");
  });

  it("PENDING: o geocoding ainda esta na fila", () => {
    expect(situacaoDoPonto({ locationStatus: "PENDING" })).toBe("localizando");
  });

  it("LOCATED, sem o campo (backend antigo) ou sem endereco: nada a avisar", () => {
    expect(situacaoDoPonto({ locationStatus: "LOCATED" })).toBeNull();
    expect(situacaoDoPonto({})).toBeNull();
    expect(situacaoDoPonto(null)).toBeNull();
    expect(situacaoDoPonto(undefined)).toBeNull();
    expect(situacaoDoPonto({ locationStatus: "OUTRO" })).toBeNull();
  });
});

describe("mensagemDoEnderecoSalvo (o texto da caixa \"Endereço salvo\")", () => {
  it("com a posicao do aparelho (LOCATED): ja aparece na busca", () => {
    expect(mensagemDoEnderecoSalvo({ locationStatus: "LOCATED" })).toBe(
      "Sua loja já aparece para quem busca por perto."
    );
  });

  it("PENDING ou sem o campo: o mapa leva alguns segundos", () => {
    const pendente = "Estamos localizando sua loja no mapa — leva alguns segundos.";
    expect(mensagemDoEnderecoSalvo({ locationStatus: "PENDING" })).toBe(pendente);
    expect(mensagemDoEnderecoSalvo({})).toBe(pendente);
    expect(mensagemDoEnderecoSalvo(null)).toBe(pendente);
  });

  it("UNRESOLVED: salvo, mas fora da busca por perto — diz o que fazer", () => {
    expect(mensagemDoEnderecoSalvo({ locationStatus: "UNRESOLVED" })).toBe(
      "Não achamos o endereço no mapa: sua loja não aparece para quem busca por perto. " +
        "Na loja, toque em \"Usar minha localização\" e salve de novo, ou confira o endereço."
    );
  });
});

// ponto-da-loja-pelo-gps (Andre, 05/10): ao abrir o endereco, oferecer o GPS
// SEMPRE — mesmo com o endereco achado —, ate o ponto ser marcado por ele.
describe("perguntarPosicaoAoAbrir", () => {
  it("com o id do endereco e sem marca: pergunta, ache o geocoder ou nao", () => {
    expect(perguntarPosicaoAoAbrir({ locationStatus: "UNRESOLVED", addressId: "a1" }, false)).toBe(true);
    expect(perguntarPosicaoAoAbrir({ locationStatus: "LOCATED", addressId: "a1" }, false)).toBe(true);
    expect(perguntarPosicaoAoAbrir({ locationStatus: "PENDING", addressId: "a1" }, false)).toBe(true);
  });

  it("ja marcado pelo GPS: nao pergunta de novo", () => {
    expect(perguntarPosicaoAoAbrir({ locationStatus: "LOCATED", addressId: "a1" }, true)).toBe(false);
  });

  it("sem o id do endereco ou sem endereco: nao pergunta (o PATCH nao tem onde ir)", () => {
    expect(perguntarPosicaoAoAbrir({ locationStatus: "UNRESOLVED" }, false)).toBe(false);
    expect(perguntarPosicaoAoAbrir(null, false)).toBe(false);
    expect(perguntarPosicaoAoAbrir(undefined, false)).toBe(false);
  });
});

describe("mensagemDaPerguntaDoPonto", () => {
  it("sem ponto: a loja nao aparece; com ponto: fica exato", () => {
    expect(mensagemDaPerguntaDoPonto({ locationStatus: "UNRESOLVED" })).toMatch(/não aparece/);
    expect(mensagemDaPerguntaDoPonto({ locationStatus: "LOCATED" })).toMatch(/ponto exato pelo GPS/);
  });
});
