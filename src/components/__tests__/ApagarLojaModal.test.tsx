import { fireEvent, render } from "@testing-library/react-native";
import { ApagarLojaModal } from "../ApagarLojaModal";

const base = { visible: true, nomeDaLoja: "Barbearia Ana", onConfirm: jest.fn(), onClose: jest.fn() };

// desativar-conta (c0f5b17, item 5): apagar a loja e irreversivel — pede a senha
// e diz o que acontece com a equipe e com o historico.
describe("ApagarLojaModal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("diz o nome, o que acontece e pede a senha", () => {
    const { getByText, getByPlaceholderText } = render(<ApagarLojaModal {...base} />);
    expect(getByText("Apagar a loja")).toBeTruthy();
    expect(getByText(/Barbearia Ana/)).toBeTruthy();
    expect(getByText(/profissionais saem da loja/)).toBeTruthy();
    expect(getByPlaceholderText("Senha atual")).toBeTruthy();
  });

  it("sem senha nao confirma; com senha, confirma com ela", () => {
    const onConfirm = jest.fn();
    const { getByLabelText, getByPlaceholderText } = render(
      <ApagarLojaModal {...base} onConfirm={onConfirm} />
    );
    fireEvent.press(getByLabelText("Apagar a loja de vez"));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(getByLabelText("Apagar a loja de vez"));
    expect(onConfirm).toHaveBeenCalledWith("segredo");
  });

  it("mostra o erro; apagando, nao confirma de novo", () => {
    const onConfirm = jest.fn();
    const { getByTestId, getByPlaceholderText, getByLabelText } = render(
      <ApagarLojaModal {...base} onConfirm={onConfirm} isDeleting error="Fila aberta." />
    );
    expect(getByTestId("delete-store-error")).toHaveTextContent("Fila aberta.");
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(getByLabelText("Apagando..."));
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
