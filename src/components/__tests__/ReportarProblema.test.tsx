import { fireEvent } from "@testing-library/react-native";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { ReportarProblema } from "../ReportarProblema";
import { reportarProblema } from "@lib/sentry";
import { avisar } from "@lib/confirmar";

jest.mock("@lib/sentry", () => ({ reportarProblema: jest.fn() }));
jest.mock("@lib/confirmar", () => ({ avisar: jest.fn().mockResolvedValue(undefined) }));

describe("ReportarProblema", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Enviar so vale com mensagem; manda nome e mensagem e agradece", async () => {
    (reportarProblema as jest.Mock).mockReturnValue(true);
    const onFechar = jest.fn();
    const { getByTestId } = renderWithProvider(<ReportarProblema visivel onFechar={onFechar} />);
    fireEvent.changeText(getByTestId("reportar-nome"), "Ana");
    fireEvent.changeText(getByTestId("reportar-mensagem"), "a fila travou");
    fireEvent.press(getByTestId("reportar-enviar"));
    expect(reportarProblema).toHaveBeenCalledWith({ mensagem: "a fila travou", nome: "Ana" });
    expect(onFechar).toHaveBeenCalled();
    await Promise.resolve();
    expect(avisar).toHaveBeenCalledWith({ titulo: "Enviado", mensagem: "Obrigado. Vamos olhar." });
  });

  it("falha ao enviar: diz que nao enviou", async () => {
    (reportarProblema as jest.Mock).mockReturnValue(false);
    const { getByTestId } = renderWithProvider(<ReportarProblema visivel onFechar={jest.fn()} />);
    fireEvent.changeText(getByTestId("reportar-mensagem"), "algo");
    fireEvent.press(getByTestId("reportar-enviar"));
    await Promise.resolve();
    expect(avisar).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Não enviou" }));
  });

  it("Cancelar fecha sem enviar", () => {
    const onFechar = jest.fn();
    const { getByTestId } = renderWithProvider(<ReportarProblema visivel onFechar={onFechar} />);
    fireEvent.press(getByTestId("reportar-cancelar"));
    expect(onFechar).toHaveBeenCalled();
    expect(reportarProblema).not.toHaveBeenCalled();
  });
});
