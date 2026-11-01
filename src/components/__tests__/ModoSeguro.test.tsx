import { fireEvent } from "@testing-library/react-native";
import { act } from "react";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { AvisoModoSeguro } from "../AvisoModoSeguro";
import { TelaDeRecuperacao } from "../TelaDeRecuperacao";
import { useModoSeguro } from "@lib/aberturas";

describe("modo seguro e recuperacao", () => {
  beforeEach(() => useModoSeguro.getState().reset());

  it("o aviso so aparece em modo seguro", () => {
    const { queryByTestId } = renderWithProvider(<AvisoModoSeguro />);
    expect(queryByTestId("aviso-modo-seguro")).toBeNull();
    act(() => useModoSeguro.getState().definir({ quedas: 2, modoSeguro: true }));
    expect(queryByTestId("aviso-modo-seguro")).not.toBeNull();
  });

  it("a tela de recuperacao tenta de novo e nao mostra o erro", () => {
    const tentar = jest.fn();
    const { getByTestId, queryByText } = renderWithProvider(<TelaDeRecuperacao onTentarDeNovo={tentar} />);
    fireEvent.press(getByTestId("tentar-de-novo"));
    expect(tentar).toHaveBeenCalled();
    expect(queryByText(/Error|stack/i)).toBeNull();
  });
});
