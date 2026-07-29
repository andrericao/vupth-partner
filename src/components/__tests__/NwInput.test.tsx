import { render, fireEvent } from "@testing-library/react-native";
import { NwInput } from "../nw/Input";

// Primitiva NativeWind — nao precisa do GluestackUIProvider (RN puro + className).
describe("NwInput (primitiva NativeWind)", () => {
  it("mostra o label e propaga a digitacao", () => {
    const onChangeText = jest.fn();
    const view = render(
      <NwInput label="E-mail" placeholder="email@email.com" onChangeText={onChangeText} />
    );
    expect(view.getByText("E-mail")).toBeTruthy();
    fireEvent.changeText(view.getByPlaceholderText("email@email.com"), "a@b.com");
    expect(onChangeText).toHaveBeenCalledWith("a@b.com");
  });

  it("so mostra a mensagem quando `error` vem preenchido", () => {
    const view = render(<NwInput label="E-mail" error="" />);
    expect(view.queryByText("E-mail invalido")).toBeNull();

    view.rerender(<NwInput label="E-mail" error="E-mail invalido" />);
    expect(view.getByText("E-mail invalido")).toBeTruthy();
  });

  it("secure mascara o campo e o olho alterna a visibilidade", () => {
    const view = render(<NwInput label="Senha" placeholder="senha" secure />);
    const field = view.getByPlaceholderText("senha");
    expect(field.props.secureTextEntry).toBe(true);

    fireEvent.press(view.getByLabelText("Mostrar senha"));
    expect(view.getByPlaceholderText("senha").props.secureTextEntry).toBe(false);

    fireEvent.press(view.getByLabelText("Ocultar senha"));
    expect(view.getByPlaceholderText("senha").props.secureTextEntry).toBe(true);
  });

  it("sem `secure` nao renderiza o olho", () => {
    const view = render(<NwInput label="E-mail" />);
    expect(view.queryByLabelText("Mostrar senha")).toBeNull();
  });
});
