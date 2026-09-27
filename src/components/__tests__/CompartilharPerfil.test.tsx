import { render, fireEvent, screen } from "@testing-library/react-native";
import { CompartilharPerfil } from "../CompartilharPerfil";

const mockCompartilhar = jest.fn(async () => undefined);
const mockCopiar = jest.fn(async () => undefined);
jest.mock("@lib/compartilharComAviso", () => ({
  compartilharComAviso: (...a: unknown[]) => mockCompartilhar(...(a as [])),
}));
jest.mock("@lib/copiar", () => ({ copiarComAviso: (...a: unknown[]) => mockCopiar(...(a as [])) }));

// Compartilhar + copiar lado a lado (Andre, 26/09).
describe("CompartilharPerfil", () => {
  it("o botao compartilha e o icone ao lado copia o mesmo link", () => {
    render(<CompartilharPerfil link="https://x/loja/1" titulo="Loja" mensagem="Entre:" />);
    fireEvent.press(screen.getByLabelText("Compartilhar perfil"));
    expect(mockCompartilhar).toHaveBeenCalledWith("https://x/loja/1", { titulo: "Loja", mensagem: "Entre:" });
    fireEvent.press(screen.getByLabelText("Copiar link"));
    expect(mockCopiar).toHaveBeenCalledWith("https://x/loja/1", "Link");
  });
});
