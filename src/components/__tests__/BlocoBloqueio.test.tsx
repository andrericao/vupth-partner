import { render, fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { BlocoBloqueio } from "@components/BlocoBloqueio";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

// bordas-do-card (Andre, 05/10 e 10/10): a caixa pessego quase sem borda e o
// botao colado na borda de baixo do card.
describe("BlocoBloqueio", () => {
  const props = {
    titulo: "Você ainda não tem fila",
    texto: "Para receber clientes você precisa estar vinculado.",
    acao: "Buscar estabelecimento",
    rota: "/(professional)/find-establishment",
  };

  it("mostra o titulo, o texto e a acao", () => {
    const { getByText } = render(<BlocoBloqueio {...props} />);
    expect(getByText(props.titulo)).toBeTruthy();
    expect(getByText(props.texto)).toBeTruthy();
    expect(getByText(props.acao)).toBeTruthy();
  });

  it("a acao leva para a rota", () => {
    const { getByText } = render(<BlocoBloqueio {...props} />);
    fireEvent.press(getByText(props.acao));
    expect(router.push).toHaveBeenCalledWith(props.rota);
  });

  it("a caixa tem borda e folga embaixo do botao", () => {
    const { getByTestId } = render(<BlocoBloqueio {...props} />);
    const caixa = getByTestId("bloco-bloqueio").props.className;
    expect(caixa).toContain("border-2");
    expect(caixa).toContain("border-vupth-forest/20");
    expect(caixa).toContain("pb-6");
  });
});
