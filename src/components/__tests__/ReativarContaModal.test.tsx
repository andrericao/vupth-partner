import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ReativarContaModal } from "../ReativarContaModal";

const base = { aviso: "boas-vindas" as const, onReativar: jest.fn(), onSoConsultar: jest.fn() };

// desativar-conta (Andre, 08/10): "apos logar com a conta desativada, ele recebe
// as boas-vindas e tem a opcao de ativar ou nao" — o login nao reativa sozinho.
describe("ReativarContaModal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sem aviso, nao aparece", () => {
    const { queryByText } = render(<ReativarContaModal {...base} aviso={null} />);
    expect(queryByText("Bem-vindo de volta")).toBeNull();
  });

  it("no login: boas-vindas com Reativar e So consultar", () => {
    const { getByText } = render(<ReativarContaModal {...base} />);
    expect(getByText("Bem-vindo de volta")).toBeTruthy();
    expect(getByText("Reativar")).toBeTruthy();
    expect(getByText("Só consultar")).toBeTruthy();
  });

  it("no meio do uso (403): diz que a acao pede a conta ativa", () => {
    const { getByText } = render(<ReativarContaModal {...base} aviso="bloqueado" />);
    expect(getByText("Sua conta está desativada")).toBeTruthy();
    expect(getByText(/reative a conta/)).toBeTruthy();
  });

  it("So consultar fecha sem reativar", () => {
    const onSoConsultar = jest.fn();
    const onReativar = jest.fn();
    const { getByText } = render(
      <ReativarContaModal {...base} onSoConsultar={onSoConsultar} onReativar={onReativar} />
    );
    fireEvent.press(getByText("Só consultar"));
    expect(onSoConsultar).toHaveBeenCalled();
    expect(onReativar).not.toHaveBeenCalled();
  });

  it("Reativar chama e, se falhar, mostra o erro e deixa tentar de novo", async () => {
    const onReativar = jest.fn().mockRejectedValueOnce(new Error("Network Error")).mockResolvedValueOnce(undefined);
    const { getByText, findByTestId } = render(<ReativarContaModal {...base} onReativar={onReativar} />);

    fireEvent.press(getByText("Reativar"));
    expect(await findByTestId("reactivate-error")).toBeTruthy();

    fireEvent.press(getByText("Reativar"));
    await waitFor(() => expect(onReativar).toHaveBeenCalledTimes(2));
  });
});
