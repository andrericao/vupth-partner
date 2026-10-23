import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QuantoCobrar } from "@components/QuantoCobrar";
import { QuantoCobrarCard } from "@components/QuantoCobrarCard";
import { router } from "expo-router";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

// aba-de-custos: a calculadora e a porta em Relatorios.
const EXEMPLO = { fixos: 1800, dias: 22, cortesPorDia: 8, custoPorCorte: 4, ganho: 4000 };
const SERVICOS = [
  { id: "1", customName: "Corte", price: 35 },
  { id: "2", customName: "Corte + barba", price: 55 },
];

describe("QuantoCobrar", () => {
  it("carrega o ultimo calculo, calcula e mostra o sugerido, o minimo e a diferenca dos servicos", async () => {
    const carregar = jest.fn().mockResolvedValue(EXEMPLO);
    const salvar = jest.fn().mockResolvedValue(undefined);
    const r = render(<QuantoCobrar servicos={SERVICOS} carregar={carregar} salvar={salvar} />);
    await waitFor(() => expect(r.getByTestId("custos-fixos").props.value).toBe("R$ 1.800,00"));
    fireEvent.press(r.getByTestId("custos-calcular"));
    expect(r.getByTestId("custos-sugerido").props.children).toBe("R$ 37,00");
    expect(r.getByTestId("custos-minimo").props.children.join("")).toContain("R$ 14,00");
    expect(salvar).toHaveBeenCalledWith(EXEMPLO);
    const linhas = r.getAllByTestId("custos-servico");
    expect(linhas).toHaveLength(2);
    expect(r.getByText(/R\$ 35,00\s+−R\$ 2,00/)).toBeTruthy();
    expect(r.queryByText(/R\$ 55,00\s+−/)).toBeNull();
  });

  it("Saiba mais abre a conta e Ajustar volta aos campos", async () => {
    const r = render(
      <QuantoCobrar servicos={[]} carregar={jest.fn().mockResolvedValue(EXEMPLO)} salvar={jest.fn().mockResolvedValue(undefined)} />
    );
    await waitFor(() => expect(r.getByTestId("custos-fixos").props.value).toBe("R$ 1.800,00"));
    fireEvent.press(r.getByTestId("custos-calcular"));
    expect(r.queryByTestId("custos-servicos")).toBeNull();
    fireEvent.press(r.getByTestId("custos-saiba-mais-abrir"));
    expect(r.getByTestId("custos-saiba-mais")).toBeTruthy();
    fireEvent.press(r.getByTestId("custos-ajustar"));
    expect(r.getByTestId("custos-form")).toBeTruthy();
  });

  it("sem custos nem ganho, Calcular fica desabilitado; digitar liga", async () => {
    const vazio = { fixos: 0, dias: 22, cortesPorDia: 8, custoPorCorte: 0, ganho: 0 };
    const r = render(<QuantoCobrar servicos={[]} carregar={jest.fn().mockResolvedValue(vazio)} salvar={jest.fn()} />);
    await waitFor(() => expect(r.getByTestId("custos-dias").props.value).toBe("22"));
    expect(r.getByTestId("custos-calcular").props.accessibilityState?.disabled).toBe(true);
    fireEvent.changeText(r.getByTestId("custos-fixos"), "180000");
    fireEvent.changeText(r.getByTestId("custos-dias"), "2a2");
    fireEvent.changeText(r.getByTestId("custos-cortes"), "8");
    fireEvent.changeText(r.getByTestId("custos-custo"), "400");
    fireEvent.changeText(r.getByTestId("custos-ganho"), "400000");
    expect(r.getByTestId("custos-fixos").props.value).toBe("R$ 1.800,00");
    expect(r.getByTestId("custos-dias").props.value).toBe("22");
    expect(r.getByTestId("custos-calcular").props.accessibilityState?.disabled).toBeFalsy();
  });

  it("falha ao carregar o ultimo calculo deixa os campos no padrao", async () => {
    const carregar = jest.fn().mockRejectedValue(new Error("x"));
    const r = render(<QuantoCobrar servicos={[]} carregar={carregar} salvar={jest.fn()} />);
    await waitFor(() => expect(carregar).toHaveBeenCalled());
    expect(r.getByTestId("custos-dias").props.value).toBe("22");
  });
});

describe("QuantoCobrarCard", () => {
  it("o cartao abre a calculadora", () => {
    const r = render(<QuantoCobrarCard />);
    fireEvent.press(r.getByTestId("quanto-cobrar-card"));
    expect(router.push).toHaveBeenCalledWith("/(professional)/custos");
  });
});
