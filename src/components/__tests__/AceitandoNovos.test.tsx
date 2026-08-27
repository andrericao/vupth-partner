import { fireEvent } from "@testing-library/react-native";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { AceitandoNovos } from "../AceitandoNovos";

describe("AceitandoNovos", () => {
  it("aberta: a legenda diz que dá para entrar", () => {
    const { getByText } = renderWithProvider(
      <AceitandoNovos aceitando onToggle={jest.fn()} />
    );
    getByText("Entrada na fila liberada");
  });

  it("fechada: a legenda diz o que acontece com quem JA esta", () => {
    // O medo de fechar e "e quem esta esperando?". A legenda responde antes de
    // perguntarem.
    const { getByText } = renderWithProvider(
      <AceitandoNovos aceitando={false} onToggle={jest.fn()} />
    );
    getByText("Fila fechada — só quem já está espera");
  });

  it("a chave reflete o estado, nao so a legenda", () => {
    const { getByTestId } = renderWithProvider(
      <AceitandoNovos aceitando={false} onToggle={jest.fn()} />
    );
    expect(getByTestId("aceitando-novos").props.value).toBe(false);
  });

  it("mexer na chave avisa quem chamou", () => {
    const onToggle = jest.fn();
    const { getByTestId } = renderWithProvider(
      <AceitandoNovos aceitando onToggle={onToggle} />
    );
    fireEvent(getByTestId("aceitando-novos"), "valueChange", false);
    expect(onToggle).toHaveBeenCalled();
  });
});
