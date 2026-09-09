import { render, fireEvent, act } from "@testing-library/react-native";

import { DialogoVupth } from "../DialogoVupth";
import { useDialogoStore, abrirDialogo } from "@store/dialogo.store";

describe("DialogoVupth (o diálogo do app no nativo)", () => {
  beforeEach(() => useDialogoStore.getState().fechar());

  it("sem pedido, não desenha nada", () => {
    const { toJSON } = render(<DialogoVupth />);
    expect(toJSON()).toBeNull();
  });

  it("mostra título e mensagem do pedido", () => {
    const { getByText, rerender } = render(<DialogoVupth />);
    act(() => void abrirDialogo({ titulo: "Erro", mensagem: "Senha incorreta" }));
    rerender(<DialogoVupth />);

    expect(getByText("Erro")).toBeTruthy();
    expect(getByText("Senha incorreta")).toBeTruthy();
  });

  it("o toque resolve com o índice — é assim que o confirmar sabe a resposta", async () => {
    const { getByTestId, rerender } = render(<DialogoVupth />);
    let escolha!: Promise<number>;
    act(() => {
      escolha = abrirDialogo({
        titulo: "Fechar fila",
        mensagem: "Ninguém novo entra.",
        botoes: [{ texto: "Voltar", estilo: "cancel" }, { texto: "Fechar" }],
      });
    });
    rerender(<DialogoVupth />);

    fireEvent.press(getByTestId("dialogo-botao-1"));

    await expect(escolha).resolves.toBe(1);
  });

  it("marca a si mesmo como montado — sem isso quem chama cai no Alert do sistema", () => {
    render(<DialogoVupth />);
    expect(useDialogoStore.getState().hostMontado).toBe(true);
  });

  it("três botões cabem — o Alert do sistema empilha, e o nosso também", () => {
    const { getByTestId, rerender } = render(<DialogoVupth />);
    act(() =>
      void abrirDialogo({
        titulo: "Encerrar expediente",
        mensagem: "Ainda há gente na fila",
        botoes: [{ texto: "Continuar", estilo: "cancel" }, { texto: "Pausar entrada" }, { texto: "Encerrar", estilo: "destructive" }],
      })
    );
    rerender(<DialogoVupth />);

    expect(getByTestId("dialogo-botao-2")).toBeTruthy();
  });
});
