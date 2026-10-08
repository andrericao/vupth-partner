import { fireEvent, render } from "@testing-library/react-native";
import { DesativarContaModal } from "../DesativarContaModal";

const base = { visible: true, onConfirm: jest.fn(), onClose: jest.fn() };

// desativar-conta (c0f5b17): reversivel — a pessoa volta entrando de novo. Pede
// a senha (o backend exige) e diz o que acontece com a loja de quem e dono.
describe("DesativarContaModal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("explica que e reversivel e pede a senha", () => {
    const { getByText, getByPlaceholderText } = render(<DesativarContaModal {...base} />);
    expect(getByText("Desativar conta")).toBeTruthy();
    expect(getByText(/entrar de novo com o seu e-mail e senha/)).toBeTruthy();
    expect(getByPlaceholderText("Senha atual")).toBeTruthy();
  });

  it("para o dono, diz o que acontece com a loja", () => {
    const { getByText, queryByText, rerender } = render(<DesativarContaModal {...base} />);
    expect(queryByText(/sua loja sai da busca/)).toBeNull();
    rerender(<DesativarContaModal {...base} ehDono />);
    expect(getByText(/sua loja sai da busca/)).toBeTruthy();
  });

  it("sem senha, confirmar nao faz nada; com senha, confirma com ela", () => {
    const onConfirm = jest.fn();
    const { getByLabelText, getByPlaceholderText } = render(
      <DesativarContaModal {...base} onConfirm={onConfirm} />
    );
    fireEvent.press(getByLabelText("Desativar minha conta"));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(getByLabelText("Desativar minha conta"));
    expect(onConfirm).toHaveBeenCalledWith("segredo");
  });

  it("mostra o erro que vier e, desativando, nao confirma de novo", () => {
    const onConfirm = jest.fn();
    const { getByTestId, getByPlaceholderText, getByLabelText } = render(
      <DesativarContaModal {...base} onConfirm={onConfirm} isDeactivating error="Senha incorreta." />
    );
    expect(getByTestId("deactivate-account-error")).toHaveTextContent("Senha incorreta.");
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(getByLabelText("Desativando..."));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cancelar limpa a senha e fecha", () => {
    const onClose = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <DesativarContaModal {...base} onClose={onClose} />
    );
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(getByText("Cancelar"));
    expect(onClose).toHaveBeenCalled();
    expect(getByPlaceholderText("Senha atual").props.value).toBe("");
  });
});
