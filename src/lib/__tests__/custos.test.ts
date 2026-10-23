import * as SecureStore from "expo-secure-store";
import {
  calcularCustos,
  faltaParaSugerido,
  explicacaoDaConta,
  lerCustos,
  salvarCustos,
  PADRAO_DE_CUSTOS,
} from "@lib/custos";

jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

// aba-de-custos (desenho da Design): os numeros do exemplo.
const EXEMPLO = { fixos: 1800, dias: 22, cortesPorDia: 8, custoPorCorte: 4, ganho: 4000 };

describe("custos", () => {
  afterEach(() => jest.clearAllMocks());

  it("a conta do exemplo da Design: 176 cortes, minimo R$ 14, sugerido R$ 37", () => {
    const r = calcularCustos(EXEMPLO)!;
    expect(r.cortesNoMes).toBe(176);
    expect(r.minimo).toBe(14);
    expect(r.sugerido).toBe(37);
    expect(r.sobraPct).toBe(62);
  });

  it("sem dias ou sem cortes, nao ha conta", () => {
    expect(calcularCustos({ ...EXEMPLO, dias: 0 })).toBeNull();
    expect(calcularCustos({ ...EXEMPLO, cortesPorDia: 0 })).toBeNull();
  });

  it("sem nada a pagar nem ganhar, o sugerido e so o custo do corte", () => {
    const r = calcularCustos({ ...PADRAO_DE_CUSTOS, custoPorCorte: 0 })!;
    expect(r.sugerido).toBe(0);
    expect(r.sobraPct).toBe(0);
  });

  it("quanto falta para o sugerido, so quando o preco esta abaixo", () => {
    expect(faltaParaSugerido(35, 37)).toBe(2);
    expect(faltaParaSugerido(37, 37)).toBeNull();
    expect(faltaParaSugerido(55, 37)).toBeNull();
  });

  it("o Saiba mais explica a conta com os numeros da pessoa", () => {
    const linhas = explicacaoDaConta(calcularCustos(EXEMPLO)!, EXEMPLO);
    expect(linhas).toHaveLength(4);
    expect(linhas[0]).toContain("R$ 1.800,00 de custo fixo ÷ 176 cortes");
    expect(linhas[3]).toContain("sugerido de R$ 37,00");
    expect(linhas[3]).toContain("62%");
  });

  it("guarda e le o ultimo calculo; sem nada ou com lixo, o padrao", async () => {
    await salvarCustos(EXEMPLO);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("custos_calculo", JSON.stringify(EXEMPLO));
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(EXEMPLO));
    await expect(lerCustos()).resolves.toEqual(EXEMPLO);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    await expect(lerCustos()).resolves.toEqual(PADRAO_DE_CUSTOS);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce("{lixo");
    await expect(lerCustos()).resolves.toEqual(PADRAO_DE_CUSTOS);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify({ fixos: -1, dias: "x" }));
    await expect(lerCustos()).resolves.toEqual(PADRAO_DE_CUSTOS);
  });

  it("falha ao guardar nao derruba o calculo", async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error("sem espaco"));
    await expect(salvarCustos(EXEMPLO)).resolves.toBeUndefined();
  });
});
