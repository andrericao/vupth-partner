import { Text } from "react-native";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { ModalBase, ALTURA_MAXIMA_DO_MODAL } from "../ModalBase";

describe("ModalBase", () => {
  it("titulo e corpo rolam; o rodape com os botoes fica fora da rolagem", () => {
    const { getByTestId, getByText } = renderWithProvider(
      <ModalBase visible aoFechar={() => {}} titulo="Titulo" rodape={<Text>Botao</Text>}>
        <Text>Corpo</Text>
      </ModalBase>
    );
    const corpo = getByTestId("modal-corpo");
    expect(corpo).toContainElement(getByText("Titulo"));
    expect(corpo).toContainElement(getByText("Corpo"));
    expect(corpo).not.toContainElement(getByText("Botao"));
    expect(getByTestId("modal-rodape")).toContainElement(getByText("Botao"));
  });

  it("limita a altura a uma fracao da tela", () => {
    expect(ALTURA_MAXIMA_DO_MODAL).toBeGreaterThan(0.5);
    expect(ALTURA_MAXIMA_DO_MODAL).toBeLessThan(1);
    const { getByTestId } = renderWithProvider(
      <ModalBase visible aoFechar={() => {}} titulo="T" testID="cartao" rodape={null} />
    );
    expect(getByTestId("cartao").props.style).toEqual(expect.objectContaining({ maxHeight: expect.any(Number) }));
  });
});
