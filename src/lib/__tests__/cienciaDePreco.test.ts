import { precisaDeCiencia, prazoDaCiencia, type PoliticaDePreco } from "../cienciaDePreco";

const p = (o: Partial<PoliticaDePreco>): PoliticaDePreco => ({ version: 3, acknowledged: false, noticed_at: "2026-10-23T10:00:00Z", ...o });

describe("cienciaDePreco", () => {
  it("so pede ciencia de quem foi avisado e ainda nao deu", () => {
    expect(precisaDeCiencia(null)).toBe(false);
    expect(precisaDeCiencia(p({ acknowledged: true }))).toBe(false);
    expect(precisaDeCiencia(p({ noticed_at: null }))).toBe(false);
    expect(precisaDeCiencia(p({}))).toBe(true);
  });

  it("o prazo em uma frase", () => {
    expect(prazoDaCiencia(p({ days_left: 5 }))).toBe("Faltam 5 dias para dar ciência");
    expect(prazoDaCiencia(p({ days_left: 1 }))).toBe("Falta 1 dia para dar ciência");
    expect(prazoDaCiencia(p({ days_left: 0 }))).toBe("Último dia para dar ciência");
    expect(prazoDaCiencia(p({ blocked: true, days_left: 0 }))).toMatch(/bloqueadas/);
    expect(prazoDaCiencia(p({ acknowledged: true }))).toBeNull();
    expect(prazoDaCiencia(null)).toBeNull();
  });
});
