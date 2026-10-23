import { ESCURO_LIBERADO } from "../liberacao";

describe("liberacao do escuro", () => {
  it("o escuro esta liberado na escolha de Aparencia", () => {
    expect(ESCURO_LIBERADO).toBe(true);
  });
});
