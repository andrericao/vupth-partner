import { getApiErrorMessage } from "@lib/api";

// api.ts importa expo-secure-store no topo (interceptors) — mockar p/ o import.
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("getApiErrorMessage", () => {
  it("sem response (erro de rede) => mensagem de sem conexao", () => {
    expect(getApiErrorMessage({}, "fallback")).toMatch(/Sem conexao/);
    expect(getApiErrorMessage(new Error("timeout"), "fallback")).toMatch(/Sem conexao/);
    expect(getApiErrorMessage(undefined, "fallback")).toMatch(/Sem conexao/);
  });

  it("codigo conhecido => traducao PT (nao usa o fallback)", () => {
    const err = { response: { data: { code: "PROFESSIONAL_ALREADY_AFFILIATED" } } };
    expect(getApiErrorMessage(err, "fallback")).toMatch(/ja esta vinculado/);
  });

  it("codigo desconhecido, com fieldErrors => lista campo: msg (uma por linha)", () => {
    const err = {
      response: { data: { code: "SOMETHING_ELSE", fieldErrors: { email: "invalido", senha: "curta" } } },
    };
    expect(getApiErrorMessage(err, "fallback")).toBe("email: invalido\nsenha: curta");
  });

  it("sem code, com fieldErrors => lista os campos", () => {
    const err = { response: { data: { fieldErrors: { nome: "obrigatorio" } } } };
    expect(getApiErrorMessage(err, "fallback")).toBe("nome: obrigatorio");
  });

  it("sem code/fieldErrors, com message => devolve a message crua", () => {
    const err = { response: { data: { message: "Erro do servidor" } } };
    expect(getApiErrorMessage(err, "fallback")).toBe("Erro do servidor");
  });

  it("response com data vazio => fallback", () => {
    expect(getApiErrorMessage({ response: { data: {} } }, "fallback padrao")).toBe("fallback padrao");
  });

  it("response sem data => fallback", () => {
    expect(getApiErrorMessage({ response: {} }, "fb")).toBe("fb");
  });
});
