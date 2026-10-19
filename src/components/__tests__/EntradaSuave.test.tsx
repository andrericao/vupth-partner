import { act, render } from "@testing-library/react-native";
import { AccessibilityInfo, Animated, StyleSheet, Text, ViewStyle } from "react-native";

import { EntradaSuave } from "../EntradaSuave";
import { TabBarIcon } from "../TabBarIcon";
import { StatCard } from "../brand/StatCard";

const esvaziar = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const estiloDa = (json: unknown) =>
  StyleSheet.flatten((json as { props: { style: unknown } }).props.style as ViewStyle);

describe("EntradaSuave", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("o que chega entra com fade e deslize de 12 pontos em 450 ms", async () => {
    const timing = jest.spyOn(Animated, "timing");
    const { getByText } = render(
      <EntradaSuave dy={12}>
        <Text>Maria</Text>
      </EntradaSuave>
    );
    expect(getByText("Maria")).toBeTruthy();
    await esvaziar();
    // Só transform e opacity, no driver nativo: é o que mantém a lista fluida.
    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 1, duration: 450, delay: 0, useNativeDriver: true })
    );
  });

  it("com movimento reduzido ja nasce no lugar", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const { toJSON } = render(
      <EntradaSuave>
        <Text>x</Text>
      </EntradaSuave>
    );
    await esvaziar();
    expect(estiloDa(toJSON()).opacity).toBe(1);
  });

  it("o atraso escalona a lista e desmontar antes nao quebra", async () => {
    const { unmount } = render(
      <EntradaSuave atraso={150}>
        <Text>x</Text>
      </EntradaSuave>
    );
    await esvaziar();
    expect(() => unmount()).not.toThrow();
  });
});

// DS5.1: a pilula do ativo atras do icone. A cor sozinha nao separava a aba ativa
// (1,49:1 entre os dois tons); agora a pilula tambem entra em fade e escala.
describe("TabBarIcon", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("a pilula existe em toda aba e so aparece na ativa", async () => {
    jest.useFakeTimers();
    const ativa = render(<TabBarIcon name="queue" focused />);
    const inativa = render(<TabBarIcon name="fits" focused={false} />);
    await esvaziar();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    const opacidadeDaPilula = (r: ReturnType<typeof render>) => {
      const raiz = r.toJSON() as { children: { props: { style: unknown } }[] };
      return StyleSheet.flatten(raiz.children[0].props.style as ViewStyle).opacity;
    };
    expect(opacidadeDaPilula(ativa)).toBe(1);
    expect(opacidadeDaPilula(inativa)).toBe(0);
  });

  it("trocar de aba acende e apaga com a mesma transicao", async () => {
    jest.useFakeTimers();
    const { rerender, toJSON } = render(<TabBarIcon name="queue" focused={false} />);
    rerender(<TabBarIcon name="queue" focused />);
    await esvaziar();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(400);
    });
    const raiz = toJSON() as { children: { props: { style: unknown } }[] };
    expect(StyleSheet.flatten(raiz.children[0].props.style as ViewStyle).opacity).toBe(1);
  });

  it("com movimento reduzido a pilula troca sem transicao", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const { toJSON } = render(<TabBarIcon name="queue" focused />);
    await esvaziar();
    const raiz = toJSON() as { children: { props: { style: unknown } }[] };
    expect(StyleSheet.flatten(raiz.children[0].props.style as ViewStyle).opacity).toBe(1);
  });
});

describe("StatCard", () => {
  it("mostra o numero e o rotulo, e o numero que muda nao some", async () => {
    const { getByText, rerender } = render(<StatCard label="Hoje" value="R$ 480,00" />);
    expect(getByText("R$ 480,00")).toBeTruthy();
    rerender(<StatCard label="Hoje" value="R$ 515,00" />);
    await esvaziar();
    expect(getByText("R$ 515,00")).toBeTruthy();
    expect(getByText("Hoje")).toBeTruthy();
  });
});
