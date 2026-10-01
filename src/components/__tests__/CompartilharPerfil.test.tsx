import { render, fireEvent, screen } from "@testing-library/react-native";
import { CompartilharPerfil } from "../CompartilharPerfil";

const mockCompartilhar = jest.fn(async () => undefined);
jest.mock("@lib/compartilharComAviso", () => ({
  compartilharComAviso: (...a: unknown[]) => mockCompartilhar(...(a as [])),
}));

// So o icone de compartilhar (Andre, 27/09): o menu do sistema ja tem o copiar.
describe("CompartilharPerfil", () => {
  it("um icone so, que compartilha o link", () => {
    render(<CompartilharPerfil link="https://x/loja/1" titulo="Loja" mensagem="Entre:" rotulo="Compartilhar a loja" />);
    expect(screen.queryByLabelText("Copiar link")).toBeNull();
    fireEvent.press(screen.getByLabelText("Compartilhar a loja"));
    expect(mockCompartilhar).toHaveBeenCalledWith("https://x/loja/1", { titulo: "Loja", mensagem: "Entre:" });
  });
});
