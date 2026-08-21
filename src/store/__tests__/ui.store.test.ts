import { useUiStore } from "../ui.store";

describe("ui.store — faixa dismissal", () => {
  beforeEach(() => {
    useUiStore.getState().resetFaixa();
  });

  it("comeca visivel (não dispensada)", () => {
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

describe("ui.store — prompt de auto-fechamento (CLOSING_PROMPT)", () => {
  beforeEach(() => {
    useUiStore.getState().dismissClosingPrompt();
  });

  it("comeca sem prompt ativo", () => {
    expect(useUiStore.getState().closingGraceUntil).toBeNull();
  });

  it("showClosingPrompt guarda o graceUntil", () => {
    useUiStore.getState().showClosingPrompt("2026-07-25T20:15:00-03:00");
    expect(useUiStore.getState().closingGraceUntil).toBe("2026-07-25T20:15:00-03:00");
  });

  it("dismissClosingPrompt limpa o prompt", () => {
    useUiStore.getState().showClosingPrompt("2026-07-25T20:15:00-03:00");
    useUiStore.getState().dismissClosingPrompt();
    expect(useUiStore.getState().closingGraceUntil).toBeNull();
  });
});
