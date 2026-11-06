import fs from "fs";
import path from "path";

import { api } from "@lib/api";
import { meusPremios, premiosPendentes, linhaDoPremio, type PremioDeIndicacao } from "../premios";

jest.mock("@lib/api", () => ({ api: { get: jest.fn() } }));
const get = api.get as jest.Mock;

// premio-em-pendentes (Andre, 05/11): contrato PROPOSTO pelo Backend (GET /referrals/me/credits), em mock.
const P: PremioDeIndicacao = {
  credit_id: "k1",
  campaign_id: "6b9f",
  campaign_name: "Teste de Lançamento",
  amount: 5,
  share: "REFERRER",
  client_name: "Ana",
  attendance_id: "at-1",
  finished_at: "2026-11-05T14:30:00-03:00",
  status: "LOCKED",
  test: false,
};

describe("meusPremios", () => {
  beforeEach(() => get.mockReset());

  it("le a lista do Backend", async () => {
    get.mockResolvedValue({ data: [P] });
    await expect(meusPremios()).resolves.toEqual([P]);
    expect(get).toHaveBeenCalledWith("/referrals/me/credits");
  });

  it("Backend sem o endpoint (404), erro ou corpo estranho: lista vazia", async () => {
    get.mockRejectedValue({ response: { status: 404 } });
    await expect(meusPremios()).resolves.toEqual([]);
    get.mockResolvedValue({ data: { x: 1 } });
    await expect(meusPremios()).resolves.toEqual([]);
  });
});

describe("premiosPendentes e linhaDoPremio", () => {
  it("pago sai de Pendentes; travado e a receber ficam", () => {
    const l = [P, { ...P, credit_id: "k2", status: "TO_PAY" }, { ...P, credit_id: "k3", status: "PAID" }];
    expect(premiosPendentes(l).map((p) => p.credit_id)).toEqual(["k1", "k2"]);
  });

  it("campanha, valor, estado, primeiro nome e a data do corte", () => {
    expect(linhaDoPremio(P)).toEqual({
      titulo: "Teste de Lançamento",
      valor: "R$ 5,00",
      estado: "a liberar pelo VUPTH",
      detalhe: "Ana · corte em 05/11",
    });
    expect(linhaDoPremio({ ...P, status: "TO_PAY", amount: "7.5" }).estado).toBe("a receber");
    expect(linhaDoPremio({ ...P, status: "OUTRO" }).estado).toBe("a receber");
    expect(linhaDoPremio({ ...P, test: true }).estado).toBe("prêmio de teste");
  });

  it("sem cliente ou sem data, o detalhe encolhe; sem nenhum, some", () => {
    expect(linhaDoPremio({ ...P, client_name: null }).detalhe).toBe("corte em 05/11");
    expect(linhaDoPremio({ ...P, finished_at: "lixo" }).detalhe).toBe("Ana");
    expect(linhaDoPremio({ ...P, client_name: " ", finished_at: null }).detalhe).toBeNull();
  });

  it("Seu dia soma os premios na aba Pendentes e os mostra abaixo dos pagamentos", () => {
    const tela = fs.readFileSync(path.resolve(__dirname, "../../../app/(professional)/my-day.tsx"), "utf8");
    expect(tela).toContain("pendentes={pagamentos.length + premiosAbertos.length}");
    expect(tela).toContain("itens={pendFiltrados.premios}");
    expect(tela).toContain("pendFiltrados.pagamentos.length === 0 && pendFiltrados.premios.length === 0");
    // "Ver o dia": o Historico naquele dia
    expect(tela).toMatch(/onVerDia=\{\(iso\) => \{\s*setDiaEscolhido\(new Date\(iso\)\);\s*setPeriod\("day"\);\s*setAba\("historico"\);/);
    expect(tela).toContain("useRelatorioDoPeriodo(\"profissional\", professional?.id, period, fetchMyReport, diaEscolhido)");
    expect(tela).toContain("paramsDoHistorico(professional.id, filter, period, diaEscolhido ?? undefined)");
  });
});
