import { Switch } from "react-native";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { ExporPosicao } from "../ExporPosicao";

// expor-posicao (decisao de 05/09, Backend 35d57c0): o cliente ve a posicao na
// fila; esconder e a escolha ativa.
describe("ExporPosicao", () => {
  it("ligado mostra que o cliente ve a posicao; desligar avisa false", () => {
    const onMudar = jest.fn();
    render(<ExporPosicao expor onMudar={onMudar} />);
    expect(screen.getByText("O cliente vê a posição dele na fila.")).toBeTruthy();
    fireEvent(screen.getByTestId("expor-posicao"), "valueChange", false);
    expect(onMudar).toHaveBeenCalledWith(false);
  });

  it("desligado diz o que o cliente ve no lugar", () => {
    render(<ExporPosicao expor={false} onMudar={jest.fn()} />);
    expect(screen.getByTestId("expor-posicao").props.value).toBe(false);
    expect(screen.getByText("O cliente não vê a posição — só a previsão de quando será chamado.")).toBeTruthy();
  });

  it("enquanto salva, o interruptor fica travado", () => {
    render(<ExporPosicao expor onMudar={jest.fn()} ocupado />);
    expect(screen.getByTestId("expor-posicao").props.disabled).toBe(true);
  });

  // validacao de 17/10 (DS7): o trilho era #C9CBC9 (fora da paleta) e forest
  // ligado; os outros tres interruptores do app usam border/green.
  it("o trilho e o dos outros interruptores: border desligado, green ligado, bolinha branca", () => {
    render(<ExporPosicao expor onMudar={jest.fn()} />);
    const sw = screen.UNSAFE_getByType(Switch);
    expect(sw.props.trackColor).toEqual({ false: "#D7DDD3", true: "#9FE870" });
    expect(sw.props.thumbColor).toBe("#FFFFFF");
    expect(sw.props.ios_backgroundColor).toBe("#D7DDD3");
  });
});
