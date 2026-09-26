import { pegarLocalizacao, enderecoDaPosicao, siglaDaUf, preencherVazios } from "@lib/localizacao";

// "Usar minha localizacao" no endereco da loja (build 1.4.0, expo-location).
// Sem coordenada, a loja some da busca por proximidade (S25). O backend aceita
// latitude/longitude no endereco (os dois juntos; (0,0) e recusado).
describe("siglaDaUf", () => {
  it("nome do estado -> sigla; sigla fica; desconhecido -> vazio", () => {
    expect(siglaDaUf("São Paulo")).toBe("SP");
    expect(siglaDaUf("Rio de Janeiro")).toBe("RJ");
    expect(siglaDaUf("Distrito Federal")).toBe("DF");
    expect(siglaDaUf("mg")).toBe("MG");
    expect(siglaDaUf("Atlantis")).toBe("");
    expect(siglaDaUf(null)).toBe("");
  });
});

describe("enderecoDaPosicao", () => {
  it("traduz o que o aparelho devolve para os campos do formulario", () => {
    expect(
      enderecoDaPosicao({
        street: "Avenida Paulista",
        streetNumber: "1578",
        district: "Bela Vista",
        city: "São Paulo",
        subregion: null,
        region: "São Paulo",
        postalCode: "01310-200",
      } as any)
    ).toEqual({
      street: "Avenida Paulista",
      number: "1578",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-200",
    });
  });

  it("cidade ausente cai na sub-regiao; campo ausente fica vazio", () => {
    const r = enderecoDaPosicao({ city: null, subregion: "Campinas", region: "SP" } as any);
    expect(r.city).toBe("Campinas");
    expect(r.street).toBe("");
    expect(r.state).toBe("SP");
  });
});

describe("pegarLocalizacao", () => {
  const loc = (permitido = true, coords = { latitude: -23.5613, longitude: -46.6565 }) => ({
    requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: permitido })),
    getCurrentPositionAsync: jest.fn(async () => ({ coords })),
    reverseGeocodeAsync: jest.fn(async () => [{ street: "Av. Paulista", city: "São Paulo", region: "São Paulo" }]),
    Accuracy: { Balanced: 3 },
  });

  it("pede permissao, pega a posicao e o endereco do lugar", async () => {
    const l = loc();
    const r = await pegarLocalizacao({ location: l as any });
    expect(r.coordenada).toEqual({ latitude: -23.5613, longitude: -46.6565 });
    expect(r.endereco?.street).toBe("Av. Paulista");
    expect(r.endereco?.state).toBe("SP");
  });

  it("sem permissao: o motivo, em portugues", async () => {
    await expect(pegarLocalizacao({ location: loc(false) as any })).rejects.toThrow(/localização/);
  });

  it("(0,0) nao e posicao: erro (o backend tambem recusa)", async () => {
    await expect(
      pegarLocalizacao({ location: loc(true, { latitude: 0, longitude: 0 }) as any })
    ).rejects.toThrow(/posição/);
  });

  it("o endereco do lugar falhou: a coordenada vale mesmo assim", async () => {
    const l = loc();
    l.reverseGeocodeAsync.mockRejectedValue(new Error("sem geocoder"));
    const r = await pegarLocalizacao({ location: l as any });
    expect(r.coordenada.latitude).toBe(-23.5613);
    expect(r.endereco).toBeNull();
  });
});

describe("preencherVazios", () => {
  it("so preenche o que o dono ainda nao digitou", () => {
    const atual = { street: "Rua A", number: "", neighborhood: "", city: "", state: "", zipCode: "" };
    const sugerido = { street: "Av. B", number: "10", neighborhood: "Centro", city: "X", state: "SP", zipCode: "01000-000" };
    expect(preencherVazios(atual, sugerido)).toEqual({
      street: "Rua A",
      number: "10",
      neighborhood: "Centro",
      city: "X",
      state: "SP",
      zipCode: "01000-000",
    });
  });
});
