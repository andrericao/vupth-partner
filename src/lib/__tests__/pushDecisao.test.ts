import MockAdapter from "axios-mock-adapter";
import { api } from "@lib/api";
import { decidirPeloPush, resolverAcaoDoPush } from "@lib/pushDecisao";
import { ACAO_ACEITAR, ACAO_RECUSAR, ACAO_OK } from "@lib/push";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mock = new MockAdapter(api);

// push-acoes-por-pergunta (Backend 7584964): Aceitar/Recusar no push chamam o mesmo
// endpoint da tela, escolhido pelo data.type.
describe("decidirPeloPush", () => {
  afterEach(() => mock.reset());

  it("pedido de corte: aceita e recusa pelo cutRequestId", async () => {
    mock.onPatch("/attendances/cut-requests/c1/accept").reply(200, {});
    mock.onPatch("/attendances/cut-requests/c1/refuse").reply(200, {});
    const data = { type: "CUT_REQUESTED", cutRequestId: "c1" };
    expect(await decidirPeloPush(data, "aceitar")).toBe(true);
    expect(await decidirPeloPush(data, "recusar")).toBe(true);
    expect(mock.history.patch.map((r) => r.url)).toEqual([
      "/attendances/cut-requests/c1/accept",
      "/attendances/cut-requests/c1/refuse",
    ]);
  });

  it("convite de dono: aceita e recusa pelo transferId", async () => {
    mock.onPost("/ownership-transfers/t1/accept").reply(204);
    mock.onPost("/ownership-transfers/t1/refuse").reply(204);
    const data = { type: "OWNERSHIP_TRANSFER_REQUESTED", transferId: "t1" };
    expect(await decidirPeloPush(data, "aceitar")).toBe(true);
    expect(await decidirPeloPush(data, "recusar")).toBe(true);
    expect(mock.history.post.map((r) => r.url)).toEqual([
      "/ownership-transfers/t1/accept",
      "/ownership-transfers/t1/refuse",
    ]);
  });

  it("ja paguei do cliente: confirma e recusa pelo attendanceId", async () => {
    mock.onPost("/attendances/a1/payment/confirm").reply(200, {});
    mock.onPost("/attendances/a1/payment/refuse").reply(200, {});
    const data = { type: "PAYMENT_CLAIMED", attendanceId: "a1" };
    expect(await decidirPeloPush(data, "aceitar")).toBe(true);
    expect(await decidirPeloPush(data, "recusar")).toBe(true);
    expect(mock.history.post.map((r) => r.url)).toEqual([
      "/attendances/a1/payment/confirm",
      "/attendances/a1/payment/refuse",
    ]);
  });

  it("sem o id, ou de outro tipo, nao chama nada e devolve false", async () => {
    expect(await decidirPeloPush({ type: "CUT_REQUESTED" }, "aceitar")).toBe(false);
    expect(await decidirPeloPush({ type: "OWNERSHIP_TRANSFER_REQUESTED", transferId: "" }, "recusar")).toBe(false);
    expect(await decidirPeloPush({ type: "PRICE_POLICY" }, "aceitar")).toBe(false);
    expect(await decidirPeloPush(undefined, "aceitar")).toBe(false);
    expect(mock.history.patch.length + mock.history.post.length).toBe(0);
  });

  it("se a chamada falha, devolve false (o app abre a tela)", async () => {
    mock.onPatch("/attendances/cut-requests/c1/accept").reply(409, { code: "CUT_REQUEST_NOT_PENDING" });
    expect(await decidirPeloPush({ type: "CUT_REQUESTED", cutRequestId: "c1" }, "aceitar")).toBe(false);
  });
});

// push-resolve-sem-abrir-o-app: a tarefa em segundo plano e o listener recebem a MESMA
// resposta; cada toque decide uma vez so.
describe("resolverAcaoDoPush", () => {
  afterEach(() => mock.reset());
  const resposta = (id: string, actionIdentifier: string, data: object) => ({
    actionIdentifier,
    notification: { request: { identifier: id, content: { data } } },
  });

  it("Aceitar chama o endpoint e devolve feito", async () => {
    mock.onPatch("/attendances/cut-requests/c9/accept").reply(200, {});
    const r = resposta("n1", ACAO_ACEITAR, { type: "CUT_REQUESTED", cutRequestId: "c9" });
    expect(await resolverAcaoDoPush(r)).toBe("feito");
    expect(mock.history.patch).toHaveLength(1);
  });

  it("o mesmo toque chegando de novo (tarefa e listener) nao decide duas vezes", async () => {
    mock.onPatch("/attendances/cut-requests/c8/refuse").reply(200, {});
    const r = resposta("n2", ACAO_RECUSAR, { type: "CUT_REQUESTED", cutRequestId: "c8" });
    expect(await resolverAcaoDoPush(r)).toBe("feito");
    expect(await resolverAcaoDoPush(r)).toBe("repetida");
    expect(mock.history.patch).toHaveLength(1);
  });

  it("falhou: devolve falhou e deixa tentar de novo", async () => {
    mock.onPatch("/attendances/cut-requests/c7/accept").replyOnce(409).onPatch("/attendances/cut-requests/c7/accept").reply(200, {});
    const r = resposta("n3", ACAO_ACEITAR, { type: "CUT_REQUESTED", cutRequestId: "c7" });
    expect(await resolverAcaoDoPush(r)).toBe("falhou");
    expect(await resolverAcaoDoPush(r)).toBe("feito");
  });

  it("OK e toque no corpo da notificacao nao decidem nada", async () => {
    expect(await resolverAcaoDoPush(resposta("n4", ACAO_OK, { type: "PRICE_POLICY" }))).toBe("ignorada");
    expect(await resolverAcaoDoPush(resposta("n5", "expo.modules.notifications.actions.DEFAULT", {}))).toBe("ignorada");
    expect(mock.history.patch.length + mock.history.post.length).toBe(0);
  });
});
