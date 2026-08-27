import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { ClosingPrompt } from "../ClosingPrompt";
import { useUiStore } from "@store/ui.store";
import { useProfessionalStore } from "@store/professional.store";

// graceUntil bem no futuro p/ o countdown ficar > 0 (sem auto-dismiss no mount).
const FUTURE = () => new Date(Date.now() + 14 * 60 * 1000).toISOString();

describe("ClosingPrompt (auto-fechamento — CLOSING_PROMPT)", () => {
  beforeEach(() => {
    useUiStore.getState().dismissClosingPrompt();
    useProfessionalStore.setState({ updateMyStatus: jest.fn().mockResolvedValue(undefined) });
  });

  it("com prompt ativo, mostra o aviso e as duas ações", () => {
    useUiStore.getState().showClosingPrompt(FUTURE());
    const view = renderWithProvider(<ClosingPrompt />);
    expect(view.getByText(/Passou do horário de fechamento/)).toBeTruthy();
    expect(view.getByText("Fechar agora")).toBeTruthy();
    expect(view.getByText("Continuar atendendo")).toBeTruthy();
  });

  it("'Continuar atendendo' apenas dispensa (segue drenando)", () => {
    useUiStore.getState().showClosingPrompt(FUTURE());
    const view = renderWithProvider(<ClosingPrompt />);
    fireEvent.press(view.getByText("Continuar atendendo"));
    expect(useUiStore.getState().closingGraceUntil).toBeNull();
  });

  it("'Fechar agora' chama updateMyStatus('OFF') e dispensa", async () => {
    const off = jest.fn().mockResolvedValue(undefined);
    useProfessionalStore.setState({ updateMyStatus: off });
    useUiStore.getState().showClosingPrompt(FUTURE());
    const view = renderWithProvider(<ClosingPrompt />);
    fireEvent.press(view.getByText("Fechar agora"));
    await waitFor(() => expect(off).toHaveBeenCalledWith("OFF"));
    await waitFor(() => expect(useUiStore.getState().closingGraceUntil).toBeNull());
  });
});
