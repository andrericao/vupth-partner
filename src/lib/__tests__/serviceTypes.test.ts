import { serviceTypeLabel } from "../serviceTypes";

describe("serviceTypeLabel", () => {
  it("traduz o enum do backend para o rotulo em portugues", () => {
    expect(serviceTypeLabel("BARBER")).toBe("Barbearia");
    expect(serviceTypeLabel("BEAUTY_SALON")).toBe("Salão de Beleza");
    expect(serviceTypeLabel("NAIL_SALON")).toBe("Manicure / Pedicure");
    expect(serviceTypeLabel("EYEBROW")).toBe("Sobrancelha");
    expect(serviceTypeLabel("SPA")).toBe("SPA");
    expect(serviceTypeLabel("CLINIC")).toBe("Clínica");
  });

  it("enum desconhecido cai no proprio valor (nunca fica em branco)", () => {
    expect(serviceTypeLabel("PET_SHOP")).toBe("PET_SHOP");
  });

  it("vazio/nulo/indefinido vira string vazia", () => {
    expect(serviceTypeLabel("")).toBe("");
    expect(serviceTypeLabel(null)).toBe("");
    expect(serviceTypeLabel(undefined)).toBe("");
  });
});
