import { render, fireEvent, screen } from "@testing-library/react-native";
import { FotoEditavel } from "../FotoEditavel";

jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

// Como nas redes sociais (Andre, 02/10 — o selo sozinho parecia icone de
// "crop"): foto tocavel + selo de camera + "Editar foto" embaixo; o toque abre
// uma folha de baixo com Tirar foto · Escolher da galeria · Remover foto.
describe("FotoEditavel", () => {
  it("mostra a foto, o selo e o texto 'Editar foto'", () => {
    render(<FotoEditavel nome="Ana" uri="https://pub/a.jpg" onEscolher={jest.fn()} rotulo="Trocar foto de perfil" />);
    expect(screen.getByTestId("foto-editavel-selo")).toBeTruthy();
    expect(screen.getByText("Editar foto")).toBeTruthy();
    expect(screen.queryByText("Tirar foto")).toBeNull();
  });

  it("tocar na foto abre a folha; escolher fecha e devolve a origem", () => {
    const onEscolher = jest.fn();
    render(<FotoEditavel nome="Ana" uri="https://pub/a.jpg" onEscolher={onEscolher} rotulo="Trocar foto de perfil" />);
    fireEvent.press(screen.getByLabelText("Trocar foto de perfil"));
    expect(screen.getByText("Tirar foto")).toBeTruthy();
    expect(screen.getByText("Escolher da galeria")).toBeTruthy();
    fireEvent.press(screen.getByText("Tirar foto"));
    expect(onEscolher).toHaveBeenCalledWith("camera");
    expect(screen.queryByText("Tirar foto")).toBeNull();
  });

  it("o texto 'Editar foto' tambem abre a folha; galeria e remover", () => {
    const onEscolher = jest.fn();
    render(<FotoEditavel nome="Ana" uri="https://pub/a.jpg" onEscolher={onEscolher} rotulo="Trocar foto de perfil" />);
    fireEvent.press(screen.getByText("Editar foto"));
    fireEvent.press(screen.getByText("Escolher da galeria"));
    expect(onEscolher).toHaveBeenLastCalledWith("galeria");
    fireEvent.press(screen.getByText("Editar foto"));
    fireEvent.press(screen.getByText("Remover foto"));
    expect(onEscolher).toHaveBeenLastCalledWith("remover");
  });

  it("sem foto: iniciais, 'Pôr foto' e sem 'Remover foto'", () => {
    render(<FotoEditavel nome="Barbearia Central" onEscolher={jest.fn()} rotulo="Pôr foto da loja" />);
    expect(screen.getByText("BC")).toBeTruthy();
    fireEvent.press(screen.getByText("Pôr foto"));
    expect(screen.queryByText("Remover foto")).toBeNull();
  });

  it("Cancelar e o fundo fecham sem escolher", () => {
    const onEscolher = jest.fn();
    render(<FotoEditavel nome="Ana" uri="https://pub/a.jpg" onEscolher={onEscolher} rotulo="Trocar foto de perfil" />);
    fireEvent.press(screen.getByLabelText("Trocar foto de perfil"));
    fireEvent.press(screen.getByText("Cancelar"));
    expect(screen.queryByText("Tirar foto")).toBeNull();
    fireEvent.press(screen.getByLabelText("Trocar foto de perfil"));
    fireEvent.press(screen.getByLabelText("Fechar opções da foto"));
    expect(screen.queryByText("Tirar foto")).toBeNull();
    expect(onEscolher).not.toHaveBeenCalled();
  });
});
