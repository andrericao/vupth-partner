import { api } from "@lib/api";
import { buscarDivida, textoDaDivida, type DividaPorFora } from "@lib/dividaPorFora";

jest.mock("@lib/api", () => ({ api: { get: jest.fn() }, getApiErrorMessage: (_e: any, f: string) => f }));

const BASE: DividaPorFora = {
  real: true, open_amount: 0, simulated_amount: 0, limit: 25, over_limit: false, items: [],
};

describe("dividaPorFora", () => {
  it("le GET /professional/me/debt e normaliza", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { ...BASE, open_amount: "5.8", items: null } });
    const d = await buscarDivida();
    expect(api.get).toHaveBeenCalledWith("/professional/me/debt");
    expect(d?.open_amount).toBe(5.8);
    expect(d?.items).toEqual([]);
  });

  it("falha ou resposta vazia: null (a faixa some)", async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error("x"));
    expect(await buscarDivida()).toBeNull();
    (api.get as jest.Mock).mockResolvedValueOnce({ data: null });
    expect(await buscarDivida()).toBeNull();
  });

  it("sem divida nenhuma, nada a mostrar", () => {
    expect(textoDaDivida(null)).toBeNull();
    expect(textoDaDivida(BASE)).toBeNull();
  });

  it("flag desligada: mostra o simulado como teste", () => {
    const t = textoDaDivida({ ...BASE, real: false, simulated_amount: 2.9 });
    expect(t?.titulo).toBe("R$ 2,90 de dívida (teste)");
    expect(t?.teste).toBe(true);
    expect(t?.pix).toBeNull();
  });

  it("divida real abaixo do limite: so avisa, sem Pix", () => {
    const t = textoDaDivida({ ...BASE, open_amount: 5.8, pix_copy_paste: "000201" });
    expect(t?.titulo).toBe("Você deve R$ 5,80 ao app");
    expect(t?.pix).toBeNull();
  });

  it("passou do limite: leva o Pix de cobranca", () => {
    const t = textoDaDivida({ ...BASE, open_amount: 26.1, over_limit: true, pix_copy_paste: "000201" });
    expect(t?.detalhe).toMatch(/Passou de R\$ 25,00/);
    expect(t?.pix).toBe("000201");
  });
});
