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

  it("no topo do bloco, por campanha: N atendimentos geraram R$ X", () => {
    const r = render(
      <PremiosPendentes
        itens={[
          { ...P, campaign_id: "c1" },
          { ...P, credit_id: "k2", campaign_id: "c1" },
          { ...P, credit_id: "k3", campaign_id: "c2", campaign_name: "Outra" },
        ]}
      />
    );
    expect(r.getByTestId("premios-resumo-c1").props.children).toBe("Teste de Lançamento: 2 atendimentos geraram R$ 10,00");
    expect(r.getByTestId("premios-resumo-c2").props.children).toBe("Outra: 1 atendimento gerou R$ 5,00");
  });

  it("tocar abre a janela com o resumo no topo, cliente, dia, campanha e valor; Ver o dia leva ao dia do corte", () => {
    const onVerDia = jest.fn();
    const r = render(<PremiosPendentes itens={[P, { ...P, credit_id: "k2" }]} onVerDia={onVerDia} />);
    fireEvent.press(r.getAllByTestId("premio-pendente")[0]);
    expect(r.getByTestId("premio-janela-resumo").props.children).toBe("2 atendimentos geraram R$ 10,00");
    expect(r.getByTestId("premio-janela-campanha").props.children).toBe("Teste de Lançamento");
    expect(r.getByTestId("premio-janela-cliente").props.children).toBe("Cliente: Ana");
    expect(r.getByTestId("premio-janela-dia").props.children).toBe("Corte em 05/11");
    expect(r.getByTestId("premio-janela-valor").props.children).toBe("R$ 5,00 · a liberar pelo VUPTH");
    fireEvent.press(r.getByTestId("premio-janela-ver-dia"));
    expect(onVerDia).toHaveBeenCalledWith(P.finished_at);
  });

  it("sem dia do corte (ou sem onVerDia), a janela nao oferece Ver o dia; Fechar fecha", () => {
    const r = render(<PremiosPendentes itens={[{ ...P, finished_at: null, client_name: null }]} onVerDia={jest.fn()} />);
    fireEvent.press(r.getByTestId("premio-pendente"));
    expect(r.queryByTestId("premio-janela-ver-dia")).toBeNull();
    expect(r.queryByTestId("premio-janela-cliente")).toBeNull();
    expect(r.queryByTestId("premio-janela-dia")).toBeNull();
    fireEvent.press(r.getByTestId("premio-janela-fechar"));
  });
});
