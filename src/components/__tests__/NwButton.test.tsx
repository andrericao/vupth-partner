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
});
