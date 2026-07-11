import { useUiStore } from "../ui.store";

describe("ui.store — faixa dismissal", () => {
  beforeEach(() => {
    useUiStore.getState().resetFaixa();
  });

  it("comeca visivel (nao dispensada)", () => {
    expect(useUiStore.getState().faixaDismissed).toBe(false);
  });

  it("dismissFaixa marca como dispensada", () => {
    useUiStore.getState().dismissFaixa();
    expect(useUiStore.getState().faixaDismissed).toBe(true);
  });

  it("resetFaixa volta a exibir (simula nova abertura do app)", () => {
    useUiStore.getState().dismissFaixa();
    useUiStore.getState().resetFaixa();
    expect(useUiStore.getState().faixaDismissed).toBe(false);
  });
});
