import { fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { AvisoDeDivida } from "../AvisoDeDivida";
import { buscarDivida } from "@lib/dividaPorFora";
import { copiarComAviso } from "@lib/copiar";

jest.mock("@lib/dividaPorFora", () => ({
  ...jest.requireActual("@lib/dividaPorFora"),
  buscarDivida: jest.fn(),
}));
jest.mock("@lib/copiar", () => ({ copiarComAviso: jest.fn() }));

const comQuery = (ui: React.ReactElement) =>
  renderWithProvider(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
  );
const BASE = { real: true, open_amount: 0, simulated_amount: 0, limit: 25, over_limit: false, items: [] };

describe("AvisoDeDivida", () => {
  it("passou do limite: mostra o valor, o titular e copia o Pix", async () => {
    (buscarDivida as jest.Mock).mockResolvedValue({
      ...BASE, open_amount: 26.1, over_limit: true, pix_copy_paste: "000201", holder_name: "VUPTH",
    });
    const { findByText, getByTestId } = comQuery(<AvisoDeDivida />);
    await findByText("Você deve R$ 26,10 ao app");
    await findByText("Para: VUPTH");
    fireEvent.press(getByTestId("divida-copiar-pix"));
    expect(copiarComAviso).toHaveBeenCalledWith("000201", "Pix");
  });

  it("sem titular nem Pix a copiar quando abaixo do limite", async () => {
    (buscarDivida as jest.Mock).mockResolvedValue({ ...BASE, open_amount: 5.8, pix_copy_paste: "000201" });
    const { findByText, queryByTestId } = comQuery(<AvisoDeDivida />);
    await findByText("Você deve R$ 5,80 ao app");
    expect(queryByTestId("divida-copiar-pix")).toBeNull();
  });

  it("sem divida a faixa some", async () => {
    (buscarDivida as jest.Mock).mockResolvedValue(BASE);
    const { queryByTestId } = comQuery(<AvisoDeDivida />);
    await waitFor(() => expect(buscarDivida).toHaveBeenCalled());
    expect(queryByTestId("aviso-de-divida")).toBeNull();
  });
});
