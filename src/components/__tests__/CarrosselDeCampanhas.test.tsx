import { fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { CarrosselDeCampanhas, ESPACO_DO_CARROSSEL } from "../CarrosselDeCampanhas";
import type { Campanha } from "@lib/campanhas";

const c = (id: string, name: string): Campanha => ({ id, name, type: "REFERRAL_BONUS", value_amount: 5 });

const comQuery = (ui: React.ReactElement) =>
  renderWithProvider(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
  );

describe("CarrosselDeCampanhas", () => {
  it("sem campanha o bloco some inteiro", async () => {
    const listar = jest.fn().mockResolvedValue([]);
    const { queryByTestId } = comQuery(<CarrosselDeCampanhas listar={listar} />);
    await waitFor(() => expect(listar).toHaveBeenCalled());
    expect(queryByTestId("campanhas-da-home")).toBeNull();
  });

  it("se a chamada falha, some tambem", async () => {
    const listar = jest.fn().mockRejectedValue(new Error("x"));
    const { queryByTestId } = comQuery(<CarrosselDeCampanhas listar={listar} />);
    await waitFor(() => expect(listar).toHaveBeenCalled());
    expect(queryByTestId("campanhas-da-home")).toBeNull();
  });

  it("mostra o nome de cada campanha e avisa o toque", async () => {
    const listar = jest.fn().mockResolvedValue([c("1", "Compartilhe e ganhe"), c("2", "Acesse os cupons")]);
    const aoTocar = jest.fn();
    const { findByText, getAllByTestId } = comQuery(
      <CarrosselDeCampanhas listar={listar} aoTocar={aoTocar} />
    );
    await findByText("Compartilhe e ganhe");
    await findByText("Acesse os cupons");
    fireEvent.press(getAllByTestId("campanha-da-home")[1]);
    expect(aoTocar).toHaveBeenCalledWith(expect.objectContaining({ id: "2" }));
  });

  it("o vao entre os cards passa do picote (10px de cada lado), sem encostar na Fila", () => {
    expect(ESPACO_DO_CARROSSEL.gap).toBeGreaterThan(20);
    expect(ESPACO_DO_CARROSSEL.paddingHorizontal).toBeGreaterThanOrEqual(12);
  });
});
