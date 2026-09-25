import { seloDoStatus } from "@lib/statusAtendimento";

// Contrato novo do backend (decisão do Andre, 18/09): REMOVED = a LOJA tirou o
// cliente da fila; CANCELLED = o CLIENTE desistiu. O backend segurou o deploy
// até os fronts aceitarem o valor: "se houver switch/if por status sem ramo
// padrão, ele cai em texto cru na tela".
describe("seloDoStatus", () => {
  it("REMOVED tem rótulo próprio — a loja retirou", () => {
    expect(seloDoStatus("REMOVED").label).toBe("Retirado");
  });

  it("CANCELLED continua 'Cancelado' — linhas antigas não dizem quem saiu", () => {
    // O backend não reconstrói o passado: o que era CANCELLED antes de 18/09
    // pode ter sido a loja ou o cliente. Chamar de "desistiu" mentiria.
    expect(seloDoStatus("CANCELLED").label).toBe("Cancelado");
  });

  it("retirado e cancelado não usam a mesma cor", () => {
    expect(seloDoStatus("REMOVED").selo).not.toBe(seloDoStatus("CANCELLED").selo);
  });

  it.each(["FINISHED", "IN_PROGRESS", "PAUSED", "SCHEDULED", "LATE"])("%s tem rótulo em português", (st) => {
    expect(seloDoStatus(st).label).not.toBe(st);
  });

  it("status desconhecido NUNCA aparece cru na tela", () => {
    const s = seloDoStatus("ALGO_NOVO");
    expect(s.label).not.toContain("ALGO_NOVO");
    expect(s.label.length).toBeGreaterThan(0);
  });
});
