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

  it("'Fechar fila' chama comingSoon", () => {
    const { getByLabelText } = renderWithProvider(
      <ProfessionalStatusControl hasQueue={false} />
    );
    fireEvent.press(getByLabelText("Fechar fila"));
    expect(comingSoon).toHaveBeenCalledWith("Fechar fila");
  });
});
