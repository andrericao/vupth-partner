import { waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { AvisoCienciaDePreco } from "../AvisoCienciaDePreco";
import { buscarPolitica } from "@lib/cienciaDePreco";

jest.mock("@lib/cienciaDePreco", () => ({
  ...jest.requireActual("@lib/cienciaDePreco"),
  buscarPolitica: jest.fn(),
}));

const comQuery = (ui: React.ReactElement) =>
  renderWithProvider(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
  );

describe("AvisoCienciaDePreco", () => {
  it("aparece com politica nova sem ciencia, com o prazo", async () => {
    (buscarPolitica as jest.Mock).mockResolvedValue({
      version: 2, acknowledged: false, noticed_at: "2026-10-23T10:00:00Z", days_left: 4,
    });
    const { findByTestId, findByText } = comQuery(<AvisoCienciaDePreco />);
    await findByTestId("aviso-ciencia-de-preco");
    await findByText(/Faltam 4 dias/);
  });

  it("some sem politica ou depois da ciencia", async () => {
    (buscarPolitica as jest.Mock).mockResolvedValue({ version: 2, acknowledged: true, noticed_at: "x" });
    const { queryByTestId } = comQuery(<AvisoCienciaDePreco />);
    await waitFor(() => expect(buscarPolitica).toHaveBeenCalled());
    expect(queryByTestId("aviso-ciencia-de-preco")).toBeNull();
  });
});
