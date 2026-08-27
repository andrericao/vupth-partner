import { render, fireEvent } from "@testing-library/react-native";
import { NwButton } from "../nw/Button";

// Primitiva NativeWind — nao precisa do GluestackUIProvider (RN puro + className).
describe("NwButton (primitiva NativeWind)", () => {
  it("mostra o titulo e dispara onPress", () => {
    const onPress = jest.fn();
    const view = render(<NwButton title="Salvar" onPress={onPress} />);
    fireEvent.press(view.getByText("Salvar"));
    expect(onPress).toHaveBeenCalled();
  });

  it("isLoading esconde o titulo e desabilita o toque", () => {
    const onPress = jest.fn();
    const view = render(<NwButton title="Salvar" isLoading onPress={onPress} />);
    expect(view.queryByText("Salvar")).toBeNull();
    // disabled: o press nao dispara.
    fireEvent.press(view.getByLabelText("Salvar"));
    expect(onPress).not.toHaveBeenCalled();
  });

  // [marca-vupth] Variantes da identidade nova (design/marca-dev). Entraram
  // SEM teste; sao o par claro brandGreen+forest, que so pode existir nelas.
  it.each(["vupthPrimary", "vupthSecondary", "vupthOutline"] as const)(
    "renderiza a variante %s e dispara onPress",
    (variant) => {
      const onPress = jest.fn();
      const view = render(<NwButton title="Acao" variant={variant} onPress={onPress} />);

      expect(view.getByText("Acao")).toBeTruthy();
      fireEvent.press(view.getByText("Acao"));
      expect(onPress).toHaveBeenCalledTimes(1);
    }
  );

  it("as variantes antigas continuam existindo (a marca nova nao as substituiu)", () => {
    // A adocao e tela por tela: se alguem remover uma variante v1, as telas que
    // ainda a usam quebram calado (o TS pega o nome, nao o visual).
    for (const variant of ["primary", "secondary", "danger", "outlineBrand", "outlineDanger"] as const) {
      const view = render(<NwButton title={variant} variant={variant} />);
      expect(view.getByText(variant)).toBeTruthy();
    }
  });
});
