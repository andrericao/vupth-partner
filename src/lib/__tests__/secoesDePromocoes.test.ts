import {
  separarEmSecoes,
  dinheiroDaIndicacao,
  idsEmQueParticipo,
  soDisponiveis,
  cupomPassado,
} from "../secoesDePromocoes";
import type { Campanha } from "../campanhas";

jest.mock("@lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() }, API_ENV: "staging" }));

// promocoes-em-secoes (Andre, 05/11): Ativas, Disponiveis e Passadas.
const AGORA = new Date("2026-11-05T12:00:00-03:00");
const link = (id: string, extra: Partial<Campanha> = {}): Campanha => ({ id, name: `Link ${id}`, type: "REFERRAL_BONUS", ...extra });
const cupom = (id: string, extra: Partial<Campanha> = {}): Campanha => ({ id, name: `Cupom ${id}`, type: "DISCOUNT", code: `C${id}`, ...extra });
const MEU = { code: "ABC", link: "https://x/i/ABC", referred_clients: 1 };
const participa = (id: string, extra = {}) => ({ campaign_id: id, name: `Link ${id}`, link: `https://x/i/ABC?c=${id}`, referred: 0, credited: 0, ...extra });

describe("separarEmSecoes", () => {
  it("campanha de link em que participa e no prazo: Ativas; vencida: Passadas", () => {
    const s = separarEmSecoes(
      {
        meu: { ...MEU, campaigns: [participa("a"), participa("v", { ends_at: "2026-10-28T23:59:00-03:00" })] },
        noAr: [link("a", { ends_at: "2026-12-10T23:59:00-03:00" })],
        cupons: [],
      },
      AGORA
    );
    expect(s.linksAtivos.map((x) => x.link.campaign_id)).toEqual(["a"]);
    expect(s.linksAtivos[0].base?.id).toBe("a");
    expect(s.linksPassados.map((x) => x.link.campaign_id)).toEqual(["v"]);
  });

  it("o prazo da campanha no ar vale quando o link nao traz o fim", () => {
    const s = separarEmSecoes(
      { meu: { ...MEU, campaigns: [participa("a")] }, noAr: [link("a", { ends_at: "2026-11-01T00:00:00-03:00" })], cupons: [] },
      AGORA
    );
    expect(s.linksPassados).toHaveLength(1);
    expect(s.linksAtivos).toHaveLength(0);
  });

  it("Disponiveis: link no ar sem participar (esgotado fica, encerrado sai) e cupom com codigo ainda nao ativado", () => {
    const s = separarEmSecoes(
      {
        meu: { ...MEU, campaigns: [participa("ja")] },
        noAr: [
          link("ja"),
          link("novo"),
          link("cheio", { remaining_slots: 0 }),
          link("fim", { ends_at: "2026-10-01T00:00:00-03:00" }),
          cupom("d"),
          cupom("sem", { code: null }),
          cupom("ativado"),
          cupom("cheio2", { remaining_slots: 0 }),
        ],
        cupons: [cupom("ativado", { status: "ACTIVE" })],
      },
      AGORA
    );
    expect(s.linksDisponiveis.map((c) => c.id)).toEqual(["novo", "cheio"]);
    expect(s.cuponsDisponiveis.map((c) => c.id)).toEqual(["d"]);
  });

  it("cupom ativado: valido em Ativas; vencido em 28/10, usado ou EXPIRED em Passadas", () => {
    const s = separarEmSecoes(
      {
        meu: null,
        noAr: [],
        cupons: [
          cupom("ok", { status: "ACTIVE", ends_at: "2026-11-30T00:00:00-03:00" }),
          cupom("28", { status: "ACTIVE", ends_at: "2026-10-28T23:59:00-03:00" }),
          cupom("u", { status: "USED" }),
          cupom("e", { status: "EXPIRED" }),
        ],
      },
      AGORA
    );
    expect(s.cuponsAtivos.map((c) => c.id)).toEqual(["ok"]);
    expect(s.cuponsPassados.map((c) => c.id)).toEqual(["28", "u", "e"]);
    expect(cupomPassado(cupom("x"), AGORA)).toBe(false);
  });

  it("sem nada carregado, tudo vazio", () => {
    const s = separarEmSecoes({ meu: null, noAr: [], cupons: [] });
    expect(Object.values(s).every((l) => l.length === 0)).toBe(true);
  });
});

describe("dinheiroDaIndicacao", () => {
  it("so reais, sem contagem de clientes", () => {
    expect(dinheiroDaIndicacao({ to_receive: 5, pending_release: "5" })).toEqual({
      receber: "R$ 5,00 a receber",
      liberar: "R$ 5,00 a liberar pelo VUPTH",
    });
  });

  it("zero, ausente, lixo ou sem resposta: nada", () => {
    expect(dinheiroDaIndicacao({ to_receive: 0, pending_release: null })).toEqual({ receber: null, liberar: null });
    expect(dinheiroDaIndicacao({ to_receive: "x" as any })).toEqual({ receber: null, liberar: null });
    expect(dinheiroDaIndicacao(null)).toEqual({ receber: null, liberar: null });
  });
});

describe("carrossel so com as Disponiveis", () => {
  it("idsEmQueParticipo junta os links e os cupons; uma carga falha sozinha", async () => {
    const meu = jest.fn().mockResolvedValue({ ...MEU, campaigns: [participa("a")] });
    const cupons = jest.fn().mockResolvedValue([cupom("d")]);
    await expect(idsEmQueParticipo(meu, cupons)).resolves.toEqual(["a", "d"]);
    await expect(idsEmQueParticipo(jest.fn().mockRejectedValue(new Error("x")), cupons)).resolves.toEqual(["d"]);
    await expect(idsEmQueParticipo(jest.fn().mockResolvedValue(MEU), jest.fn().mockRejectedValue(new Error("x")))).resolves.toEqual([]);
  });

  it("soDisponiveis tira as que ja participa e as encerradas", () => {
    const noAr = [link("a"), link("b"), cupom("d"), link("fim", { ends_at: "2026-10-01T00:00:00-03:00" })];
    expect(soDisponiveis(noAr, ["a", "d"], AGORA).map((c) => c.id)).toEqual(["b"]);
  });
});
