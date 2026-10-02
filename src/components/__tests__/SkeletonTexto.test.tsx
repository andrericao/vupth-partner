import { render, screen } from "@testing-library/react-native";
import { SkeletonTexto, SkeletonList } from "../Skeleton";
import { ScreenHeader } from "../ScreenHeader";

jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

// Andre, 02/10: o Perfil mostrou "Profissional" ate os dados chegarem e parecia
// erro. Enquanto carrega, a forma do texto — nunca um texto generico que pareca dado.
describe("SkeletonTexto", () => {
  it("um bloco com a largura e altura pedidas, anunciado como carregando", () => {
    render(<SkeletonTexto largura={160} altura={20} testID="nome" />);
    const bloco = screen.getByTestId("nome");
    expect(bloco.props.style).toEqual(expect.objectContaining({ width: 160, height: 20 }));
    expect(screen.getByLabelText("Carregando")).toBeTruthy();
  });

  it("sobre fundo escuro usa a cor clara", () => {
    render(<SkeletonTexto largura={100} escuro testID="nome" />);
    expect(screen.getByTestId("nome").props.style.backgroundColor).not.toBe("#D7DDD3");
  });
});

describe("ScreenHeader carregando", () => {
  it("troca o titulo generico pelo skeleton", () => {
    render(<ScreenHeader title="Meu estabelecimento" carregando />);
    expect(screen.queryByText("Meu estabelecimento")).toBeNull();
    expect(screen.getByTestId("screen-header-carregando")).toBeTruthy();
  });

  it("sem carregar, o titulo", () => {
    render(<ScreenHeader title="Barbearia Central" />);
    expect(screen.getByText("Barbearia Central")).toBeTruthy();
  });
});

describe("SkeletonList", () => {
  it("desenha a quantidade pedida de cards fantasma (3 por padrao)", () => {
    const { toJSON, rerender } = render(<SkeletonList count={2} />);
    expect((toJSON() as any).children).toHaveLength(2);
    rerender(<SkeletonList />);
    expect((toJSON() as any).children).toHaveLength(3);
  });
});
