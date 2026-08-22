import { fireEvent } from "@testing-library/react-native";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { BrandButton } from "../brand/Button";

// Primitiva da marca nova (Pencil). Convive com o Button v1 e o NwButton — a
// adocao e tela por tela, entao os tres precisam continuar funcionando.
describe("BrandButton (marca nova)", () => {
  it("mostra o titulo e dispara onPress", () => {
    const onPress = jest.fn();
    const view = renderWithProvider(<BrandButton title="Entrar na fila" onPress={onPress} />);

    expect(view.getByText("Entrar na fila")).toBeTruthy();
    fireEvent.press(view.getByText("Entrar na fila"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("isLoading esconde o titulo e nao deixa tocar duas vezes", () => {
    const onPress = jest.fn();
    const view = renderWithProvider(
      <BrandButton title="Salvar" onPress={onPress} isLoading />
    );

    // O titulo da lugar ao spinner — sem isso o usuario toca de novo achando
    // que nao pegou, e a acao vai duas vezes.
    expect(view.queryByText("Salvar")).toBeNull();
  });

  it("isDisabled nao dispara onPress", () => {
    const onPress = jest.fn();
    const view = renderWithProvider(
      <BrandButton title="Confirmar" onPress={onPress} isDisabled />
    );

    fireEvent.press(view.getByText("Confirmar"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it.each(["primary", "secondary", "outline", "ghost"] as const)(
    "renderiza a variante %s",
    (variant) => {
      const view = renderWithProvider(<BrandButton title="Acao" variant={variant} />);
      expect(view.getByText("Acao")).toBeTruthy();
    }
  );
});
