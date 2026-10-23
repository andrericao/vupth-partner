import { api } from "@lib/api";
import {
  meuLinkDeIndicacao,
  clientesQueChegaram,
  aReceber,
  participarDaCampanha,
  mensagemDaAdesao,
  aLiberar,
  andamentoDaCampanha,
} from "@lib/indicacao";

jest.mock("@lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));

// link-de-indicacao (DEC-70, Backend 3fdcec1).
describe("indicacao", () => {
  it("pede o link em GET /referrals/me", async () => {
    const dado = { code: "ABC234", link: "https://vupth.pages.dev/i/ABC234", referred_clients: 2 };
    (api.get as jest.Mock).mockResolvedValue({ data: dado });
    await expect(meuLinkDeIndicacao()).resolves.toEqual(dado);
    expect(api.get).toHaveBeenCalledWith("/referrals/me");
  });

  it("a frase dos clientes que chegaram", () => {
    expect(clientesQueChegaram(0)).toBe("Nenhum cliente chegou pelo seu link ainda.");
    expect(clientesQueChegaram(1)).toBe("1 cliente chegou pelo seu link.");
    expect(clientesQueChegaram(3)).toBe("3 clientes chegaram pelo seu link.");
  });

  // a-receber-da-indicacao (Backend e5dc2e8).
  it("o a receber: quantos concluiram e o valor", () => {
    expect(aReceber({ credited_clients: 2, to_receive: 10 })).toBe("2 concluíram o corte · R$ 10,00 a receber");
    expect(aReceber({ credited_clients: 1, to_receive: "5.5" })).toBe("1 concluiu o corte · R$ 5,50 a receber");
    expect(aReceber({ credited_clients: 0, to_receive: null })).toBe("0 concluíram o corte · R$ 0,00 a receber");
    expect(aReceber({ credited_clients: 1, to_receive: "x" })).toBe("1 concluiu o corte · R$ 0,00 a receber");
  });

  it("Backend antigo, sem os campos: sem a linha", () => {
    expect(aReceber({})).toBeNull();
    expect(aReceber({ credited_clients: null })).toBeNull();
  });

  // compartilhe-e-ganhe-no-partner (Backend fcd4fd3, DEC-113).
  it("participa da campanha em POST /campaigns/{id}/join", async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: {} });
    await participarDaCampanha("c1");
    expect(api.post).toHaveBeenCalledWith("/campaigns/c1/join");
  });

  it("a recusa da adesao em uma frase", () => {
    const erro = (code: string) => ({ response: { data: { code } } });
    expect(mensagemDaAdesao(erro("CAMPAIGN_NOT_FOUND"))).toBe("Campanha não encontrada.");
    expect(mensagemDaAdesao(erro("CAMPAIGN_NOT_AVAILABLE"))).toBe("Esta campanha não está valendo agora.");
    expect(mensagemDaAdesao(erro("CAMPAIGN_ALREADY_REDEEMED"))).toBe("Você já participa desta campanha.");
    expect(mensagemDaAdesao(erro("CAMPAIGN_NOT_FOR_YOU"))).toBe("Esta campanha não é para o seu perfil.");
    expect(mensagemDaAdesao(erro("OUTRO"))).toBe("Não foi possível participar agora.");
    expect(mensagemDaAdesao(new Error("rede"))).toBe("Não foi possível participar agora.");
  });

  it("o ganho que espera o Andre liberar", () => {
    expect(aLiberar({ pending_release: 10 })).toBe("R$ 10,00 a liberar pelo VUPTH");
    expect(aLiberar({ pending_release: "2.5" })).toBe("R$ 2,50 a liberar pelo VUPTH");
    expect(aLiberar({ pending_release: 0 })).toBeNull();
    expect(aLiberar({ pending_release: null })).toBeNull();
    expect(aLiberar({})).toBeNull();
  });

  it("o andamento da campanha", () => {
    expect(andamentoDaCampanha({ referred: 2, credited: 1 })).toBe("2 chegaram · 1 concluiu o corte");
    expect(andamentoDaCampanha({ referred: 1, credited: 2 })).toBe("1 chegou · 2 concluíram o corte");
    expect(andamentoDaCampanha({})).toBe("0 chegaram · 0 concluíram o corte");
  });
});
