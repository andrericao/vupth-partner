import { nomeDaEspecialidade } from "@lib/especialidade";

// O codigo cru ("NAIL_TECH") aparecia tambem na aba Filas do dono — mesmo
// defeito que o Andre achou nas Configuracoes (25/09).
describe("nomeDaEspecialidade", () => {
  it.each([
    ["BARBER", "Barbeiro"],
    ["HAIRDRESSER", "Cabeleireiro(a)"],
    ["NAIL_TECH", "Manicure"],
    ["EYEBROW_TECH", "Designer de sobrancelha"],
    ["MASSEUSE", "Massagista"],
    ["ESTHETICIAN", "Esteticista"],
  ])("%s -> %s", (codigo, nome) => {
    expect(nomeDaEspecialidade(codigo)).toBe(nome);
  });

  it("desconhecida ou ausente: vazio (nunca o codigo cru)", () => {
    expect(nomeDaEspecialidade("NOVA_COISA")).toBe("");
    expect(nomeDaEspecialidade(null)).toBe("");
  });
});
