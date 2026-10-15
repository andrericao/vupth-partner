import MockAdapter from "axios-mock-adapter";
import { api } from "@lib/api";
import {
  pedirPosse,
  lerPosseDoDono,
  cancelarPosse,
  listarConvitesDePosse,
  aceitarPosse,
  recusarPosse,
  mensagemDaPosse,
  candidatosAPosse,
} from "@lib/posseDaLoja";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mock = new MockAdapter(api);
const erro = (status: number, data: object) => ({ response: { status, data } });

// passar a posse (contrato do Backend c0f5b17 + respostas ao S41, 01c785e).
describe("posse da loja — chamadas", () => {
  afterEach(() => mock.reset());

  it("o dono pede para um profissional da equipe", async () => {
    mock.onPost("/establishment/e1/ownership-transfer").reply(201, { id: "t1", status: "PENDING" });
    const r = await pedirPosse("e1", "p1");
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ professionalId: "p1" });
    expect(r.id).toBe("t1");
  });

  it("o dono le o proprio pendente; sem pendente (404) e null", async () => {
    mock.onGet("/establishment/e1/ownership-transfer").replyOnce(200, {
      id: "t1", status: "PENDING", professional_id: "p1", professional_name: "Bia", created_at: "2026-10-08T12:00:00Z",
    });
    expect((await lerPosseDoDono("e1"))?.professional_name).toBe("Bia");

    mock.onGet("/establishment/e1/ownership-transfer").replyOnce(404, { code: "OWNERSHIP_TRANSFER_NOT_FOUND" });
    expect(await lerPosseDoDono("e1")).toBeNull();
  });

  it("outro erro ao ler o pendente sobe", async () => {
    mock.onGet("/establishment/e1/ownership-transfer").reply(500);
    await expect(lerPosseDoDono("e1")).rejects.toBeTruthy();
  });

  it("cancelar, listar, aceitar e recusar", async () => {
    mock.onDelete("/ownership-transfers/t1").reply(204);
    mock.onGet("/professional/me/ownership-transfers").reply(200, [{ id: "t1", status: "PENDING" }]);
    mock.onPost("/ownership-transfers/t1/accept").reply(204);
    mock.onPost("/ownership-transfers/t1/refuse").reply(204);

    await cancelarPosse("t1");
    expect(await listarConvitesDePosse()).toHaveLength(1);
    await aceitarPosse("t1");
    await recusarPosse("t1");

    expect(mock.history.delete[0].url).toBe("/ownership-transfers/t1");
    expect(mock.history.post.map((r) => r.url)).toEqual([
      "/ownership-transfers/t1/accept",
      "/ownership-transfers/t1/refuse",
    ]);
  });

  it("a lista vazia ou fora do formato vira []", async () => {
    mock.onGet("/professional/me/ownership-transfers").reply(200, null);
    expect(await listarConvitesDePosse()).toEqual([]);
  });
});

describe("mensagemDaPosse", () => {
  it("fora da equipe (422)", () => {
    expect(mensagemDaPosse(erro(422, { code: "TRANSFER_TARGET_NOT_IN_TEAM" }))).toMatch(/equipe/);
  });
  it("ja ha pendente (409)", () => {
    expect(mensagemDaPosse(erro(409, { code: "TRANSFER_ALREADY_PENDING" }))).toMatch(/pendente/);
  });
  it("outro erro cai na mensagem padrao", () => {
    expect(mensagemDaPosse(new Error("Network Error"))).toMatch(/Sem conexão/);
  });
});

describe("candidatosAPosse", () => {
  it("a equipe sem o proprio dono", () => {
    const equipe = [
      { id: "dono", name: "Eu" },
      { id: "p1", name: "Bia" },
    ];
    expect(candidatosAPosse(equipe, "dono")).toEqual([{ id: "p1", nome: "Bia" }]);
    expect(candidatosAPosse(undefined, "dono")).toEqual([]);
  });
});
