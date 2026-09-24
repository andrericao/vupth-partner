import { fireEvent, render } from "@testing-library/react-native";
import { PilulaVoltarAoTopo } from "../PilulaVoltarAoTopo";

// Desenho escolhido pelo Andre (24/09): pílula com texto, centralizada, acima
// das abas; fundo forest e texto verde (a âncora escura da marca).
describe("PilulaVoltarAoTopo", () => {
  it("diz o que faz, em texto", () => {
    const { getByText } = render(<PilulaVoltarAoTopo visivel onPress={jest.fn()} />);
    expect(getByText("Voltar ao topo")).toBeTruthy();
  });

  it("tocar chama o subir", () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(<PilulaVoltarAoTopo visivel onPress={onPress} />);
    fireEvent.press(getByLabelText("Voltar ao topo"));
    expect(onPress).toHaveBeenCalled();
  });

  it("escondida, não intercepta toque nem aparece para leitor de tela", () => {
    const { getByTestId } = render(<PilulaVoltarAoTopo visivel={false} onPress={jest.fn()} />);
    // Oculta do leitor de tela: o RNTL só a acha pedindo os elementos ocultos.
    const caixa = getByTestId("pilula-topo", { includeHiddenElements: true });
    expect(caixa.props.pointerEvents).toBe("none");
    expect(caixa.props.accessibilityElementsHidden).toBe(true);
  });

  it("a cor vem da marca: fundo forest, texto verde", () => {
    const { getByLabelText, getByText } = render(<PilulaVoltarAoTopo visivel onPress={jest.fn()} />);
    expect(getByLabelText("Voltar ao topo").props.className ?? "").toContain("bg-vupth-forest");
    expect(getByText("Voltar ao topo").props.className).toContain("text-vupth-green");
  });
});
