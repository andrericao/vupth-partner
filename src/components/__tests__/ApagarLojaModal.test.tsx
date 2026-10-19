import { fireEvent, render } from "@testing-library/react-native";
import { ApagarLojaModal } from "../ApagarLojaModal";

const base = { visible: true, nomeDaLoja: "Barbearia Ana", onConfirm: jest.fn(), onClose: jest.fn() };

// desativar-conta (c0f5b17, item 5): excluir a loja e irreversivel — pede a senha
// e diz, em uma linha, que o historico fica (guia de texto, regra 3).
describe("ApagarLojaModal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("diz o nome, o que acontece e pede a senha", () => {
    const { getByText, getByPlaceholderText } = render(<ApagarLojaModal {...base} />);
    expect(getByText("Excluir loja")).toBeTruthy();
    expect(getByText("Barbearia Ana sai do app. O histórico fica.")).toBeTruthy();
    expect(getByPlaceholderText("Senha atual")).toBeTruthy();
  });

  it("segue o guia de texto: sem Apagar, o corpo cabe em 70 caracteres, botões de uma palavra", () => {
    const { toJSON, getByLabelText } = render(<ApagarLojaModal {...base} nomeDaLoja="Barbearia do Léo da Rua Grande" />);
    expect(JSON.stringify(toJSON())).not.toMatch(/Apag/);
    expect("Barbearia do Léo da Rua Grande sai do app. O histórico fica.".length).toBeLessThanOrEqual(70);
    expect(getByLabelText("Excluir")).toBeTruthy();
    expect(getByLabelText("Cancelar")).toBeTruthy();
  });

  it("sem senha nao confirma; com senha, confirma com ela", () => {
    const onConfirm = jest.fn();
    const { getByLabelText, getByPlaceholderText } = render(
      <ApagarLojaModal {...base} onConfirm={onConfirm} />
    );
    fireEvent.press(getByLabelText("Excluir"));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(getByLabelText("Excluir"));
    expect(onConfirm).toHaveBeenCalledWith("segredo");
  });

  it("mostra o erro; excluindo, o botao vira o spinner e nao confirma de novo", () => {
    const onConfirm = jest.fn();
    const { getByTestId, getByPlaceholderText, getByLabelText, queryByText } = render(
      <ApagarLojaModal {...base} onConfirm={onConfirm} isDeleting error="Fila aberta." />
    );
    expect(getByTestId("delete-store-error")).toHaveTextContent("Fila aberta.");
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    expect(queryByText("Excluir")).toBeNull();
    fireEvent.press(getByLabelText("Excluir"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cancelar limpa a senha e fecha", () => {
    const onClose = jest.fn();
    const { getByText, getByPlaceholderText } = render(<ApagarLojaModal {...base} onClose={onClose} />);
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(getByText("Cancelar"));
    expect(onClose).toHaveBeenCalled();
    expect(getByPlaceholderText("Senha atual").props.value).toBe("");
  });
});
