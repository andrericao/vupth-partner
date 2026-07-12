import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import * as SecureStore from "expo-secure-store";
import { api, getApiErrorMessage } from "@lib/api";

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

describe("api — interceptor de refresh (401)", () => {
  // apiMock intercepta as requisicoes do `api`; rawMock intercepta o POST
  // /auth/refresh, que o interceptor faz pelo axios "cru" (nao pelo `api`).
  const apiMock = new MockAdapter(api);
  const rawMock = new MockAdapter(axios);

  afterEach(() => {
    apiMock.reset();
    rawMock.reset();
    jest.clearAllMocks();
  });

  it("401 => renova o token e refaz a requisicao original", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) =>
      k === "vupth_refresh_token" ? "refresh-1" : "access-1"
    );
    apiMock.onGet("/protected").replyOnce(401);
    apiMock.onGet("/protected").replyOnce(200, { ok: true });
    rawMock.onPost(/\/auth\/refresh$/).reply(200, {
      access_token: "new-a",
      refresh_token: "new-r",
    });

    const res = await api.get("/protected");

    expect(res.data).toEqual({ ok: true });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("vupth_access_token", "new-a");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("vupth_refresh_token", "new-r");
  });

  it("401 sem refresh token salvo => rejeita sem tentar renovar", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    apiMock.onGet("/protected").reply(401);

    await expect(api.get("/protected")).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(rawMock.history.post.length).toBe(0);
  });

  it("401 com refresh que falha => limpa os tokens e rejeita", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) =>
      k === "vupth_refresh_token" ? "refresh-1" : "access-1"
    );
    apiMock.onGet("/protected").reply(401);
    rawMock.onPost(/\/auth\/refresh$/).reply(401);

    await expect(api.get("/protected")).rejects.toBeTruthy();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("vupth_access_token");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("vupth_refresh_token");
  });

  it("erro != 401 apenas propaga (nao renova)", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("access-1");
    apiMock.onGet("/x").reply(500);

    await expect(api.get("/x")).rejects.toMatchObject({ response: { status: 500 } });
    expect(rawMock.history.post.length).toBe(0);
  });
});
