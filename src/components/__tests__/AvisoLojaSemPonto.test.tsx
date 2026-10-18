import { AccessibilityInfo, Animated } from "react-native";
import { render, fireEvent, act } from "@testing-library/react-native";
import { router } from "expo-router";
import { AvisoLojaSemPonto } from "../AvisoLojaSemPonto";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

// loja-sem-coordenada (S25, BAK d215d5a): no painel do dono.
describe("AvisoLojaSemPonto", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("UNRESOLVED: avisa que a loja nao aparece e leva ao endereco", () => {
    const { getByText, getByTestId } = render(
      <AvisoLojaSemPonto endereco={{ locationStatus: "UNRESOLVED" }} onReler={jest.fn()} />
    );
    expect(getByTestId("aviso-loja-sem-ponto")).toBeTruthy();
    expect(getByText("Sua loja não aparece para quem busca por perto")).toBeTruthy();
    fireEvent.press(getByText("Usar localização"));
    expect(router.push).toHaveBeenCalledWith("/(owner)/onboarding/address");
  });

  // validacao de 17/10 (DS6): e bloqueio, nao vazio. A borda pessego sobre
  // surface da 1,5:1 e sumia; o link sublinhado virou texto + seta.
  it("e bloqueio: pessego liso, sem borda e sem surface; o link nao e sublinhado", () => {
    const { getByTestId, getByText } = render(
      <AvisoLojaSemPonto endereco={{ locationStatus: "UNRESOLVED" }} onReler={jest.fn()} />
    );
    const cartao = getByTestId("aviso-loja-sem-ponto").children[0] as any;
    const classes: string = cartao.props.className;
    expect(classes).toContain("bg-vupth-accentPeach");
    expect(classes).toContain("rounded-card");
    expect(classes).not.toMatch(/\bborder/);
    expect(classes).not.toContain("bg-vupth-surface");
    expect(getByText("Usar localização").props.className).not.toContain("underline");
  });

  it("LOCATED, sem o campo ou sem endereco: nao mostra nada e nao rele", () => {
    const onReler = jest.fn();
    for (const endereco of [{ locationStatus: "LOCATED" as const }, {}, null]) {
      const { queryByTestId, unmount } = render(<AvisoLojaSemPonto endereco={endereco} onReler={onReler} />);
      expect(queryByTestId("aviso-loja-sem-ponto")).toBeNull();
      unmount();
    }
    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(onReler).not.toHaveBeenCalled();
  });

  it("PENDING: nao mostra nada, rele a loja a cada 5 s e desiste depois de 6 vezes", () => {
    const onReler = jest.fn();
    const { queryByTestId, rerender } = render(
      <AvisoLojaSemPonto endereco={{ locationStatus: "PENDING" }} onReler={onReler} />
    );
    expect(queryByTestId("aviso-loja-sem-ponto")).toBeNull();
    for (let i = 1; i <= 8; i++) {
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      // A store devolve um objeto novo a cada releitura.
      rerender(<AvisoLojaSemPonto endereco={{ locationStatus: "PENDING" }} onReler={onReler} />);
    }
    expect(onReler).toHaveBeenCalledTimes(6);
  });

  it("PENDING que vira LOCATED: para de reler", () => {
    const onReler = jest.fn();
    const { rerender } = render(
      <AvisoLojaSemPonto endereco={{ locationStatus: "PENDING" }} onReler={onReler} />
    );
    rerender(<AvisoLojaSemPonto endereco={{ locationStatus: "LOCATED" }} onReler={onReler} />);
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    expect(onReler).not.toHaveBeenCalled();
  });

  describe("entrada: fade + deslize de 12 px em 400 ms", () => {
    const estilo = (el: any) => {
      const style = el.props.style;
      return Array.isArray(style) ? Object.assign({}, ...style.flat()) : style;
    };
    const ponto = { locationStatus: "UNRESOLVED" };

    // `Once`, e nao spyOn + restore: AccessibilityInfo.isReduceMotionEnabled ja
    // e um jest.fn() do setup do React Native, e restaurar um spy dele apaga a
    // implementacao (a chamada passa a devolver undefined nos testes seguintes).
    // O Animated.timing e funcao de verdade; esse espiao se desfaz normalmente.
    const reduzido = AccessibilityInfo.isReduceMotionEnabled as jest.Mock;
    let timing: jest.SpyInstance | undefined;
    afterEach(() => {
      timing?.mockRestore();
      timing = undefined;
    });

    it("comeca invisivel, 12 px abaixo, e anima para o lugar em 400 ms no driver nativo", async () => {
      reduzido.mockResolvedValueOnce(false);
      timing = jest.spyOn(Animated, "timing");
      const { getByTestId } = render(<AvisoLojaSemPonto endereco={ponto} onReler={jest.fn()} />);
      const inicio = estilo(getByTestId("aviso-loja-sem-ponto"));
      expect(inicio.opacity).toBe(0);
      expect(inicio.transform[0].translateY).toBe(12);

      await act(async () => {
        await Promise.resolve();
      });
      expect(timing).toHaveBeenCalledTimes(1);
      expect(timing!.mock.calls[0][1]).toEqual(
        expect.objectContaining({ toValue: 1, duration: 400, useNativeDriver: true })
      );
    });

    it("com remover animacoes ligado, aparece pronto", async () => {
      reduzido.mockResolvedValueOnce(true);
      timing = jest.spyOn(Animated, "timing");
      const { getByTestId } = render(<AvisoLojaSemPonto endereco={ponto} onReler={jest.fn()} />);
      await act(async () => {
        await Promise.resolve();
      });
      expect(estilo(getByTestId("aviso-loja-sem-ponto")).opacity).toBe(1);
      expect(timing).not.toHaveBeenCalled();
    });

    it("se o sistema nao responde sobre animacao, o aviso aparece mesmo assim", async () => {
      reduzido.mockRejectedValueOnce(new Error("sem resposta"));
      const { getByTestId } = render(<AvisoLojaSemPonto endereco={ponto} onReler={jest.fn()} />);
      await act(async () => {
        await Promise.resolve();
      });
      expect(estilo(getByTestId("aviso-loja-sem-ponto")).opacity).toBe(1);
    });

    it("desmontar antes da resposta nao anima nem estoura", async () => {
      reduzido.mockResolvedValueOnce(false);
      timing = jest.spyOn(Animated, "timing");
      const { unmount } = render(<AvisoLojaSemPonto endereco={ponto} onReler={jest.fn()} />);
      unmount();
      await act(async () => {
        await Promise.resolve();
      });
      expect(timing).not.toHaveBeenCalled();
    });
  });
});
