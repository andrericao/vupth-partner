import { render, fireEvent, screen, act, waitFor } from "@testing-library/react-native";
import { Modal } from "react-native";
import { FotoEditavel } from "../FotoEditavel";

jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

// O jest-expo finge o modulo nativo do gesture-handler; aqui vale o caminho sem ele (PanResponder).
jest.mock("react-native-gesture-handler", () => {
  throw new Error("sem o modulo nativo");
});

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
    expect(onEscolher).toHaveBeenCalledWith("camera", expect.any(Function));
    expect(screen.queryByText("Tirar foto")).toBeNull();
  });

  it("o texto 'Editar foto' tambem abre a folha; galeria e remover", () => {
    const onEscolher = jest.fn();
    render(<FotoEditavel nome="Ana" uri="https://pub/a.jpg" onEscolher={onEscolher} rotulo="Trocar foto de perfil" />);
    fireEvent.press(screen.getByText("Editar foto"));
    fireEvent.press(screen.getByText("Escolher da galeria"));
    expect(onEscolher).toHaveBeenLastCalledWith("galeria", expect.any(Function));
    fireEvent.press(screen.getByText("Editar foto"));
    fireEvent.press(screen.getByText("Remover foto"));
    expect(onEscolher).toHaveBeenLastCalledWith("remover", expect.any(Function));
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

  // foto-ux (Andre, 15/10): titulo na folha, o "Ajuste a foto" nosso e o
  // "Enviando…" ate a foto subir.
  it("a folha tem titulo", () => {
    render(<FotoEditavel nome="Ana" onEscolher={jest.fn()} rotulo="Pôr foto da loja" titulo="Foto da loja" />);
    fireEvent.press(screen.getByText("Pôr foto"));
    expect(screen.getByText("Foto da loja")).toBeTruthy();
  });

  // validacao de 17/10: o titulo da folha e rotulo, como o da folha de status.
  it("o titulo da folha e rotulo: text-xs, textSecondary, a esquerda", () => {
    render(<FotoEditavel nome="Ana" onEscolher={jest.fn()} rotulo="Pôr foto da loja" titulo="Foto da loja" />);
    fireEvent.press(screen.getByText("Pôr foto"));
    const classes: string = screen.getByText("Foto da loja").props.className;
    expect(classes).toContain("text-xs");
    expect(classes).toContain("text-vupth-textSecondary");
    expect(classes).not.toContain("text-center");
  });

  it("enquadrar abre o 'Ajuste a foto'; Usar foto responde e mostra Enviando… ate subir", async () => {
    let terminar!: () => void;
    let resposta: unknown;
    const onEscolher = jest.fn(async (_acao, enquadrar) => {
      resposta = await enquadrar({ uri: "file:///f.jpg", width: 100, height: 100 });
      await new Promise<void>((r) => (terminar = r));
    });
    render(<FotoEditavel nome="Ana" onEscolher={onEscolher} rotulo="Pôr foto de perfil" testID="foto-perfil" />);
    fireEvent.press(screen.getByText("Pôr foto"));
    fireEvent.press(screen.getByText("Escolher da galeria"));
    await waitFor(() => expect(screen.getByText("Ajuste a foto")).toBeTruthy());
    fireEvent.press(screen.getByTestId("foto-perfil-usar"));
    await waitFor(() => expect(screen.getByText("Enviando…")).toBeTruthy());
    expect(resposta).toEqual({ recorte: { originX: 0, originY: 0, width: 100, height: 100 } });
    expect(screen.queryByText("Ajuste a foto")).toBeNull();
    await act(async () => terminar());
    expect(screen.queryByText("Enviando…")).toBeNull();
    expect(screen.getByText("Pôr foto")).toBeTruthy();
  });

  it("Cancelar no 'Ajuste a foto' responde null e nao mostra Enviando…", async () => {
    let resposta: unknown = "nada";
    const onEscolher = jest.fn(async (_acao, enquadrar) => {
      resposta = await enquadrar({ uri: "file:///f.jpg" });
    });
    render(<FotoEditavel nome="Ana" onEscolher={onEscolher} rotulo="Pôr foto de perfil" testID="foto-perfil" />);
    fireEvent.press(screen.getByText("Pôr foto"));
    fireEvent.press(screen.getByText("Tirar foto"));
    await waitFor(() => expect(screen.getByTestId("foto-perfil-recorte-cancelar")).toBeTruthy());
    fireEvent.press(screen.getByTestId("foto-perfil-recorte-cancelar"));
    await waitFor(() => expect(resposta).toBeNull());
    expect(screen.queryByText("Enviando…")).toBeNull();
  });

  it("remover mostra Enviando… enquanto apaga", async () => {
    let terminar!: () => void;
    const onEscolher = jest.fn(() => new Promise<void>((r) => (terminar = r)));
    render(<FotoEditavel nome="Ana" uri="https://pub/a.jpg" onEscolher={onEscolher} rotulo="Trocar foto de perfil" />);
    fireEvent.press(screen.getByText("Editar foto"));
    fireEvent.press(screen.getByText("Remover foto"));
    expect(screen.getByTestId("foto-editavel-enviando")).toBeTruthy();
    await act(async () => terminar());
    expect(screen.queryByTestId("foto-editavel-enviando")).toBeNull();
  });

  it("o voltar do Android fecha a folha", () => {
    render(<FotoEditavel nome="Ana" onEscolher={jest.fn()} rotulo="Pôr foto de perfil" />);
    fireEvent.press(screen.getByText("Pôr foto"));
    act(() => screen.UNSAFE_getAllByType(Modal)[0].props.onRequestClose());
    expect(screen.queryByText("Tirar foto")).toBeNull();
  });
});
