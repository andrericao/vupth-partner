import { api } from "@lib/api";
import {
  aceitarEncaixe,
  apoioDoEncaixe,
  contraporEncaixe,
  encaixesEsperandoOCliente,
  encaixesParaResponder,
  frasesDoApoio,
  lerValor,
  listarEncaixes,
  recusarEncaixe,
  type PedidoDeEncaixe,
} from "@lib/fitIn";

jest.mock("@lib/api", () => ({ api: { get: jest.fn(), put: jest.fn() } }));

const bruto = (status: string) => ({
  id: "e1", status, ahead_count: 2, desired_time: "2026-11-02T15:00:00Z", current_extra: "12.50",
  last_offer_by: "CLIENT", attendance_id: null, created_at: "2026-11-02T14:00:00Z",
});

// aceitar-encaixe (DEC-136 a 141; Backend 580596e).
describe("fitIn — chamadas", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lista e traduz os campos", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: [bruto("PENDING")] });
    const [p] = await listarEncaixes();
    expect(api.get).toHaveBeenCalledWith("/attendances/fit-in-requests");
    expect(p).toMatchObject({ id: "e1", status: "PENDING", aheadCount: 2, currentExtra: 12.5, lastOfferBy: "CLIENT" });
  });

  it("resposta que nao e lista vira vazia", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: null });
    expect(await listarEncaixes()).toEqual([]);
  });

  it("aceita, recusa e contrapoe nas rotas certas", async () => {
    (api.put as jest.Mock).mockResolvedValue({ data: bruto("ACCEPTED") });
    await aceitarEncaixe("e1");
    await recusarEncaixe("e1");
    await contraporEncaixe("e1", 15);
    expect(api.put).toHaveBeenNthCalledWith(1, "/attendances/fit-in-requests/e1/accept");
    expect(api.put).toHaveBeenNthCalledWith(2, "/attendances/fit-in-requests/e1/decline");
    expect(api.put).toHaveBeenNthCalledWith(3, "/attendances/fit-in-requests/e1/counter", { extra: 15 });
  });

  it("le o apoio em camelCase ou snake_case", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { aheadNow: 2, behindNow: 1, durationMinutes: 30, sliceMinutesPerClient: 10, absorbedUnnoticed: true, estimatedFinish: null, closesAt: "18:00:00", passesClosing: false },
    });
    expect(await apoioDoEncaixe("e1")).toMatchObject({ aheadNow: 2, behindNow: 1, absorbedUnnoticed: true, closesAt: "18:00:00" });
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { ahead_now: 1, passes_closing: true } });
    expect(await apoioDoEncaixe("e1")).toMatchObject({ aheadNow: 1, passesClosing: true });
  });
});

describe("fitIn — regras", () => {
  const p = (status: PedidoDeEncaixe["status"]) => ({ id: status, status } as PedidoDeEncaixe);

  it("so PENDING espera o profissional; COUNTERED espera o cliente", () => {
    const lista = [p("PENDING"), p("COUNTERED"), p("ACCEPTED"), p("EXPIRED")];
    expect(encaixesParaResponder(lista).map((x) => x.id)).toEqual(["PENDING"]);
    expect(encaixesEsperandoOCliente(lista).map((x) => x.id)).toEqual(["COUNTERED"]);
    expect(encaixesParaResponder(undefined)).toEqual([]);
  });

  it("le o valor com virgula ou ponto; vazio, zero e lixo viram null", () => {
    expect(lerValor("12,50")).toBe(12.5);
    expect(lerValor(" 7.2 ")).toBe(7.2);
    expect(lerValor("")).toBeNull();
    expect(lerValor("0")).toBeNull();
    expect(lerValor("abc")).toBeNull();
    expect(lerValor("-3")).toBeNull();
  });

  it("as frases do apoio dizem quantos absorvem e se passa do fechamento", () => {
    const base = { aheadNow: 1, behindNow: 2, durationMinutes: 30, sliceMinutesPerClient: 10, absorbedUnnoticed: true, estimatedFinish: null, closesAt: "18:00:00", passesClosing: false };
    expect(frasesDoApoio(base)).toEqual(["3 clientes absorvem o tempo sem perceber."]);
    expect(frasesDoApoio({ ...base, aheadNow: 1, behindNow: 0 })[0]).toBe("1 cliente absorve o tempo sem perceber.");
    expect(frasesDoApoio({ ...base, absorbedUnnoticed: false, passesClosing: true })).toEqual([
      "O encaixe adiciona 10 min para cada um dos 3 clientes.",
      "Passa do fechamento (18:00).",
    ]);
  });
});
