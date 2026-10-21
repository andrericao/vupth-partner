import { AccessibilityInfo, ActivityIndicator, StyleSheet } from "react-native";
import { act, fireEvent, render as renderPuro } from "@testing-library/react-native";
import { renderWithProvider as render } from "../../test-utils/renderWithProvider";
import { ServerWarmup } from "../ServerWarmup";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { commit: "abc1234" } } },
}));

// abertura-profissional (PAR-10, DEC-40): a abertura e a da marca — o V e um
// indicador discreto, sem citar servidor nem tempo de espera.
describe("ServerWarmup", () => {
  // abertura-v-pulsando (PAR-2, Andre 15/10): sem spinner, o V pulsa devagar.
  it("abrindo: so o V pulsando, sem spinner e sem falar de servidor", () => {
    const { getByTestId, queryByText, UNSAFE_queryAllByType } = render(<ServerWarmup />);
    const v = getByTestId("abertura-v-pulsando");
    expect(v.props.accessibilityLabel).toBe("Vupth, abrindo");
    expect(UNSAFE_queryAllByType(ActivityIndicator)).toHaveLength(0);
    expect(queryByText(/servidor/i)).toBeNull();
    expect(queryByText(/50s/)).toBeNull();
  });

  it("falhou: explica sem falar de servidor e oferece tentar de novo", () => {
    const onRetry = jest.fn();
    const { getByText, queryByText, queryByTestId } = render(
      <ServerWarmup failed onRetry={onRetry} />
    );
    expect(getByText("Não foi possível abrir o app")).toBeTruthy();
    expect(queryByText(/servidor/i)).toBeNull();
    expect(queryByTestId("abertura-v-pulsando")).toBeNull();
    expect(queryByTestId("abertura-v")).toBeTruthy();
    fireEvent.press(getByText("Tentar de novo"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("falhou sem onRetry: sem o botao", () => {
    const { queryByText } = render(<ServerWarmup failed />);
    expect(queryByText("Tentar de novo")).toBeNull();
  });

  // commit-visivel (Andre, 03/10): o commit a vista antes de qualquer login.
  it("mostra o commit do codigo ja na abertura", () => {
    const { getByTestId } = render(<ServerWarmup />);
    expect(getByTestId("app-commit")).toHaveTextContent("abc1234");
  });

  it("o pulso para quando a tela sai ou falha", () => {
    expect(() => render(<ServerWarmup />).unmount()).not.toThrow();
    expect(() => render(<ServerWarmup failed />).unmount()).not.toThrow();
  });

  // abertura-sem-piscar (18/10): entrada por varredura, pulso de 1 a 0,92 e
  // saida com o V inteiro. O `rerender` do helper com provider troca a arvore
  // inteira e deixa o getByTestId apontando para um no morto: aqui o render puro.
  describe("entrada, pulso e saida", () => {
    const esvaziar = async () => {
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
    };

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it("o V pulsa so de leve: opacidade e escala animadas no mesmo no", () => {
      const { getByTestId } = renderPuro(<ServerWarmup />);
      const estilo = StyleSheet.flatten(getByTestId("abertura-v-pulsando").props.style);
      expect(estilo.opacity).toBeDefined();
      expect(estilo.transform).toHaveLength(1);
      expect(estilo.width).toBe(96);
    });

    it("pronto: so sai depois da varredura e avisa quando a saida termina", async () => {
      jest.useFakeTimers();
      const onSaiu = jest.fn();
      const { rerender } = renderPuro(<ServerWarmup onSaiu={onSaiu} />);
      rerender(<ServerWarmup pronto onSaiu={onSaiu} />);
      await esvaziar();
      // A varredura (600 ms) ainda nao terminou: o V nao pode sair cortado pela metade.
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      expect(onSaiu).not.toHaveBeenCalled();
      // Varredura acabou: so agora o V sai (450 ms).
      await act(async () => {
        jest.advanceTimersByTime(400);
      });
      await esvaziar();
      expect(onSaiu).not.toHaveBeenCalled();
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      expect(onSaiu).toHaveBeenCalledTimes(1);
    });

    it("sem pronto o V so pulsa: nunca avisa que saiu", async () => {
      jest.useFakeTimers();
      const onSaiu = jest.fn();
      renderPuro(<ServerWarmup onSaiu={onSaiu} />);
      await esvaziar();
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      expect(onSaiu).not.toHaveBeenCalled();
    });

    it("com movimento reduzido: o V ja esta inteiro e a saida e imediata", async () => {
      jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
      const onSaiu = jest.fn();
      const { rerender } = renderPuro(<ServerWarmup onSaiu={onSaiu} />);
      rerender(<ServerWarmup pronto onSaiu={onSaiu} />);
      await esvaziar();
      expect(onSaiu).toHaveBeenCalledTimes(1);
    });

    it("falhou depois de pronto nao ser pedido: o V fica parado e inteiro, sem avisar saida", async () => {
      const onSaiu = jest.fn();
      const { getByTestId } = renderPuro(<ServerWarmup failed pronto onSaiu={onSaiu} />);
      await esvaziar();
      expect(getByTestId("abertura-v")).toBeTruthy();
      expect(onSaiu).not.toHaveBeenCalled();
    });

    it("tentar de novo: a falha volta a entrar por varredura", async () => {
      const { rerender, getByTestId, queryByTestId } = renderPuro(<ServerWarmup failed />);
      expect(queryByTestId("abertura-v-pulsando")).toBeNull();
      rerender(<ServerWarmup />);
      await esvaziar();
      expect(getByTestId("abertura-v-pulsando")).toBeTruthy();
    });

    it("desmontar no meio da varredura nao quebra nem avisa ninguem", async () => {
      const onSaiu = jest.fn();
      const { unmount } = renderPuro(<ServerWarmup pronto onSaiu={onSaiu} />);
      unmount();
      await esvaziar();
      expect(onSaiu).not.toHaveBeenCalled();
    });
  });
});
