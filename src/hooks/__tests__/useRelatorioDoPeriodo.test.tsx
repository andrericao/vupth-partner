import { render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useRelatorioDoPeriodo } from "../useRelatorioDoPeriodo";

jest.mock("@react-navigation/native", () => ({ useIsFocused: () => true }));

// Relatorios pintam o "Hoje" guardado NA HORA (fila do partner, 25/09): antes a
// tela esperava o GET a cada abertura e mostrava o esqueleto por cima de um
// numero que ela ja tinha. O esqueleto so aparece quando nao ha NADA guardado.
function Tela({ buscar }: { buscar: (de: string, ate: string) => Promise<{ total: number }> }) {
  const r = useRelatorioDoPeriodo("teste", "loja-1", "day", buscar);
  if (r.carregando) return <Text>esqueleto</Text>;
  if (r.erro) return <Text>erro:{r.erro}</Text>;
  return <Text>total:{r.dados?.total}</Text>;
}

let client: QueryClient;
afterEach(() => client?.clear());

const montar = (buscar: (de: string, ate: string) => Promise<{ total: number }>) =>
  render(
    <QueryClientProvider client={client}>
      <Tela buscar={buscar} />
    </QueryClientProvider>
  );

describe("useRelatorioDoPeriodo", () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("primeira vez: esqueleto e depois o numero", async () => {
    montar(async () => ({ total: 3 }));
    expect(screen.getByText("esqueleto")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("total:3")).toBeTruthy());
  });

  it("voltando a tela: o numero guardado aparece NA HORA, sem esqueleto", async () => {
    const primeira = montar(async () => ({ total: 3 }));
    await waitFor(() => expect(screen.getByText("total:3")).toBeTruthy());
    primeira.unmount();

    let soltar: (v: { total: number }) => void = () => {};
    montar(() => new Promise((ok) => (soltar = ok)));
    expect(screen.getByText("total:3")).toBeTruthy();
    expect(screen.queryByText("esqueleto")).toBeNull();

    soltar({ total: 5 });
    await waitFor(() => expect(screen.getByText("total:5")).toBeTruthy());
  });

  it("falha sem nada guardado: mostra o erro", async () => {
    montar(async () => {
      throw new Error("x");
    });
    await waitFor(() => expect(screen.getByText(/^erro:/)).toBeTruthy());
  });

  it("sem loja: nao busca", () => {
    const buscar = jest.fn();
    render(
      <QueryClientProvider client={client}>
        <SemLoja buscar={buscar} />
      </QueryClientProvider>
    );
    expect(buscar).not.toHaveBeenCalled();
  });
});

function SemLoja({ buscar }: { buscar: jest.Mock }) {
  useRelatorioDoPeriodo("teste", null, "day", buscar);
  return <Text>ok</Text>;
}
