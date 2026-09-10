import { render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { useAnuncioPronto } from "../useAnuncioPronto";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));

const mockAvisar = jest.fn(async () => undefined);
jest.mock("@lib/confirmar", () => ({
  avisar: (...args: unknown[]) => mockAvisar(...(args as [])),
}));

function Tela({ percent }: { percent: number }) {
  useAnuncioPronto("dono", percent, "Pode abrir a loja.");
  return <Text>tela</Text>;
}

// 🔴 "O anúncio de que o estabelecimento já pode atender deve ser um modal"
// (10/09). O que se testa aqui é o CONTRATO do anúncio: uma vez, e no momento
// certo — não a aparência da caixa.
describe("useAnuncioPronto", () => {
  beforeEach(() => jest.clearAllMocks());

  it("não anuncia enquanto o cadastro não fecha", async () => {
    render(<Tela percent={80} />);
    await waitFor(() => expect(mockAvisar).not.toHaveBeenCalled());
  });

  it("anuncia quando fecha em 100%", async () => {
    render(<Tela percent={100} />);
    await waitFor(() => expect(mockAvisar).toHaveBeenCalledTimes(1));
  });

  it("🔴 re-renderizar NÃO abre um segundo modal", async () => {
    // O storage é assíncrono: sem a trava de sessão, duas renderizações
    // seguidas disparariam dois modais antes de a primeira gravação terminar.
    const { rerender } = render(<Tela percent={100} />);
    await waitFor(() => expect(mockAvisar).toHaveBeenCalledTimes(1));
    rerender(<Tela percent={100} />);
    await waitFor(() => expect(mockAvisar).toHaveBeenCalledTimes(1));
  });
});
