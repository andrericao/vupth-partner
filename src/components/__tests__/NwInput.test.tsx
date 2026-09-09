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

  it("só mostra a mensagem quando `error` vem preenchido", () => {
    const view = render(<NwInput label="E-mail" error="" />);
    expect(view.queryByText("E-mail inválido")).toBeNull();

    view.rerender(<NwInput label="E-mail" error="E-mail inválido" />);
    expect(view.getByText("E-mail inválido")).toBeTruthy();
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

  it("sem `secure` não renderiza o olho", () => {
    const view = render(<NwInput label="E-mail" />);
    expect(view.queryByLabelText("Mostrar senha")).toBeNull();
  });
});

// 🔴 "duas bordas na web, e fica espremido" (08/09). A segunda borda e do
// NAVEGADOR — o TextInput do react-native-web e um <input> de verdade, que
// herda borda e anel de foco do user-agent. O app do cliente nao sofre disso
// porque o campo dele vem do Gluestack, que ja traz o reset.
describe("NwInput — a borda que o navegador desenha por cima", () => {
  const estiloDo = (campo: any) =>
    (Array.isArray(campo.props.style) ? campo.props.style : [campo.props.style])
      .filter(Boolean)
      .reduce((acc: any, e: any) => ({ ...acc, ...e }), {});

  it("no NATIVO nao injeta reset nenhum — o problema nao existe la", () => {
    const { getByDisplayValue } = render(<NwInput label="E-mail" value="a@b.com" onChangeText={jest.fn()} />);
    expect(estiloDo(getByDisplayValue("a@b.com")).outlineStyle).toBeUndefined();
  });

  it("o estilo de quem chama continua valendo por cima do reset", () => {
    const { getByDisplayValue } = render(
      <NwInput label="E-mail" value="a@b.com" onChangeText={jest.fn()} style={{ fontSize: 20 }} />
    );
    expect(estiloDo(getByDisplayValue("a@b.com")).fontSize).toBe(20);
  });
});
