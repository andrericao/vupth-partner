import { act, fireEvent, render } from "@testing-library/react-native";
import { ScrollView, Text } from "react-native";

import { deveMostrarPilula, usePilulaTopo } from "../useVoltarAoTopo";

// Andre, 24/09: pílula "↑ Voltar ao topo", como a do Spotify — surge suave
// quando a pessoa já desceu bastante e some ao voltar ao topo.
describe("deveMostrarPilula", () => {
  it("no topo, não", () => expect(deveMostrarPilula(0, 800)).toBe(false));
  it("antes de rolar uma tela inteira, não", () => expect(deveMostrarPilula(700, 800)).toBe(false));
  it("depois de rolar mais de uma tela, sim", () => expect(deveMostrarPilula(900, 800)).toBe(true));
  it("sem medida da tela ainda, não", () => expect(deveMostrarPilula(900, 0)).toBe(false));
});

// O container da rolagem, fora do componente: o teste confere a chamada nele.
const mockScrollTo = jest.fn();
const refDaLista = { current: { scrollTo: mockScrollTo } } as any;

function Tela() {
  const pilula = usePilulaTopo(refDaLista);
  return (
    <ScrollView testID="lista" onScroll={pilula.onScroll}>
      <Text testID="estado">{pilula.visivel ? "visivel" : "oculta"}</Text>
      <Text testID="subir" onPress={pilula.subir}>subir</Text>
    </ScrollView>
  );
}

const rolagem = (y: number) => ({
  nativeEvent: { contentOffset: { y }, layoutMeasurement: { height: 800 }, contentSize: { height: 4000 } },
});

describe("usePilulaTopo", () => {
  it("aparece ao descer e some ao voltar", () => {
    const { getByTestId } = render(<Tela />);
    expect(getByTestId("estado")).toHaveTextContent("oculta");
    act(() => fireEvent.scroll(getByTestId("lista"), rolagem(1200)));
    expect(getByTestId("estado")).toHaveTextContent("visivel");
    act(() => fireEvent.scroll(getByTestId("lista"), rolagem(100)));
    expect(getByTestId("estado")).toHaveTextContent("oculta");
  });

  it("subir rola o container até o topo, com animação", () => {
    const { getByTestId } = render(<Tela />);
    fireEvent.press(getByTestId("subir"));
    expect(mockScrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
  });
});
