import { render, fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { Aparencia } from "../Aparencia";
import { useFonteStore } from "@store/fonte.store";
import { useTemaStore } from "@store/tema.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));
const mockAvisar = jest.fn(async () => undefined);
jest.mock("@lib/confirmar", () => ({ avisar: (...a: unknown[]) => mockAvisar(...(a as [])) }));
// A liberacao do escuro (src/theme/liberacao.ts) e lida a cada uso.
let mockLiberado = false;
jest.mock("@theme/liberacao", () => ({
  get ESCURO_LIBERADO() {
    return mockLiberado;
  },
}));

// "Aparencia" igual ao Client (4cb0c205): o tamanho so vale no Salvar.
describe("Aparencia", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLiberado = false;
    useFonteStore.setState({ passo: 0 });
    useTemaStore.setState({ preferencia: "claro", restaurado: true });
  });

  it("com o escuro ainda nao liberado: tema claro e o aviso de que chega em breve", () => {
    render(<Aparencia />);
    expect(screen.getByLabelText("Tema: Claro")).toBeTruthy();
    fireEvent.press(screen.getByTestId("aparencia-tema"));
    expect(mockAvisar).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Tema escuro" }));
    expect(screen.queryByTestId("janela-do-tema")).toBeNull();
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

  describe("com o escuro liberado", () => {
    beforeEach(() => {
      mockLiberado = true;
    });

    it("o Tema abre uma janela com Claro, Escuro e Automatico, e o claro vem marcado", () => {
      render(<Aparencia />);
      fireEvent.press(screen.getByTestId("aparencia-tema"));
      expect(mockAvisar).not.toHaveBeenCalled();
      expect(screen.getByTestId("janela-do-tema")).toBeTruthy();
      expect(screen.getByLabelText("Tema Claro").props.accessibilityState).toEqual({ selected: true });
      expect(screen.getByLabelText("Tema Escuro").props.accessibilityState).toEqual({ selected: false });
      expect(screen.getByLabelText("Tema Automático")).toBeTruthy();
    });

    it("so vale no Salvar: guarda no aparelho e a linha passa a mostrar a escolha", async () => {
      render(<Aparencia />);
      fireEvent.press(screen.getByTestId("aparencia-tema"));
      fireEvent.press(screen.getByTestId("tema-escuro"));
      expect(useTemaStore.getState().preferencia).toBe("claro");
      fireEvent.press(screen.getByTestId("salvar-tema"));
      await waitFor(() => expect(useTemaStore.getState().preferencia).toBe("escuro"));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith("vupth_tema", "escuro");
      expect(screen.getByLabelText("Tema: Escuro")).toBeTruthy();
    });

    it("Automatico tambem se escolhe", async () => {
      render(<Aparencia />);
      fireEvent.press(screen.getByTestId("aparencia-tema"));
      fireEvent.press(screen.getByTestId("tema-automatico"));
      fireEvent.press(screen.getByTestId("salvar-tema"));
      await waitFor(() => expect(useTemaStore.getState().preferencia).toBe("automatico"));
      expect(screen.getByLabelText("Tema: Automático")).toBeTruthy();
    });

    it("Cancelar nao muda o tema, e a janela reabre na escolha de agora", () => {
      useTemaStore.setState({ preferencia: "escuro" });
      render(<Aparencia />);
      fireEvent.press(screen.getByTestId("aparencia-tema"));
      fireEvent.press(screen.getByTestId("tema-claro"));
      fireEvent.press(screen.getByLabelText("Cancelar"));
      expect(useTemaStore.getState().preferencia).toBe("escuro");
      fireEvent.press(screen.getByTestId("aparencia-tema"));
      expect(screen.getByLabelText("Tema Escuro").props.accessibilityState).toEqual({ selected: true });
    });

    it("Salvar sem mexer nao grava de novo", () => {
      render(<Aparencia />);
      fireEvent.press(screen.getByTestId("aparencia-tema"));
      fireEvent.press(screen.getByTestId("salvar-tema"));
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });
});
