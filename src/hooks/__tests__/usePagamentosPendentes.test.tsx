import { render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { usePagamentosPendentes } from "../usePagamentosPendentes";

const mockGet = jest.fn();
jest.mock("@lib/api", () => ({
  api: { get: (...args: unknown[]) => mockGet(...args) },
}));

function Tela({ ativo }: { ativo: boolean }) {
  const { aguardando, itens } = usePagamentosPendentes(ativo);
  return (
    <Text>
      aguardando:{aguardando} itens:{itens.length}
    </Text>
  );
}

let client: QueryClient;
afterEach(() => client?.clear());

function montar(ativo: boolean) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Tela ativo={ativo} />
    </QueryClientProvider>
  );
}

describe("usePagamentosPendentes", () => {
  beforeEach(() => mockGet.mockReset());

  it("conta os que o cliente diz que pagou e lista todos", async () => {
    mockGet.mockResolvedValue({
      data: { awaiting_count: 1, items: [{ attendance_id: "a1" }, { attendance_id: "a2" }] },
    });
    montar(true);
    await waitFor(() => expect(screen.getByText("aguardando:1 itens:2")).toBeTruthy());
  });

  it("desligado (sem profissional) nao busca", () => {
    montar(false);
    expect(screen.getByText("aguardando:0 itens:0")).toBeTruthy();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
