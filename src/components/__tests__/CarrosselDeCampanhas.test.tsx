import { fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderWithProvider } from "../../test-utils/renderWithProvider";
import { CarrosselDeCampanhas, ESPACO_DO_CARROSSEL } from "../CarrosselDeCampanhas";
import type { Campanha } from "@lib/campanhas";

const c = (id: string, name: string): Campanha => ({ id, name, type: "REFERRAL_BONUS", value_amount: 5 });

// promocoes-em-secoes: sem a API de verdade nos testes, ninguem participa de nada.
const NENHUMA = () => Promise.resolve([] as string[]);

const comQuery = (ui: React.ReactElement) =>
  renderWithProvider(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
  );

describe("CarrosselDeCampanhas", () => {
  it("sem campanha o bloco some inteiro", async () => {
    const listar = jest.fn().mockResolvedValue([]);
    const { queryByTestId } = comQuery(<CarrosselDeCampanhas listar={listar} participo={NENHUMA} />);
    await waitFor(() => expect(listar).toHaveBeenCalled());
    expect(queryByTestId("campanhas-da-home")).toBeNull();
  });

  it("se a chamada falha, some tambem", async () => {
    const listar = jest.fn().mockRejectedValue(new Error("x"));
    const { queryByTestId } = comQuery(<CarrosselDeCampanhas listar={listar} participo={NENHUMA} />);
    await waitFor(() => expect(listar).toHaveBeenCalled());
    expect(queryByTestId("campanhas-da-home")).toBeNull();
  });

  it("mostra o nome de cada campanha e avisa o toque", async () => {
    const listar = jest.fn().mockResolvedValue([c("1", "Compartilhe e ganhe"), c("2", "Acesse os cupons")]);
    const aoTocar = jest.fn();
    const { findByText, getAllByTestId } = comQuery(
      <CarrosselDeCampanhas listar={listar} aoTocar={aoTocar} participo={NENHUMA} />
    );
    await findByText("Compartilhe e ganhe");
    await findByText("Acesse os cupons");
    fireEvent.press(getAllByTestId("campanha-da-home")[1]);
    expect(aoTocar).toHaveBeenCalledWith(expect.objectContaining({ id: "2" }));
  });

  // promocoes-em-secoes (Andre, 05/11): o carrossel so mostra as Disponiveis.
  it("a campanha de que ja participa e a encerrada nao entram; falha ao saber de quais participa nao derruba", async () => {
    const listar = jest.fn().mockResolvedValue([
      c("1", "Ja participo"),
      c("2", "Disponivel"),
      { ...c("3", "Velha"), ends_at: "2020-01-01T00:00:00-03:00" },
    ]);
    const r = comQuery(<CarrosselDeCampanhas listar={listar} participo={() => Promise.resolve(["1"])} />);
    await r.findByText("Disponivel");
    expect(r.queryByText("Ja participo")).toBeNull();
    expect(r.queryByText("Velha")).toBeNull();
    r.unmount();

    const r2 = comQuery(
      <CarrosselDeCampanhas listar={jest.fn().mockResolvedValue([c("1", "Ja participo")])} participo={() => Promise.reject(new Error("x"))} />
    );
    expect(await r2.findByText("Ja participo")).toBeTruthy();
  });

  it("o vao entre os cards e de 12px e o picote sai so de um lado, sem encostar no vizinho", () => {
    expect(ESPACO_DO_CARROSSEL.gap).toBe(12);
    expect(ESPACO_DO_CARROSSEL.paddingHorizontal).toBeGreaterThanOrEqual(12);
  });
});
