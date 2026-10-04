import { paramsDoHistorico, rotuloDoFiltroSemStatus, pertoDoFim } from "@lib/historicoDoPeriodo";

// Desempenho do Meu dia (Andre, 25/09): o historico buscava TODOS os
// atendimentos do profissional, desde sempre, a cada foco da aba. O backend ja
// aceita dateFrom/dateTo no GET /attendances — o historico passa a seguir o
// mesmo periodo do resumo (Hoje por padrao).
describe("paramsDoHistorico", () => {
  const hoje = new Date(2026, 8, 25, 15, 0);

  it("Hoje: so o dia", () => {
    expect(paramsDoHistorico("p1", "ALL", "day", hoje)).toEqual({
      professionalId: "p1",
      dateFrom: "2026-09-25",
      dateTo: "2026-09-25",
    });
  });

  it("Semana e Mes: os mesmos 7 e 30 dias do resumo", () => {
    expect(paramsDoHistorico("p1", "ALL", "week", hoje).dateFrom).toBe("2026-09-19");
    expect(paramsDoHistorico("p1", "ALL", "month", hoje).dateFrom).toBe("2026-08-27");
  });

  it("com filtro de status, o status vai junto", () => {
    expect(paramsDoHistorico("p1", "REMOVED", "day", hoje).status).toBe("REMOVED");
  });
});

// Andre, 26/09: o chip "Todos" ficava marcado e a lista dizia "Nenhum
// atendimento hoje" — "Todos" lia como "desde sempre". O chip sem filtro de
// status passa a dizer o PERIODO que a lista mostra.
describe("rotuloDoFiltroSemStatus", () => {
  it.each([
    ["day", "Hoje"],
    ["week", "7 dias"],
    ["month", "30 dias"],
  ] as const)("%s -> %s", (periodo, rotulo) => {
    expect(rotuloDoFiltroSemStatus(periodo)).toBe(rotulo);
  });
});

// historico-paginado (cefac04): a proxima pagina sai quando faltam menos de
// 400 px para o fim da rolagem.
describe("pertoDoFim", () => {
  const rolagem = (y: number) => ({
    contentOffset: { y },
    layoutMeasurement: { height: 800 },
    contentSize: { height: 3000 },
  });

  it("longe do fim, nao", () => {
    expect(pertoDoFim(rolagem(1000))).toBe(false);
  });

  it("a menos de 400 px do fim, sim", () => {
    expect(pertoDoFim(rolagem(1800))).toBe(true);
    expect(pertoDoFim(rolagem(2200))).toBe(true);
  });
});
