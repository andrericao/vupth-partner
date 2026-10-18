import {
  agruparPor,
  caminhoDoRelatorio,
  dataBrParaIso,
  diaMes,
  intervaloDasLojas,
  reais,
} from "@lib/relatorioDasLojas";

const vazio = { de: "", ate: "" };
const agora = new Date(2026, 9, 17, 12, 0, 0); // 17/10/2026

describe("relatorioDasLojas", () => {
  it("Hoje, 7 dias, 30 dias e Mes", () => {
    expect(intervaloDasLojas("hoje", vazio, agora)).toEqual({ dateFrom: "2026-10-17", dateTo: "2026-10-17" });
    expect(intervaloDasLojas("7dias", vazio, agora)).toEqual({ dateFrom: "2026-10-11", dateTo: "2026-10-17" });
    expect(intervaloDasLojas("30dias", vazio, agora)).toEqual({ dateFrom: "2026-09-18", dateTo: "2026-10-17" });
    expect(intervaloDasLojas("mes", vazio, agora)).toEqual({ dateFrom: "2026-10-01", dateTo: "2026-10-17" });
  });

  it("personalizado: valido, invertido e incompleto", () => {
    expect(intervaloDasLojas("custom", { de: "01/10/2026", ate: "15/10/2026" }, agora)).toEqual({
      dateFrom: "2026-10-01",
      dateTo: "2026-10-15",
    });
    expect(intervaloDasLojas("custom", { de: "15/10/2026", ate: "01/10/2026" }, agora)).toBeNull();
    expect(intervaloDasLojas("custom", vazio, agora)).toBeNull();
  });

  it("data brasileira: rejeita formato errado e dia que nao existe", () => {
    expect(dataBrParaIso("31/02/2026")).toBeNull();
    expect(dataBrParaIso("2026-10-01")).toBeNull();
    expect(dataBrParaIso(" 05/03/2026 ")).toBe("2026-03-05");
  });

  it("agrupa por dia, semana ou mes conforme o tamanho", () => {
    expect(agruparPor("2026-10-01", "2026-10-31")).toBe("day");
    expect(agruparPor("2026-09-01", "2026-10-31")).toBe("week");
    expect(agruparPor("2026-01-01", "2026-10-31")).toBe("month");
  });

  it("o caminho leva a loja so quando escolhida", () => {
    expect(caminhoDoRelatorio("2026-10-01", "2026-10-07", null)).toBe(
      "/owner/me/reports?dateFrom=2026-10-01&dateTo=2026-10-07&groupBy=day",
    );
    expect(caminhoDoRelatorio("2026-10-01", "2026-10-07", "abc")).toContain("&establishmentId=abc");
  });

  it("formata dia e dinheiro", () => {
    expect(diaMes("2026-10-17")).toBe("17/10");
    expect(reais(12.5)).toBe("R$ 12.50");
    expect(reais(null)).toBe("R$ 0.00");
  });
});

describe("motivos do nao realizado (DEC-83)", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { motivoNaoRealizado, observacaoDoAtendimento } = require("@lib/statusAtendimento");

  it("so os tres motivos aparecem; o desconhecido some", () => {
    expect(motivoNaoRealizado("CLIENT_CANCELLED")).toBe("Cliente cancelou");
    expect(motivoNaoRealizado("PROFESSIONAL_REMOVED")).toBe("Profissional removeu o cliente");
    expect(motivoNaoRealizado("REMOVED_FOR_LATENESS")).toBe("Cliente removido por atraso");
    expect(motivoNaoRealizado("OUTRO")).toBeNull();
    expect(motivoNaoRealizado(null)).toBeNull();
  });

  it("concluido com atraso diz que teve atraso; sem nada, nao diz nada", () => {
    expect(observacaoDoAtendimento({ late_arrival: true })).toBe("Teve atraso");
    expect(observacaoDoAtendimento({ not_realized_reason: "CLIENT_CANCELLED" })).toBe("Cliente cancelou");
    expect(observacaoDoAtendimento({})).toBeNull();
  });
});
