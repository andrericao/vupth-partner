import { act, fireEvent, render } from "@testing-library/react-native";
import { ReativarContaDoApp } from "../ReativarContaDoApp";
import { useAuthStore } from "@store/auth.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("ReativarContaDoApp", () => {
  it("abre com o aviso do store e o So consultar fecha", () => {
    act(() => useAuthStore.setState({ contaDesativada: true, avisoDeReativar: "boas-vindas" }));
    const { getByText, queryByText } = render(<ReativarContaDoApp />);

    expect(getByText("Bem-vindo de volta")).toBeTruthy();
    fireEvent.press(getByText("Só consultar"));

    expect(useAuthStore.getState().avisoDeReativar).toBeNull();
    expect(useAuthStore.getState().contaDesativada).toBe(true);
    expect(queryByText("Bem-vindo de volta")).toBeNull();
  });
});
