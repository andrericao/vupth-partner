import { lookupCep } from "@lib/cep";

describe("lookupCep", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("CEP com tamanho != 8 => null e NAO chama fetch", async () => {
    const spy = jest.fn();
    global.fetch = spy as any;
    expect(await lookupCep("123")).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("aceita CEP mascarado e mapeia a resposta do ViaCEP", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        logradouro: "Praca da Se",
        bairro: "Se",
        localidade: "Sao Paulo",
        uf: "SP",
      }),
    }) as any;
    const r = await lookupCep("01001-000");
    expect(r).toEqual({
      street: "Praca da Se",
      neighborhood: "Se",
      city: "Sao Paulo",
      state: "SP",
    });
  });

  it("resposta com erro:true => null", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ erro: true }) }) as any;
    expect(await lookupCep("00000000")).toBeNull();
  });

  it("HTTP nao-ok => null", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as any;
    expect(await lookupCep("01001000")).toBeNull();
  });

  it("fetch lanca (offline) => null (nunca propaga)", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network")) as any;
    expect(await lookupCep("01001000")).toBeNull();
  });

  it("campos ausentes viram string vazia", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as any;
    expect(await lookupCep("01001000")).toEqual({
      street: "",
      neighborhood: "",
      city: "",
      state: "",
    });
  });
});
