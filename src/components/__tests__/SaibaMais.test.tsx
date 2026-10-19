import { Linking } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

import { SaibaMais } from "../SaibaMais";
import { SUPORTE_URL } from "@lib/suporte";

describe("SaibaMais", () => {
  it("é um link com o rótulo Saiba mais e abre o artigo do assunto", () => {
    const abrir = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { getByText, getByTestId } = render(<SaibaMais artigo="conta" />);
    expect(getByText("Saiba mais")).toBeTruthy();
    expect(getByTestId("saiba-mais").props.accessibilityRole).toBe("link");
    fireEvent.press(getByTestId("saiba-mais"));
    expect(abrir).toHaveBeenCalledWith(`${SUPORTE_URL}artigos/parceiro/conta.html`);
    abrir.mockRestore();
  });

  it("aceita um testID próprio (um por cartão, para a bateria achar)", () => {
    const { getByTestId } = render(<SaibaMais artigo="atraso" testID="desativar-saiba-mais" />);
    expect(getByTestId("desativar-saiba-mais")).toBeTruthy();
  });
});
