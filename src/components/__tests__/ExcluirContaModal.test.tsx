import { fireEvent, render } from "@testing-library/react-native";
import { ExcluirContaModal } from "../ExcluirContaModal";

const base = { visible: true, onConfirm: jest.fn(), onClose: jest.fn() };

// Espelho do DeleteAccountModal do client: pede a senha atual (o app fica
// logado por muito tempo; excluir e irreversivel) e diz o que REALMENTE
// acontece — o backend anonimiza, o historico do atendimento sobrevive. Em uma
// linha (guia de texto, regra 3), com a palavra do vocabulario: Excluir.
describe("ExcluirContaModal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("explica o que acontece e pede a senha", () => {
    const { getByText, getByPlaceholderText } = render(<ExcluirContaModal {...base} />);
    expect(getByText("Excluir conta")).toBeTruthy();
    expect(getByText("Seus dados são apagados; o histórico da loja fica sem o seu nome.")).toBeTruthy();
    expect(getByPlaceholderText("Senha atual")).toBeTruthy();
  });

  it("segue o guia de texto: sem Deletar, corpo de até 70 caracteres, botões de uma palavra", () => {
    const { toJSON, getByLabelText } = render(<ExcluirContaModal {...base} />);
    const texto = JSON.stringify(toJSON());
    expect(texto).not.toMatch(/Delet/);
    expect("Seus dados são apagados; o histórico da loja fica sem o seu nome.".length).toBeLessThanOrEqual(70);
    expect(getByLabelText("Excluir")).toBeTruthy();
    expect(getByLabelText("Cancelar")).toBeTruthy();
  });

  it("sem senha, confirmar nao faz nada", () => {
    const onConfirm = jest.fn();
    const { getByLabelText } = render(<ExcluirContaModal {...base} onConfirm={onConfirm} />);
    fireEvent.press(getByLabelText("Excluir"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("com senha, confirma com ela", () => {
    const onConfirm = jest.fn();
    const { getByLabelText, getByPlaceholderText } = render(
      <ExcluirContaModal {...base} onConfirm={onConfirm} />
    );
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(getByLabelText("Excluir"));
    expect(onConfirm).toHaveBeenCalledWith("segredo");
  });

  it("mostra o erro que vier", () => {
    const { getByTestId } = render(<ExcluirContaModal {...base} error="Senha incorreta." />);
    expect(getByTestId("delete-account-error")).toHaveTextContent("Senha incorreta.");
  });

  it("cancelar fecha e esquece a senha digitada", () => {
    const onClose = jest.fn();
    const view = render(<ExcluirContaModal {...base} onClose={onClose} />);
    fireEvent.changeText(view.getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(view.getByLabelText("Cancelar"));
    expect(onClose).toHaveBeenCalled();
    expect(view.getByPlaceholderText("Senha atual").props.value).toBe("");
  });

  it("enquanto exclui, o botao vira o spinner (sem 'Excluindo...') e nao confirma de novo", () => {
    const onConfirm = jest.fn();
    const view = render(<ExcluirContaModal {...base} onConfirm={onConfirm} isDeleting />);
    fireEvent.changeText(view.getByPlaceholderText("Senha atual"), "segredo");
    expect(view.queryByText("Excluir")).toBeNull();
    fireEvent.press(view.getByLabelText("Excluir"));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
