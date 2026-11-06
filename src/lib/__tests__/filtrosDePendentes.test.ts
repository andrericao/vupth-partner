import {
  noPeriodo,
  filtrarPendentes,
  textoDoResumo,
  resumosPorCampanha,
  resumoDaCampanhaDe,
  diaCurto,
} from "../filtrosDePendentes";
import type { PremioDeIndicacao } from "../premios";
import type { PagamentoPendente } from "../pagamento";

jest.mock("@lib/api", () => ({ api: { get: jest.fn(), post: jest.fn() } }));

// premio-em-pendentes, opcao a (Andre, 05/11): filtros por tipo e periodo, e o resumo.
const AGORA = new Date(2026, 10, 5, 15, 0);
const dias = (n: number) => new Date(2026, 10, 5 - n, 10, 0).toISOString();
const pag = (id: string, quando: string | null): PagamentoPendente => ({
  attendance_id: id,
  status: "PENDING",
  amount: 40,
  client_name: "Bia",
  finished_at: quando,
  claimed_at: null,
});
const premio = (id: string, quando: string | null, extra: Partial<PremioDeIndicacao> = {}): PremioDeIndicacao => ({
  credit_id: id,
  campaign_id: "c1",
  campaign_name: "Teste de Lançamento",
  amount: 5,
  finished_at: quando,
  status: "LOCKED",
  ...extra,
});

describe("noPeriodo", () => {
  it("Hoje, 7 dias e 30 dias contam dias do calendario, com hoje", () => {
    expect(noPeriodo(dias(0), "HOJE", AGORA)).toBe(true);
    expect(noPeriodo(dias(1), "HOJE", AGORA)).toBe(false);
    expect(noPeriodo(dias(6), "SEMANA", AGORA)).toBe(true);
    expect(noPeriodo(dias(7), "SEMANA", AGORA)).toBe(false);
    expect(noPeriodo(dias(29), "MES", AGORA)).toBe(true);
    expect(noPeriodo(dias(30), "MES", AGORA)).toBe(false);
  });

  it("sem data (ou data ruim) so entra em Tudo", () => {
    expect(noPeriodo(null, "TUDO", AGORA)).toBe(true);
    expect(noPeriodo(null, "HOJE", AGORA)).toBe(false);
    expect(noPeriodo("lixo", "MES", AGORA)).toBe(false);
  });
});

describe("filtrarPendentes", () => {
  const dados = { pagamentos: [pag("a", dias(0)), pag("b", dias(10))], premios: [premio("k1", dias(0)), premio("k2", dias(3))] };

  it("Todos e Tudo: tudo", () => {
    const r = filtrarPendentes(dados, "TODOS", "TUDO", AGORA);
    expect(r.pagamentos).toHaveLength(2);
    expect(r.premios).toHaveLength(2);
  });

  it("Cortes so os pagamentos; Bonificacao so os premios", () => {
    expect(filtrarPendentes(dados, "CORTES", "TUDO", AGORA).premios).toHaveLength(0);
    expect(filtrarPendentes(dados, "BONIFICACAO", "TUDO", AGORA).pagamentos).toHaveLength(0);
  });

  it("o periodo vale para os dois tipos", () => {
    const r = filtrarPendentes(dados, "TODOS", "HOJE", AGORA);
    expect(r.pagamentos.map((p) => p.attendance_id)).toEqual(["a"]);
    expect(r.premios.map((p) => p.credit_id)).toEqual(["k1"]);
  });
});

describe("resumo por campanha", () => {
  it("singular e plural", () => {
    expect(textoDoResumo(1, 5)).toBe("1 atendimento gerou R$ 5,00");
    expect(textoDoResumo(3, 15)).toBe("3 atendimentos geraram R$ 15,00");
  });

  it("agrupa pela campanha (id, ou o nome sem id) e soma o valor; valor ruim conta zero", () => {
    const lista = [
      premio("k1", null),
      premio("k2", null, { amount: "5.00" }),
      premio("k3", null, { campaign_id: null, campaign_name: "Sem id", amount: "x" }),
    ];
    expect(resumosPorCampanha(lista)).toEqual([
      { chave: "c1", campanha: "Teste de Lançamento", texto: "2 atendimentos geraram R$ 10,00" },
      { chave: "Sem id", campanha: "Sem id", texto: "1 atendimento gerou R$ 0,00" },
    ]);
    expect(resumoDaCampanhaDe(lista[0], lista)).toBe("2 atendimentos geraram R$ 10,00");
    expect(resumoDaCampanhaDe(premio("fora", null, { campaign_id: "zz" }), lista)).toBe("1 atendimento gerou R$ 5,00");
  });

  it("diaCurto: dd/MM; invalido, null", () => {
    expect(diaCurto(new Date(2026, 10, 5).toISOString())).toBe("05/11");
    expect(diaCurto(null)).toBeNull();
    expect(diaCurto("lixo")).toBeNull();
  });
});
