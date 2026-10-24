import { api } from "@lib/api";
import { buscarGateway, pagaPeloApp, avisoDeTeste } from "@lib/gateway";

jest.mock("@lib/api", () => ({ api: { get: jest.fn() } }));

// pagamento-pelo-asaas-no-partner (DEC-119; Backend dea2d00).
describe("gateway", () => {
  afterEach(() => jest.clearAllMocks());

  it("le a conexao em GET /payment-gateway", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { connected: true, mode: "SANDBOX" } });
    await expect(buscarGateway()).resolves.toEqual({ connected: true, mode: "SANDBOX" });
    expect(api.get).toHaveBeenCalledWith("/payment-gateway");
    (api.get as jest.Mock).mockResolvedValue({ data: { connected: false } });
    await expect(buscarGateway()).resolves.toEqual({ connected: false, mode: null });
  });

  it("sem resposta util, desconectado: o fluxo de sempre", async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error("404"));
    await expect(buscarGateway()).resolves.toEqual({ connected: false, mode: null });
    (api.get as jest.Mock).mockResolvedValue(undefined);
    await expect(buscarGateway()).resolves.toEqual({ connected: false, mode: null });
  });

  it("so sai pelo app quando conectado e a partir de R$ 5,00", () => {
    expect(pagaPeloApp({ connected: true, mode: "REAL" }, 30)).toBe(true);
    expect(pagaPeloApp({ connected: true, mode: "REAL" }, 5)).toBe(true);
    expect(pagaPeloApp({ connected: true, mode: "REAL" }, 4.9)).toBe(false);
    expect(pagaPeloApp({ connected: false }, 30)).toBe(false);
    expect(pagaPeloApp(null, 30)).toBe(false);
  });

  it("a faixa de teste so no sandbox conectado", () => {
    expect(avisoDeTeste({ connected: true, mode: "SANDBOX" })).toBe("Pagamento de teste, sem dinheiro de verdade.");
    expect(avisoDeTeste({ connected: true, mode: "REAL" })).toBeNull();
    expect(avisoDeTeste({ connected: false, mode: "SANDBOX" })).toBeNull();
    expect(avisoDeTeste(undefined)).toBeNull();
  });
});
