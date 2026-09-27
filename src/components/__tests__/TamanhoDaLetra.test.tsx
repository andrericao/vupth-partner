import { render, fireEvent, screen } from "@testing-library/react-native";
import { TamanhoDaLetra } from "../TamanhoDaLetra";
import { useFonteStore } from "@store/fonte.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));

describe("TamanhoDaLetra", () => {
  beforeEach(() => useFonteStore.setState({ passo: 0 }));

  it("mostra os cinco passos com o atual marcado e troca ao tocar", () => {
    render(<TamanhoDaLetra />);
    expect(screen.getByTestId("fonte-0").props.accessibilityState.selected).toBe(true);
    fireEvent.press(screen.getByLabelText("Tamanho da letra +2"));
    expect(useFonteStore.getState().passo).toBe(2);
  });
});
