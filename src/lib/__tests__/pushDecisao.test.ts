import MockAdapter from "axios-mock-adapter";
import { api } from "@lib/api";
import { decidirPeloPush } from "@lib/pushDecisao";

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
