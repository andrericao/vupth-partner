import { render, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { CartaoDeEncaixe } from "../CartaoDeEncaixe";
import type { ApoioDoEncaixe, PedidoDeEncaixe } from "@lib/fitIn";

const pedido: PedidoDeEncaixe = {
  id: "e1", status: "PENDING", aheadCount: 2, desiredTime: "2026-11-02T15:00:00", currentExtra: 12.5,
  lastOfferBy: "CLIENT", attendanceId: null, createdAt: "2026-11-02T14:00:00",
};
const apoio: ApoioDoEncaixe = {
  aheadNow: 2, behindNow: 1, durationMinutes: 30, sliceMinutesPerClient: 10, absorbedUnnoticed: false,
  estimatedFinish: null, closesAt: "18:00:00", passesClosing: true,
};

function montar(extra: Partial<React.ComponentProps<typeof CartaoDeEncaixe>> = {}) {
  const props = {
    pedido,
    onAceitar: jest.fn().mockResolvedValue(undefined),
    onRecusar: jest.fn().mockResolvedValue(undefined),
    onContrapor: jest.fn().mockResolvedValue(undefined),
    apoio: jest.fn().mockResolvedValue(apoio),
    ...extra,
  };
  render(<CartaoDeEncaixe {...props} />);
  return props;
}

describe("CartaoDeEncaixe", () => {
  it("mostra o lugar, o adicional e o apoio, sem nome de cliente", async () => {
    montar();
    expect(screen.getByText(/depois de 2 clientes/)).toBeTruthy();
    expect(screen.getByTestId("encaixe-adicional")).toBeTruthy();
    expect(await screen.findByText("Passa do fechamento (18:00).")).toBeTruthy();
  });

  it("aceitar e recusar chamam o pai com o id", async () => {
    const p = montar();
    fireEvent.press(screen.getByTestId("encaixe-aceitar"));
    await waitFor(() => expect(p.onAceitar).toHaveBeenCalledWith("e1"));
    fireEvent.press(screen.getByText("Recusar"));
    await waitFor(() => expect(p.onRecusar).toHaveBeenCalledWith("e1"));
  });

  it("contrapor pede o valor, so envia valor valido", async () => {
    const p = montar();
    fireEvent.press(screen.getByTestId("encaixe-contrapor"));
    fireEvent.changeText(screen.getByTestId("encaixe-contraproposta"), "0");
    expect(screen.getByTestId("encaixe-enviar-valor").props.accessibilityState?.disabled ?? true).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("encaixe-contraproposta"), "15,50");
    fireEvent.press(screen.getByTestId("encaixe-enviar-valor"));
    await waitFor(() => expect(p.onContrapor).toHaveBeenCalledWith("e1", 15.5));
  });

  it("erro do servidor aparece no cartao", async () => {
    montar({ onAceitar: jest.fn().mockRejectedValue(new Error("x")) });
    fireEvent.press(screen.getByTestId("encaixe-aceitar"));
    expect(await screen.findByText(/Não foi possível responder o encaixe/)).toBeTruthy();
  });

  it("se o apoio falhar, o cartao segue sem ele", async () => {
    montar({ apoio: jest.fn().mockRejectedValue(new Error("x")) });
    await Promise.resolve();
    expect(screen.queryByTestId("encaixe-apoio")).toBeNull();
    expect(screen.getByTestId("encaixe-aceitar")).toBeTruthy();
  });
});
