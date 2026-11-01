import { Text } from "react-native";
import { simularNativoDoAsyncStorage } from "../../test-utils/nativoDoAsyncStorage";
import { render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProfessionalsWithQueueQuery } from "@hooks/useQueuePolling";
import { api } from "@lib/api";

// partner-cai-de-novo (01/11): o async-storage lancava DENTRO do efeito que le a
// ultima fila ao montar, e o React tratava como fatal. Aqui o efeito monta com o
// modulo ausente e com o pacote lancando em getItem: a fila tem de montar igual.
jest.mock("@lib/api", () => ({ api: { get: jest.fn() } }));
jest.mock("@hooks/useQueueSocket", () => ({ useQueueSocket: jest.fn() }));

function Tela() {
  const q = useProfessionalsWithQueueQuery("e1");
  return <Text testID="estado">{q.data ? "com-dados" : "sem-dados"}</Text>;
}

let client: QueryClient;
const montar = () => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Tela />
    </QueryClientProvider>
  );
};

describe("fila monta sem o async-storage", () => {
  beforeEach(() => (api.get as jest.Mock).mockResolvedValue({ data: { id: "e1", professionals: [] } }));
  afterEach(() => {
    client?.clear();
    jest.restoreAllMocks();
    jest.resetModules();
    jest.dontMock("@react-native-async-storage/async-storage");
  });

  it("modulo nativo ausente", async () => {
    simularNativoDoAsyncStorage(false);
    const { getByTestId } = montar();
    await waitFor(() => expect(getByTestId("estado").props.children).toBe("com-dados"));
  });

  it("pacote presente mas getItem lanca", async () => {
    simularNativoDoAsyncStorage(true);
    jest.doMock("@react-native-async-storage/async-storage", () => ({
      __esModule: true,
      default: {
        getItem: () => {
          throw new Error("lancou dentro do efeito");
        },
        setItem: () => {
          throw new Error("x");
        },
        removeItem: () => {
          throw new Error("x");
        },
      },
    }));
    const { getByTestId } = montar();
    await waitFor(() => expect(getByTestId("estado").props.children).toBe("com-dados"));
  });
});
