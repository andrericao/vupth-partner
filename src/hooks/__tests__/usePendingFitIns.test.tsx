import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePendingFitIns } from "../usePendingFitIns";
import { listarEncaixes } from "@lib/fitIn";
import { ENCAIXE_NOVO_LIGADO } from "@lib/recursos";
import { useProfessionalStore } from "@store/professional.store";

jest.mock("@lib/fitIn", () => ({
  ...jest.requireActual("@lib/fitIn"),
  listarEncaixes: jest.fn(),
}));

const envolver = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

// DEC-144: o encaixe novo fica fora por ora; a chave liga no futuro.
describe("usePendingFitIns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProfessionalStore.setState({ professional: { id: "p1", establishment_id: "l1" } as any });
    (listarEncaixes as jest.Mock).mockResolvedValue([
      { id: "a", status: "PENDING" },
      { id: "b", status: "COUNTERED" },
    ]);
  });

  it("a chave do app esta desligada", () => {
    expect(ENCAIXE_NOVO_LIGADO).toBe(false);
  });

  it("desligado: nao consulta e nao conta", async () => {
    const { result } = renderHook(() => usePendingFitIns(false), { wrapper: envolver });
    await Promise.resolve();
    expect(listarEncaixes).not.toHaveBeenCalled();
    expect(result.current.count).toBe(0);
    expect(result.current.paraResponder).toEqual([]);
  });

  it("ligado: conta so o que espera o profissional", async () => {
    const { result } = renderHook(() => usePendingFitIns(true), { wrapper: envolver });
    await waitFor(() => expect(result.current.count).toBe(1));
    expect(result.current.esperandoOCliente.map((p) => p.id)).toEqual(["b"]);
  });
});
