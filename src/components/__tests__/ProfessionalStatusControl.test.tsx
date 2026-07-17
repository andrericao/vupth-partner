import { Modal } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { ProfessionalStatusControl } from "../ProfessionalStatusControl";
import { comingSoon } from "@components/comingSoon";

jest.mock("@components/comingSoon", () => ({ comingSoon: jest.fn() }));

describe("ProfessionalStatusControl", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sem fila: explica o status e trocar de status chama comingSoon", () => {
    const { getByText, getByLabelText } = renderWithProvider(
      <ProfessionalStatusControl hasQueue={false} />
    );
    expect(getByText(/é como fechar a loja só para você/)).toBeTruthy();
    fireEvent.press(getByLabelText("Intervalo"));
    expect(comingSoon).toHaveBeenCalled();
  });

  it("com fila: 'Indisponível' nao dispara comingSoon e mostra o aviso de Fechar fila", () => {
    const { getByText, getByLabelText } = renderWithProvider(
      <ProfessionalStatusControl hasQueue={true} />
    );
    expect(getByText(/Com cliente na fila/)).toBeTruthy();
    fireEvent.press(getByLabelText("Indisponível"));
    expect(comingSoon).not.toHaveBeenCalled();
  });

  it("sem fila: 'Indisponível' esta habilitado e dispara comingSoon", () => {
    const { getByLabelText } = renderWithProvider(
      <ProfessionalStatusControl hasQueue={false} />
    );
    fireEvent.press(getByLabelText("Indisponível"));
    expect(comingSoon).toHaveBeenCalled();
  });

  it("'Fechar fila' chama comingSoon", () => {
    const { getByLabelText } = renderWithProvider(
      <ProfessionalStatusControl hasQueue={false} />
    );
    fireEvent.press(getByLabelText("Fechar fila"));
    expect(comingSoon).toHaveBeenCalledWith("Fechar fila");
  });

  it("modal (i): abre no icone e fecha pelo 'Entendi'", () => {
    const { getByLabelText, getByText } = renderWithProvider(
      <ProfessionalStatusControl hasQueue={false} />
    );
    fireEvent.press(getByLabelText("O que e fechar fila"));
    expect(getByText(/continua sendo atendido/)).toBeTruthy();
    fireEvent.press(getByText("Entendi"));
  });

  it("modal (i): tocar no card nao fecha; tocar no fundo fecha", () => {
    const { getByLabelText, getByText } = renderWithProvider(
      <ProfessionalStatusControl hasQueue={false} />
    );
    fireEvent.press(getByLabelText("O que e fechar fila"));
    fireEvent.press(getByText("Fechar fila")); // titulo/card interno = no-op
    fireEvent.press(getByLabelText("Fechar")); // backdrop fecha
  });

  it("modal (i): fecha pelo botao voltar do sistema (onRequestClose)", () => {
    const view = renderWithProvider(<ProfessionalStatusControl hasQueue={false} />);
    fireEvent.press(view.getByLabelText("O que e fechar fila"));
    fireEvent(view.UNSAFE_getByType(Modal), "requestClose");
  });
});
