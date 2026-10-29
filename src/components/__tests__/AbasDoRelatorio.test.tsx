import { fireEvent, render, screen } from "@testing-library/react-native";
import { AbasDoRelatorio } from "../AbasDoRelatorio";

// dividas-e-pendentes-no-relatorio (Andre, 29/10; mockup "abas no topo").
describe("AbasDoRelatorio", () => {
  it("tres abas, com o numero no rotulo de Pendentes e Dividas", () => {
    render(<AbasDoRelatorio aba="historico" onMudar={jest.fn()} pendentes={3} dividas={2} />);
    expect(screen.getByText("Histórico")).toBeTruthy();
    expect(screen.getByText("Pendentes · 3")).toBeTruthy();
    expect(screen.getByText("Dívidas · 2")).toBeTruthy();
  });

  it("sem itens o rotulo vai sem numero", () => {
    render(<AbasDoRelatorio aba="historico" onMudar={jest.fn()} pendentes={0} dividas={0} />);
    expect(screen.getByText("Pendentes")).toBeTruthy();
    expect(screen.getByText("Dívidas")).toBeTruthy();
  });

  it("tocar numa aba avisa qual; a ativa fica selecionada", () => {
    const onMudar = jest.fn();
    render(<AbasDoRelatorio aba="pendentes" onMudar={onMudar} pendentes={1} dividas={0} />);
    expect(screen.getByTestId("aba-relatorio-pendentes").props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId("aba-relatorio-dividas").props.accessibilityState).toEqual({ selected: false });
    fireEvent.press(screen.getByTestId("aba-relatorio-dividas"));
    expect(onMudar).toHaveBeenCalledWith("dividas");
    fireEvent.press(screen.getByTestId("aba-relatorio-historico"));
    expect(onMudar).toHaveBeenCalledWith("historico");
  });

  it("o dot so aparece quando ha 'ja paguei' a conferir", () => {
    const { rerender } = render(<AbasDoRelatorio aba="historico" onMudar={jest.fn()} pendentes={1} dividas={0} />);
    expect(screen.queryByTestId("aba-relatorio-dot")).toBeNull();
    rerender(<AbasDoRelatorio aba="historico" onMudar={jest.fn()} pendentes={1} dividas={0} precisaConferir />);
    expect(screen.getByTestId("aba-relatorio-dot")).toBeTruthy();
  });
});
