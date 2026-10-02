import { render, fireEvent, screen } from "@testing-library/react-native";
import { Aparencia } from "../Aparencia";
import { useFonteStore } from "@store/fonte.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));
const mockAvisar = jest.fn(async () => undefined);
jest.mock("@lib/confirmar", () => ({ avisar: (...a: unknown[]) => mockAvisar(...(a as [])) }));

// "Aparencia" igual ao Client (4cb0c205): o tamanho so vale no Salvar.
describe("Aparencia", () => {
  beforeEach(() => useFonteStore.setState({ passo: 0 }));

  it("tema claro; o escuro avisa que chega em breve", () => {
    render(<Aparencia />);
    fireEvent.press(screen.getByTestId("aparencia-tema"));
    expect(mockAvisar).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Tema escuro" }));
  });

  it("a janela mostra a demonstracao no tamanho escolhido, e so salva no Salvar", () => {
    render(<Aparencia />);
    fireEvent.press(screen.getByTestId("aparencia-fonte"));
    fireEvent.press(screen.getByLabelText("Tamanho +3"));
    expect(screen.getByTestId("amostra-titulo").props.style).toEqual(expect.objectContaining({ fontSize: 21 }));
    expect(useFonteStore.getState().passo).toBe(0);
    fireEvent.press(screen.getByTestId("salvar-fonte"));
    expect(useFonteStore.getState().passo).toBe(3);
  });

  it("Cancelar nao muda nada", () => {
    render(<Aparencia />);
    fireEvent.press(screen.getByTestId("aparencia-fonte"));
    fireEvent.press(screen.getByLabelText("Tamanho +4"));
    fireEvent.press(screen.getByLabelText("Cancelar"));
    expect(useFonteStore.getState().passo).toBe(0);
  });
});
