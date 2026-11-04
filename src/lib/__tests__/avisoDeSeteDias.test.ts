import { avisoDeSeteDias } from "../gateway";
import { ehContaIncompleta, levarSeContaIncompleta } from "../contaIncompleta";
import { router } from "expo-router";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

describe("avisoDeSeteDias (DEC-163)", () => {
  const gw = { connected: false, notice: { opened_at: "2026-11-10T10:00:00", changes_at: "2026-11-17T10:00:00" } };

  it("mostra a data da virada enquanto o prazo corre e o CPF nao foi informado", () => {
    expect(avisoDeSeteDias(gw, false)).toBe("Pagamentos pelo app a partir de 17/11. Informe seu CPF em Configurações.");
  });

  it("some com CPF informado, sem notice ou com data invalida", () => {
    expect(avisoDeSeteDias(gw, true)).toBeNull();
    expect(avisoDeSeteDias({ connected: true, notice: null }, false)).toBeNull();
    expect(avisoDeSeteDias(null, false)).toBeNull();
    expect(avisoDeSeteDias({ connected: false, notice: { changes_at: "lixo" } }, false)).toBeNull();
  });
});

describe("contaIncompleta (422 ACCOUNT_INCOMPLETE)", () => {
  const erro = { response: { status: 422, data: { code: "ACCOUNT_INCOMPLETE" } } };

  it("so reconhece o 422 desse codigo", () => {
    expect(ehContaIncompleta(erro)).toBe(true);
    expect(ehContaIncompleta({ response: { status: 422, data: { code: "OUTRO" } } })).toBe(false);
    expect(ehContaIncompleta({ response: { status: 409, data: { code: "ACCOUNT_INCOMPLETE" } } })).toBe(false);
    expect(ehContaIncompleta(null)).toBe(false);
  });

  it("leva as Configuracoes com o aviso; outro erro nao navega", () => {
    expect(levarSeContaIncompleta(erro)).toBe(true);
    expect(router.push).toHaveBeenCalledWith({ pathname: "/(professional)/settings-account", params: { aviso: "conta-incompleta" } });
    (router.push as jest.Mock).mockClear();
    expect(levarSeContaIncompleta({ response: { status: 500 } })).toBe(false);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("navegador indisponivel nao lanca", () => {
    (router.push as jest.Mock).mockImplementationOnce(() => {
      throw new Error("sem navegador");
    });
    expect(levarSeContaIncompleta(erro)).toBe(true);
  });
});
