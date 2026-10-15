import { TIPOS_DE_SERVICO, tiposDaEspecialidade, tipoDoServico } from "@lib/tiposDeServico";

// tipo-de-servico-sumiu (PAR-14) e tipo-uma-vez (PAR-15), Andre 15/10.
describe("tiposDeServico", () => {
  it("barbeiro ve os tipos de barbearia", () => {
    const valores = tiposDaEspecialidade("BARBER").map((t) => t.value);
    expect(valores).toEqual(["CORTE_MAQUINA", "CORTE_TESOURA", "BARBA", "SOBRANCELHA", "PINTURA"]);
  });

  it("aceita o codigo com espaco ou minusculo", () => {
    expect(tiposDaEspecialidade(" nail_tech ").map((t) => t.value)).toContain("MANICURE");
  });

  it("aceita o nome do cadastro no lugar do codigo", () => {
    expect(tiposDaEspecialidade("Barbeiro").map((t) => t.value)).toContain("BARBA");
    expect(tiposDaEspecialidade("Cabeleireira").map((t) => t.value)).toContain("ESCOVA");
  });

  it("especialidade fora da lista, vazia ou nula: todos os tipos (a grade nunca fica vazia)", () => {
    expect(tiposDaEspecialidade("Corte")).toBe(TIPOS_DE_SERVICO);
    expect(tiposDaEspecialidade("")).toBe(TIPOS_DE_SERVICO);
    expect(tiposDaEspecialidade(null)).toBe(TIPOS_DE_SERVICO);
    expect(tiposDaEspecialidade(undefined)).toBe(TIPOS_DE_SERVICO);
  });

  it("o tipo escolhido vale; sem escolha, o primeiro da especialidade", () => {
    const tipos = tiposDaEspecialidade("NAIL_TECH");
    expect(tipoDoServico(tipos, "PEDICURE")).toBe("PEDICURE");
    expect(tipoDoServico(tipos, "")).toBe("MANICURE");
    expect(tipoDoServico(tipos, null)).toBe("MANICURE");
    expect(tipoDoServico(tipos, "BARBA")).toBe("MANICURE");
  });

  it("lista vazia: o primeiro de todos", () => {
    expect(tipoDoServico([], undefined)).toBe("CORTE_MAQUINA");
  });
});
