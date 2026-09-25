import { mascaraMinutos, lerMinutos, MINUTOS_PADRAO } from "@lib/tempoDoServico";

// Editar o tempo de cada servico (fila do partner, 25/09). O backend ja aceita
// `estimatedMinutes` no POST e no PATCH e usa o valor na previsao da fila; sem
// ele, grava 30. O app nunca enviava — todo servico ficava com 30 min.
describe("tempo do servico", () => {
  it("o padrao e o mesmo do backend (30)", () => {
    expect(MINUTOS_PADRAO).toBe(30);
  });

  it("mascara: so digitos, ate 3", () => {
    expect(mascaraMinutos("4a5")).toBe("45");
    expect(mascaraMinutos("12345")).toBe("123");
  });

  it("le minutos de 5 a 480", () => {
    expect(lerMinutos("45")).toBe(45);
    expect(lerMinutos("5")).toBe(5);
    expect(lerMinutos("480")).toBe(480);
  });

  it("fora da faixa ou vazio: null", () => {
    expect(lerMinutos("")).toBeNull();
    expect(lerMinutos("4")).toBeNull();
    expect(lerMinutos("481")).toBeNull();
    expect(lerMinutos("0")).toBeNull();
  });
});
