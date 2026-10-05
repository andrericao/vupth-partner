import { render, fireEvent, screen } from "@testing-library/react-native";
import { CompartilharNoTopo } from "../CompartilharNoTopo";

const mockCompartilhar = jest.fn(async () => undefined);
jest.mock("@lib/compartilharComAviso", () => ({
  compartilharComAviso: (...a: unknown[]) => mockCompartilhar(...(a as [])),
}));

// compartilhar-no-topo (Andre, 05/10): o icone no canto direito do cabecalho.
describe("CompartilharNoTopo", () => {
  it("compartilha o link com o titulo e a mensagem", () => {
    render(
      <CompartilharNoTopo
        link="https://x/loja/1"
        titulo="Loja"
        mensagem="Conheça a Loja no VUPTH:"
        rotulo="Compartilhar a loja"
      />
    );
    fireEvent.press(screen.getByLabelText("Compartilhar a loja"));
    expect(mockCompartilhar).toHaveBeenCalledWith("https://x/loja/1", {
      titulo: "Loja",
      mensagem: "Conheça a Loja no VUPTH:",
    });
    expect(screen.getByTestId("compartilhar-no-topo")).toBeTruthy();
  });
});
