import { paramsDoHistorico } from "@lib/historicoDoPeriodo";

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
