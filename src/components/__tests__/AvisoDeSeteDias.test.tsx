import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { AvisoDeSeteDias } from "../AvisoDeSeteDias";
import { useProfessionalStore } from "@store/professional.store";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
const mockBuscar = jest.fn();
jest.mock("@lib/gateway", () => ({
  ...jest.requireActual("@lib/gateway"),
  buscarGateway: () => mockBuscar(),
}));

const comQuery = (ui: ReactElement) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("AvisoDeSeteDias (aviso-7-dias-banner, DEC-163)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProfessionalStore.setState({ professional: { id: "p" } as any });
  });

  it("mostra a faixa durante o prazo e leva as Configuracoes", async () => {
    mockBuscar.mockResolvedValue({ connected: false, notice: { changes_at: "2026-11-17T10:00:00" } });
    const { findByTestId } = comQuery(<AvisoDeSeteDias />);
    const faixa = await findByTestId("aviso-7-dias");
    expect(faixa).toHaveTextContent(/Pagamentos pelo app a partir de 17\/11/);
    fireEvent.press(faixa);
    expect(router.push).toHaveBeenCalledWith({ pathname: "/(professional)/settings-account", params: { aviso: "cpf" } });
  });

  it("sem aviso do Backend, ou com CPF informado, nao aparece", async () => {
    mockBuscar.mockResolvedValue({ connected: true, notice: null });
    const a = comQuery(<AvisoDeSeteDias />);
    await waitFor(() => expect(mockBuscar).toHaveBeenCalled());
    expect(a.queryByTestId("aviso-7-dias")).toBeNull();

    useProfessionalStore.setState({ professional: { id: "p", cpf: "***.982.247-**" } as any });
    mockBuscar.mockResolvedValue({ connected: false, notice: { changes_at: "2026-11-17T10:00:00" } });
    const b = comQuery(<AvisoDeSeteDias />);
    await waitFor(() => expect(mockBuscar).toHaveBeenCalledTimes(2));
    expect(b.queryByTestId("aviso-7-dias")).toBeNull();
  });
});
