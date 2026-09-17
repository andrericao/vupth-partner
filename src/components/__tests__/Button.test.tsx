import { fireEvent } from "@testing-library/react-native";
import { renderWithProvider as render } from "../../test-utils/renderWithProvider";
import { Button } from "../Button";

// 16/09 (Andre): o botao principal e verde com texto forest nos DOIS apps —
// como o Button do client e o NwButton primary. O forest com texto branco saiu.
describe("Button (gluestack legado)", () => {
  it("texto forest por padrao", () => {
    const { getByText } = render(<Button title="Tentar de novo" />);
    const estilo = [getByText("Tentar de novo").props.style].flat(Infinity);
    expect(estilo).toEqual(expect.arrayContaining([expect.objectContaining({ color: "#163300" })]));
  });

  it("textColor ainda sobrescreve", () => {
    const { getByText } = render(<Button title="X" textColor="#B3261E" />);
    const estilo = [getByText("X").props.style].flat(Infinity);
    expect(estilo).toEqual(expect.arrayContaining([expect.objectContaining({ color: "#B3261E" })]));
  });

  // No Gluestack v1 o `isDisabled` e so visual: o toque continuava disparando.
  it("isDisabled bloqueia o toque de verdade", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Salvar" isDisabled onPress={onPress} />);
    fireEvent.press(getByText("Salvar"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
