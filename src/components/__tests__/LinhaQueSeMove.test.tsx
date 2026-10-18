import { act, fireEvent, render } from "@testing-library/react-native";
import { AccessibilityInfo, Animated, StyleSheet, Text, ViewStyle } from "react-native";

import { LinhaQueSeMove } from "../LinhaQueSeMove";

const esvaziar = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const layout = (y: number) => ({ nativeEvent: { layout: { x: 0, y, width: 300, height: 60 } } });
const deslocamento = (json: unknown) => {
  const estilo = StyleSheet.flatten((json as { props: { style: unknown } }).props.style as ViewStyle);
  return (estilo.transform as { translateY: number }[])[0].translateY;
};

// A linha que muda de lugar desliza da posicao antiga para a nova.
describe("LinhaQueSeMove", () => {
  // `isReduceMotionEnabled` ja e um jest.fn do setup do React Native, nao um spy
  // criado aqui: o restoreAllMocks nao desfaz o `mockResolvedValue(true)` do teste
  // de movimento reduzido, e ele vazaria para os testes seguintes.
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
  });
  afterEach(() => jest.restoreAllMocks());

  it("a primeira medida nao anima: so guarda o lugar", async () => {
    const timing = jest.spyOn(Animated, "timing");
    const { getByText, toJSON } = render(
      <LinhaQueSeMove>
        <Text>Maria</Text>
      </LinhaQueSeMove>
    );
    fireEvent(toJSON() as never, "layout", layout(100));
    await esvaziar();
    expect(getByText("Maria")).toBeTruthy();
    expect(timing).not.toHaveBeenCalled();
  });

  it("subiu na lista: comeca deslocada da diferenca e anda ate zero em 300 ms", async () => {
    const timing = jest.spyOn(Animated, "timing");
    const { UNSAFE_getByType, toJSON } = render(
      <LinhaQueSeMove>
        <Text>Maria</Text>
      </LinhaQueSeMove>
    );
    const raiz = UNSAFE_getByType(Animated.View);
    fireEvent(raiz, "layout", layout(120));
    // De 120 para 60: a linha esta 60 pontos acima de onde estava, entao parte de +60.
    fireEvent(raiz, "layout", layout(60));
    await esvaziar();
    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 0, duration: 300, useNativeDriver: true })
    );
    expect(deslocamento(toJSON())).toBe(60);
  });

  it("o mesmo lugar de novo nao anima", async () => {
    const timing = jest.spyOn(Animated, "timing");
    const { UNSAFE_getByType } = render(
      <LinhaQueSeMove>
        <Text>Maria</Text>
      </LinhaQueSeMove>
    );
    const raiz = UNSAFE_getByType(Animated.View);
    fireEvent(raiz, "layout", layout(80));
    fireEvent(raiz, "layout", layout(80));
    await esvaziar();
    expect(timing).not.toHaveBeenCalled();
  });

  it("com movimento reduzido a linha so troca de lugar", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const timing = jest.spyOn(Animated, "timing");
    const { UNSAFE_getByType, toJSON } = render(
      <LinhaQueSeMove>
        <Text>Maria</Text>
      </LinhaQueSeMove>
    );
    const raiz = UNSAFE_getByType(Animated.View);
    fireEvent(raiz, "layout", layout(120));
    fireEvent(raiz, "layout", layout(60));
    await esvaziar();
    expect(timing).not.toHaveBeenCalled();
    expect(deslocamento(toJSON())).toBe(0);
  });

  it("uma segunda mudanca no meio do deslize reinicia a animacao ate zero", async () => {
    // Duas mudancas de ordem em menos de 0,3 s: a segunda recomeca da nova diferenca.
    const timing = jest.spyOn(Animated, "timing");
    const { UNSAFE_getByType } = render(
      <LinhaQueSeMove>
        <Text>Maria</Text>
      </LinhaQueSeMove>
    );
    const raiz = UNSAFE_getByType(Animated.View);
    fireEvent(raiz, "layout", layout(120));
    fireEvent(raiz, "layout", layout(60));
    await esvaziar();
    fireEvent(raiz, "layout", layout(0));
    await esvaziar();
    expect(timing).toHaveBeenCalledTimes(2);
    expect(timing.mock.calls.every(([, c]) => (c as { toValue: number }).toValue === 0)).toBe(true);
  });

  it("desmontar no meio do deslize nao quebra", async () => {
    const { UNSAFE_getByType, unmount } = render(
      <LinhaQueSeMove>
        <Text>Maria</Text>
      </LinhaQueSeMove>
    );
    const raiz = UNSAFE_getByType(Animated.View);
    fireEvent(raiz, "layout", layout(120));
    fireEvent(raiz, "layout", layout(60));
    expect(() => unmount()).not.toThrow();
  });
});
