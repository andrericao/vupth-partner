import { render, fireEvent } from "@testing-library/react-native";
import { PremiosPendentes } from "@components/PremiosPendentes";
import type { PremioDeIndicacao } from "@lib/premios";

// premio-em-pendentes (Andre, 05/11).
jest.setTimeout(20000);
const P: PremioDeIndicacao = {
  credit_id: "k1",
  campaign_name: "Teste de Lançamento",
  amount: 5,
  client_name: "Ana",
  attendance_id: "at-1",
  finished_at: "2026-11-05T14:30:00-03:00",
  status: "LOCKED",
};

describe("PremiosPendentes", () => {
  it("sem premio, nada", () => {
    const r = render(<PremiosPendentes itens={[]} />);
    expect(r.queryByTestId("premios-pendentes")).toBeNull();
  });

  it("uma linha por premio: campanha, valor, estado e o detalhe", () => {
    const r = render(<PremiosPendentes itens={[P, { ...P, credit_id: "k2", status: "TO_PAY" }]} />);
    expect(r.getByText("PRÊMIOS DE INDICAÇÃO")).toBeTruthy();
    expect(r.getAllByTestId("premio-pendente")).toHaveLength(2);
    expect(r.getByTestId("premio-valor-k1").props.children).toBe("R$ 5,00");
    expect(r.getByTestId("premio-estado-k1").props.children).toBe("a liberar pelo VUPTH");
    expect(r.getByTestId("premio-estado-k2").props.children).toBe("a receber");
    expect(r.getByTestId("premio-detalhe-k1").props.children).toBe("Ana · corte em 05/11");
  });

  it("com onAbrir, tocar abre o atendimento do premio; sem attendance_id, nao e botao", () => {
    const onAbrir = jest.fn();
    const r = render(<PremiosPendentes itens={[P, { ...P, credit_id: "k2", attendance_id: null }]} onAbrir={onAbrir} />);
    const linhas = r.getAllByTestId("premio-pendente");
    fireEvent.press(linhas[0]);
    expect(onAbrir).toHaveBeenCalledWith("at-1");
    expect(linhas[1].props.accessibilityRole).toBeUndefined();
  });
});
