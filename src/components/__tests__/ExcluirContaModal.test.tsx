import { fireEvent, render } from "@testing-library/react-native";
import { ExcluirContaModal } from "../ExcluirContaModal";

const base = { visible: true, onConfirm: jest.fn(), onClose: jest.fn() };

// Espelho do DeleteAccountModal do client: pede a senha atual (o app fica
// logado por muito tempo; apagar e irreversivel) e diz o que REALMENTE
// acontece — o backend anonimiza, o historico do atendimento sobrevive.
describe("ExcluirContaModal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("explica o que acontece e pede a senha", () => {
    const { getByText, getByPlaceholderText } = render(<ExcluirContaModal {...base} />);
    expect(getByText("Deletar conta")).toBeTruthy();
    expect(getByText(/dados pessoais serão apagados/)).toBeTruthy();
    expect(getByPlaceholderText("Senha atual")).toBeTruthy();
  });

  it("sem senha, confirmar nao faz nada", () => {
    const onConfirm = jest.fn();
    const { getByLabelText } = render(<ExcluirContaModal {...base} onConfirm={onConfirm} />);
    fireEvent.press(getByLabelText("Deletar minha conta"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("com senha, confirma com ela", () => {
    const onConfirm = jest.fn();
    const { getByLabelText, getByPlaceholderText } = render(
      <ExcluirContaModal {...base} onConfirm={onConfirm} />
    );
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(getByLabelText("Deletar minha conta"));
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

  it("enquanto apaga, o botao mostra que esta apagando e nao confirma de novo", () => {
    const onConfirm = jest.fn();
    const view = render(<ExcluirContaModal {...base} onConfirm={onConfirm} isDeleting />);
    fireEvent.changeText(view.getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(view.getByLabelText("Deletando..."));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
