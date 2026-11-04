import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithProvider as render } from "../../test-utils/renderWithProvider";
import { EnviarFeedback } from "../EnviarFeedback";

const mockEnviar = jest.fn();
jest.mock("@lib/feedbackPorEmail", () => ({
  FEEDBACK_MAX: 1000,
  enviarFeedback: (t: string) => mockEnviar(t),
}));
const mockAvisar = jest.fn(async (_o?: unknown) => {});
jest.mock("@lib/confirmar", () => ({ avisar: (o: unknown) => mockAvisar(o) }));

describe("EnviarFeedback", () => {
  beforeEach(() => jest.clearAllMocks());

  it("enviar so habilita com texto; envia, agradece e fecha", async () => {
    mockEnviar.mockResolvedValue({ ok: true });
    const onFechar = jest.fn();
    const { getByTestId } = render(<EnviarFeedback visivel onFechar={onFechar} />);
    fireEvent.changeText(getByTestId("feedback-texto"), "Muito bom");
    fireEvent.press(getByTestId("feedback-enviar"));
    await waitFor(() => expect(onFechar).toHaveBeenCalled(), { timeout: 4000 });
    expect(mockEnviar).toHaveBeenCalledWith("Muito bom");
    expect(mockAvisar).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Obrigado" }));
  });

  it("falha: avisa o motivo e mantem a caixa aberta", async () => {
    mockEnviar.mockResolvedValue({ ok: false, mensagem: "Tente amanhã" });
    const onFechar = jest.fn();
    const { getByTestId } = render(<EnviarFeedback visivel onFechar={onFechar} />);
    fireEvent.changeText(getByTestId("feedback-texto"), "oi");
    fireEvent.press(getByTestId("feedback-enviar"));
    await waitFor(() => expect(mockAvisar).toHaveBeenCalledWith({ titulo: "Não enviou", mensagem: "Tente amanhã" }));
    expect(onFechar).not.toHaveBeenCalled();
  });

  it("cancelar fecha sem enviar", () => {
    const onFechar = jest.fn();
    const { getByTestId } = render(<EnviarFeedback visivel onFechar={onFechar} />);
    fireEvent.press(getByTestId("feedback-cancelar"));
    expect(onFechar).toHaveBeenCalled();
    expect(mockEnviar).not.toHaveBeenCalled();
  });
});
