import { situacaoDoPonto, mensagemDoEnderecoSalvo, perguntarPosicaoAoAbrir } from "@lib/pontoNoMapa";

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

// gps-da-loja (DEC-23): ao abrir o endereco, perguntar "usar a posicao atual?"
// so quando falta o ponto — loja com ponto configurado nao e incomodada.
describe("perguntarPosicaoAoAbrir", () => {
  it("UNRESOLVED com o id do endereco: pergunta (o PATCH tem onde ir)", () => {
    expect(perguntarPosicaoAoAbrir({ locationStatus: "UNRESOLVED", addressId: "a1" })).toBe(true);
  });

  it("LOCATED: a loja ja tem o ponto — nao pergunta", () => {
    expect(perguntarPosicaoAoAbrir({ locationStatus: "LOCATED", addressId: "a1" })).toBe(false);
  });

  it("PENDING: o geocoding ainda pode achar — nao pergunta", () => {
    expect(perguntarPosicaoAoAbrir({ locationStatus: "PENDING", addressId: "a1" })).toBe(false);
  });

  it("sem o id do endereco, sem o campo ou sem endereco: nao pergunta", () => {
    expect(perguntarPosicaoAoAbrir({ locationStatus: "UNRESOLVED" })).toBe(false);
    expect(perguntarPosicaoAoAbrir({ addressId: "a1" })).toBe(false);
    expect(perguntarPosicaoAoAbrir(null)).toBe(false);
    expect(perguntarPosicaoAoAbrir(undefined)).toBe(false);
  });
});
