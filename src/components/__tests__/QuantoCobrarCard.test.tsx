import { MOSTRAR_QUANTO_COBRAR } from "../QuantoCobrarCard";

// ocultar-quanto-cobrar-relatorios (Andre, 24/10): o cartao fica escondido em Relatorios.
describe("QuantoCobrarCard", () => {
  it("esta escondido (a flag liga de volta; a calculadora segue no codigo)", () => {
    expect(MOSTRAR_QUANTO_COBRAR).toBe(false);
  });
});
