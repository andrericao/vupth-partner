import { fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { AvisoDeAgenda } from "../AvisoDeAgenda";
import { useUiStore } from "@store/ui.store";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

// avisos-de-agenda-e-solicitacao: o aviso so existe depois do WS AGENDA_RELEASE_PROMPT.
describe("AvisoDeAgenda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUiStore.getState().dismissAvisoDeAgenda();
  });

  it("sem o aviso do Backend, nao aparece", () => {
    const { queryByTestId } = renderWithProvider(<AvisoDeAgenda />);
    expect(queryByTestId("aviso-de-agenda")).toBeNull();
  });

  it("com o aviso, pede para liberar a agenda e pode ser fechado", () => {
    useUiStore.getState().showAvisoDeAgenda();
    const { getByText, getByTestId, queryByTestId } = renderWithProvider(<AvisoDeAgenda />);
    getByText("Libere a sua agenda");
    fireEvent.press(getByTestId("aviso-de-agenda-fechar"));
    expect(queryByTestId("aviso-de-agenda")).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("Abrir a agenda leva a tela da agenda e fecha o aviso", () => {
    useUiStore.getState().showAvisoDeAgenda();
    const { getByTestId, queryByTestId } = renderWithProvider(<AvisoDeAgenda />);
    fireEvent.press(getByTestId("aviso-de-agenda-abrir"));
    expect(router.push).toHaveBeenCalledWith("/(professional)/agenda");
    expect(queryByTestId("aviso-de-agenda")).toBeNull();
  });
});
