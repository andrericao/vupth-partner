import { FRASES_DA_ABERTURA, fraseDestaAbertura, proximoIndice } from "../frasesDaAbertura";

const mem: Record<string, string> = {};
jest.mock("@lib/armazenamentoOpcional", () => ({
  lerItem: jest.fn(async (k: string) => mem[k] ?? null),
  gravarItem: jest.fn(async (k: string, v: string) => {
    mem[k] = v;
    return true;
  }),
}));

describe("frasesDaAbertura", () => {
  it("a lista tem a frase de teste e so frases curtas", () => {
    expect(FRASES_DA_ABERTURA[0]).toMatch(/Estamos em teste/);
    FRASES_DA_ABERTURA.forEach((f) => expect(f.length).toBeLessThanOrEqual(80));
  });

  it("proximoIndice gira e tolera lixo", () => {
    expect(proximoIndice(null)).toBe(0);
    expect(proximoIndice("x")).toBe(0);
    expect(proximoIndice("-3")).toBe(0);
    expect(proximoIndice("0")).toBe(1);
    expect(proximoIndice(String(FRASES_DA_ABERTURA.length - 1))).toBe(0);
  });

  it("cada abertura mostra a frase seguinte", async () => {
    const a = await fraseDestaAbertura();
    const b = await fraseDestaAbertura();
    expect(a).toBe(FRASES_DA_ABERTURA[0]);
    expect(b).toBe(FRASES_DA_ABERTURA[1]);
  });
});
