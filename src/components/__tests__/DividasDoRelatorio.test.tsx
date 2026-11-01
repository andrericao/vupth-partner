import { fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { DividasDoRelatorio, dataCurta, origemDaDivida } from "../DividasDoRelatorio";
import { buscarDivida } from "@lib/dividaPorFora";

jest.mock("@lib/dividaPorFora", () => ({
  ...jest.requireActual("@lib/dividaPorFora"),
  buscarDivida: jest.fn(),
}));

const comQuery = (ui: React.ReactElement) =>
  renderWithProvider(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
  );
const BASE = { real: true, open_amount: 0, simulated_amount: 0, limit: 25, over_limit: false, items: [] };

describe("DividasDoRelatorio", () => {
  it("sem divida: diz que nao ha", async () => {
    (buscarDivida as jest.Mock).mockResolvedValue(BASE);
    const { findByTestId } = comQuery(<DividasDoRelatorio />);
    expect(await findByTestId("dividas-vazio")).toBeTruthy();
  });

  it("lista cada corte recebido por fora e a faixa com o total; a linha abre o atendimento de origem", async () => {
    (buscarDivida as jest.Mock).mockResolvedValue({
      ...BASE,
      open_amount: 5.8,
      items: [
        { attendance_id: "a1", amount: 2.9, origin: "CASH", created_at: "2026-10-20T15:00:00Z" },
        { attendance_id: "a2", amount: 2.9, origin: null, created_at: "2026-10-21T15:00:00Z", simulated: true },
      ],
    });
    const abrir = jest.fn().mockResolvedValue(0);
    const { findByText, getByTestId, getAllByText } = comQuery(<DividasDoRelatorio abrir={abrir} />);
    await findByText("Você deve R$ 5,80 ao app");
    expect(getAllByText("Corte recebido por fora")).toHaveLength(2);
    fireEvent.press(getByTestId("divida-a1"));
    await waitFor(() => expect(abrir).toHaveBeenCalled());
    expect(abrir.mock.calls[0][0]).toMatchObject({ titulo: "Corte recebido por fora" });
    expect(abrir.mock.calls[0][0].mensagem).toContain("dinheiro");
    expect(abrir.mock.calls[0][0].mensagem).toContain("R$ 2,90");
    fireEvent.press(getByTestId("divida-a2"));
    await waitFor(() => expect(abrir).toHaveBeenCalledTimes(2));
    expect(abrir.mock.calls[1][0].mensagem).toContain("fora do app");
    expect(abrir.mock.calls[1][0].mensagem).toContain("(teste)");
  });

  it("data curta e origem: valores soltos", () => {
    expect(dataCurta(null)).toBe("—");
    expect(dataCurta("nao e data")).toBe("—");
    expect(dataCurta("2026-10-20T15:00:00Z")).toBe("20/10");
    expect(origemDaDivida("card")).toBe("cartão");
    expect(origemDaDivida("outro")).toBe("fora do app");
  });
});
