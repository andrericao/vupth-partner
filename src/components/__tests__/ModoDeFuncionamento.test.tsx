import { render, fireEvent, screen } from "@testing-library/react-native";
import { ModoDeFuncionamento } from "../ModoDeFuncionamento";

// Funcionamento no menu da fila (Andre, 26/09): fila e agenda, ou so agenda.
describe("ModoDeFuncionamento", () => {
  it("marca o modo atual e escolher o outro avisa", () => {
    const onEscolher = jest.fn();
    render(<ModoDeFuncionamento atual="QUEUE" onEscolher={onEscolher} />);
    expect(screen.getByTestId("modo-QUEUE").props.accessibilityState.checked).toBe(true);
    fireEvent.press(screen.getByLabelText("Só agenda"));
    expect(onEscolher).toHaveBeenCalledWith("AGENDA_ONLY");
  });

  it("tocar no ja escolhido, ou enquanto salva, nao faz nada", () => {
    const onEscolher = jest.fn();
    const { rerender } = render(<ModoDeFuncionamento atual="QUEUE" onEscolher={onEscolher} />);
    fireEvent.press(screen.getByLabelText("Fila e agenda"));
    rerender(<ModoDeFuncionamento atual="QUEUE" onEscolher={onEscolher} ocupado />);
    fireEvent.press(screen.getByLabelText("Só agenda"));
    expect(onEscolher).not.toHaveBeenCalled();
  });
});
