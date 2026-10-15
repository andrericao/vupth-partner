import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import * as SecureStore from "expo-secure-store";
import { api, getApiErrorMessage, aoContaDesativada } from "@lib/api";

// api.ts importa expo-secure-store no topo (interceptors) — mockar p/ o import.
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// UM par de adaptadores para o ARQUIVO inteiro. Criar um `MockAdapter` novo
// sobre o mesmo `api` SUBSTITUI o anterior — dois blocos com seus proprios
// adaptadores fazem o primeiro registrar respostas num adaptador que ja nao
// esta ativo, e os testes dele quebram sem que o codigo tenha mudado. Foi o que
// aconteceu ao entrar o bloco do single-flight.
//
// apiMock intercepta as requisicoes do `api`; rawMock intercepta o POST
// /auth/refresh, que o interceptor faz pelo axios "cru" (nao pelo `api`).
const apiMock = new MockAdapter(api);
const rawMock = new MockAdapter(axios);

describe("getApiErrorMessage", () => {
  it("sem response (erro de rede) => mensagem de sem conexao", () => {
    expect(getApiErrorMessage({}, "fallback")).toMatch(/Sem conexão/);
    expect(getApiErrorMessage(new Error("timeout"), "fallback")).toMatch(/Sem conexão/);
    expect(getApiErrorMessage(undefined, "fallback")).toMatch(/Sem conexão/);
  });

  it("código conhecido => traducao PT (não usa o fallback)", () => {
    const err = { response: { data: { code: "PROFESSIONAL_ALREADY_AFFILIATED" } } };
    expect(getApiErrorMessage(err, "fallback")).toMatch(/já está vinculado/);
  });

  // desativar-conta, fatia 1 (Backend 6a5d3ab): a loja de um dono desativado.
  it("ESTABLISHMENT_UNAVAILABLE => a loja esta desativada", () => {
    const err = { response: { status: 409, data: { code: "ESTABLISHMENT_UNAVAILABLE" } } };
    expect(getApiErrorMessage(err, "fallback")).toMatch(/loja está desativada/);
  });

  it("CURRENT_PASSWORD_INVALID => mensagem de senha atual incorreta", () => {
    const err = { response: { data: { code: "CURRENT_PASSWORD_INVALID" } } };
    expect(getApiErrorMessage(err, "fallback")).toMatch(/senha atual/i);
  });

  // 🔴 Andre, 26/09: ao abrir a fila e ao mudar para Fora, a tela mostrou
  // "NullPointerException: Cannot invoke ... because candidate is null" — um
  // erro interno do servidor (500), com a mensagem crua do Java. Erro 5xx sem
  // codigo conhecido nao e frase para o usuario.
  it("500 sem codigo conhecido: frase de servidor, nunca a mensagem crua", () => {
    const err = {
      response: {
        status: 500,
        data: { message: 'NullPointerException: Cannot invoke "java.time.OffsetDateTime.isBefore"' },
      },
    };
    const m = getApiErrorMessage(err, "fallback");
    expect(m).toMatch(/Algo deu errado/);
    expect(m).not.toMatch(/NullPointer/);
  });

  it("5xx com codigo conhecido continua usando a traducao do codigo", () => {
    const err = { response: { status: 503, data: { code: "OPERATION_MODE_LOCKED" } } };
    expect(getApiErrorMessage(err, "fallback")).toMatch(/começo do expediente/);
  });

  it("EMAIL_NOT_FOUND e TOO_MANY_REQUESTS (acesso, 03/10) => textos de reserva", () => {
    const semConta = { response: { status: 404, data: { code: "EMAIL_NOT_FOUND" } } };
    const espera = { response: { status: 429, data: { code: "TOO_MANY_REQUESTS" } } };
    expect(getApiErrorMessage(semConta, "fallback")).toBe("Não há conta com este e-mail.");
    expect(getApiErrorMessage(espera, "fallback")).toMatch(/Muitas tentativas/);
  });

  it("OPERATION_MODE_LOCKED (so agenda depois do 1o cliente) => explica quando da para trocar", () => {
    const err = { response: { status: 409, data: { code: "OPERATION_MODE_LOCKED" } } };
    expect(getApiErrorMessage(err, "fallback")).toMatch(/começo do expediente/);
  });

  it("SERVICE_PRICE_SPLIT_INVALID (422 da divisao do preco) => frase sobre o preço", () => {
    const err = { response: { status: 422, data: { code: "SERVICE_PRICE_SPLIT_INVALID" } } };
    expect(getApiErrorMessage(err, "fallback")).toMatch(/Taxas Vupth/);
  });

  it("código desconhecido, com fieldErrors => lista campo: msg (uma por linha)", () => {
    const err = {
      response: { data: { code: "SOMETHING_ELSE", fieldErrors: { email: "inválido", senha: "curta" } } },
    };
    expect(getApiErrorMessage(err, "fallback")).toBe("email: inválido\nsenha: curta");
  });

  it("sem code, com fieldErrors => lista os campos", () => {
    const err = { response: { data: { fieldErrors: { nome: "obrigatório" } } } };
    expect(getApiErrorMessage(err, "fallback")).toBe("nome: obrigatório");
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

  it("401 CURRENT_PASSWORD_INVALID => erro de campo, NAO renova nem desloga", async () => {
    // Breaking do backend 2026-07-23: trocar senha exige current_password;
    // senha atual errada volta 401 CURRENT_PASSWORD_INVALID. E erro de negocio,
    // nao de sessao — o interceptor NAO pode disparar refresh/logout.
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) =>
      k === "vupth_refresh_token" ? "refresh-1" : "access-1"
    );
    apiMock.onPatch("/profile/update-password/me").reply(401, { code: "CURRENT_PASSWORD_INVALID" });

    await expect(api.patch("/profile/update-password/me", {})).rejects.toMatchObject({
      response: { status: 401, data: { code: "CURRENT_PASSWORD_INVALID" } },
    });
    expect(rawMock.history.post.length).toBe(0);
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it("erro != 401 apenas propaga (não renova)", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("access-1");
    apiMock.onGet("/x").reply(500);

    await expect(api.get("/x")).rejects.toMatchObject({ response: { status: 500 } });
    expect(rawMock.history.post.length).toBe(0);
  });
});

// 🔴 Pedido do Front-Client (06/09): "os quatro POST /auth/refresh do log de
// PROD são deste app — falta o single-flight aqui".
//
// Cada 401 disparava o PRÓPRIO refresh. O backend ROTACIONA o refresh token:
// com quatro chamadas simultâneas, uma ganha e as outras tomam 401 — e é pior
// do que só "três falharem". A perdedora cai no catch e APAGA OS TOKENS QUE A
// VENCEDORA ACABOU DE SALVAR. O usuário é deslogado pela própria renovação que
// deu certo, sem motivo aparente.
describe("api — refresh em voo único (single-flight)", () => {

  afterEach(() => {
    apiMock.reset();
    rawMock.reset();
    jest.clearAllMocks();
  });

  const comRefreshSalvo = () =>
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) =>
      k === "vupth_refresh_token" ? "refresh-1" : "access-velho"
    );

  it("🔴 QUATRO 401 simultâneos chamam o refresh UMA vez só", async () => {
    comRefreshSalvo();
    for (const rota of ["/a", "/b", "/c", "/d"]) {
      apiMock.onGet(rota).replyOnce(401);
      apiMock.onGet(rota).replyOnce(200, { rota });
    }
    rawMock.onPost(/\/auth\/refresh$/).reply(() =>
      // Demora de proposito: e a janela em que as outras tres chegam.
      new Promise((resolve) =>
        setTimeout(() => resolve([200, { access_token: "novo-a", refresh_token: "novo-r" }]), 30)
      )
    );

    const respostas = await Promise.all(["/a", "/b", "/c", "/d"].map((r) => api.get(r)));

    expect(rawMock.history.post.length).toBe(1);
    expect(respostas.map((r) => r.data.rota)).toEqual(["/a", "/b", "/c", "/d"]);
  });

  it("as que esperaram na fila são refeitas com o token NOVO", async () => {
    // Armazenamento COM MEMORIA, de proposito: a requisicao refeita passa de
    // novo pelo interceptor de REQUISICAO, que rele o token do SecureStore e
    // sobrescreve o cabecalho. Com um mock que sempre devolve o token velho, o
    // teste acusaria defeito que nao existe — no app o `setItemAsync` persiste.
    const guardado: Record<string, string> = {
      vupth_access_token: "access-velho",
      vupth_refresh_token: "refresh-1",
    };
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) => guardado[k] ?? null);
    (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (k: string, v: string) => {
      guardado[k] = v;
    });
    apiMock.onGet("/a").replyOnce(401);
    apiMock.onGet("/b").replyOnce(401);
    apiMock.onGet("/a").replyOnce((cfg) => [200, { auth: cfg.headers?.Authorization }]);
    apiMock.onGet("/b").replyOnce((cfg) => [200, { auth: cfg.headers?.Authorization }]);
    rawMock.onPost(/\/auth\/refresh$/).reply(() =>
      new Promise((resolve) =>
        setTimeout(() => resolve([200, { access_token: "novo-a", refresh_token: "novo-r" }]), 20)
      )
    );

    const [a, b] = await Promise.all([api.get("/a"), api.get("/b")]);

    expect(a.data.auth).toBe("Bearer novo-a");
    expect(b.data.auth).toBe("Bearer novo-a");
  });

  it("refresh falhando derruba a fila INTEIRA junto — um logout, não uma corrida", async () => {
    comRefreshSalvo();
    apiMock.onGet("/a").reply(401);
    apiMock.onGet("/b").reply(401);
    rawMock.onPost(/\/auth\/refresh$/).reply(() =>
      new Promise((resolve) => setTimeout(() => resolve([401]), 20))
    );

    const resultados = await Promise.allSettled([api.get("/a"), api.get("/b")]);

    expect(resultados.every((r) => r.status === "rejected")).toBe(true);
    expect(rawMock.history.post.length).toBe(1);
  });

  it("depois que o voo termina, o PRÓXIMO 401 pode renovar de novo", async () => {
    // Sem o `finally` zerando a flag, o app ficaria preso para sempre na fila
    // depois do primeiro refresh — nenhuma requisição voltaria a andar.
    comRefreshSalvo();
    rawMock.onPost(/\/auth\/refresh$/).reply(200, { access_token: "x", refresh_token: "y" });

    apiMock.onGet("/um").replyOnce(401);
    apiMock.onGet("/um").replyOnce(200, {});
    await api.get("/um");

    apiMock.onGet("/dois").replyOnce(401);
    apiMock.onGet("/dois").replyOnce(200, {});
    await api.get("/dois");

    expect(rawMock.history.post.length).toBe(2);
  });
});

// desativar-conta (c0f5b17): no "So consultar" o que mexe na operacao da 403
// ACCOUNT_DEACTIVATED — o app oferece "Reativar" (o aviso mora no auth store;
// o api so avisa quem se registrou, para nao importar o store aqui).
describe("api — 403 ACCOUNT_DEACTIVATED", () => {
  afterEach(() => {
    apiMock.reset();
    aoContaDesativada(null);
  });

  it("avisa quem se registrou e devolve o erro para a tela", async () => {
    const avisar = jest.fn();
    aoContaDesativada(avisar);
    apiMock.onPost("/attendances").reply(403, { code: "ACCOUNT_DEACTIVATED" });

    await expect(api.post("/attendances")).rejects.toBeTruthy();
    expect(avisar).toHaveBeenCalledTimes(1);
  });

  it("outro 403 nao avisa", async () => {
    const avisar = jest.fn();
    aoContaDesativada(avisar);
    apiMock.onGet("/x").reply(403, { code: "FORBIDDEN" });

    await expect(api.get("/x")).rejects.toBeTruthy();
    expect(avisar).not.toHaveBeenCalled();
  });
});
