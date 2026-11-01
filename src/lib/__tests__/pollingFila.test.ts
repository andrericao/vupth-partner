import { AppState } from "react-native";
import { focusManager } from "@tanstack/react-query";
import { useWsDiagnosticsStore } from "@store/wsDiagnostics.store";
import {
  REDE_DE_SEGURANCA_MS,
  intervaloDaFila,
  intervaloDaFilaAoVivo,
  ligarFocoAoAppState,
} from "../pollingFila";

describe("pollingFila", () => {
  afterEach(() => useWsDiagnosticsStore.getState().reset());

  it("socket conectado: so a rede de seguranca lenta", () => {
    expect(intervaloDaFila(60000, true)).toBe(REDE_DE_SEGURANCA_MS);
  });

  it("socket caido: ritmo normal", () => {
    expect(intervaloDaFila(60000, false)).toBe(60000);
  });

  it("ao vivo: acompanha o estado do socket (caiu -> volta ao normal)", () => {
    const f = intervaloDaFilaAoVivo(15000);
    expect(f()).toBe(15000);
    useWsDiagnosticsStore.getState().markConnected("public");
    expect(f()).toBe(REDE_DE_SEGURANCA_MS);
    useWsDiagnosticsStore.getState().markClosed("public");
    expect(f()).toBe(15000);
  });

  it("saida da conta (reset) volta ao ritmo normal", () => {
    useWsDiagnosticsStore.getState().markConnected("public");
    useWsDiagnosticsStore.getState().reset();
    expect(intervaloDaFilaAoVivo(60000)()).toBe(60000);
  });

  it("foco do react-query segue o AppState e o listener e removido", () => {
    let handler: (s: string) => void = () => {};
    const remove = jest.fn();
    jest.spyOn(AppState, "addEventListener").mockImplementation(((_: string, h: (s: string) => void) => {
      handler = h;
      return { remove };
    }) as never);
    const spy = jest.spyOn(focusManager, "setFocused");
    const off = ligarFocoAoAppState();
    handler("background");
    expect(spy).toHaveBeenLastCalledWith(false);
    handler("active");
    expect(spy).toHaveBeenLastCalledWith(true);
    off();
    expect(remove).toHaveBeenCalled();
  });
});
