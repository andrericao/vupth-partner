import { Linking } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { DesativarContaModal } from "../DesativarContaModal";
import { SUPORTE_URL } from "@lib/suporte";

const base = { visible: true, onConfirm: jest.fn(), onClose: jest.fn() };

// desativar-conta (c0f5b17): reversivel — a pessoa volta entrando de novo. Pede
// a senha (o backend exige) e diz o que acontece com a loja de quem e dono.
// Corpo de uma linha e o resto no "Saiba mais" (guia de texto, regras 3 e 4).
describe("DesativarContaModal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("explica que e reversivel e pede a senha", () => {
    const { getByText, getByPlaceholderText } = render(<DesativarContaModal {...base} />);
    expect(getByText("Desativar conta")).toBeTruthy();
    expect(getByText("Nada é apagado. Para voltar, entre de novo.")).toBeTruthy();
    expect(getByPlaceholderText("Senha atual")).toBeTruthy();
  });

  it("o Saiba mais abre o artigo da conta no navegador", () => {
    const abrir = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { getByText, getByTestId } = render(<DesativarContaModal {...base} />);
    expect(getByText("Saiba mais")).toBeTruthy();
    fireEvent.press(getByTestId("desativar-saiba-mais"));
    expect(abrir).toHaveBeenCalledWith(`${SUPORTE_URL}artigos/parceiro/conta.html`);
    abrir.mockRestore();
  });

  it("segue o guia de texto: botões de uma palavra, sem 'minha conta'", () => {
    const { getByLabelText } = render(<DesativarContaModal {...base} />);
    expect(getByLabelText("Desativar")).toBeTruthy();
    expect(getByLabelText("Cancelar")).toBeTruthy();
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
    fireEvent.press(getByLabelText("Desativar"));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    fireEvent.press(getByLabelText("Desativar"));
    expect(onConfirm).toHaveBeenCalledWith("segredo");
  });

  it("mostra o erro que vier e, desativando, o botao vira o spinner e nao confirma de novo", () => {
    const onConfirm = jest.fn();
    const { getByTestId, getByPlaceholderText, getByLabelText, queryByText } = render(
      <DesativarContaModal {...base} onConfirm={onConfirm} isDeactivating error="Senha incorreta." />
    );
    expect(getByTestId("deactivate-account-error")).toHaveTextContent("Senha incorreta.");
    fireEvent.changeText(getByPlaceholderText("Senha atual"), "segredo");
    expect(queryByText("Desativar")).toBeNull();
    fireEvent.press(getByLabelText("Desativar"));
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
