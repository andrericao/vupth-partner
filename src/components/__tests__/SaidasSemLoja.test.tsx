import { fireEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { renderWithProvider as render } from "../../test-utils/renderWithProvider";
import { SaidasSemLoja } from "../SaidasSemLoja";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
const mockLogout = jest.fn(async () => {});
jest.mock("@store/auth.store", () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ logout: mockLogout }),
}));
const mockConfirmar = jest.fn(async (_o?: unknown) => true);
jest.mock("@lib/confirmar", () => ({ confirmar: (o: unknown) => mockConfirmar(o) }));

describe("SaidasSemLoja (sem-loja-tela-de-saida, DEC-173)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Entrar em uma loja e Dados pessoais levam as telas certas", () => {
    const { getByTestId } = render(<SaidasSemLoja />);
    fireEvent.press(getByTestId("sem-loja-entrar"));
    expect(router.push).toHaveBeenCalledWith("/(professional)/find-establishment");
    fireEvent.press(getByTestId("sem-loja-dados"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/(professional)/settings-account", params: { from: "owner" } });
  });

  it("Sair confirma, desconecta e volta a entrada", async () => {
    const { getByTestId } = render(<SaidasSemLoja />);
    fireEvent.press(getByTestId("sem-loja-sair"));
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    expect(router.replace).toHaveBeenCalledWith("/(auth)");
  });

  it("Sair cancelado nao desconecta", async () => {
    mockConfirmar.mockResolvedValueOnce(false);
    const { getByTestId } = render(<SaidasSemLoja />);
    fireEvent.press(getByTestId("sem-loja-sair"));
    await waitFor(() => expect(mockConfirmar).toHaveBeenCalled());
    expect(mockLogout).not.toHaveBeenCalled();
  });
});
