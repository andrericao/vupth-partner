import { render, fireEvent, screen } from "@testing-library/react-native";
import { LinhaComInterruptor } from "../LinhaComInterruptor";

// Andre, 25/09: "a opcao desligar aviso de almoco nas configuracoes pode ser o
// toggle". Era um botao "Ligar/Desligar aviso".
describe("LinhaComInterruptor", () => {
  it("mostra o rotulo, a explicacao e o estado", () => {
    render(
      <LinhaComInterruptor rotulo="Aviso na hora da refeição" descricao="Ligado" ligado onMudar={jest.fn()} />
    );
    expect(screen.getByText("Aviso na hora da refeição")).toBeTruthy();
    expect(screen.getByText("Ligado")).toBeTruthy();
    expect(screen.getByRole("switch").props.value).toBe(true);
  });

  it("tocar no interruptor avisa o novo valor", () => {
    const onMudar = jest.fn();
    render(<LinhaComInterruptor rotulo="Aviso" descricao="" ligado={false} onMudar={onMudar} />);
    fireEvent(screen.getByRole("switch"), "valueChange", true);
    expect(onMudar).toHaveBeenCalledWith(true);
  });
});
