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
    fireEvent.press(getByText("Usar minha localização ou corrigir o endereço"));
    expect(router.push).toHaveBeenCalledWith("/(owner)/onboarding/address");
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
});
