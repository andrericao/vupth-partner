import { rotuloDoMes } from "../mesDaAgenda";

describe("rotuloDoMes", () => {
  it("um mes so", () => {
    expect(rotuloDoMes(["2026-11-02", "2026-11-30"])).toBe("Novembro de 2026");
  });
  it("dois meses do mesmo ano", () => {
    expect(rotuloDoMes(["2026-11-20", "2026-12-05"])).toBe("Novembro e dezembro de 2026");
  });
  it("virada de ano", () => {
    expect(rotuloDoMes(["2027-01-03", "2026-12-20"])).toBe("Dezembro de 2026 e janeiro de 2027");
  });
  it("sem dias, sem rotulo", () => {
    expect(rotuloDoMes([])).toBeNull();
  });
});
