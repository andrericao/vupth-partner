import { fireEvent } from "@testing-library/react-native";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { StatusPill } from "../StatusPill";

describe("StatusPill", () => {
  it("mostra o status atual no rotulo", () => {
    const { getByLabelText } = renderWithProvider(
      <StatusPill current="trabalhando" onSelect={jest.fn()} />
    );
    getByLabelText("Você está: Trabalhando. Toque para trocar.");
  });

  it("sem status ainda, convida a definir em vez de mentir um valor", () => {
    const { getByText } = renderWithProvider(<StatusPill current={null} onSelect={jest.fn()} />);
    getByText("Definir status");
  });

  it("o seletor so aparece depois do toque", () => {
    const { queryByTestId, getByLabelText } = renderWithProvider(
      <StatusPill current="trabalhando" onSelect={jest.fn()} />
    );
    expect(queryByTestId("status-intervalo")).toBeNull();
    fireEvent.press(getByLabelText("Você está: Trabalhando. Toque para trocar."));
    expect(queryByTestId("status-intervalo")).not.toBeNull();
  });

  it("escolher outro status avisa quem chamou", () => {
    const onSelect = jest.fn();
    const { getByTestId, getByLabelText } = renderWithProvider(
      <StatusPill current="trabalhando" onSelect={onSelect} />
    );
    fireEvent.press(getByLabelText("Você está: Trabalhando. Toque para trocar."));
    fireEvent.press(getByTestId("status-indisponivel"));
    expect(onSelect).toHaveBeenCalledWith("indisponivel");
  });

  it("tocar no status que ja esta ativo NAO dispara uma troca", () => {
    // Sem isto, abrir o seletor e desistir custaria um PATCH e — se voce fosse
    // o ultimo — o susto de "loja fechada" sem ter mudado nada.
    const onSelect = jest.fn();
    const { getByTestId, getByLabelText } = renderWithProvider(
      <StatusPill current="intervalo" onSelect={onSelect} />
    );
    fireEvent.press(getByLabelText("Você está: Intervalo. Toque para trocar."));
    fireEvent.press(getByTestId("status-intervalo"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
