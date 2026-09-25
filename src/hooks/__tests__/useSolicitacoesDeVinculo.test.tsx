import { render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useSolicitacoesDeVinculo } from "../useSolicitacoesDeVinculo";

const mockGet = jest.fn();
jest.mock("@lib/api", () => ({
  api: { get: (...args: unknown[]) => mockGet(...args) },
}));

function Tela({ id }: { id: string | null }) {
  const n = useSolicitacoesDeVinculo(id);
  return <Text>pendentes:{n}</Text>;
}

// O hook refaz a busca a cada 60s: sem limpar o cliente, o timer segura o jest.
let client: QueryClient;
afterEach(() => client?.clear());

function montar(id: string | null) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Tela id={id} />
    </QueryClientProvider>
  );
}

describe("useSolicitacoesDeVinculo", () => {
  beforeEach(() => mockGet.mockReset());

  it("conta os pedidos pendentes da loja", async () => {
    mockGet.mockResolvedValue({
      data: [
        { type: "REQUEST", status: "PENDING" },
        { type: "INVITATION", status: "PENDING" },
      ],
    });
    montar("est-1");
    await waitFor(() => expect(screen.getByText("pendentes:1")).toBeTruthy());
    expect(mockGet).toHaveBeenCalledWith("/establishment/est-1/affiliations");
  });

  it("sem loja: nao busca e fica em zero", () => {
    montar(null);
    expect(screen.getByText("pendentes:0")).toBeTruthy();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
