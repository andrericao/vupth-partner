import { api } from "@lib/api";
import {
  cupomNoAr,
  usarCupom,
  minhasCampanhas,
  campanhasAtivas,
  mensagemDoCupom,
  beneficioDaCampanha,
  validadeDaCampanha,
  estadoDaCampanha,
  meusCreditosDeCupom,
  type Campanha,
} from "@lib/campanhas";

jest.mock("@lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
  getApiErrorMessage: (_e: any, fallback: string) => fallback,
}));

// cupom-no-app (DEC-61, DEC-63; contrato do Backend 4a94610).
const BASE: Campanha = { id: "c1", name: "Lançamento", type: "DISCOUNT" };

describe("campanhas", () => {
  afterEach(() => jest.clearAllMocks());

  it("ligado onde o Backend ja subiu as campanhas (staging), desligado na producao", () => {
    expect(cupomNoAr("staging")).toBe(true);
    expect(cupomNoAr("dev")).toBe(true);
    expect(cupomNoAr("prod")).toBe(false);
  });

  it("usa o cupom sem espacos", async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { ...BASE, code: "VUPTH10" } });
    await expect(usarCupom("  vupth10 ")).resolves.toMatchObject({ code: "VUPTH10" });
    expect(api.post).toHaveBeenCalledWith("/campaigns/redeem", { code: "vupth10" });
  });

  it("lista os cupons usados; resposta estranha vira lista vazia", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: [BASE] });
    await expect(minhasCampanhas()).resolves.toEqual([BASE]);
    (api.get as jest.Mock).mockResolvedValueOnce({ data: null });
    await expect(minhasCampanhas()).resolves.toEqual([]);
    expect(api.get).toHaveBeenCalledWith("/campaigns/me");
  });

  // DEC-122: nenhuma regra de papel fixa no app; o que o Backend lista, o app mostra.
  it("nao filtra campanha por papel no codigo", async () => {
    const lista = [
      { ...BASE, id: "p", audience: "PROFESSIONAL" },
      { ...BASE, id: "c", audience: "CLIENT" },
      { ...BASE, id: "n", audience: null },
    ];
    (api.get as jest.Mock).mockResolvedValue({ data: lista });
    expect((await campanhasAtivas()).map((c) => c.id)).toEqual(["p", "c", "n"]);
    expect((await minhasCampanhas()).map((c) => c.id)).toEqual(["p", "c", "n"]);
  });

  it("cada recusa em uma frase curta", () => {
    const erro = (code: string) => ({ response: { data: { code } } });
    expect(mensagemDoCupom(erro("CAMPAIGN_NOT_FOUND"))).toBe("Cupom não encontrado.");
    expect(mensagemDoCupom(erro("CAMPAIGN_NOT_AVAILABLE"))).toBe("Este cupom não está valendo agora.");
    expect(mensagemDoCupom(erro("CAMPAIGN_ALREADY_REDEEMED"))).toBe("Você já usou este cupom.");
    expect(mensagemDoCupom(erro("CAMPAIGN_NOT_FOR_YOU"))).toBe("Este cupom não é para o seu perfil.");
    expect(mensagemDoCupom(erro("OUTRO"))).toBe("Não foi possível usar o cupom.");
    expect(mensagemDoCupom(undefined)).toBe("Não foi possível usar o cupom.");
  });

  it("o beneficio em poucas palavras", () => {
    expect(beneficioDaCampanha({ ...BASE, type: "REFERRAL_BONUS", value_amount: 5 })).toBe("R$ 5,00 por cliente indicado");
    expect(beneficioDaCampanha({ ...BASE, type: "REFERRAL_BONUS" })).toBe("Bônus por indicação");
    expect(beneficioDaCampanha({ ...BASE, type: "FEE_WAIVER" })).toBe("Sem taxa");
    expect(beneficioDaCampanha({ ...BASE, value_percent: 10 })).toBe("10% de desconto");
    expect(beneficioDaCampanha({ ...BASE, value_amount: 0, value_percent: 0 })).toBe("Desconto");
    expect(beneficioDaCampanha({ ...BASE, type: "NOVO" })).toBe("Lançamento");
  });

  it("a validade, quando ha fim", () => {
    expect(validadeDaCampanha({ ...BASE, ends_at: "2026-11-30T12:00:00-03:00" })).toBe("até 30/11");
    expect(validadeDaCampanha(BASE)).toBeNull();
    expect(validadeDaCampanha({ ...BASE, ends_at: "nao-e-data" })).toBeNull();
  });
});

describe("cupom ativado em Configuracoes (BAK-1)", () => {
  it("estadoDaCampanha: so usado e vencido levam rotulo", () => {
    expect(estadoDaCampanha({ ...BASE, status: "USED" })).toBe("usado");
    expect(estadoDaCampanha({ ...BASE, status: "EXPIRED" })).toBe("vencido");
    expect(estadoDaCampanha({ ...BASE, status: "ACTIVE" })).toBeNull();
    expect(estadoDaCampanha(BASE)).toBeNull();
  });

  it("meusCreditosDeCupom le GET /professional/me/credits", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { open_amount: "3", next_payout: "2026-10-30", items: [{ attendance_id: "a", campaign: "X", amount: 3 }] },
    });
    const r = await meusCreditosDeCupom();
    expect(api.get).toHaveBeenCalledWith("/professional/me/credits");
    expect(r.open_amount).toBe(3);
    expect(r.items).toHaveLength(1);
  });

  it("meusCreditosDeCupom: resposta torta vira vazio", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: null });
    expect(await meusCreditosDeCupom()).toEqual({ open_amount: 0, next_payout: null, items: [] });
  });
});
